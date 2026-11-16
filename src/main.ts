import Phaser from 'phaser';
import '@fontsource/lilita-one';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { PALETTE } from './art/palette';
import { BootScene } from './scenes/BootScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'gioco',
  backgroundColor: PALETTE.sabbia,
  scale: {
    // EXPAND: riempie tutto lo schermo del telefono senza bande nere, mantenendo le proporzioni.
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: { activePointers: 3 }, // più dita insieme (joystick + mira)
  scene: [BootScene],
});
