import Phaser from 'phaser';
import { TEX } from '../art';
import { hitSpark } from '../art/effects';
import { DEPTH, FONT_FAMILY } from '../config';
import { getCharacter, isPlayable } from '../data/characters';
import { Projectile } from '../entities/Projectile';
import type { Player } from '../entities/Player';
import { getCharacterModule } from './index';
import type { CharacterModule } from './types';

/** Altezza da terra a cui volano i geroglifici. */
const GLYPH_HEIGHT = 66;
const GLYPHS = [TEX.geroglifico0, TEX.geroglifico1, TEX.geroglifico2];

/** Un geroglifico che vola dritto. */
function shootGlyph(user: Player, angle: number, index: number, damage: number, range: number): void {
  const p = user.stats.weapon.params;
  const scene = user.scene;
  const combat = user.combat;
  new Projectile(scene, user.x + Math.cos(angle) * 34, user.y + Math.sin(angle) * 34, {
    owner: user,
    combat,
    angle,
    speed: p.speed,
    range,
    radius: p.radius,
    height: GLYPH_HEIGHT,
    texture: GLYPHS[index % GLYPHS.length],
    spin: 0,
    onHit: (target, x, y) => {
      if (target.team === user.team) return;
      combat.damage(user, target, damage);
      hitSpark(scene, x, y - GLYPH_HEIGHT, y + 2);
    },
  });
}

/** Scritta che sale sopra la testa (es. "Copia: Seth!"). */
function floatText(scene: Phaser.Scene, x: number, y: number, text: string): void {
  const t = scene.add
    .text(x, y, text, { fontFamily: FONT_FAMILY, fontSize: '26px', color: '#FFE08A', stroke: '#14213D', strokeThickness: 6 })
    .setOrigin(0.5)
    .setDepth(DEPTH.overhead + 5);
  scene.tweens.add({ targets: t, y: y - 50, alpha: { from: 1, to: 0 }, delay: 500, duration: 900, onComplete: () => t.destroy() });
}

/** Thoth — Raffica di Geroglifici: scrive in aria 3 geroglifici che partono uno dopo l'altro. */
export const thoth: CharacterModule = {
  id: 'thoth',
  swingSeconds: 0.08,

  attack(user, angle) {
    const w = user.stats.weapon;
    const damage = user.attackDamage();
    shootGlyph(user, angle, 0, damage, w.range);
    for (let i = 1; i < w.params.glyphs; i++) {
      user.scene.time.delayedCall(w.params.gapSeconds * 1000 * i, () => {
        if (user.canAct()) shootGlyph(user, angle, i, damage, w.range);
      });
    }
  },

  /**
   * Super — Libro di Thoth: copia la super dell'ultimo nemico che lo ha colpito e la usa una volta.
   * Se nessuno l'ha ancora colpito, scrive un cerchio di geroglifici tutto attorno.
   */
  useSuper(user, angle, combat, distance) {
    const scene = user.scene;
    const copied = user.lastEnemySuper;
    if (copied && copied !== 'thoth' && isPlayable(copied)) {
      const data = getCharacter(copied);
      floatText(scene, user.x, user.y - 210, `Copia: ${data.name}!`);
      user.withBorrowedStats(data, () =>
        getCharacterModule(copied).useSuper(user, angle, combat, Math.min(distance, data.super.range)),
      );
      return;
    }
    const p = user.stats.super.params;
    const damage = user.scaledDamage(p.ringDamage);
    for (let i = 0; i < p.ringGlyphs; i++) {
      shootGlyph(user, (i / p.ringGlyphs) * Math.PI * 2, i, damage, user.stats.weapon.range * 0.7);
    }
  },
};
