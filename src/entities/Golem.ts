import Phaser from 'phaser';
import { TEX } from '../art';
import { dustPuff, hitSpark, turnToSand } from '../art/effects';
import { PALETTE } from '../art/palette';
import { HealthBar } from '../ui/HealthBar';
import { showDamageNumber } from '../ui/DamageNumber';
import type { Combat, Damageable } from './Combat';

export interface GolemOptions {
  combat: Combat;
  team: number;
  /** È il golem del giocatore vero? (barra verde) */
  ownerIsHuman: boolean;
  seconds: number;
  health: number;
  speed: number;
  damage: number;
  punchRange: number;
  punchDelay: number;
  sight: number;
}

const FEET_W = 50;
const FEET_H = 26;
const BAR_OFFSET_Y = 140;

/**
 * Golem d'argilla (super di Khnum): combatte da solo per qualche secondo al fianco di chi l'ha creato.
 * Va verso il nemico più vicino e lo prende a pugni. Si può colpire; alla fine si sbriciola.
 */
export class Golem extends Phaser.GameObjects.Container implements Damageable {
  declare body: Phaser.Physics.Arcade.Body;
  readonly kind = 'personaggio' as const;
  readonly hitRadius = 30;
  readonly team: number;
  readonly maxHealth: number;
  health: number;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly bar: HealthBar;
  private target: Damageable | null = null;
  private retarget = 0;
  private punchWait = 0.4;
  private age = 0;
  private ended = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly opt: GolemOptions,
  ) {
    super(scene, x, y);
    this.team = opt.team;
    this.maxHealth = opt.health;
    this.health = opt.health;
    this.add(scene.add.image(0, 0, TEX.ombra).setScale(1.3));
    this.sprite = scene.add.image(0, 4, TEX.golem).setOrigin(0.5, 1);
    this.add(this.sprite);
    this.bar = new HealthBar(scene, opt.ownerIsHuman ? PALETTE.verdeNilo : PALETTE.rossoDeserto, false, 'Golem');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(FEET_W, FEET_H).setOffset(-FEET_W / 2, -FEET_H / 2);
    this.body.setCollideWorldBounds(true);
    if (opt.combat.walls) scene.physics.add.collider(this, opt.combat.walls);
    opt.combat.add(this);

    // nasce dall'argilla: esce dal terreno allungandosi
    this.sprite.setScale(1.2, 0.1);
    scene.tweens.add({ targets: this.sprite, scaleX: 1, scaleY: 1, duration: 420, ease: 'Back.out' });
    dustPuff(scene, x, y, 0, y - 1);
    dustPuff(scene, x, y, Math.PI, y - 1);
  }

  isAlive(): boolean {
    return this.health > 0 && !this.ended;
  }

  takeDamage(amount: number): void {
    if (!this.isAlive()) return;
    this.health = Math.max(0, this.health - amount);
    showDamageNumber(this.scene, this.x, this.y - BAR_OFFSET_Y + 20, amount, '#FFFFFF');
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.sprite.active && this.sprite.clearTint());
    if (this.health <= 0) this.crumble();
  }

  /** Si sbriciola in sabbia (tempo finito o sconfitto). */
  private crumble(): void {
    if (this.ended) return;
    this.ended = true;
    this.opt.combat.remove(this);
    this.body.stop();
    this.body.enable = false;
    this.bar.destroy();
    turnToSand(this.scene, [this.sprite], this.x, this.y, () => this.destroy());
  }

  preUpdate(_t: number, delta: number): void {
    if (this.ended) return;
    const dt = delta / 1000;
    this.age += dt;
    this.setDepth(this.y);
    this.bar.setPosition(this.x, this.y - BAR_OFFSET_Y);
    this.bar.draw(this.health, this.maxHealth);
    if (this.age >= this.opt.seconds) {
      this.crumble();
      return;
    }
    if (this.age < 0.45) return; // sta ancora uscendo dal terreno

    const c = this.opt.combat;
    this.retarget -= dt;
    if (this.retarget <= 0 || !this.target || !this.target.isAlive()) {
      this.retarget = 0.4;
      this.target = c.nearestEnemy(this.x, this.y, this.team, this.opt.sight, null, ['personaggio', 'bersaglio']);
    }
    const t = this.target;
    this.punchWait -= dt;
    if (!t) {
      this.body.setVelocity(0, 0);
      this.sprite.y = 4;
      return;
    }
    const dist = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y) - t.hitRadius;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, t.x, t.y);
    this.sprite.setFlipX(Math.cos(angle) < 0);
    if (dist > this.opt.punchRange * 0.75) {
      this.body.setVelocity(Math.cos(angle) * this.opt.speed, Math.sin(angle) * this.opt.speed);
      // passi pesanti: dondola
      this.sprite.y = 4 - Math.abs(Math.sin(this.age * 9)) * 5;
      this.sprite.rotation = Math.sin(this.age * 9) * 0.05;
    } else {
      this.body.setVelocity(0, 0);
      this.sprite.y = 4;
      this.sprite.rotation = 0;
    }
    if (dist <= this.opt.punchRange && this.punchWait <= 0 && !c.lineBlocked(this.x, this.y, t.x, t.y)) {
      this.punchWait = this.opt.punchDelay;
      this.punch(t, angle);
    }
  }

  /** Pugno: il golem si sporge in avanti e colpisce. */
  private punch(t: Damageable, angle: number): void {
    const f = Math.cos(angle) < 0 ? -1 : 1;
    this.scene.tweens.add({ targets: this.sprite, x: f * 16, rotation: f * 0.18, duration: 90, yoyo: true, ease: 'Quad.out' });
    this.scene.time.delayedCall(90, () => {
      if (!this.isAlive() || !t.isAlive()) return;
      t.takeDamage(this.opt.damage);
      hitSpark(this.scene, t.x, t.y - 60, t.y + 2);
    });
  }

  destroy(fromScene?: boolean): void {
    this.opt.combat.remove(this);
    if (!this.ended) this.bar.destroy();
    super.destroy(fromScene);
  }
}
