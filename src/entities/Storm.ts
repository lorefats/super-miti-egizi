import Phaser from 'phaser';
import { TEX } from '../art';
import { STORM } from '../data/match';

/** Profondità della tempesta: sopra la mappa e i personaggi, sotto barre della vita e interfaccia. */
const STORM_DEPTH = 40000;

/**
 * Tempesta di sabbia: tutto ciò che è fuori dal cerchio sicuro è coperto da sabbia che vortica.
 * Dopo un po' di calma, il cerchio si restringe fino al raggio finale.
 */
export class Storm {
  readonly cx: number;
  readonly cy: number;
  radius = STORM.startRadius;
  private elapsed = 0;
  private readonly sand: Phaser.GameObjects.TileSprite;
  private readonly maskShape: Phaser.GameObjects.Graphics;
  private readonly edge: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, mapW: number, mapH: number, center: { x: number; y: number }) {
    this.cx = center.x;
    this.cy = center.y;
    // un po' più grande della mappa, così copre anche i bordi
    this.sand = scene.add
      .tileSprite(-400, -400, mapW + 800, mapH + 800, TEX.tempesta)
      .setOrigin(0)
      .setAlpha(0.72)
      .setDepth(STORM_DEPTH);
    this.maskShape = scene.make.graphics({}, false);
    const mask = this.maskShape.createGeometryMask();
    mask.setInvertAlpha(true); // la sabbia si vede FUORI dal cerchio
    this.sand.setMask(mask);
    this.edge = scene.add.graphics().setDepth(STORM_DEPTH + 1);
    this.redraw();
  }

  /** Secondi che mancano prima che la tempesta inizi a stringersi (0 se si sta già stringendo). */
  get secondsToStart(): number {
    return Math.max(0, STORM.startDelaySeconds - this.elapsed);
  }

  /** La tempesta ha finito di stringersi? */
  get finished(): boolean {
    return this.elapsed >= STORM.startDelaySeconds + STORM.shrinkSeconds;
  }

  /** Il punto è dentro la tempesta (cioè fuori dal cerchio sicuro)? */
  isInside(x: number, y: number): boolean {
    return Phaser.Math.Distance.Between(x, y, this.cx, this.cy) > this.radius;
  }

  update(dt: number): void {
    this.elapsed += dt;
    const t = Phaser.Math.Clamp((this.elapsed - STORM.startDelaySeconds) / STORM.shrinkSeconds, 0, 1);
    this.radius = Phaser.Math.Linear(STORM.startRadius, STORM.endRadius, t);
    // il vento muove la sabbia
    this.sand.tilePositionX += dt * 90;
    this.sand.tilePositionY += dt * 25;
    this.redraw();
  }

  private redraw(): void {
    this.maskShape.clear().fillStyle(0xffffff).fillCircle(this.cx, this.cy, this.radius);
    this.edge.clear();
    this.edge.lineStyle(14, 0x8c5a2b, 0.55).strokeCircle(this.cx, this.cy, this.radius);
    this.edge.lineStyle(4, 0xffe0a8, 0.9).strokeCircle(this.cx, this.cy, this.radius - 4);
  }
}
