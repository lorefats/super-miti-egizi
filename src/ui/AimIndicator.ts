import Phaser from 'phaser';
import { DEPTH } from '../config';
import { PALETTE } from '../art/palette';
import type { WeaponData } from '../data/characters';

/** Ventaglio disegnato sulla sabbia che mostra dove colpirà l'arma mentre si mira. */
export class AimIndicator {
  private readonly g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(DEPTH.groundMarks).setVisible(false);
  }

  show(x: number, y: number, angle: number, weapon: WeaponData, ready: boolean): void {
    const g = this.g;
    const half = Phaser.Math.DegToRad(weapon.arcDegrees) / 2;
    const color = ready ? 0xffffff : PALETTE.rossoDeserto;
    g.clear().setVisible(true);
    g.fillStyle(color, 0.28);
    g.slice(x, y, weapon.range, angle - half, angle + half, false).fillPath();
    g.lineStyle(3, color, 0.8);
    g.beginPath();
    g.arc(x, y, weapon.range, angle - half, angle + half, false);
    g.strokePath();
  }

  hide(): void {
    this.g.setVisible(false);
  }
}
