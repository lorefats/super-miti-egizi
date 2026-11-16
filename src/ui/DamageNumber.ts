import Phaser from 'phaser';
import { DEPTH, FONT_FAMILY } from '../config';
import { PALETTE, css } from '../art/palette';

/** Numero di danno che salta fuori, con bordo scuro, e svanisce. */
export function showDamageNumber(scene: Phaser.Scene, x: number, y: number, amount: number, color = '#FFFFFF'): void {
  const t = scene.add
    .text(x + Phaser.Math.Between(-14, 14), y, String(Math.round(amount)), {
      fontFamily: FONT_FAMILY,
      fontSize: '34px',
      color,
      stroke: css(PALETTE.bluNotte),
      strokeThickness: 7,
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.overhead + 1)
    .setScale(0.4);
  scene.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Back.out' });
  scene.tweens.add({
    targets: t,
    y: y - 60,
    alpha: 0,
    delay: 250,
    duration: 550,
    ease: 'Quad.in',
    onComplete: () => t.destroy(),
  });
}
