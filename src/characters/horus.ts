import Phaser from 'phaser';
import { TEX } from '../art';
import { hitSpark, isOnScreen } from '../art/effects';
import { DEPTH } from '../config';
import { Projectile } from '../entities/Projectile';
import { FieldEffect } from '../entities/FieldEffect';
import type { CharacterModule } from './types';

/** Nome del potere dato dalla super (lo legge anche Player.seesAll). */
const EYE = 'occhio';
/** Altezza da terra a cui vola la freccia. */
const ARROW_HEIGHT = 64;

/** Scia corta dietro la freccia (dorata quando l'Occhio di Horus è attivo). */
function streak(color: number) {
  return (g: Phaser.GameObjects.Graphics, sx: number, sy: number, x: number, y: number) => {
    const len = Phaser.Math.Distance.Between(sx, sy, x, y);
    if (len < 4) return;
    const k = Math.min(1, 90 / len);
    g.lineStyle(5, color, 0.45).lineBetween(x - (x - sx) * k, y - (y - sy) * k, x, y);
  };
}

/** Horus — Arco del Falco: una freccia lunghissima e veloce. Più vola lontano, più fa danno. */
export const horus: CharacterModule = {
  id: 'horus',
  swingSeconds: 0.12,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    const base = user.attackDamage();
    // con l'Occhio di Horus le frecce attraversano i nemici
    const pierce = user.hasBuff(EYE);
    new Projectile(scene, user.x + Math.cos(angle) * 34, user.y + Math.sin(angle) * 34, {
      owner: user,
      combat,
      angle,
      speed: p.arrowSpeed,
      range: w.range,
      radius: p.arrowRadius,
      height: ARROW_HEIGHT,
      texture: TEX.freccia,
      spin: 0,
      pierce,
      drawTrail: streak(pierce ? 0xffd27a : 0xffffff),
      onHit: (target, x, y, travelled) => {
        const far = Math.min(1, travelled / w.range);
        combat.damage(user, target, base * (1 + p.farBonus * far));
        hitSpark(scene, x, y - ARROW_HEIGHT, y + 2);
      },
    });
  },

  /** Super — Occhio di Horus: per qualche secondo vede tutti i nemici (anche nei cespugli) e le frecce li attraversano. */
  useSuper(user) {
    const seconds = user.stats.super.params.seconds;
    const scene = user.scene;
    user.addBuff(EYE, seconds);
    if (user.isHuman) scene.cameras.main.flash(250, 255, 220, 140);
    if (!isOnScreen(scene, user.x, user.y) && !user.isHuman) return;

    // un grande occhio appare nel cielo sopra di lui e lo segue
    const eye = scene.add.image(user.x, user.y - 250, TEX.occhioHorus).setDepth(DEPTH.overhead - 10).setScale(0.2).setAlpha(0);
    const glow = scene.add
      .image(user.x, user.y - 250, TEX.bagliore)
      .setDepth(DEPTH.overhead - 11)
      .setTint(0xffd27a)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.8)
      .setAlpha(0);
    scene.tweens.add({ targets: eye, scale: 0.75, alpha: 0.95, duration: 380, ease: 'Back.out' });
    scene.tweens.add({ targets: glow, alpha: 0.7, duration: 380 });
    const fx = new FieldEffect(scene, user.x, user.y, seconds, (f) => {
      const y = user.y - 250 + Math.sin(f.age * 3) * 6;
      eye.setPosition(user.x, y);
      glow.setPosition(user.x, y).setScale(1.8 + Math.sin(f.age * 6) * 0.12);
      // l'occhio si chiude quando il personaggio non c'è più
      if (!user.isAlive()) f.finish();
    });
    fx.own(eye, glow);
  },
};
