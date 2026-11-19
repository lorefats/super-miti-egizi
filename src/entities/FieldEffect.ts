import Phaser from 'phaser';

/**
 * Un effetto che resta sulla mappa per qualche secondo (pioggia, tornado, scia sotto terra...).
 * Ogni fotogramma chiama `tick`; alla fine fa svanire e cancella tutto quello che gli è stato affidato con `own`.
 */
export class FieldEffect extends Phaser.GameObjects.Container {
  /** Secondi passati dall'inizio. */
  age = 0;
  private ended = false;
  private readonly owned: Phaser.GameObjects.GameObject[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly seconds: number,
    private readonly tick: (fx: FieldEffect, dt: number) => void,
    private readonly onEnd?: (fx: FieldEffect) => void,
  ) {
    super(scene, x, y);
    scene.add.existing(this);
  }

  /** Affida degli oggetti all'effetto: spariranno con lui. */
  own(...objs: Phaser.GameObjects.GameObject[]): void {
    this.owned.push(...objs);
  }

  preUpdate(_t: number, delta: number): void {
    if (this.ended) return;
    const dt = delta / 1000;
    this.age += dt;
    this.tick(this, dt);
    if (this.age >= this.seconds) this.finish();
  }

  /** Finisce adesso (svanendo). */
  finish(): void {
    if (this.ended) return;
    this.ended = true;
    this.onEnd?.(this);
    const things = [this, ...this.owned];
    this.scene.tweens.add({
      targets: things,
      alpha: 0,
      duration: 300,
      onComplete: () => things.forEach((o) => o.destroy()),
    });
  }
}
