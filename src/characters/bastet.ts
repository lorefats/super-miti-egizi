import Phaser from 'phaser';
import { dustPuff, hitSpark, isOnScreen } from '../art/effects';
import type { Player } from '../entities/Player';
import type { CharacterModule } from './types';

/** A che distanza dal nemico atterra (pixel). */
const LAND_GAP = 85;
/** Altezza da terra a cui passano gli artigli. */
const CLAW_HEIGHT = 48;

/** Tre graffi bianchi paralleli che compaiono di colpo nel punto (x, y). */
function clawMarks(scene: Phaser.Scene, x: number, y: number, depth: number, tilt: number): void {
  if (!isOnScreen(scene, x, y)) return;
  const g = scene.add.graphics({ x, y }).setDepth(depth).setRotation(tilt);
  for (let i = -1; i <= 1; i++) {
    const ox = i * 13;
    g.lineStyle(9, 0x14213d, 0.9);
    g.beginPath().moveTo(ox - 6, -34).lineTo(ox + 6, 34).strokePath();
    g.lineStyle(4.5, 0xffffff, 1);
    g.beginPath().moveTo(ox - 6, -34).lineTo(ox + 6, 34).strokePath();
  }
  g.setScale(1, 0.1);
  scene.tweens.add({ targets: g, scaleY: 1, duration: 70, ease: 'Quad.out' });
  scene.tweens.add({ targets: g, alpha: 0, delay: 120, duration: 160, onComplete: () => g.destroy() });
}

/** Un graffio a ventaglio davanti a Bastet. */
function scratch(user: Player, angle: number, index: number): void {
  const w = user.stats.weapon;
  const combat = user.combat;
  const scene = user.scene;
  const hits = combat.hitArc(user, angle, w.range, w.arcDegrees, user.attackDamage());
  const cx = user.x + Math.cos(angle) * w.range * 0.6;
  const cy = user.y + Math.sin(angle) * w.range * 0.6 - CLAW_HEIGHT;
  // i due graffi si incrociano
  clawMarks(scene, cx, cy, user.y + 2, index % 2 === 0 ? 0.5 : -0.5);
  for (const h of hits) hitSpark(scene, h.x, h.y - 60, h.y + 2);
}

/** Bastet — Artigli Gemelli: doppio graffio rapidissimo a corto raggio. */
export const bastet: CharacterModule = {
  id: 'bastet',
  swingSeconds: 0.05,

  attack(user, angle) {
    const p = user.stats.weapon.params;
    scratch(user, angle, 0);
    for (let i = 1; i < p.scratches; i++) {
      user.scene.time.delayedCall(p.gapSeconds * 1000 * i, () => {
        if (user.canAct()) scratch(user, angle, i);
      });
    }
  },

  /**
   * Super — Balzo Felino: salta su un nemico da lontano, lo stordisce per un attimo e fa 3 graffi veloci.
   * Se nella direzione della mira non c'è nessuno, salta comunque in avanti.
   */
  useSuper(user, angle, combat) {
    const sup = user.stats.super;
    const p = sup.params;
    const scene = user.scene;
    const prey = combat.enemyInCone(user.x, user.y, user.team, angle, sup.range, p.aimCone);
    let tx = user.x + Math.cos(angle) * sup.range;
    let ty = user.y + Math.sin(angle) * sup.range;
    if (prey) {
      // atterra proprio davanti al nemico
      const a = Phaser.Math.Angle.Between(user.x, user.y, prey.x, prey.y);
      const d = Math.max(0, Phaser.Math.Distance.Between(user.x, user.y, prey.x, prey.y) - LAND_GAP);
      tx = user.x + Math.cos(a) * d;
      ty = user.y + Math.sin(a) * d;
    }
    const spot = combat.freeSpot(user.x, user.y, tx, ty);
    dustPuff(scene, user.x, user.y, angle, user.y - 1);

    user.dashTo(spot.x, spot.y, p.leapSeconds, {
      hop: p.leapHeight,
      onArrive: () => {
        dustPuff(scene, spot.x, spot.y, angle + Math.PI, spot.y - 1);
        const near = combat.inCircle(spot.x, spot.y, p.landRadius, (t) => t.team !== user.team && t.kind !== 'baule');
        for (const t of near) t.stun?.(p.stunSeconds, 'stelle');
        const target = near[0] ?? prey;
        const a = target ? Phaser.Math.Angle.Between(spot.x, spot.y, target.x, target.y) : angle;
        const damage = user.scaledDamage(p.scratchDamage);
        for (let i = 0; i < p.scratches; i++) {
          scene.time.delayedCall(p.scratchGap * 1000 * i, () => {
            if (!user.isAlive()) return;
            const cx = user.x + Math.cos(a) * 60;
            const cy = user.y + Math.sin(a) * 60 - CLAW_HEIGHT;
            clawMarks(scene, cx, cy, user.y + 2, i % 2 === 0 ? 0.5 : -0.5);
            for (const t of combat.inCircle(user.x, user.y, p.landRadius, (o) => o.team !== user.team)) {
              combat.damage(user, t, damage);
              hitSpark(scene, t.x, t.y - 60, t.y + 2);
            }
          });
        }
        if (user.isHuman || near.some((h) => h.isHuman)) scene.cameras.main.shake(120, 0.005);
      },
    });
  },
};
