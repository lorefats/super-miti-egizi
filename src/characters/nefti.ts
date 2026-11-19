import Phaser from 'phaser';
import { TEX } from '../art';
import { hitSpark, isOnScreen } from '../art/effects';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Altezza da terra a cui volano le lame. */
const BLADE_HEIGHT = 60;

/** Fumo viola (quando sparisce e quando riappare). */
function purpleSmoke(scene: Phaser.Scene, x: number, y: number): void {
  if (!isOnScreen(scene, x, y)) return;
  const s = scene.add.particles(x, y - 60, TEX.granello, {
    speed: { min: 40, max: 140 },
    lifespan: { min: 400, max: 700 },
    scale: { start: 2.4, end: 0.5 },
    alpha: { start: 0.9, end: 0 },
    tint: [0x5a189a, 0x9d6bd6, 0x240747],
    emitting: false,
  });
  s.setDepth(y + 5);
  s.explode(26);
  scene.time.delayedCall(800, () => s.destroy());
}

/** Nefti — Lame del Crepuscolo: 3 lame d'ombra a ventaglio. */
export const nefti: CharacterModule = {
  id: 'nefti',
  swingSeconds: 0.07,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    const damage = user.attackDamage() * user.consumeNextHitBonus();
    const spread = Phaser.Math.DegToRad(p.spreadDegrees);
    for (let i = 0; i < p.blades; i++) {
      const a = angle - spread / 2 + (spread * i) / Math.max(1, p.blades - 1);
      new Projectile(scene, user.x + Math.cos(a) * 30, user.y + Math.sin(a) * 30, {
        owner: user,
        combat,
        angle: a,
        speed: p.speed,
        range: w.range,
        radius: p.radius,
        height: BLADE_HEIGHT,
        texture: TEX.lamaOmbra,
        spin: 0,
        onHit: (target, x, y) => {
          if (target.team === user.team) return;
          combat.damage(user, target, damage);
          hitSpark(scene, x, y - BLADE_HEIGHT, y + 2);
        },
      });
    }
  },

  /** Super — Passo nell'Ombra: si teletrasporta dietro il nemico più debole vicino; il colpo dopo fa più danno. */
  useSuper(user, angle, combat) {
    const sup = user.stats.super;
    const p = sup.params;
    const scene = user.scene;
    const near = combat.inCircle(user.x, user.y, sup.range, (t) => t.team !== user.team && t.kind === 'personaggio');
    const prey = near.sort((a, b) => (a.healthFraction?.() ?? 1) - (b.healthFraction?.() ?? 1))[0];
    let tx = user.x + Math.cos(angle) * sup.range * 0.5;
    let ty = user.y + Math.sin(angle) * sup.range * 0.5;
    if (prey) {
      // dietro di lui, dalla parte opposta a Nefti
      const a = Phaser.Math.Angle.Between(user.x, user.y, prey.x, prey.y);
      tx = prey.x + Math.cos(a) * p.behindGap;
      ty = prey.y + Math.sin(a) * p.behindGap;
    }
    const spot = prey ? combat.freeSpot(prey.x, prey.y, tx, ty) : combat.freeSpot(user.x, user.y, tx, ty);
    purpleSmoke(scene, user.x, user.y);
    user.teleportTo(spot.x, spot.y);
    purpleSmoke(scene, spot.x, spot.y);
    user.grantNextHitBonus(p.nextHitFactor, p.nextHitSeconds);
  },
};
