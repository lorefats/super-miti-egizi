import Phaser from 'phaser';
import { DEPTH, FONT_FAMILY } from '../config';
import { PALETTE } from '../art/palette';

/** Messaggio breve in alto che sparisce da solo (es. "Arriva presto!"). Uno alla volta. */
export function showToast(scene: Phaser.Scene, message: string, seconds = 1.5): void {
  const old = scene.children.getByName('toast');
  old?.destroy();
  const { width } = scene.scale;
  const text = scene.add
    .text(0, 0, message, { fontFamily: FONT_FAMILY, fontSize: '30px', color: '#FFFFFF', align: 'center' })
    .setOrigin(0.5);
  const w = text.width + 60;
  const h = text.height + 26;
  const bg = scene.add.graphics();
  bg.fillStyle(PALETTE.bluNotte, 0.92).fillRoundedRect(-w / 2, -h / 2, w, h, 18);
  bg.lineStyle(4, PALETTE.oro, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
  const box = scene.add.container(width / 2, 150, [bg, text]).setName('toast').setDepth(DEPTH.ui + 200).setScrollFactor(0);
  box.setScale(0.6).setAlpha(0);
  scene.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 180, ease: 'Back.out' });
  scene.tweens.add({ targets: box, alpha: 0, delay: seconds * 1000, duration: 300, onComplete: () => box.destroy() });
}
