import Phaser from 'phaser';
import { TEX } from '../art';
import { groundRing, hitSpark, isOnScreen } from '../art/effects';
import { DEPTH } from '../config';
import type { Damageable } from '../entities/Combat';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Altezza da terra a cui vola il disco solare, e a cui passa la barca. */
const ORB_HEIGHT = 64;
const BOAT_HEIGHT = 90;
const FIRE = [0xffe08a, 0xff9f1c, 0xe8590c];

/** Esplosione di fuoco nel punto (x, y). */
function fireBurst(scene: Phaser.Scene, x: number, y: number, radius: number): void {
  groundRing(scene, x, y, radius, 0xff9f1c, 350);
  if (!isOnScreen(scene, x, y)) return;
  const b = scene.add.particles(x, y - 30, TEX.fiamma, {
    speed: { min: 100, max: 260 },
    lifespan: { min: 250, max: 450 },
    scale: { start: 1.1, end: 0.2 },
    alpha: { start: 1, end: 0 },
    tint: FIRE,
    emitting: false,
  });
  b.setDepth(y + 4);
  b.explode(16);
  scene.time.delayedCall(550, () => b.destroy());
}

/** Rà — Disco Solare: sfera di fuoco che esplode quando tocca qualcosa, con danno attorno. */
export const ra: CharacterModule = {
  id: 'ra',
  swingSeconds: 0.12,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    const direct = user.attackDamage();
    const blast = user.scaledDamage(p.blastDamage);
    let hit: Damageable | null = null;
    new Projectile(scene, user.x + Math.cos(angle) * 34, user.y + Math.sin(angle) * 34, {
      owner: user,
      combat,
      angle,
      speed: p.speed,
      range: w.range,
      radius: p.radius,
      height: ORB_HEIGHT,
      texture: TEX.discoSolare,
      spin: 5,
      onHit: (target) => {
        if (target.team === user.team) return;
        hit = target;
        combat.damage(user, target, direct);
      },
      onEnd: (x, y) => {
        // esplode dove si ferma: colpisce chi è attorno (non di nuovo chi ha preso il disco in pieno)
        for (const t of combat.inCircle(x, y, p.blastRadius, (o) => o.team !== user.team && o !== hit)) {
          combat.damage(user, t, blast);
          hitSpark(scene, t.x, t.y - 60, t.y + 2);
        }
        fireBurst(scene, x, y, p.blastRadius);
      },
    });
  },

  /**
   * Super — Barca del Sole: la barca dorata del sole attraversa tutta la mappa in linea retta,
   * lasciando un raggio di sole gigante che passa attraverso i muri.
   */
  useSuper(user, angle, combat) {
    const sup = user.stats.super;
    const p = sup.params;
    const scene = user.scene;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const sx = user.x;
    const sy = user.y;
    const length = sup.range;
    const width = sup.aimWidth;
    const damage = user.scaledDamage(p.damage);
    const travel = length / p.speed;

    // chi è sulla strada viene colpito quando la barca passa da lui (i muri non fermano il raggio)
    for (const t of combat.alongLine(sx, sy, angle, length, width, user.team)) {
      const along = (t.x - sx) * cos + (t.y - sy) * sin;
      scene.time.delayedCall((Math.max(0, along) / p.speed) * 1000, () => {
        if (!t.isAlive()) return;
        combat.damage(user, t, damage);
        hitSpark(scene, t.x, t.y - 60, t.y + 2);
        fireBurst(scene, t.x, t.y, 60);
      });
    }
    if (user.isHuman) scene.cameras.main.flash(300, 255, 220, 140);

    const beam = scene.add.graphics().setDepth(DEPTH.overhead - 50);
    const boat = scene.add
      .image(sx, sy - BOAT_HEIGHT, TEX.barcaSole)
      .setDepth(DEPTH.overhead - 49)
      .setFlipX(cos < 0)
      .setRotation(cos < 0 ? angle - Math.PI : angle)
      .setScale(0.3);
    scene.tweens.add({ targets: boat, scale: 1.1, duration: 200, ease: 'Back.out' });
    const state = { head: 0, fade: 1 };
    const draw = () => {
      const hx = sx + cos * length * state.head;
      const hy = sy + sin * length * state.head;
      beam.clear();
      // raggio a strati: alone arancio, giallo, cuore bianco
      beam.lineStyle(width * 1.3, 0xff9f1c, 0.25 * state.fade).lineBetween(sx, sy - 40, hx, hy - 40);
      beam.lineStyle(width * 0.8, 0xffd23f, 0.55 * state.fade).lineBetween(sx, sy - 40, hx, hy - 40);
      beam.lineStyle(width * 0.3, 0xffffff, 0.9 * state.fade).lineBetween(sx, sy - 40, hx, hy - 40);
      boat.setPosition(hx, hy - BOAT_HEIGHT);
    };
    scene.tweens.add({
      targets: state,
      head: 1,
      duration: travel * 1000,
      onUpdate: draw,
      onComplete: () => {
        scene.tweens.add({ targets: boat, alpha: 0, scale: 0.5, duration: 250, onComplete: () => boat.destroy() });
        scene.tweens.add({
          targets: state,
          fade: 0,
          delay: p.glowSeconds * 1000,
          duration: 300,
          onUpdate: draw,
          onComplete: () => beam.destroy(),
        });
      },
    });
  },
};
