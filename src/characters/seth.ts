import Phaser from 'phaser';
import { TEX } from '../art';
import { hitSpark } from '../art/effects';
import { DEPTH } from '../config';
import type { Damageable } from '../entities/Combat';
import { FieldEffect } from '../entities/FieldEffect';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Altezza da terra a cui vola la lancia. */
const SPEAR_HEIGHT = 60;
/** Ogni quanto la tempesta fa danno (secondi). */
const STORM_TICK = 0.5;

/** Seth — Lancia del Caos: lancia che vola dritta e alla fine si divide in 3 pezzi. */
export const seth: CharacterModule = {
  id: 'seth',
  swingSeconds: 0.12,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    const base = user.attackDamage();
    const pieceDamage = user.scaledDamage(p.pieceDamage);
    let hitFirst: Damageable | null = null;
    new Projectile(scene, user.x + Math.cos(angle) * 34, user.y + Math.sin(angle) * 34, {
      owner: user,
      combat,
      angle,
      speed: p.speed,
      range: w.range,
      radius: p.radius,
      height: SPEAR_HEIGHT,
      texture: TEX.lancia,
      spin: 0,
      onHit: (target, x, y) => {
        hitFirst = target;
        if (target.team === user.team) return;
        combat.damage(user, target, base);
        hitSpark(scene, x, y - SPEAR_HEIGHT, y + 2);
      },
      onEnd: (x, y) => {
        // si divide in pezzi a ventaglio, che continuano nella stessa direzione
        const spread = Phaser.Math.DegToRad(p.spreadDegrees);
        for (let i = 0; i < p.pieces; i++) {
          const a = angle - spread / 2 + (spread * i) / Math.max(1, p.pieces - 1);
          new Projectile(scene, x, y, {
            owner: user,
            combat,
            angle: a,
            speed: p.speed * 0.8,
            range: p.pieceRange,
            radius: 14,
            height: SPEAR_HEIGHT,
            texture: TEX.lancia,
            spin: 0,
            ignore: hitFirst ? [hitFirst] : [],
            onHit: (target, sx, sy) => {
              if (target.team === user.team) return;
              combat.damage(user, target, pieceDamage);
              hitSpark(scene, sx, sy - SPEAR_HEIGHT, sy + 2);
            },
          }).setScale(0.6);
        }
      },
    });
  },

  /**
   * Super — Tempesta di Sabbia: per qualche secondo una tempesta rossa in un'area.
   * Chi è dentro prende danno e vede solo vicino a sé.
   */
  useSuper(user, angle, combat, distance) {
    const p = user.stats.super.params;
    const scene = user.scene;
    const cx = user.x + Math.cos(angle) * distance;
    const cy = user.y + Math.sin(angle) * distance;
    const r = p.radius;

    const ground = scene.add.graphics({ x: cx, y: cy }).setDepth(-955).setScale(1, 0.62).setAlpha(0);
    ground.fillStyle(0xb5562a, 0.35).fillCircle(0, 0, r);
    ground.lineStyle(5, 0xe63946, 0.7).strokeCircle(0, 0, r);
    scene.tweens.add({ targets: ground, alpha: 1, duration: 300 });
    const sand = scene.add.particles(cx, cy - 40, TEX.granello, {
      speed: { min: 80, max: 200 },
      lifespan: { min: 500, max: 900 },
      scale: { start: 1.6, end: 0.4 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xc0582a, 0xe0a060, 0x8c3a1a],
      frequency: 12,
      emitZone: { type: 'random', source: new Phaser.Geom.Ellipse(0, 0, r * 2, r * 1.24), quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
    });
    sand.setDepth(DEPTH.overhead - 30);

    let tick = 0;
    const fx = new FieldEffect(
      scene,
      cx,
      cy,
      p.seconds,
      (_f, dt) => {
        tick -= dt;
        if (tick > 0) return;
        tick = STORM_TICK;
        // chi è dentro prende danno e vede solo vicino a sé
        for (const t of combat.inCircle(cx, cy, r, (o) => o.team !== user.team)) {
          combat.damage(user, t, user.scaledDamage(p.damagePerSecond * STORM_TICK));
          t.blind?.(STORM_TICK + 0.2);
        }
      },
      () => {
        sand.stop();
        scene.time.delayedCall(900, () => sand.destroy());
      },
    );
    fx.own(ground);
  },
};
