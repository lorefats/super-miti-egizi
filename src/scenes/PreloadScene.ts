import Phaser from 'phaser';
import { FONT_FAMILY } from '../config';
import { PALETTE, css } from '../art/palette';
import { createAllTextures } from '../art';

/** Mostra il titolo mentre disegna tutte le immagini del gioco, poi mostra il logo. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Super Miti Egizi', {
        fontFamily: FONT_FAMILY,
        fontSize: '96px',
        color: css(PALETTE.oro),
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 12,
        shadow: { offsetX: 0, offsetY: 8, color: css(PALETTE.oroOmbra), fill: true, stroke: true },
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 110, 'Caricamento...', {
        fontFamily: FONT_FAMILY,
        fontSize: '32px',
        color: css(PALETTE.bluNotte),
      })
      .setOrigin(0.5);

    await createAllTextures(this);
    // "?partita" nell'indirizzo salta logo e Lobby (comodo per provare)
    this.scene.start(new URLSearchParams(location.search).has('partita') ? 'Match' : 'Title');
  }
}
