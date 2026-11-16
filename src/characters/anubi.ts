import { TEX } from '../art';
import type { CharacterModule } from './types';

/** Anubi — Scettro Uas: colpo a mezzaluna a corto raggio che colpisce tutti davanti a lui. */
export const anubi: CharacterModule = {
  id: 'anubi',

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const scene = user.scene;

    // effetto: mezzaluna dorata che si allarga davanti ad Anubi
    const baseScale = w.range / 120; // la mezzaluna è disegnata con raggio 120
    const fx = scene.add
      .image(user.x, user.y - 30, TEX.mezzaluna)
      .setRotation(angle)
      .setScale(baseScale * 0.55)
      .setDepth(user.y + 1);
    scene.tweens.add({
      targets: fx,
      scale: baseScale,
      rotation: angle + 0.35 * (Math.cos(angle) >= 0 ? 1 : -1),
      duration: 260,
      ease: 'Cubic.out',
    });
    scene.tweens.add({ targets: fx, alpha: 0, delay: 160, duration: 200, onComplete: () => fx.destroy() });

    combat.hitArc(user, angle, w.range, w.arcDegrees, w.damage);
  },
};
