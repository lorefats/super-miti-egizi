import Phaser from 'phaser';
import { TEX } from '../art';
import { PALETTE } from '../art/palette';
import { TARGET_DATA } from '../data/targets';
import type { Combat, Damageable } from './Combat';
import { HealthBar } from '../ui/HealthBar';
import { showDamageNumber } from '../ui/DamageNumber';

const BAR_OFFSET_Y = 142;
const FOOT_W = 56;
const FOOT_H = 26;

/** Bersaglio fermo d'allenamento: una statuetta di terracotta. Sconfitta, diventa sabbia. */
export class Target extends Phaser.GameObjects.Container implements Damageable {
  declare body: Phaser.Physics.Arcade.Body;
  readonly team = 99; // nemico di tutti
  readonly hitRadius = 30;
  private health = TARGET_DATA.maxHealth;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly bar: HealthBar;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly combat: Combat,
  ) {
    super(scene, x, y);
    const shadow = scene.add.image(0, -4, TEX.ombra);
    this.sprite = scene.add.image(0, 0, TEX.bersaglio).setOrigin(0.5, 1);
    this.add([shadow, this.sprite]);
    this.setDepth(y);

    this.bar = new HealthBar(scene, PALETTE.rossoDeserto, false);
    this.bar.setPosition(x, y - BAR_OFFSET_Y);
    this.bar.draw(this.health, TARGET_DATA.maxHealth);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(FOOT_W, FOOT_H).setOffset(-FOOT_W / 2, -FOOT_H);
    this.body.setImmovable(true);
    this.body.moves = false;
    combat.add(this);
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  takeDamage(amount: number): void {
    if (!this.isAlive()) return;
    this.health = Math.max(0, this.health - amount);
    this.bar.draw(this.health, TARGET_DATA.maxHealth);
    showDamageNumber(this.scene, this.x, this.y - BAR_OFFSET_Y + 10, amount);

    // lampo bianco e scossone
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.sprite.clearTint());
    this.scene.tweens.add({ targets: this.sprite, angle: { from: -6, to: 0 }, duration: 180, ease: 'Back.out' });

    if (this.health <= 0) this.crumbleToSand();
  }

  /** Sconfitta: la statuetta si sgretola in sabbia e lascia un mucchietto che poi svanisce. */
  private crumbleToSand(): void {
    const scene = this.scene;
    this.combat.remove(this);
    this.body.enable = false;
    this.bar.destroy();

    this.sprite.setTint(PALETTE.sabbia);
    scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.05,
      scaleX: 1.25,
      alpha: 0.3,
      duration: 450,
      ease: 'Quad.in',
      onComplete: () => this.destroy(),
    });

    const grains = scene.add.particles(this.x, this.y - 50, TEX.granello, {
      speed: { min: 60, max: 220 },
      angle: { min: 200, max: 340 },
      gravityY: 500,
      lifespan: { min: 500, max: 900 },
      scale: { start: 1, end: 0.4 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    grains.setDepth(this.y + 1);
    grains.explode(36);
    scene.time.delayedCall(1200, () => grains.destroy());

    const pile = scene.add.image(this.x, this.y + 4, TEX.mucchietto).setOrigin(0.5, 1).setDepth(this.y - 1).setScale(0.3);
    scene.tweens.add({ targets: pile, scale: 1, duration: 350, delay: 200, ease: 'Back.out' });
    scene.tweens.add({ targets: pile, alpha: 0, delay: 4000, duration: 1000, onComplete: () => pile.destroy() });
  }
}
