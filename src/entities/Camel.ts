import Phaser from 'phaser';
import { TEX } from '../art';
import { CAMEL } from '../data/match';

const FOOT_W = 120;
const FOOT_H = 40;

/** Un cammello dell'oasi: un ostacolo che cammina piano avanti e indietro tra due punti. */
export class Camel extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private readonly sprite: Phaser.GameObjects.Image;
  private toB = true;
  private time = Math.random() * 10;

  constructor(
    scene: Phaser.Scene,
    private readonly a: { x: number; y: number },
    private readonly b: { x: number; y: number },
  ) {
    super(scene, a.x, a.y);
    const shadow = scene.add.image(0, -2, TEX.ombra).setScale(1.6, 1.2);
    this.sprite = scene.add.image(0, 2, TEX.cammello).setOrigin(0.5, 1);
    this.add([shadow, this.sprite]);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(FOOT_W, FOOT_H).setOffset(-FOOT_W / 2, -FOOT_H);
    this.body.setImmovable(true);
    this.body.pushable = false;
    this.head();
  }

  private head(): void {
    const t = this.toB ? this.b : this.a;
    const ang = Phaser.Math.Angle.Between(this.x, this.y, t.x, t.y);
    this.body.setVelocity(Math.cos(ang) * CAMEL.speed, Math.sin(ang) * CAMEL.speed);
    this.sprite.setFlipX(Math.cos(ang) < 0);
  }

  preUpdate(_t: number, delta: number): void {
    this.time += delta / 1000;
    const t = this.toB ? this.b : this.a;
    if (Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y) < 8) {
      this.toB = !this.toB;
      this.head();
    }
    this.setDepth(this.y);
    // passo lento e dondolante
    this.sprite.y = 2 - Math.abs(Math.sin(this.time * 3.5)) * 3;
    this.sprite.rotation = Math.sin(this.time * 3.5) * 0.025;
  }
}
