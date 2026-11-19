import Phaser from 'phaser';
import { TEX } from '../art';
import { hitSpark, isOnScreen } from '../art/effects';
import type { Combat, Damageable, Shield } from '../entities/Combat';
import { FieldEffect } from '../entities/FieldEffect';
import { Projectile } from '../entities/Projectile';
import type { Player } from '../entities/Player';
import type { CharacterModule } from './types';

/** Altezza da terra a cui vola l'ankh. */
const ANKH_HEIGHT = 62;
/** Colori delle piume della cupola. */
const RAINBOW = [0x9b5de5, 0x2ec4b6, 0xf2b632, 0x3f63d9, 0xe63946];

/** Lancia un ankh luminoso da (x, y) nella direzione `angle`. Se `chain`, dopo aver colpito rimbalza su un altro nemico. */
function throwAnkh(user: Player, combat: Combat, x: number, y: number, angle: number, damage: number, chain: boolean, ignore: Damageable[]): void {
  const p = user.stats.weapon.params;
  const scene = user.scene;
  new Projectile(scene, x, y, {
    owner: user,
    combat,
    angle,
    speed: p.speed,
    range: chain ? user.stats.weapon.range : p.chainRange + 40,
    radius: p.radius,
    height: ANKH_HEIGHT,
    texture: TEX.ankh,
    spin: 7,
    ignore,
    drawTrail: (g, sx, sy, ex, ey) => {
      const len = Phaser.Math.Distance.Between(sx, sy, ex, ey);
      if (len < 4) return;
      const k = Math.min(1, 70 / len);
      g.lineStyle(8, 0xffe08a, 0.4).lineBetween(ex - (ex - sx) * k, ey - (ey - sy) * k, ex, ey);
    },
    onHit: (target, hx, hy) => {
      if (target.team === user.team) return;
      combat.damage(user, target, damage);
      hitSpark(scene, hx, hy - ANKH_HEIGHT, hy + 2);
      if (!chain) return;
      // rimbalza sul nemico più vicino (non quello appena colpito)
      const next = combat
        .inCircle(hx, hy, p.chainRange, (o) => o !== target && o.team !== user.team)
        .sort((a, b) => Phaser.Math.Distance.Between(hx, hy, a.x, a.y) - Phaser.Math.Distance.Between(hx, hy, b.x, b.y))[0];
      if (next) {
        const a = Phaser.Math.Angle.Between(hx, hy, next.x, next.y);
        throwAnkh(user, combat, hx, hy, a, damage * p.chainDamage, false, [target]);
      }
    },
  });
}

/** Iside — Ankh Luminoso: proiettile magico che, dopo aver colpito, rimbalza su un secondo bersaglio vicino. */
export const iside: CharacterModule = {
  id: 'iside',
  swingSeconds: 0.09,

  attack(user, angle, combat) {
    throwAnkh(user, combat, user.x + Math.cos(angle) * 30, user.y + Math.sin(angle) * 30, angle, user.attackDamage(), true, []);
  },

  /** Super — Ali Protettrici: apre le ali e crea una cupola che blocca tutti i proiettili dei nemici. */
  useSuper(user, _angle, combat) {
    const p = user.stats.super.params;
    const scene = user.scene;
    const r = p.radius;
    const shield: Shield = { x: user.x, y: user.y, radius: r, team: user.team };
    combat.shields.push(shield);

    // la cupola: una bolla trasparente con un bordo di piume colorate
    const dome = scene.add.graphics({ x: shield.x, y: shield.y }).setDepth(shield.y + r * 0.5);
    dome.fillStyle(0xcba6f7, 0.16).fillEllipse(0, -r * 0.35, r * 2, r * 1.6);
    dome.lineStyle(6, 0xffffff, 0.7).strokeEllipse(0, -r * 0.35, r * 2, r * 1.6);
    dome.lineStyle(3, 0x9b5de5, 0.9).strokeEllipse(0, -r * 0.35, r * 1.9, r * 1.5);
    const base = scene.add.graphics({ x: shield.x, y: shield.y }).setDepth(-950).setScale(1, 0.62);
    base.lineStyle(5, 0xcba6f7, 0.9).strokeCircle(0, 0, r);
    const feathers: Phaser.GameObjects.Image[] = [];
    if (isOnScreen(scene, shield.x, shield.y)) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const f = scene.add
          .image(shield.x + Math.cos(a) * r, shield.y + Math.sin(a) * r * 0.62, TEX.piumetta)
          .setTint(RAINBOW[i % RAINBOW.length])
          .setScale(1.4)
          .setRotation(a + Math.PI / 2)
          .setDepth(shield.y + Math.sin(a) * r * 0.62 + 1);
        feathers.push(f);
      }
    }
    dome.setScale(0.2);
    scene.tweens.add({ targets: dome, scale: 1, duration: 300, ease: 'Back.out' });
    if (user.isHuman) scene.cameras.main.flash(200, 230, 210, 255);

    const fx = new FieldEffect(
      scene,
      shield.x,
      shield.y,
      p.seconds,
      (f) => {
        dome.setAlpha(0.85 + Math.sin(f.age * 8) * 0.15);
        feathers.forEach((fe, i) => fe.setScale(1.4 + Math.sin(f.age * 6 + i) * 0.15));
      },
      () => {
        const i = combat.shields.indexOf(shield);
        if (i >= 0) combat.shields.splice(i, 1);
      },
    );
    fx.own(dome, base, ...feathers);
  },
};
