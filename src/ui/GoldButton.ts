import Phaser from 'phaser';
import { FONT_FAMILY } from '../config';
import { PALETTE, css } from '../art/palette';

/**
 * Grande pulsante d'oro (comodo per le dita). Fisso sullo schermo: lo scrollFactor va messo
 * su ogni pezzo, altrimenti con la telecamera spostata il tocco "manca" il pulsante.
 */
export function createGoldButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onPress: () => void,
  width = 320,
  height = 84,
  fontSize = 40,
): Phaser.GameObjects.Container {
  const btn = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.oroOmbra, 1).fillRoundedRect(-width / 2, -height / 2 + 8, width, height, 22);
  g.fillStyle(PALETTE.oro, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 22);
  g.fillStyle(0xffffff, 0.25).fillRoundedRect(-width / 2 + 10, -height / 2 + 6, width - 20, height * 0.32, 14);
  g.lineStyle(5, PALETTE.bluNotte, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 22);
  const text = scene.add
    .text(0, -2, label, { fontFamily: FONT_FAMILY, fontSize: `${fontSize}px`, color: css(PALETTE.bluNotte) })
    .setOrigin(0.5);
  btn.add([g, text]);
  btn.setSize(width, height + 8).setInteractive({ useHandCursor: true });
  for (const o of [btn, g, text]) o.setScrollFactor(0);
  let pressed = false;
  btn.on('pointerdown', () => {
    pressed = true;
    btn.setScale(0.95);
  });
  btn.on('pointerout', () => {
    pressed = false;
    btn.setScale(1);
  });
  btn.on('pointerup', () => {
    btn.setScale(1);
    if (!pressed) return;
    pressed = false;
    onPress();
  });
  return btn;
}
