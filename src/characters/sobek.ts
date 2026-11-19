import Phaser from 'phaser';
import { TEX } from '../art';
import { groundRing, hitSpark, isOnScreen, waterSplash } from '../art/effects';
import { FieldEffect } from '../entities/FieldEffect';
import type { CharacterModule } from './types';

/** Altezza da terra a cui si chiudono le fauci. */
const BITE_HEIGHT = 44;

/** Sobek — Fauci del Fiume: morso a cono ravvicinato, danno alto. */
export const sobek: CharacterModule = {
  id: 'sobek',
  swingSeconds: 0.12,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const scene = user.scene;
    const hits = combat.hitArc(user, angle, w.range, w.arcDegrees, user.attackDamage());
    if (!isOnScreen(scene, user.x, user.y)) return;

    // due mascelle che si chiudono di scatto davanti a lui
    const bx = user.x + Math.cos(angle) * w.range * 0.55;
    const by = user.y + Math.sin(angle) * w.range * 0.55 - BITE_HEIGHT;
    const left = Math.cos(angle) < 0;
    const holder = scene.add.container(bx, by).setDepth(user.y + 2).setRotation(left ? angle - Math.PI : angle);
    const sx = left ? -1 : 1;
    const top = scene.add.image(0, -24, TEX.fauce).setScale(sx * 0.8, 0.8).setRotation(-0.45 * sx);
    const bottom = scene.add.image(0, 24, TEX.fauce).setScale(sx * 0.8, -0.8).setRotation(0.45 * sx);
    holder.add([top, bottom]);
    holder.setScale(0.7);
    scene.tweens.add({ targets: holder, scale: 1, duration: 90, ease: 'Quad.out' });
    scene.tweens.add({ targets: top, y: -9, rotation: 0, duration: 110, ease: 'Back.in' });
    scene.tweens.add({ targets: bottom, y: 9, rotation: 0, duration: 110, ease: 'Back.in' });
    scene.tweens.add({ targets: holder, alpha: 0, delay: 200, duration: 160, onComplete: () => holder.destroy() });
    scene.time.delayedCall(110, () => waterSplash(scene, bx, by + BITE_HEIGHT, 6, user.y + 3));

    for (const h of hits) hitSpark(scene, h.x, h.y - 60, h.y + 2);
    if (hits.length > 0 && (user.isHuman || hits.some((h) => h.isHuman))) scene.cameras.main.shake(90, 0.004);
  },

  /**
   * Super — Ondata del Nilo: si tuffa sotto terra come nell'acqua, riemerge dove ha mirato
   * con un'onda che spinge via i nemici.
   */
  useSuper(user, angle, combat, distance) {
    const sup = user.stats.super;
    const p = sup.params;
    const scene = user.scene;
    const d = Phaser.Math.Clamp(distance, p.minDistance, sup.range);
    const spot = combat.freeSpot(user.x, user.y, user.x + Math.cos(angle) * d, user.y + Math.sin(angle) * d);
    const travel = Phaser.Math.Distance.Between(user.x, user.y, spot.x, spot.y);

    waterSplash(scene, user.x, user.y, 12);
    groundRing(scene, user.x, user.y, 70, 0x2a9d8f, 350);

    // scia d'acqua sotto la sabbia mentre nuota
    let rippleTimer = 0;
    new FieldEffect(scene, user.x, user.y, travel / p.diveSpeed + 0.05, (_f, dt) => {
      rippleTimer -= dt;
      if (rippleTimer > 0) return;
      rippleTimer = 0.06;
      groundRing(scene, user.x, user.y, 46, 0x2a9d8f, 380);
    });

    user.dashTo(spot.x, spot.y, travel / p.diveSpeed, {
      hidden: true,
      onArrive: () => {
        // riemerge con l'onda
        groundRing(scene, spot.x, spot.y, p.waveRadius, 0x2a9d8f, 500);
        groundRing(scene, spot.x, spot.y, p.waveRadius * 0.6, 0x5fd3f0, 400);
        waterSplash(scene, spot.x, spot.y, 22);
        const damage = user.scaledDamage(p.damage);
        const hits = combat.inCircle(spot.x, spot.y, p.waveRadius, (t) => t.team !== user.team);
        for (const t of hits) {
          combat.damage(user, t, damage);
          const away = new Phaser.Math.Vector2(t.x - spot.x, t.y - spot.y);
          if (away.lengthSq() < 1) away.set(Math.cos(angle), Math.sin(angle));
          away.normalize().scale(p.push);
          t.push?.(away.x, away.y);
          hitSpark(scene, t.x, t.y - 60, t.y + 2);
        }
        if (user.isHuman || hits.some((h) => h.isHuman)) scene.cameras.main.shake(160, 0.007);
      },
    });
  },
};
