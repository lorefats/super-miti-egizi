import Phaser from 'phaser';
import { DEPTH } from '../config';
import { PALETTE } from '../art/palette';
import type { MapData } from '../data/maps';

/** Lato della minimappa sullo schermo (pixel). */
const SIZE = 190;
const MARGIN = 14;

/** Minimappa in alto a sinistra: zone colorate, acqua, il cerchio della tempesta e dove sei tu. */
export class Minimap {
  private readonly dyn: Phaser.GameObjects.Graphics;
  private readonly k: number;

  constructor(scene: Phaser.Scene, map: MapData) {
    this.k = SIZE / Math.max(map.width, map.height);
    const k = this.k;
    const bg = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.ui);
    const ox = MARGIN;
    const oy = MARGIN;
    bg.fillStyle(PALETTE.bluNotte, 0.7).fillRoundedRect(ox - 5, oy - 5, SIZE + 10, SIZE + 10, 10);
    bg.fillStyle(PALETTE.sabbia, 1).fillRect(ox, oy, map.width * k, map.height * k);
    for (const z of map.zones ?? []) bg.fillStyle(z.color, 1).fillRect(ox + z.x * k, oy + z.y * k, z.w * k, z.h * k);
    for (const w of map.water ?? []) bg.fillStyle(PALETTE.acquaNilo, 1).fillRect(ox + w.x * k, oy + w.y * k, w.w * k, w.h * k);
    for (const p of map.bigPyramids ?? []) {
      bg.fillStyle(0xb88a4e, 1).fillTriangle(ox + (p.x - 450) * k, oy + p.y * k, ox + (p.x + 450) * k, oy + p.y * k, ox + p.x * k, oy + (p.y - 500) * k);
    }
    bg.lineStyle(2, PALETTE.oro, 1).strokeRect(ox, oy, map.width * k, map.height * k);
    this.dyn = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.ui + 1);
    // il cerchio della tempesta non deve uscire dal riquadro della minimappa
    const clip = scene.make.graphics({}, false).setScrollFactor(0);
    clip.fillStyle(0xffffff).fillRect(ox, oy, map.width * k, map.height * k);
    this.dyn.setMask(clip.createGeometryMask());
  }

  /** Disegna la tempesta e il giocatore (da chiamare ogni fotogramma). */
  update(player: { x: number; y: number; alive: boolean }, storm: { cx: number; cy: number; radius: number }): void {
    const k = this.k;
    const g = this.dyn;
    g.clear();
    // il cerchio sicuro della tempesta (resta dentro la minimappa)
    const r = storm.radius * k;
    g.lineStyle(3, 0xc1440e, 0.95).strokeCircle(MARGIN + storm.cx * k, MARGIN + storm.cy * k, r);
    if (player.alive) {
      const px = MARGIN + player.x * k;
      const py = MARGIN + player.y * k;
      g.fillStyle(PALETTE.bluNotte, 1).fillCircle(px, py, 6);
      g.fillStyle(0xffffff, 1).fillCircle(px, py, 4);
    }
  }
}
