import Phaser from 'phaser';
import { playSfx, vibrate } from '../audio/Sound';
import { DEPTH, FONT_FAMILY } from '../config';
import { PALETTE, css } from '../art/palette';

/** Scritta grande di fine partita ("VITTORIA!" / "Sconfitto — 4° posto"), prima dei Risultati. */
export function showEndOverlay(scene: Phaser.Scene, title: string, victory: boolean): void {
  const { width, height } = scene.scale;
  const dim = scene.add
    .rectangle(0, 0, width, height, PALETTE.bluNotte, 0.6)
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(DEPTH.ui + 100)
    .setAlpha(0);
  // blocca i tocchi sotto la scritta
  dim.setInteractive();

  const titleText = scene.add
    .text(width / 2, height / 2, title, {
      fontFamily: FONT_FAMILY,
      fontSize: victory ? '110px' : '76px',
      color: victory ? css(PALETTE.oro) : '#FFFFFF',
      stroke: css(PALETTE.bluNotte),
      strokeThickness: 12,
      shadow: { offsetX: 0, offsetY: 8, color: victory ? css(PALETTE.oroOmbra) : '#000000', fill: true, stroke: true },
      align: 'center',
    })
    .setOrigin(0.5)
    .setScale(0.3)
    .setScrollFactor(0)
    .setDepth(DEPTH.ui + 101);

  playSfx(victory ? 'victory' : 'lose');
  if (victory) vibrate('victory');
  scene.tweens.add({ targets: dim, alpha: 1, duration: 250 });
  scene.tweens.add({ targets: titleText, scale: 1, duration: 450, ease: 'Back.out' });
}
