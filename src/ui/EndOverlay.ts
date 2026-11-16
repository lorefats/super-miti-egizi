import Phaser from 'phaser';
import { DEPTH, FONT_FAMILY } from '../config';
import { PALETTE, css } from '../art/palette';

/** Schermata di fine partita: titolo grande e pulsante per giocare ancora. */
export function showEndOverlay(scene: Phaser.Scene, title: string, victory: boolean, onPlayAgain: () => void): void {
  const { width, height } = scene.scale;
  const layer = scene.add.container(0, 0).setDepth(DEPTH.ui + 100);

  const dim = scene.add.rectangle(0, 0, width, height, PALETTE.bluNotte, 0.6).setOrigin(0);
  // blocca i tocchi sotto la schermata
  dim.setInteractive();

  const titleText = scene.add
    .text(width / 2, height / 2 - 70, title, {
      fontFamily: FONT_FAMILY,
      fontSize: victory ? '110px' : '76px',
      color: victory ? css(PALETTE.oro) : '#FFFFFF',
      stroke: css(PALETTE.bluNotte),
      strokeThickness: 12,
      shadow: { offsetX: 0, offsetY: 8, color: victory ? css(PALETTE.oroOmbra) : '#000000', fill: true, stroke: true },
      align: 'center',
    })
    .setOrigin(0.5)
    .setScale(0.3);

  // pulsante "Gioca ancora" (grande, per le dita)
  const bw = 320;
  const bh = 84;
  const by = height / 2 + 90;
  const btn = scene.add.container(width / 2, by);
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.oroOmbra, 1).fillRoundedRect(-bw / 2, -bh / 2 + 8, bw, bh, 22);
  g.fillStyle(PALETTE.oro, 1).fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 22);
  g.lineStyle(5, PALETTE.bluNotte, 1).strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 22);
  const label = scene.add
    .text(0, -2, 'Gioca ancora', { fontFamily: FONT_FAMILY, fontSize: '40px', color: css(PALETTE.bluNotte) })
    .setOrigin(0.5);
  btn.add([g, label]);
  btn.setSize(bw, bh + 8).setInteractive({ useHandCursor: true });
  btn.on('pointerdown', () => btn.setScale(0.95));
  btn.on('pointerout', () => btn.setScale(1));
  btn.on('pointerup', () => onPlayAgain());

  layer.add([dim, titleText, btn]);
  // Fisso sullo schermo anche per i tocchi: Phaser controlla ogni oggetto da solo, quindi va detto
  // a ciascuno (altrimenti, con la telecamera spostata, il tocco "manca" il pulsante).
  for (const o of [layer, dim, titleText, btn]) o.setScrollFactor(0);
  btn.setAlpha(0);
  scene.tweens.add({ targets: titleText, scale: 1, duration: 450, ease: 'Back.out' });
  scene.tweens.add({ targets: btn, alpha: 1, delay: 300, duration: 200 });
}
