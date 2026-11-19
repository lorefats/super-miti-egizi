import Phaser from 'phaser';
import { TEX } from '../art';
import { dustPuff, hitSpark, isOnScreen } from '../art/effects';
import type { Player } from '../entities/Player';
import type { CharacterModule } from './types';

/** Altezza da terra a cui chiude le fauci. */
const BITE_HEIGHT = 56;
/** A che distanza dal nemico si ferma lo scatto (pixel). */
const DASH_GAP = 60;

/** Fauci che si chiudono di scatto nel punto (x, y). `size` = grandezza. */
function chomp(scene: Phaser.Scene, x: number, y: number, depth: number, angle: number, size: number): void {
  if (!isOnScreen(scene, x, y)) return;
  const left = Math.cos(angle) < 0;
  const sx = left ? -1 : 1;
  const holder = scene.add.container(x, y).setDepth(depth).setRotation(left ? angle - Math.PI : angle).setScale(size);
  const top = scene.add.image(0, -22, TEX.fauce).setScale(sx * 0.6, 0.6).setRotation(-0.5 * sx);
  const bottom = scene.add.image(0, 22, TEX.fauce).setScale(sx * 0.6, -0.6).setRotation(0.5 * sx);
  holder.add([top, bottom]);
  scene.tweens.add({ targets: top, y: -7, rotation: 0, duration: 80, ease: 'Back.in' });
  scene.tweens.add({ targets: bottom, y: 7, rotation: 0, duration: 80, ease: 'Back.in' });
  scene.tweens.add({ targets: holder, alpha: 0, delay: 130, duration: 120, onComplete: () => holder.destroy() });
}

/** Un morso davanti ad Ammit. */
function bite(user: Player, angle: number): void {
  const w = user.stats.weapon;
  const scene = user.scene;
  const hits = user.combat.hitArc(user, angle, w.range, w.arcDegrees, user.attackDamage());
  chomp(scene, user.x + Math.cos(angle) * w.range * 0.55, user.y + Math.sin(angle) * w.range * 0.55 - BITE_HEIGHT, user.y + 2, angle, 0.9);
  for (const h of hits) hitSpark(scene, h.x, h.y - 60, h.y + 2);
}

/** Ammit — Morsi Rapidi: tre morsi velocissimi a distanza ravvicinata. */
export const ammit: CharacterModule = {
  id: 'ammit',
  swingSeconds: 0.05,

  attack(user, angle) {
    const p = user.stats.weapon.params;
    bite(user, angle);
    for (let i = 1; i < p.bites; i++) {
      user.scene.time.delayedCall(p.gapSeconds * 1000 * i, () => {
        if (user.canAct()) bite(user, angle);
      });
    }
  },

  /**
   * Super — Divora-Cuori: scatta in avanti a bocca aperta e morde forte.
   * Se così sconfigge un nemico, si cura tutta e diventa più grande per qualche secondo.
   */
  useSuper(user, angle, combat) {
    const sup = user.stats.super;
    const p = sup.params;
    const scene = user.scene;
    const prey = combat.enemyInCone(user.x, user.y, user.team, angle, sup.range, 25);
    let tx = user.x + Math.cos(angle) * sup.range;
    let ty = user.y + Math.sin(angle) * sup.range;
    if (prey) {
      const a = Phaser.Math.Angle.Between(user.x, user.y, prey.x, prey.y);
      const d = Math.max(0, Phaser.Math.Distance.Between(user.x, user.y, prey.x, prey.y) - DASH_GAP);
      tx = user.x + Math.cos(a) * d;
      ty = user.y + Math.sin(a) * d;
    }
    const spot = combat.freeSpot(user.x, user.y, tx, ty);
    dustPuff(scene, user.x, user.y, angle + Math.PI, user.y - 1);
    user.dashTo(spot.x, spot.y, p.dashSeconds, {
      hop: 20,
      onArrive: () => {
        const damage = user.scaledDamage(p.damage);
        const hits = combat.inCircle(spot.x, spot.y, p.biteRadius, (t) => t.team !== user.team);
        const a = prey ? Phaser.Math.Angle.Between(spot.x, spot.y, prey.x, prey.y) : angle;
        chomp(scene, spot.x + Math.cos(a) * 50, spot.y + Math.sin(a) * 50 - BITE_HEIGHT, spot.y + 3, a, 1.6);
        let ate = false;
        for (const t of hits) {
          combat.damage(user, t, damage);
          hitSpark(scene, t.x, t.y - 60, t.y + 2);
          if (t.kind === 'personaggio' && !t.isAlive()) ate = true;
        }
        if (user.isHuman || hits.some((h) => h.isHuman)) scene.cameras.main.shake(140, 0.006);
        if (!ate || !user.isAlive()) return;
        // ha mangiato un cuore: vita piena e diventa più grande
        user.heal(1);
        scene.tweens.add({ targets: user, scale: p.growScale, duration: 300, ease: 'Back.out' });
        scene.time.delayedCall(p.growSeconds * 1000, () => {
          if (user.active) scene.tweens.add({ targets: user, scale: 1, duration: 300 });
        });
      },
    });
  },
};
