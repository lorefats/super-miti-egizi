import Phaser from 'phaser';
import { FONT_FAMILY } from '../config';

/** Prima scena: aspetta il font e passa al caricamento. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  async create(): Promise<void> {
    try {
      await document.fonts.load(`64px ${FONT_FAMILY}`);
    } catch {
      /* se fallisce usiamo il font di riserva */
    }
    this.scene.start('Preload');
  }
}
