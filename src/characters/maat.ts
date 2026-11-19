import Phaser from 'phaser';
import { TEX } from '../art';
import { hitSpark } from '../art/effects';
import { DEPTH } from '../config';
import { Projectile } from '../entities/Projectile';
import { showDamageNumber } from '../ui/DamageNumber';
import type { CharacterModule } from './types';

/** Altezza da terra a cui vola la piuma. */
const FEATHER_HEIGHT = 64;

/** Maat — Piuma della Verità: colpo preciso a lunga distanza; fa più danno a chi ha più vita di lei. */
export const maat: CharacterModule = {
  id: 'maat',
  swingSeconds: 0.12,

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
      height: FEATHER_HEIGHT,
      texture: TEX.piumetta,
      spin: 0,
      drawTrail: (g, sx, sy, ex, ey) => {
        const len = Phaser.Math.Distance.Between(sx, sy, ex, ey);
        if (len < 4) return;
        const k = Math.min(1, 80 / len);
        g.lineStyle(4, 0xffffff, 0.5).lineBetween(ex - (ex - sx) * k, ey - (ey - sy) * k, ex, ey);
      },
      onHit: (target, x, y) => {
        if (target.team === user.team) return;
        // giustizia: chi ha più vita (in percentuale) prende di più
        const heavier = (target.healthFraction?.() ?? 0) > user.healthFraction();
        combat.damage(user, target, base * (heavier ? 1 + p.justiceBonus : 1));
        hitSpark(scene, x, y - FEATHER_HEIGHT, y + 2);
      },
    }).setScale(2);
  },

  /**
   * Super — La Bilancia: la bilancia appare sopra un nemico. Se lui ha più vita (in percentuale) di Maat,
   * le vite si scambiano (al massimo di metà vita).
   */
  useSuper(user, angle, combat) {
    const sup = user.stats.super;
    const p = sup.params;
    const scene = user.scene;
    const target =
      combat.enemyInCone(user.x, user.y, user.team, angle, sup.range, p.aimCone) ??
      combat.nearestEnemy(user.x, user.y, user.team, sup.range, user.hideout, ['personaggio'], user.seesAll());
    if (!target || !target.healthFraction || !target.setHealthFraction) return;
    const theirs = target.healthFraction();
    const mine = user.healthFraction();
    const diff = Math.min(Math.max(0, theirs - mine), p.maxSwap);

    // la bilancia oscilla sopra il nemico e poi pende dalla parte giusta
    const scale = scene.add.image(target.x, target.y - 240, TEX.bilancia).setDepth(DEPTH.overhead - 15).setScale(0.2).setAlpha(0);
    const glow = scene.add.image(target.x, target.y - 240, TEX.bagliore).setTint(0xffe08a).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.overhead - 16).setScale(1.5).setAlpha(0);
    scene.tweens.add({ targets: scale, scale: 1, alpha: 1, duration: 300, ease: 'Back.out' });
    scene.tweens.add({ targets: glow, alpha: 0.6, duration: 300 });
    scene.tweens.add({ targets: scale, angle: { from: -12, to: 12 }, duration: 160, yoyo: true, repeat: 1, delay: 300 });
    scene.time.delayedCall(950, () => {
      scene.tweens.add({ targets: scale, angle: diff > 0 ? 14 : 0, duration: 200, ease: 'Back.out' });
      if (diff > 0 && target.isAlive() && user.isAlive()) {
        target.setHealthFraction!(theirs - diff);
        user.setHealthFraction(mine + diff);
        const pct = Math.round(diff * 100);
        showDamageNumber(scene, target.x, target.y - 160, pct, '#FFB3B8', '−', '%');
        showDamageNumber(scene, user.x, user.y - 160, pct, '#7CF29A', '+', '%');
        if (user.isHuman || target.isHuman) scene.cameras.main.flash(200, 255, 230, 160);
      }
      scene.tweens.add({ targets: [scale, glow], alpha: 0, delay: 500, duration: 300, onComplete: () => (scale.destroy(), glow.destroy()) });
    });
  },
};
