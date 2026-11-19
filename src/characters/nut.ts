import Phaser from 'phaser';
import { TEX } from '../art';
import { dustPuff, groundRing, hitSpark, isOnScreen } from '../art/effects';
import { DEPTH } from '../config';
import { LOB_MIN } from '../ui/AimIndicator';
import type { CharacterModule } from './types';

/** Scoppio di scintille dorate. */
function starBurst(scene: Phaser.Scene, x: number, y: number, count: number): void {
  if (!isOnScreen(scene, x, y)) return;
  const b = scene.add.particles(x, y - 20, TEX.scintilla, {
    speed: { min: 120, max: 300 },
    lifespan: { min: 300, max: 550 },
    scale: { start: 1.2, end: 0 },
    tint: [0xffe08a, 0xffffff, 0x8ecae6],
    emitting: false,
  });
  b.setDepth(y + 4);
  b.explode(count);
  scene.time.delayedCall(650, () => b.destroy());
}

/** Nut — Stelle Cadenti: lancia una stella a parabola (passa sopra i muri) che scoppia dove cade. */
export const nut: CharacterModule = {
  id: 'nut',
  swingSeconds: 0.1,

  attack(user, angle, combat, distance) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    const damage = user.attackDamage();
    const d = Phaser.Math.Clamp(distance, LOB_MIN, w.range);
    const sx = user.x + Math.cos(angle) * 20;
    const sy = user.y + Math.sin(angle) * 20;
    const tx = user.x + Math.cos(angle) * d;
    const ty = user.y + Math.sin(angle) * d;
    const blast = w.aimWidth / 2;

    const shadow = scene.add.image(sx, sy, TEX.ombra).setScale(0.5).setAlpha(0.6);
    const star = scene.add.image(sx, sy - 100, TEX.stellaCadente);
    const state = { t: 0 };
    scene.tweens.add({
      targets: state,
      t: 1,
      duration: p.flightSeconds * 1000,
      onUpdate: () => {
        const x = sx + (tx - sx) * state.t;
        const y = sy + (ty - sy) * state.t;
        const h = 100 * (1 - state.t) + Math.sin(state.t * Math.PI) * p.arcHeight;
        shadow.setPosition(x, y).setDepth(y - 1);
        star.setPosition(x, y - h).setDepth(DEPTH.overhead - 40).setRotation(state.t * 8);
      },
      onComplete: () => {
        shadow.destroy();
        star.destroy();
        for (const t of combat.inCircle(tx, ty, blast, (o) => o.team !== user.team)) {
          combat.damage(user, t, damage);
          hitSpark(scene, t.x, t.y - 60, t.y + 2);
        }
        groundRing(scene, tx, ty, blast, 0xffe08a, 350);
        starBurst(scene, tx, ty, 12);
      },
    });
  },

  /** Super — Volta Celeste: dopo un attimo di avviso, una pioggia di meteore cade su una grande area. */
  useSuper(user, angle, combat, distance) {
    const p = user.stats.super.params;
    const scene = user.scene;
    const cx = user.x + Math.cos(angle) * distance;
    const cy = user.y + Math.sin(angle) * distance;
    const r = p.radius;
    const damage = user.scaledDamage(p.meteorDamage);

    // avviso: un cerchio rosso che pulsa sul terreno
    const warn = scene.add.graphics({ x: cx, y: cy }).setDepth(-950).setScale(1, 0.62);
    const pulse = { k: 0 };
    scene.tweens.add({
      targets: pulse,
      k: 1,
      duration: p.warnSeconds * 1000,
      onUpdate: () => {
        warn.clear();
        warn.fillStyle(0xe63946, 0.12 + 0.18 * Math.abs(Math.sin(pulse.k * Math.PI * 4))).fillCircle(0, 0, r);
        warn.lineStyle(5, 0xe63946, 0.9).strokeCircle(0, 0, r);
        warn.lineStyle(3, 0xffe08a, 0.9).strokeCircle(0, 0, r * pulse.k);
      },
      onComplete: () => {
        scene.tweens.add({ targets: warn, alpha: 0, delay: p.rainSeconds * 1000, duration: 300, onComplete: () => warn.destroy() });
      },
    });

    for (let i = 0; i < p.meteors; i++) {
      const delay = (p.warnSeconds + (p.rainSeconds * i) / p.meteors) * 1000;
      scene.time.delayedCall(delay, () => {
        const a = Math.random() * Math.PI * 2;
        const k = Math.sqrt(Math.random()) * r * 0.9;
        const x = cx + Math.cos(a) * k;
        const y = cy + Math.sin(a) * k;
        const rock = scene.add.image(x + 180, y - 560, TEX.meteora).setOrigin(0.3, 0.7).setDepth(DEPTH.overhead - 40);
        scene.tweens.add({
          targets: rock,
          x,
          y,
          duration: 300,
          ease: 'Quad.in',
          onComplete: () => {
            rock.destroy();
            for (const t of combat.inCircle(x, y, p.meteorRadius, (o) => o.team !== user.team)) {
              combat.damage(user, t, damage);
              hitSpark(scene, t.x, t.y - 60, t.y + 2);
            }
            groundRing(scene, x, y, p.meteorRadius, 0xff7b1c, 300);
            dustPuff(scene, x, y, -Math.PI / 2, y);
            starBurst(scene, x, y, 6);
            if (user.isHuman && i % 3 === 0) scene.cameras.main.shake(80, 0.004);
          },
        });
      });
    }
  },
};
