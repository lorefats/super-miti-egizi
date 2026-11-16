import Phaser from 'phaser';
import { TEX, characterTexture } from '../art';
import { PALETTE } from '../art/palette';
import { getCharacter, SPEED_VALUES, type CharacterData } from '../data/characters';
import { getCharacterModule } from '../characters';
import type { CharacterModule } from '../characters/types';
import type { Combat, Damageable } from './Combat';
import { HealthBar } from '../ui/HealthBar';
import { showDamageNumber } from '../ui/DamageNumber';

/** Dimensioni della "impronta" dei piedi usata per le collisioni. */
const FEET_W = 40;
const FEET_H = 22;
/** Altezza a cui sta la barra della vita sopra i piedi. */
const BAR_OFFSET_Y = 182;
/** Durata dell'animazione d'attacco in secondi. */
const ATTACK_ANIM = 0.22;

/**
 * Un personaggio sulla mappa. La posizione (x, y) è il punto dei piedi:
 * serve per l'ordinamento per Y (chi è più in basso viene disegnato sopra).
 * Munizioni, ricarica e vita sono qui; cosa fa l'attacco lo decide il modulo del personaggio.
 */
export class Player extends Phaser.GameObjects.Container implements Damageable {
  declare body: Phaser.Physics.Arcade.Body;
  readonly stats: CharacterData;
  readonly team: number;
  readonly hitRadius = 26;
  health: number;
  ammo: number;

  private readonly module: CharacterModule;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly bar: HealthBar;
  private animTime = 0;
  private moving = false;
  private attackCooldown = 0;
  private attackAnim = 0;
  private facing = 1; // 1 = destra, -1 = sinistra

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    characterId: string,
    team: number,
    private readonly combat: Combat,
  ) {
    super(scene, x, y);
    this.stats = getCharacter(characterId);
    this.module = getCharacterModule(characterId);
    this.team = team;
    this.health = this.stats.maxHealth;
    this.ammo = this.stats.weapon.maxAmmo;

    this.shadow = scene.add.image(0, 0, TEX.ombra);
    this.sprite = scene.add.image(0, 2, characterTexture(characterId)).setOrigin(0.5, 1);
    this.add([this.shadow, this.sprite]);
    this.bar = new HealthBar(scene, PALETTE.verdeNilo, true);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(FEET_W, FEET_H);
    this.body.setOffset(-FEET_W / 2, -FEET_H / 2);
    this.body.setCollideWorldBounds(true);
    combat.add(this);
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  /** Il personaggio può sparare adesso? */
  canAttack(): boolean {
    return this.ammo >= 1 && this.attackCooldown <= 0;
  }

  /** Muove il personaggio. dir ha lunghezza 0 (fermo) oppure 1. */
  move(dir: Phaser.Math.Vector2): void {
    const speed = SPEED_VALUES[this.stats.speed];
    this.body.setVelocity(dir.x * speed, dir.y * speed);
    this.moving = dir.lengthSq() > 0;
    if (this.attackAnim <= 0) {
      if (dir.x < -0.1) this.facing = -1;
      else if (dir.x > 0.1) this.facing = 1;
    }
  }

  /** Attacca nella direzione `angle` (radianti). Restituisce false se non ci sono colpi pronti. */
  tryAttack(angle: number): boolean {
    if (!this.canAttack()) {
      if (this.ammo < 1) this.bar.flashAmmo();
      return false;
    }
    this.ammo -= 1;
    this.attackCooldown = this.stats.weapon.attackDelay;
    this.attackAnim = ATTACK_ANIM;
    if (Math.abs(Math.cos(angle)) > 0.05) this.facing = Math.cos(angle) < 0 ? -1 : 1;
    this.module.attack(this, angle, this.combat);
    return true;
  }

  /** Attacco automatico verso il nemico più vicino (tocco veloce). */
  autoAttack(maxDistance: number): boolean {
    const target = this.combat.nearestEnemy(this.x, this.y, this.team, maxDistance);
    const angle = target ? Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y) : this.facing > 0 ? 0 : Math.PI;
    return this.tryAttack(angle);
  }

  takeDamage(amount: number): void {
    if (!this.isAlive()) return;
    this.health = Math.max(0, this.health - amount);
    showDamageNumber(this.scene, this.x, this.y - BAR_OFFSET_Y + 20, amount, '#FFB3B8');
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.sprite.clearTint());
  }

  preUpdate(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.animTime += dt;
    this.setDepth(this.y);

    // ricarica: un colpo alla volta
    const w = this.stats.weapon;
    if (this.ammo < w.maxAmmo) this.ammo = Math.min(w.maxAmmo, this.ammo + dt / w.reloadSeconds);
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    this.sprite.setFlipX(this.facing < 0);

    if (this.attackAnim > 0) {
      // attacco: affondo in avanti con lo scettro
      this.attackAnim -= dt;
      const p = Math.sin((1 - Math.max(0, this.attackAnim) / ATTACK_ANIM) * Math.PI);
      this.sprite.x = this.facing * p * 10;
      this.sprite.y = 2;
      this.sprite.rotation = this.facing * p * 0.22;
      this.sprite.setScale(1 + p * 0.04, 1 - p * 0.03);
      this.shadow.setScale(1);
    } else if (this.moving) {
      // corsa: piccoli saltelli e leggero dondolio
      const hop = Math.abs(Math.sin(this.animTime * 12));
      this.sprite.x = 0;
      this.sprite.y = 2 - hop * 6;
      this.sprite.rotation = Math.sin(this.animTime * 12) * 0.05;
      this.sprite.setScale(1, 1);
      this.shadow.setScale(1 - hop * 0.12);
    } else {
      // attesa: respiro
      const breath = Math.sin(this.animTime * 3);
      this.sprite.x = 0;
      this.sprite.y = 2;
      this.sprite.rotation = 0;
      this.sprite.setScale(1 - breath * 0.01, 1 + breath * 0.018);
      this.shadow.setScale(1);
    }

    this.bar.setPosition(this.x, this.y - BAR_OFFSET_Y);
    this.bar.draw(this.health, this.stats.maxHealth, this.ammo, w.maxAmmo);
  }

  destroy(fromScene?: boolean): void {
    this.combat.remove(this);
    this.bar.destroy();
    super.destroy(fromScene);
  }
}
