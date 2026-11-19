import Phaser from 'phaser';
import { TEX } from '../art';
import { groundRing, hitSpark } from '../art/effects';
import { FieldEffect } from '../entities/FieldEffect';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Altezza della palla (all'inizio): rotola appoggiata a terra. */
const BALL_HEIGHT = 20;
/** Nome del cambio di velocità sotto terra. */
const DIG = 'scavo';

/** Khepri — Palla di Sabbia: fa rotolare una palla che diventa più grande e fa più danno mentre avanza. */
export const khepri: CharacterModule = {
  id: 'khepri',
  swingSeconds: 0.07,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    const base = user.attackDamage();
    new Projectile(scene, user.x + Math.cos(angle) * 34, user.y + Math.sin(angle) * 34, {
      owner: user,
      combat,
      angle,
      speed: p.speed,
      range: w.range,
      radius: p.radius,
      height: BALL_HEIGHT,
      texture: TEX.pallaSabbia,
      spin: Math.cos(angle) >= 0 ? 9 : -9,
      grow: p.grow,
      onHit: (target, x, y, travelled) => {
        if (target.team === user.team) return;
        const far = Math.min(1, travelled / w.range);
        combat.damage(user, target, base * (1 + p.farBonus * far));
        hitSpark(scene, x, y - 30, y + 2);
      },
    });
  },

  /**
   * Super — Rinascita dell'Alba: scava sotto terra (non si può colpire e va veloce) per qualche secondo
   * e riemerge con un'esplosione di sabbia dorata.
   */
  useSuper(user, _angle, combat) {
    const p = user.stats.super.params;
    const scene = user.scene;
    user.goUnderground(p.seconds);
    user.changeSpeed(DIG, p.seconds, p.speedFactor);

    // da fuori si vede solo la terra smossa che corre
    const mound = scene.add.image(user.x, user.y, TEX.mucchioTerra).setOrigin(0.5, 0.8);
    const dust = scene.add.particles(0, 0, TEX.granello, {
      speed: { min: 30, max: 90 },
      angle: { min: 200, max: 340 },
      lifespan: { min: 250, max: 450 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 0.9, end: 0 },
      frequency: 40,
    });
    new FieldEffect(
      scene,
      user.x,
      user.y,
      p.seconds,
      (f) => {
        mound.setPosition(user.x, user.y).setDepth(user.y);
        mound.setScale(1 + Math.sin(f.age * 20) * 0.06, 1 - Math.sin(f.age * 20) * 0.06);
        dust.setPosition(user.x, user.y - 10).setDepth(user.y + 1);
        if (!user.isAlive()) f.finish();
      },
      () => {
        mound.destroy();
        dust.stop();
        scene.time.delayedCall(500, () => dust.destroy());
        if (!user.isAlive()) return;
        erupt();
      },
    );

    /** Riemerge: esplosione di sabbia dorata che colpisce e spinge via chi è vicino. */
    function erupt(): void {
      const x = user.x;
      const y = user.y;
      const hits = combat.inCircle(x, y, p.radius, (t) => t.team !== user.team);
      for (const t of hits) {
        combat.damage(user, t, user.scaledDamage(p.damage));
        const a = Phaser.Math.Angle.Between(x, y, t.x, t.y);
        t.push?.(Math.cos(a) * p.push, Math.sin(a) * p.push);
        hitSpark(scene, t.x, t.y - 60, t.y + 2);
      }
      groundRing(scene, x, y, p.radius, 0xffd166, 450);
      const burst = scene.add.particles(x, y - 20, TEX.granello, {
        speed: { min: 200, max: 460 },
        angle: { min: 200, max: 340 },
        gravityY: 700,
        lifespan: { min: 500, max: 800 },
        scale: { start: 1.6, end: 0.3 },
        tint: [0xffd166, 0xffb703, 0xfff3b0],
        emitting: false,
      });
      burst.setDepth(y + 5);
      burst.explode(40);
      scene.time.delayedCall(900, () => burst.destroy());
      const sun = scene.add.image(x, y - 80, TEX.bagliore).setTint(0xffd166).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 6).setScale(0.5);
      scene.tweens.add({ targets: sun, scale: 3, alpha: 0, duration: 500, onComplete: () => sun.destroy() });
      if (user.isHuman || hits.some((h) => h.isHuman)) scene.cameras.main.shake(160, 0.007);
    }
  },
};
