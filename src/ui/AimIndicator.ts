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

  /** Linea dritta (per le super che volano dritte): lunghezza e larghezza in pixel, dorata. */
  showLine(x: number, y: number, angle: number, length: number, width: number): void {
    const g = this.g;
    g.clear().setVisible(true);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nx = -sin * (width / 2);
    const ny = cos * (width / 2);
    const ex = x + cos * length;
    const ey = y + sin * length;
    const pts = [
      new Phaser.Math.Vector2(x + nx, y + ny),
      new Phaser.Math.Vector2(ex + nx, ey + ny),
      new Phaser.Math.Vector2(ex - nx, ey - ny),
      new Phaser.Math.Vector2(x - nx, y - ny),
    ];
    g.fillStyle(PALETTE.oro, 0.3).fillPoints(pts, true);
    g.lineStyle(3, PALETTE.oro, 0.9).strokePoints(pts, true);
  }

  hide(): void {
    this.g.setVisible(false);
  }
}
