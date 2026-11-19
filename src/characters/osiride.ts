import Phaser from 'phaser';
import { TEX } from '../art';
import { groundRing, hitSpark, isOnScreen } from '../art/effects';
import { FieldEffect } from '../entities/FieldEffect';
import type { CharacterModule } from './types';

/** Schiacciamento verticale degli effetti a terra (prospettiva 2.5D). */
const GROUND_SQUASH = 0.62;
/** Altezza da terra a cui passa la frustata. */
const SWING_HEIGHT = 40;
/** Ogni quanto il campo di grano cura e rallenta (secondi). */
const FIELD_TICK = 0.5;
/** Quante spighe crescono nel campo. */
const STALKS = 22;

/** Osiride — Flagello e Pastorale: frustata a ventaglio che rallenta un po' i nemici. */
export const osiride: CharacterModule = {
  id: 'osiride',
  swingSeconds: 0.1,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    const hits = combat.hitArc(user, angle, w.range, w.arcDegrees, user.attackDamage());
    for (const h of hits) {
      h.changeSpeed?.('flagello', p.slowSeconds, p.slowFactor);
      hitSpark(scene, h.x, h.y - 60, h.y + 2);
    }
    if (!isOnScreen(scene, user.x, user.y)) return;

    // tre code del flagello che frustano a ventaglio, disegnate "sulla sabbia" in prospettiva
    const holder = scene.add.container(user.x, user.y - SWING_HEIGHT).setScale(1, GROUND_SQUASH).setDepth(user.y + 1);
    const local = Math.atan2(Math.sin(angle) / GROUND_SQUASH, Math.cos(angle));
    const half = Phaser.Math.DegToRad(w.arcDegrees) / 2;
    const g = scene.add.graphics();
    holder.add(g);
    const side = Math.cos(angle) >= 0 ? 1 : -1;
    const state = { t: 0 };
    scene.tweens.add({
      targets: state,
      t: 1,
      duration: 170,
      ease: 'Cubic.out',
      onUpdate: () => {
        g.clear();
        const a = local + (state.t * 2 - 1) * half * side;
        for (let i = -1; i <= 1; i++) {
          const aa = a + i * 0.12;
          const r = w.range * (0.9 + i * 0.05);
          const mx = Math.cos(aa - 0.25 * side) * r * 0.55;
          const my = Math.sin(aa - 0.25 * side) * r * 0.55;
          const ex = Math.cos(aa) * r;
          const ey = Math.sin(aa) * r;
          g.lineStyle(9, 0x14213d, 0.85).beginPath().moveTo(0, 0);
          g.lineTo(mx, my).lineTo(ex, ey).strokePath();
          g.lineStyle(5, i === 0 ? 0xf2b632 : 0x2ec4b6, 1).beginPath().moveTo(0, 0);
          g.lineTo(mx, my).lineTo(ex, ey).strokePath();
        }
      },
    });
    scene.tweens.add({ targets: g, alpha: 0, delay: 170, duration: 140, onComplete: () => holder.destroy() });
  },

  /**
   * Super — Rinascita del Nilo: fa crescere un campo di grano dorato dove ha mirato.
   * Per qualche secondo cura i compagni dentro (lui compreso) e rallenta i nemici.
   */
  useSuper(user, angle, combat, distance) {
    const p = user.stats.super.params;
    const scene = user.scene;
    const cx = user.x + Math.cos(angle) * distance;
    const cy = user.y + Math.sin(angle) * distance;
    const r = p.radius;

    // terreno fertile verde e oro
    const ground = scene.add.graphics({ x: cx, y: cy }).setDepth(-960).setScale(1, GROUND_SQUASH).setAlpha(0);
    ground.fillStyle(0x6b8f3a, 0.45).fillCircle(0, 0, r);
    ground.fillStyle(0xf2b632, 0.25).fillCircle(0, 0, r * 0.75);
    ground.lineStyle(5, 0xffe08a, 0.9).strokeCircle(0, 0, r);
    scene.tweens.add({ targets: ground, alpha: 1, duration: 350 });
    groundRing(scene, cx, cy, r, 0xffe08a, 500);

    // spighe e fiori di loto che spuntano e ondeggiano al vento
    const plants: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < STALKS; i++) {
      const a = Math.random() * Math.PI * 2;
      const k = Math.sqrt(Math.random()) * r * 0.9;
      const x = cx + Math.cos(a) * k;
      const y = cy + Math.sin(a) * k * GROUND_SQUASH;
      const lotus = i % 6 === 0;
      const img = scene.add
        .image(x, y, lotus ? TEX.loto : TEX.spiga)
        .setOrigin(0.5, 1)
        .setDepth(y)
        .setScale(lotus ? 1 : 1.15, 0);
      scene.tweens.add({ targets: img, scaleY: lotus ? 1 : 1.15, delay: Math.random() * 300, duration: 380, ease: 'Back.out' });
      plants.push(img);
    }

    let tick = 0;
    const fx = new FieldEffect(scene, cx, cy, p.seconds, (f, dt) => {
      plants.forEach((pl, i) => (pl.rotation = Math.sin(f.age * 2.4 + i) * 0.12));
      tick -= dt;
      if (tick > 0) return;
      tick = FIELD_TICK;
      for (const t of combat.inCircle(cx, cy, r, (o) => o.kind === 'personaggio')) {
        if (t.team === user.team) t.heal?.(p.healPerSecond * FIELD_TICK);
        else t.changeSpeed?.('grano', FIELD_TICK + 0.1, p.slowFactor);
      }
    });
    fx.own(ground, ...plants);
  },
};
