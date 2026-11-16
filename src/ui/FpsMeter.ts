import Phaser from 'phaser';
import { DEPTH, FONT_FAMILY } from '../config';

/** Contatore dei fotogrammi al secondo (si accende con "?fps" nell'indirizzo): serve per controllare la fluidità sul telefono. */
export function addFpsMeter(scene: Phaser.Scene): void {
  if (!new URLSearchParams(location.search).has('fps')) return;
  const t = scene.add
    .text(14, 220, '', { fontFamily: FONT_FAMILY, fontSize: '22px', color: '#FFFFFF', stroke: '#14213D', strokeThickness: 5 })
    .setScrollFactor(0)
    .setDepth(DEPTH.ui + 50);
  scene.time.addEvent({
    delay: 500,
    loop: true,
    callback: () => t.setText(`${Math.round(scene.game.loop.actualFps)} fps`),
  });
}
