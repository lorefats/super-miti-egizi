import Phaser from 'phaser';
import { TEX } from '../art';
import { BIG_PYRAMID, bigPyramidFloorSize } from '../art/bigPyramid';
import { DEPTH } from '../config';

/** Trasparenza del tetto: dentro (quasi invisibile), dietro (semitrasparente), fuori (pieno). */
const ROOF_ALPHA_INSIDE = 0.07;
const ROOF_ALPHA_BEHIND = 0.45;

/**
 * Piramide grande in cui si entra (vedi GAME_DESIGN.md, sezione 3).
 * È fatta di: sala interna (pavimento e muri), muro davanti con la porta, tetto (le facce) che copre tutto.
 * x = centro, frontY = linea della base davanti (dove sta la porta).
 */
export class BigPyramid {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
  private readonly roof: Phaser.GameObjects.Image;
  private readonly room: Phaser.Geom.Rectangle;
  private readonly behindArea: Phaser.Geom.Rectangle;

  constructor(
    scene: Phaser.Scene,
    walls: Phaser.Physics.Arcade.StaticGroup,
    readonly x: number,
    frontY: number,
  ) {
    const { W, D, H, inset, wall, doorW, torches } = BIG_PYRAMID;
    this.x0 = x - W / 2;
    this.x1 = x + W / 2;
    this.y1 = frontY;
    this.y0 = frontY - D;

    // sala interna, appena sopra la sabbia
    const floor = bigPyramidFloorSize();
    scene.add.image(this.x0, this.y0 + floor.offsetY, TEX.piramideGrandeSala).setOrigin(0, 0).setDepth(DEPTH.ground + 10);

    // torce che tremolano
    const faceTop = this.y0 + inset + wall - BIG_PYRAMID.backWallH;
    for (const t of torches) {
      const glow = scene.add
        .image(this.x0 + W * t, faceTop + 4, TEX.bagliore)
        .setDepth(DEPTH.ground + 11)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: glow,
        alpha: { from: 0.7, to: 1 },
        scale: { from: 0.9, to: 1.08 },
        duration: Phaser.Math.Between(120, 200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }

    // sarcofago decorativo in fondo alla sala (è anche un ostacolo)
    const sy = this.y0 + inset + wall + 120;
    scene.add.image(x, sy, TEX.sarcofago).setOrigin(0.5, 1).setDepth(sy - 10);
    walls.add(scene.add.zone(x, sy - 30, 150, 44));

    // muro davanti con la porta
    scene.add.image(x, this.y1, TEX.piramideGrandeMuro).setOrigin(0.5, 1).setDepth(this.y1 + 1);

    // tetto: le facce della piramide, sopra a tutto ciò che sta dentro
    this.roof = scene.add.image(x, this.y1 + 4, TEX.piramideGrandeTetto).setOrigin(0.5, 1).setDepth(this.y1 + 2);

    // muri solidi: dietro, sinistra, destra, e davanti in due pezzi (la porta in mezzo resta libera)
    const t = inset + wall;
    const addWall = (left: number, top: number, w: number, h: number) =>
      walls.add(scene.add.zone(left + w / 2, top + h / 2, w, h));
    addWall(this.x0, this.y0, W, t);
    addWall(this.x0, this.y0, t, D);
    addWall(this.x1 - t, this.y0, t, D);
    const half = (W - doorW) / 2;
    addWall(this.x0, this.y1 - wall, half, wall);
    addWall(this.x1 - half, this.y1 - wall, half, wall);

    this.room = new Phaser.Geom.Rectangle(this.x0 + inset, this.y0 + inset, W - 2 * inset, D - inset - 6);
    // zona "dietro la piramide": sotto la sagoma del tetto ma fuori dalla sala
    this.behindArea = new Phaser.Geom.Rectangle(this.x0, this.y0 - H + D / 2, W, H);
  }

  /** Il punto (piedi di un personaggio) è dentro la sala? */
  contains(px: number, py: number): boolean {
    return this.room.contains(px, py);
  }

  /**
   * Strada per i bot: se uno dei due punti è dentro la sala e l'altro no, bisogna passare dalla porta.
   * Restituisce il prossimo punto da raggiungere, oppure null se la piramide non c'entra.
   */
  routeVia(fx: number, fy: number, tx: number, ty: number): { x: number; y: number } | null {
    const fromIn = this.contains(fx, fy);
    const toIn = this.contains(tx, ty);
    if (fromIn === toIn) return null;
    const inside = { x: this.x, y: this.y1 - BIG_PYRAMID.wall - 40 };
    const outside = { x: this.x, y: this.y1 + 60 };
    // uscire: prima davanti alla porta da dentro, poi fuori. Entrare: il contrario.
    const first = fromIn ? inside : outside;
    const second = fromIn ? outside : inside;
    const nearFirst = Math.abs(fx - first.x) < 40 && Math.abs(fy - first.y) < 40;
    const inDoorway = Math.abs(fx - this.x) < BIG_PYRAMID.doorW / 2 - 20 && fy > this.y1 - BIG_PYRAMID.wall - 50 && fy < this.y1 + 70;
    return nearFirst || inDoorway ? second : first;
  }

  /** Aggiorna la trasparenza del tetto in base a dove si trova il giocatore. */
  updateView(viewerX: number, viewerY: number, dt: number): void {
    let target = 1;
    if (this.contains(viewerX, viewerY)) target = ROOF_ALPHA_INSIDE;
    else if (this.behindArea.contains(viewerX, viewerY)) target = ROOF_ALPHA_BEHIND;
    this.roof.alpha = Phaser.Math.Linear(this.roof.alpha, target, Math.min(1, dt * 8));
  }
}
