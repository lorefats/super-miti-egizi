import { TEX } from '../art';
import { hitSpark, isOnScreen } from '../art/effects';
import type { Damageable } from '../entities/Combat';
import { Golem } from '../entities/Golem';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Altezza da terra a cui vola il vaso, e le schegge. */
const POT_HEIGHT = 62;
const SHARD_HEIGHT = 34;

/** Khnum — Vasi d'Argilla: lancia un vaso che si frantuma in schegge quando tocca qualcosa. */
export const khnum: CharacterModule = {
  id: 'khnum',
  swingSeconds: 0.12,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    const base = user.attackDamage();
    const shardDamage = user.scaledDamage(p.shardDamage);
    let hitFirst: Damageable | null = null;
    new Projectile(scene, user.x + Math.cos(angle) * 34, user.y + Math.sin(angle) * 34, {
      owner: user,
      combat,
      angle,
      speed: p.speed,
      range: w.range,
      radius: p.radius,
      height: POT_HEIGHT,
      texture: TEX.vaso,
      spin: Math.cos(angle) >= 0 ? 8 : -8,
      onHit: (target, x, y) => {
        hitFirst = target;
        if (target.team === user.team) return;
        combat.damage(user, target, base);
        hitSpark(scene, x, y - POT_HEIGHT, y + 2);
      },
      onEnd: (x, y) => {
        // il vaso si rompe: schegge in tutte le direzioni (non colpiscono di nuovo chi ha preso il vaso)
        const start = Math.random() * Math.PI;
        for (let i = 0; i < p.shards; i++) {
          new Projectile(scene, x, y, {
            owner: user,
            combat,
            angle: start + (i / p.shards) * Math.PI * 2,
            speed: p.shardSpeed,
            range: p.shardRange,
            radius: 14,
            height: SHARD_HEIGHT,
            texture: TEX.coccio,
            ignore: hitFirst ? [hitFirst] : [],
            onHit: (target, sx, sy) => {
              if (target.team === user.team) return;
              combat.damage(user, target, shardDamage);
              hitSpark(scene, sx, sy - SHARD_HEIGHT, sy + 2);
            },
          });
        }
        if (isOnScreen(scene, x, y)) {
          const puff = scene.add.particles(x, y - POT_HEIGHT * 0.6, TEX.granello, {
            speed: { min: 60, max: 160 },
            lifespan: 350,
            scale: { start: 1.2, end: 0 },
            tint: 0xc97a3a,
            emitting: false,
          });
          puff.setDepth(y + 3);
          puff.explode(10);
          scene.time.delayedCall(450, () => puff.destroy());
        }
      },
    });
  },

  /** Super — Golem d'Argilla: modella un golem che combatte al suo fianco per qualche secondo. */
  useSuper(user, angle, combat, distance) {
    const p = user.stats.super.params;
    const scene = user.scene;
    const spot = combat.freeSpot(user.x, user.y, user.x + Math.cos(angle) * distance, user.y + Math.sin(angle) * distance, 32);
    new Golem(scene, spot.x, spot.y, {
      combat,
      team: user.team,
      ownerIsHuman: user.isHuman,
      seconds: p.seconds,
      health: user.scaledDamage(p.health),
      speed: p.speed,
      damage: user.scaledDamage(p.damage),
      punchRange: p.punchRange,
      punchDelay: p.punchDelay,
      sight: p.sight,
    });
    if (user.isHuman) scene.cameras.main.shake(120, 0.004);
  },
};
