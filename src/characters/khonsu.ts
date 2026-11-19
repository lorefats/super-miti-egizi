import Phaser from 'phaser';
import { TEX } from '../art';
import { groundRing, hitSpark } from '../art/effects';
import { DEPTH } from '../config';
import { FieldEffect } from '../entities/FieldEffect';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Altezza da terra a cui vola la falce. */
const SICKLE_HEIGHT = 56;
/** Ogni quanto l'eclissi rinnova il rallentatore (secondi). */
const ECLIPSE_TICK = 0.25;

/** Khonsu — Falce Lunare: boomerang a mezzaluna che va e torna, colpendo all'andata e al ritorno. */
export const khonsu: CharacterModule = {
  id: 'khonsu',
  swingSeconds: 0.09,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const scene = user.scene;
    const damage = user.attackDamage();
    new Projectile(scene, user.x + Math.cos(angle) * 30, user.y + Math.sin(angle) * 30, {
      owner: user,
      combat,
      angle,
      speed: w.params.speed,
      range: w.range,
      radius: w.params.radius,
      height: SICKLE_HEIGHT,
      texture: TEX.falceLuna,
      spin: 16,
      pierce: true,
      boomerang: true,
      onHit: (target, x, y) => {
        if (target.team === user.team) return;
        combat.damage(user, target, damage);
        hitSpark(scene, x, y - SICKLE_HEIGHT, y + 2);
      },
    });
  },

  /** Super — Eclissi: in un'area il tempo rallenta per i nemici (si muovono e attaccano al rallentatore). */
  useSuper(user, angle, combat, distance) {
    const p = user.stats.super.params;
    const scene = user.scene;
    const cx = user.x + Math.cos(angle) * distance;
    const cy = user.y + Math.sin(angle) * distance;
    const r = p.radius;

    const shade = scene.add.graphics({ x: cx, y: cy }).setDepth(-955).setScale(1, 0.62).setAlpha(0);
    shade.fillStyle(0x1b1f3b, 0.5).fillCircle(0, 0, r);
    shade.lineStyle(5, 0xbfc8e8, 0.9).strokeCircle(0, 0, r);
    scene.tweens.add({ targets: shade, alpha: 1, duration: 300 });
    groundRing(scene, cx, cy, r, 0xbfc8e8, 500);
    const moon = scene.add.image(cx, cy - 230, TEX.eclissi).setDepth(DEPTH.overhead - 20).setScale(0.2).setAlpha(0);
    scene.tweens.add({ targets: moon, scale: 1.2, alpha: 1, duration: 400, ease: 'Back.out' });
    const twinkle = scene.add.particles(cx, cy - 60, TEX.scintilla, {
      lifespan: 700,
      scale: { start: 0, end: 0.9, ease: 'Sine.inOut' },
      alpha: { start: 1, end: 0 },
      frequency: 70,
      emitZone: { type: 'random', source: new Phaser.Geom.Ellipse(0, 0, r * 2, r * 1.24), quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
    });
    twinkle.setDepth(DEPTH.overhead - 21);

    let tick = 0;
    const fx = new FieldEffect(
      scene,
      cx,
      cy,
      p.seconds,
      (f, dt) => {
        moon.setRotation(f.age * 0.4);
        tick -= dt;
        if (tick > 0) return;
        tick = ECLIPSE_TICK;
        for (const t of combat.inCircle(cx, cy, r, (o) => o.team !== user.team && o.kind === 'personaggio')) {
          t.changeSpeed?.('eclissi', ECLIPSE_TICK + 0.1, p.slowFactor);
          t.changeAttackRate?.('eclissi', ECLIPSE_TICK + 0.1, p.slowFactor);
        }
      },
      () => {
        twinkle.stop();
        scene.time.delayedCall(700, () => twinkle.destroy());
      },
    );
    fx.own(shade, moon);
  },
};
