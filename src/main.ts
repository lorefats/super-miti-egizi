import Phaser from 'phaser';
import '@fontsource/lilita-one';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { PALETTE } from './art/palette';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MatchScene } from './scenes/MatchScene';
import { ResultsScene } from './scenes/ResultsScene';
import { TitleScene } from './scenes/TitleScene';
import { LobbyScene } from './scenes/LobbyScene';

// "?fisica" nell'indirizzo mostra i rettangoli delle collisioni (rallenta: solo per provare).
// "?debug" rende il gioco raggiungibile dalla console del browser per le prove automatiche.
const params = new URLSearchParams(location.search);
const debug = params.has('debug');
const showPhysics = params.has('fisica');

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
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: showPhysics } },
  scene: [BootScene, PreloadScene, TitleScene, LobbyScene, MatchScene, ResultsScene],
});

// Solo in modalità debug: rende il gioco raggiungibile dalla console del browser per le prove.
if (debug) (window as unknown as { game: Phaser.Game }).game = game;
