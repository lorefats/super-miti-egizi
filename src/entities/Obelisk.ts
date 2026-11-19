import Phaser from 'phaser';
import { TEX } from '../art';
import { dustPuff, hitSpark, isOnScreen, turnToSand } from '../art/effects';
import { PALETTE } from '../art/palette';
import { HealthBar } from '../ui/HealthBar';
import { showDamageNumber } from '../ui/DamageNumber';
import type { Combat, Damageable } from './Combat';

export interface ObeliskOptions {
  combat: Combat;
  team: number;
  /** È l'obelisco del giocatore vero? (barra verde) */
  ownerIsHuman: boolean;
  seconds: number;
  health: number;
  damage: number;
  shootRange: number;
  shootDelay: number;
}

const BAR_OFFSET_Y = 170;
/** Altezza dell'occhio da cui partono i raggi. */
const EYE_HEIGHT = 104;

/**
 * Obelisco Guardiano (super di Ptah): resta fermo per qualche secondo e spara raggi ai nemici vicini.
 * Si può colpire e distruggere; alla fine si sbriciola.
 */
export class Obelisk extends Phaser.GameObjects.Container implements Damageable {
  readonly kind = 'personaggio' as const;
  readonly hitRadius = 28;
  readonly team: number;
  readonly maxHealth: number;
  health: number;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly bar: HealthBar;
  private wait = 0.8;
  private age = 0;
  private ended = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly opt: ObeliskOptions,
  ) {
    super(scene, x, y);
    this.team = opt.team;
    this.maxHealth = opt.health;
    this.health = opt.health;
    this.add(scene.add.image(0, 0, TEX.ombra).setScale(1.1));
    this.sprite = scene.add.image(0, 6, TEX.obeliscoGuardiano).setOrigin(0.5, 1);
    this.add(this.sprite);
    this.bar = new HealthBar(scene, opt.ownerIsHuman ? PALETTE.verdeNilo : PALETTE.rossoDeserto, false, 'Obelisco');
    this.setDepth(y);
    scene.add.existing(this);
    opt.combat.add(this);

    // viene costruito: sale dal terreno
    this.sprite.setScale(1, 0.05);
    scene.tweens.add({ targets: this.sprite, scaleY: 1, duration: 500, ease: 'Back.out' });
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

  private crumble(): void {
    if (this.ended) return;
    this.ended = true;
    this.opt.combat.remove(this);
    this.bar.destroy();
    turnToSand(this.scene, [this.sprite], this.x, this.y, () => this.destroy());
  }

  preUpdate(_t: number, delta: number): void {
    if (this.ended) return;
    const dt = delta / 1000;
    this.age += dt;
    this.bar.setPosition(this.x, this.y - BAR_OFFSET_Y);
    this.bar.draw(this.health, this.maxHealth);
    if (this.age >= this.opt.seconds) {
      this.crumble();
      return;
    }
    this.wait -= dt;
    if (this.wait > 0) return;
    const c = this.opt.combat;
    const t = c.nearestEnemy(this.x, this.y, this.team, this.opt.shootRange, null, ['personaggio', 'bersaglio']);
    if (!t || c.lineBlocked(this.x, this.y, t.x, t.y)) return;
    this.wait = this.opt.shootDelay;
    this.shoot(t);
  }

  /** Raggio di luce dall'occhio dell'obelisco al nemico. */
  private shoot(t: Damageable): void {
    t.takeDamage(this.opt.damage);
    const scene = this.scene;
    hitSpark(scene, t.x, t.y - 60, t.y + 2);
    if (!isOnScreen(scene, this.x, this.y)) return;
    const g = scene.add.graphics().setDepth(Math.max(this.y, t.y) + 2);
    const sx = this.x;
    const sy = this.y - EYE_HEIGHT;
    const ex = t.x;
    const ey = t.y - 60;
    g.lineStyle(12, 0x14213d, 0.6).lineBetween(sx, sy, ex, ey);
    g.lineStyle(8, 0x2ec4b6, 1).lineBetween(sx, sy, ex, ey);
    g.lineStyle(3, 0xffffff, 1).lineBetween(sx, sy, ex, ey);
    scene.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
  }

  destroy(fromScene?: boolean): void {
    this.opt.combat.remove(this);
    if (!this.ended) this.bar.destroy();
    super.destroy(fromScene);
  }
}
