import Phaser from 'phaser';
import { TEX } from '../art';
import { turnToSand } from '../art/effects';
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
    this.combat.remove(this);
    this.body.enable = false;
    this.bar.destroy();
    turnToSand(this.scene, [this.sprite], this.x, this.y, () => this.destroy());
  }
}
