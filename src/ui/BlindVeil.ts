import Phaser from 'phaser';
import { DEPTH } from '../config';
import { BLIND } from '../data/combat';

/**
 * Buio attorno al giocatore quando è accecato (tempesta di Seth, notte di Kek):
 * si vede solo un cerchio vicino a sé, il resto dello schermo è scuro.
 */
export class BlindVeil {
  private readonly g: Phaser.GameObjects.Graphics;
  private shown = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.ui - 50).setVisible(false);
  }

  /** Da chiamare ogni fotogramma con la posizione del giocatore e se è accecato. */
  update(x: number, y: number, blind: boolean, dt: number): void {
    // il buio arriva e se ne va in un attimo, senza scatti
    this.shown = Phaser.Math.Clamp(this.shown + (blind ? dt : -dt) * 4, 0, 1);
    if (this.shown <= 0) {
      this.g.setVisible(false);
      return;
    }
    const cam = this.scene.cameras.main;
    const sx = (x - cam.worldView.x) * cam.zoom;
    const sy = (y - 60 - cam.worldView.y) * cam.zoom;
    const big = Math.max(this.scene.scale.width, this.scene.scale.height) * 2;
    this.g
      .setVisible(true)
      .clear()
      .lineStyle(big, 0x120c24, 0.9 * this.shown)
      .strokeCircle(sx, sy, BLIND.sight * cam.zoom + big / 2);
  }
}
