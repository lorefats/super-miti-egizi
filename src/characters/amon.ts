import Phaser from 'phaser';
import { TEX } from '../art';
import { hitSpark, isOnScreen } from '../art/effects';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Altezza da terra a cui volano le piume. */
const FEATHER_HEIGHT = 64;

/** Luccichio blu (quando svanisce e quando riappare). */
function shimmer(scene: Phaser.Scene, x: number, y: number): void {
  if (!isOnScreen(scene, x, y)) return;
  const s = scene.add.particles(x, y - 80, TEX.scintilla, {
    speed: { min: 60, max: 180 },
    lifespan: { min: 300, max: 600 },
    scale: { start: 1, end: 0 },
    tint: [0x6f8ee0, 0xffffff, 0x8ecae6],
    emitting: false,
  });
  s.setDepth(y + 5);
  s.explode(18);
  scene.time.delayedCall(700, () => s.destroy());
}

/** Amon — Piume del Vento: lancia 2 piume che curvano verso il nemico più vicino. */
export const amon: CharacterModule = {
  id: 'amon',
  swingSeconds: 0.08,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    // attaccare lo fa riapparire; il primo colpo dopo la super fa più danno
    if (user.isInvisible()) {
      user.removeBuff('invisibile');
      shimmer(scene, user.x, user.y);
    }
    const damage = user.attackDamage() * user.consumeNextHitBonus();
    const spread = Phaser.Math.DegToRad(p.spreadDegrees);
    for (let i = 0; i < p.feathers; i++) {
      const a = angle - spread / 2 + (spread * i) / Math.max(1, p.feathers - 1);
      new Projectile(scene, user.x + Math.cos(a) * 30, user.y + Math.sin(a) * 30, {
        owner: user,
        combat,
        angle: a,
        speed: p.speed,
        range: w.range,
        radius: p.radius,
        height: FEATHER_HEIGHT,
        texture: TEX.piumetta,
        spin: 0,
        homing: { turnRate: p.turnRate, range: p.homingRange },
        onHit: (target, x, y) => {
          if (target.team === user.team) return;
          combat.damage(user, target, damage);
          hitSpark(scene, x, y - FEATHER_HEIGHT, y + 2);
        },
      })
        .setScale(1.6)
        .list.forEach((o) => (o as Phaser.GameObjects.Image).setTint?.(0x9fb4ff));
    }
  },

  /** Super — Il Nascosto: diventa invisibile per qualche secondo; il primo colpo dopo fa doppio danno. */
  useSuper(user) {
    const p = user.stats.super.params;
    shimmer(user.scene, user.x, user.y);
    user.goInvisible(p.seconds);
    user.grantNextHitBonus(p.nextHitFactor, p.nextHitSeconds);
  },
};
