import Phaser from 'phaser';
import { FONT_FAMILY } from '../config';

/** Prima scena: aspetta il font e passa al caricamento. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  async create(): Promise<void> {
    // aspetta il font, ma al massimo 2 secondi: certi browser non rispondono mai e il gioco resterebbe fermo
    const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      await Promise.race([document.fonts.load(`64px ${FONT_FAMILY}`), timeout]);
    } catch {
      /* se fallisce usiamo il font di riserva */
    }
    this.scene.start('Preload');
  }
}
