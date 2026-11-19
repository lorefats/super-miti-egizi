import Phaser from 'phaser';
import { TEX } from '../art';
import { dustPuff, hitSpark, isOnScreen } from '../art/effects';
import { FieldEffect } from '../entities/FieldEffect';
import type { CharacterModule } from './types';

/** Ogni quanti pixel spunta una roccia lungo l'onda d'urto. */
const ROCK_STEP = 46;
/** Grandezza delle pietre della prigione (anche per le collisioni). */
const PRISON_ROCK = 46;

/** Una roccia che spunta dal terreno e poi rientra. */
function popRock(scene: Phaser.Scene, x: number, y: number, delay: number, scale: number): void {
  const rock = scene.add.image(x, y, TEX.roccia).setOrigin(0.5, 1).setDepth(y).setScale(scale, 0).setAngle(Phaser.Math.Between(-10, 10));
  scene.tweens.add({ targets: rock, scaleY: scale, delay, duration: 90, ease: 'Back.out' });
  scene.tweens.add({ targets: rock, scaleY: 0, alpha: 0, delay: delay + 260, duration: 180, onComplete: () => rock.destroy() });
  scene.time.delayedCall(delay, () => dustPuff(scene, x, y, -Math.PI / 2, y - 1));
}

/** Geb — Pugno di Roccia: colpisce il terreno e un'onda d'urto avanza in linea. */
export const geb: CharacterModule = {
  id: 'geb',
  swingSeconds: 0.14,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const scene = user.scene;
    const damage = user.attackDamage();
    const length = combat.rayLength(user.x, user.y, angle, w.range);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // chi è sulla strada viene colpito quando l'onda arriva fin lì
    const hits = combat
      .alongLine(user.x, user.y, angle, length, w.aimWidth, user.team)
      .filter((t) => !combat.lineBlocked(user.x, user.y, t.x, t.y));
    for (const t of hits) {
      const along = (t.x - user.x) * cos + (t.y - user.y) * sin;
      scene.time.delayedCall((Math.max(0, along) / w.params.waveSpeed) * 1000, () => {
        if (!t.isAlive()) return;
        combat.damage(user, t, damage);
        hitSpark(scene, t.x, t.y - 50, t.y + 2);
      });
    }
    if (user.isHuman && hits.length > 0) scene.cameras.main.shake(80, 0.003);
    if (!isOnScreen(scene, user.x, user.y)) return;
    for (let d = 50; d <= length; d += ROCK_STEP) {
      popRock(scene, user.x + cos * d, user.y + sin * d, (d / w.params.waveSpeed) * 1000, 0.55 + (d / w.range) * 0.25);
    }
  },

  /** Super — Prigione di Pietra: fa spuntare un anello di rocce che intrappola chi è dentro. */
  useSuper(user, angle, combat, distance) {
    const p = user.stats.super.params;
    const scene = user.scene;
    const cx = user.x + Math.cos(angle) * distance;
    const cy = user.y + Math.sin(angle) * distance;
    const r = p.radius;

    // chi è dentro quando le rocce spuntano prende un colpo
    const inside = combat.inCircle(cx, cy, r, (t) => t.team !== user.team);
    for (const t of inside) {
      combat.damage(user, t, user.scaledDamage(p.damage));
      hitSpark(scene, t.x, t.y - 60, t.y + 2);
    }
    if (user.isHuman || inside.some((t) => t.isHuman)) scene.cameras.main.shake(180, 0.006);

    // l'anello: rocce vere (muri) tutte attaccate, così non si passa
    const count = Math.ceil((Math.PI * 2 * r) / (PRISON_ROCK - 6));
    const rocks: Phaser.GameObjects.Image[] = [];
    const blocks: Phaser.GameObjects.Zone[] = [];
    const walls = combat.walls;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const rock = scene.add.image(x, y + 14, TEX.roccia).setOrigin(0.5, 1).setDepth(y + 14).setScale(0.95, 0).setAngle(Phaser.Math.Between(-8, 8));
      scene.tweens.add({ targets: rock, scaleY: 0.95 + Math.random() * 0.3, delay: i * 12, duration: 140, ease: 'Back.out' });
      rocks.push(rock);
      if (walls) {
        const z = scene.add.zone(x, y, PRISON_ROCK, PRISON_ROCK);
        walls.add(z);
        blocks.push(z);
      }
    }
    new FieldEffect(
      scene,
      cx,
      cy,
      p.seconds,
      () => undefined,
      () => {
        // le rocce rientrano nel terreno
        for (const z of blocks) walls?.remove(z, true, true);
        rocks.forEach((rock, i) => {
          scene.tweens.add({ targets: rock, scaleY: 0, delay: i * 8, duration: 200, onComplete: () => rock.destroy() });
        });
      },
    );
  },
};
