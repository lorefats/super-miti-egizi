import Phaser from 'phaser';
import '@fontsource/lilita-one';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { PALETTE } from './art/palette';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MatchScene } from './scenes/MatchScene';

// Aggiungendo "?debug" all'indirizzo si vedono i rettangoli delle collisioni.
const debug = new URLSearchParams(location.search).has('debug');

const game = new Phaser.Game({
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
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug } },
  scene: [BootScene, PreloadScene, MatchScene],
});

// Solo in modalità debug: rende il gioco raggiungibile dalla console del browser per le prove.
if (debug) (window as unknown as { game: Phaser.Game }).game = game;
