import { TEX } from '../art';
import { hitSpark } from '../art/effects';
import { Obelisk } from '../entities/Obelisk';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Altezza da terra a cui vola il martello. */
const HAMMER_HEIGHT = 60;

/** Ptah — Martello del Creatore: martello lanciato che rimbalza una volta sui muri. */
export const ptah: CharacterModule = {
  id: 'ptah',
  swingSeconds: 0.13,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const scene = user.scene;
    const damage = user.attackDamage();
    new Projectile(scene, user.x + Math.cos(angle) * 34, user.y + Math.sin(angle) * 34, {
      owner: user,
      combat,
      angle,
      speed: w.params.speed,
      range: w.range,
      radius: w.params.radius,
      height: HAMMER_HEIGHT,
      texture: TEX.martello,
      spin: Math.cos(angle) >= 0 ? 12 : -12,
      bounces: w.params.bounces,
      onHit: (target, x, y) => {
        if (target.team === user.team) return;
        combat.damage(user, target, damage);
        hitSpark(scene, x, y - HAMMER_HEIGHT, y + 2);
        if (user.isHuman) scene.cameras.main.shake(70, 0.003);
      },
    });
  },

  /** Super — Obelisco Guardiano: costruisce un obelisco che spara raggi ai nemici vicini. */
  useSuper(user, angle, combat, distance) {
    const p = user.stats.super.params;
    const spot = combat.freeSpot(user.x, user.y, user.x + Math.cos(angle) * distance, user.y + Math.sin(angle) * distance, 32);
    new Obelisk(user.scene, spot.x, spot.y, {
      combat,
      team: user.team,
      ownerIsHuman: user.isHuman,
      seconds: p.seconds,
      health: user.scaledDamage(p.health),
      damage: user.scaledDamage(p.damage),
      shootRange: p.shootRange,
      shootDelay: p.shootDelay,
    });
  },
};
