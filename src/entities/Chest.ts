import Phaser from 'phaser';
import { playSfxAt } from '../audio/Sound';
import { TEX } from '../art';
import { hitSpark } from '../art/effects';
import { CHEST } from '../data/match';
import type { Combat, Damageable } from './Combat';
import { HealthBar } from '../ui/HealthBar';
import { showDamageNumber } from '../ui/DamageNumber';

const BAR_OFFSET_Y = 104;
const FOOT_W = 80;
const FOOT_H = 30;

/** Evento emesso quando il baule si rompe: (x, y, quanti gioielli). */
export const CHEST_BROKEN_EVENT = 'baule-rotto';

/** Baule del tesoro: si rompe colpendolo e lascia uscire i Gioielli. Blocca il passaggio finché è intero. */
export class Chest extends Phaser.GameObjects.Container implements Damageable {
  declare body: Phaser.Physics.Arcade.Body;
  readonly kind = 'baule' as const;
  readonly team = 98; // tutti possono romperlo
  readonly hitRadius = 38;
  private health = CHEST.maxHealth;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly bar: HealthBar;
  /** Chi lo vede da fuori (piramide): aggiornato dalla partita. */
  hideout: object | null = null;
  /**
   * Multiplayer: sul telefono del capo stanza (authority) il baule si rompe davvero e `onHit` avvisa la partita;
   * sugli altri telefoni i colpi non contano: la vita arriva dal capo stanza con `netSetHealth`.
   */
  net: { authority: boolean; onHit?: (health: number) => void } | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly combat: Combat,
  ) {
    super(scene, x, y);
    this.sprite = scene.add.image(0, 2, TEX.baule).setOrigin(0.5, 1);
    this.add(this.sprite);
    this.setDepth(y);
    this.bar = new HealthBar(scene, 0xc98b4a, false);
    this.bar.setPosition(x, y - BAR_OFFSET_Y).setScale(0.8);
    this.bar.draw(this.health, CHEST.maxHealth);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(FOOT_W, FOOT_H).setOffset(-FOOT_W / 2, -FOOT_H);
    this.body.setImmovable(true);
    this.body.moves = false;
    combat.add(this);
  }

  private revealed = true;
  private inView = true;

  /** Nasconde la barra quando il baule è dentro una piramide e il giocatore è fuori. */
  setRevealed(on: boolean): void {
    this.revealed = on;
    this.refreshVisibility();
  }

  /** Lontano dallo schermo il baule non si disegna (meno fatica per il telefono). */
  setInView(on: boolean): void {
    this.inView = on;
    this.refreshVisibility();
  }

  private refreshVisibility(): void {
    if (!this.isAlive()) return;
    this.setVisible(this.inView);
    this.bar.setVisible(this.inView && this.revealed);
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  takeDamage(amount: number): void {
    if (!this.isAlive()) return;
    if (this.net && !this.net.authority) return;
    this.applyHealth(Math.max(0, this.health - amount));
    this.net?.onHit?.(this.health);
  }

  /** Multiplayer: la vita decisa dal capo stanza (si vede il colpo; a zero si rompe). */
  netSetHealth(health: number): void {
    if (this.isAlive() && health < this.health) this.applyHealth(Math.max(0, health));
  }

  private applyHealth(health: number): void {
    const amount = this.health - health;
    this.health = health;
    this.bar.draw(this.health, CHEST.maxHealth);
    showDamageNumber(this.scene, this.x, this.y - BAR_OFFSET_Y + 10, amount, '#FFE2B0');
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.sprite.active && this.sprite.clearTint());
    this.scene.tweens.add({ targets: this.sprite, scaleX: { from: 1.12, to: 1 }, scaleY: { from: 0.9, to: 1 }, duration: 160, ease: 'Back.out' });
    if (this.health <= 0) this.breakOpen();
  }

  /** Si rompe: assi di legno che volano, un lampo, e i gioielli escono (li crea la partita). */
  private breakOpen(): void {
    const scene = this.scene;
    this.combat.remove(this);
    this.body.enable = false;
    this.bar.destroy();
    hitSpark(scene, this.x, this.y - 40, this.y + 2);
    const planks = scene.add.particles(this.x, this.y - 30, TEX.asse, {
      speed: { min: 120, max: 280 },
      angle: { min: 200, max: 340 },
      gravityY: 600,
      rotate: { start: 0, end: 720 },
      lifespan: { min: 500, max: 800 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    planks.setDepth(this.y + 1);
    planks.explode(12);
    scene.time.delayedCall(900, () => planks.destroy());
    playSfxAt(scene, this.x, this.y, 'chest');
    this.emit(CHEST_BROKEN_EVENT, this.x, this.y, CHEST.gems);
    scene.tweens.add({ targets: this.sprite, scaleY: 0.1, alpha: 0, duration: 200, onComplete: () => this.destroy() });
  }
}
