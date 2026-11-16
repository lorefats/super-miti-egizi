import Phaser from 'phaser';
import { TEX } from '../art';
import { BUSH } from '../data/match';

/**
 * Un gruppo di cespugli (canne di papiro o tende del bazar): chi ci entra si nasconde.
 * Ogni ciuffo è un disegno ordinato per Y, così il personaggio dentro viene coperto.
 */
export class BushPatch {
  readonly images: Phaser.GameObjects.Image[] = [];
  private seeThrough = false;

  constructor(
    scene: Phaser.Scene,
    kind: 'papiro' | 'tenda',
    private readonly spots: { x: number; y: number }[],
  ) {
    const tex = kind === 'papiro' ? TEX.papiro : TEX.tenda;
    // dall'alto in basso, così i ciuffi davanti coprono quelli dietro
    for (const sp of [...spots].sort((a, b) => a.y - b.y)) {
      const img = scene.add
        .image(sp.x, sp.y + 34, tex)
        .setOrigin(0.5, 1)
        .setDepth(sp.y + 34)
        .setFlipX(Math.random() < 0.5);
      this.images.push(img);
    }
  }

  /** Il punto (piedi di un personaggio) è dentro questo gruppo di cespugli? */
  contains(x: number, y: number): boolean {
    const r = BUSH.radius;
    return this.spots.some((sp) => {
      const dx = (x - sp.x) / r;
      const dy = (y - sp.y) / (r * 0.75);
      return dx * dx + dy * dy < 1;
    });
  }

  /** Il centro del ciuffo più vicino (per i bot che vogliono nascondersi). */
  nearestSpot(x: number, y: number): { x: number; y: number } {
    let best = this.spots[0];
    let bd = Infinity;
    for (const sp of this.spots) {
      const d = Phaser.Math.Distance.Between(x, y, sp.x, sp.y);
      if (d < bd) {
        bd = d;
        best = sp;
      }
    }
    return best;
  }

  /** Quando il giocatore è dentro, i cespugli diventano semitrasparenti per fargli vedere dov'è. */
  setSeeThrough(on: boolean): void {
    if (on === this.seeThrough) return;
    this.seeThrough = on;
    for (const img of this.images) img.setAlpha(on ? 0.5 : 1);
  }
}
