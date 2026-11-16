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
  radius: number;
  private readonly startRadius: number;
  private readonly endRadius: number;
  private readonly shrinkSeconds: number;
  private elapsed = 0;
  private readonly sand: Phaser.GameObjects.TileSprite;
  private readonly maskShape: Phaser.GameObjects.Graphics;
  private readonly edge: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    mapW: number,
    mapH: number,
    center: { x: number; y: number },
    sizes: { startRadius: number; endRadius: number; shrinkSeconds: number } = STORM,
  ) {
    this.cx = center.x;
    this.cy = center.y;
    this.startRadius = sizes.startRadius;
    this.endRadius = sizes.endRadius;
    this.shrinkSeconds = sizes.shrinkSeconds;
    this.radius = this.startRadius;
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
    return this.elapsed >= STORM.startDelaySeconds + this.shrinkSeconds;
  }

  /** Il punto è dentro la tempesta (cioè fuori dal cerchio sicuro)? */
  isInside(x: number, y: number): boolean {
    return Phaser.Math.Distance.Between(x, y, this.cx, this.cy) > this.radius;
  }

  /** `view` = la parte di mappa che si vede sullo schermo. */
  update(dt: number, view: Phaser.Geom.Rectangle): void {
    this.elapsed += dt;
    const t = Phaser.Math.Clamp((this.elapsed - STORM.startDelaySeconds) / this.shrinkSeconds, 0, 1);
    this.radius = Phaser.Math.Linear(this.startRadius, this.endRadius, t);
    // se lo schermo è tutto dentro il cerchio sicuro, la tempesta non si vede: niente da disegnare
    const far = Math.max(
      Phaser.Math.Distance.Between(this.cx, this.cy, view.x, view.y),
      Phaser.Math.Distance.Between(this.cx, this.cy, view.right, view.y),
      Phaser.Math.Distance.Between(this.cx, this.cy, view.x, view.bottom),
      Phaser.Math.Distance.Between(this.cx, this.cy, view.right, view.bottom),
    );
    const visible = far > this.radius - 20;
    this.sand.setVisible(visible);
    this.edge.setVisible(visible);
    if (!visible) return;
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
