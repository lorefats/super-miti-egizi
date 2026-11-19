import { TEX } from '../art';
import { hitSpark } from '../art/effects';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Altezza da terra a cui galleggiano le bolle. */
const BUBBLE_HEIGHT = 50;
/** Così lontano arriva il buio: tutta la mappa. */
const WHOLE_MAP = 100000;

/** Kek — Bolle d'Ombra: bolle lente che rallentano chi colpiscono. */
export const kek: CharacterModule = {
  id: 'kek',
  swingSeconds: 0.1,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    const damage = user.attackDamage();
    new Projectile(scene, user.x + Math.cos(angle) * 34, user.y + Math.sin(angle) * 34, {
      owner: user,
      combat,
      angle,
      speed: p.speed,
      range: w.range,
      radius: p.radius,
      height: BUBBLE_HEIGHT,
      texture: TEX.bollaOmbra,
      spin: 1.5,
      onHit: (target, x, y) => {
        if (target.team === user.team) return;
        combat.damage(user, target, damage);
        target.changeSpeed?.('bolla', p.slowSeconds, p.slowFactor);
        hitSpark(scene, x, y - BUBBLE_HEIGHT, y + 2);
      },
    });
  },

  /** Super — Notte Primordiale: per qualche secondo i nemici vedono solo vicino a sé, Kek invece vede tutto. */
  useSuper(user, _angle, combat) {
    const p = user.stats.super.params;
    const scene = user.scene;
    user.addBuff('notte', p.seconds);
    for (const t of combat.inCircle(user.x, user.y, WHOLE_MAP, (o) => o.team !== user.team && o.kind === 'personaggio')) {
      t.blind?.(p.seconds);
    }
    // le luci si spengono di colpo; restano i suoi occhi gialli
    if (user.isHuman) scene.cameras.main.flash(350, 30, 15, 60);
    for (const dx of [-12, 12]) {
      const eye = scene.add.image(user.x + dx, user.y - 140, TEX.bagliore).setTint(0xffd60a).setScale(0.2).setDepth(user.y + 10);
      scene.tweens.add({ targets: eye, scale: 0.7, alpha: 0, duration: 700, onComplete: () => eye.destroy() });
    }
  },
};
