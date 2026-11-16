import Phaser from 'phaser';
import { TEX, characterTexture, weaponTexture, getHeldWeapon } from '../art';
import { dustPuff, turnToSand } from '../art/effects';
import { PALETTE, type ColorVariant } from '../art/palette';
import { REGEN } from '../data/combat';
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
/** Durata del fendente e del ritorno in posizione, in secondi (la carica dipende dal personaggio). */
const STRIKE_TIME = 0.1;
const RECOVER_TIME = 0.16;
/** Rotazioni dell'arma in mano (radianti): alzata all'indietro, colpo in avanti. */
const WEAPON_WINDUP = -1.25;
const WEAPON_STRIKE = 1.9;
/** Leggera inclinazione dell'arma quando si è fermi. */
const WEAPON_REST = 0.08;

export interface FighterOptions {
  characterId: string;
  team: number;
  combat: Combat;
  /** Colore del personaggio (i bot usano colori diversi). */
  variant?: ColorVariant;
  /** Nome sopra la testa (vuoto = nessun nome). */
  name?: string;
  /** È il personaggio controllato dal giocatore? */
  isHuman?: boolean;
}

/** Evento emesso quando il personaggio viene sconfitto. */
export const DEFEATED_EVENT = 'sconfitto';

/**
 * Un personaggio sulla mappa (sia il giocatore sia i bot). La posizione (x, y) è il punto dei piedi:
 * serve per l'ordinamento per Y (chi è più in basso viene disegnato sopra).
 * Munizioni, ricarica e vita sono qui; cosa fa l'attacco lo decide il modulo del personaggio.
 */
export class Player extends Phaser.GameObjects.Container implements Damageable {
  declare body: Phaser.Physics.Arcade.Body;
  readonly stats: CharacterData;
  readonly team: number;
  readonly hitRadius = 26;
  readonly isHuman: boolean;
  readonly displayName: string;
  health: number;
  ammo: number;

  private readonly module: CharacterModule;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly bar: HealthBar;
  private readonly weapon: Phaser.GameObjects.Image | null = null;
  private readonly hand = { x: 0, y: 0 };
  private weaponOriginX = 0.5;
  private animTime = 0;
  private moving = false;
  private attackCooldown = 0;
  /** Tempo trascorso dall'inizio dell'attacco (-1 = nessun attacco in corso). */
  private attackTime = -1;
  private attackAngle = 0;
  private attackFired = false;
  private facing = 1; // 1 = destra, -1 = sinistra
  /** Secondi dall'ultima volta che ha colpito o è stato colpito (per la rigenerazione). */
  private sinceCombat = 0;
  protected readonly combat: Combat;

  constructor(scene: Phaser.Scene, x: number, y: number, opt: FighterOptions) {
    super(scene, x, y);
    const { characterId, team, combat } = opt;
    const variant = opt.variant ?? 'base';
    this.combat = combat;
    this.isHuman = opt.isHuman ?? false;
    this.displayName = opt.name ?? '';
    this.stats = getCharacter(characterId);
    this.module = getCharacterModule(characterId);
    this.team = team;
    this.health = this.stats.maxHealth;
    this.ammo = this.stats.weapon.maxAmmo;

    this.shadow = scene.add.image(0, 0, TEX.ombra);
    this.sprite = scene.add.image(0, 2, characterTexture(characterId, variant)).setOrigin(0.5, 1);
    this.add([this.shadow, this.sprite]);
    const held = getHeldWeapon(characterId);
    if (held) {
      this.hand.x = held.hand.x;
      this.hand.y = held.hand.y + 2;
      this.weaponOriginX = held.originX;
      this.weapon = scene.add.image(0, 0, weaponTexture(characterId, variant)).setOrigin(held.originX, held.originY);
      this.add(this.weapon);
    }
    this.bar = new HealthBar(scene, this.isHuman ? PALETTE.verdeNilo : PALETTE.rossoDeserto, this.isHuman, this.displayName);

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
    return this.isAlive() && this.ammo >= 1 && this.attackCooldown <= 0;
  }

  /** Muove il personaggio. dir ha lunghezza 0 (fermo) oppure 1. */
  move(dir: Phaser.Math.Vector2): void {
    if (!this.isAlive()) return;
    const speed = SPEED_VALUES[this.stats.speed];
    this.body.setVelocity(dir.x * speed, dir.y * speed);
    this.moving = dir.lengthSq() > 0;
    if (this.attackTime < 0) {
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
    this.sinceCombat = 0;
    this.attackCooldown = this.stats.weapon.attackDelay;
    this.attackTime = 0;
    this.attackAngle = angle;
    this.attackFired = false;
    if (Math.abs(Math.cos(angle)) > 0.05) this.facing = Math.cos(angle) < 0 ? -1 : 1;
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
    this.sinceCombat = 0;
    showDamageNumber(this.scene, this.x, this.y - BAR_OFFSET_Y + 20, amount, this.isHuman ? '#FFB3B8' : '#FFFFFF');
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (this.isAlive()) this.sprite.clearTint();
    });
    if (this.health <= 0) this.defeat();
  }

  /** Sconfitto: diventa sabbia e sparisce. Avvisa la partita con l'evento DEFEATED_EVENT. */
  private defeat(): void {
    this.combat.remove(this);
    this.body.stop();
    this.body.enable = false;
    this.bar.setVisible(false);
    const images = this.weapon ? [this.sprite, this.weapon] : [this.sprite];
    this.shadow.setVisible(false);
    turnToSand(this.scene, images, this.x, this.y, () => this.setVisible(false));
    this.emit(DEFEATED_EVENT, this);
  }

  /** Il personaggio sta guardando a destra (1) o a sinistra (-1). */
  get facingSign(): number {
    return this.facing;
  }

  preUpdate(_time: number, delta: number): void {
    if (!this.isAlive()) return;
    const dt = delta / 1000;
    this.animTime += dt;
    this.setDepth(this.y);

    // ricarica: un colpo alla volta
    const w = this.stats.weapon;
    if (this.ammo < w.maxAmmo) this.ammo = Math.min(w.maxAmmo, this.ammo + dt / w.reloadSeconds);
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // rigenerazione lenta se lontano dai combattimenti
    this.sinceCombat += dt;
    if (this.sinceCombat > REGEN.delaySeconds && this.health < this.stats.maxHealth) {
      this.health = Math.min(this.stats.maxHealth, this.health + this.stats.maxHealth * REGEN.fractionPerSecond * dt);
    }

    this.sprite.setFlipX(this.facing < 0);
    let weaponRot = WEAPON_REST;

    if (this.attackTime >= 0) {
      this.attackTime += dt;
      const windup = this.module.swingSeconds;
      const t = this.attackTime;
      let lean: number; // -1 indietro … +1 in avanti
      if (t < windup) {
        // 1) carica: l'arma si alza all'indietro, il corpo si piega indietro
        const p = Phaser.Math.Easing.Quadratic.Out(t / windup);
        weaponRot = Phaser.Math.Linear(WEAPON_REST, WEAPON_WINDUP, p);
        lean = -0.6 * p;
      } else {
        if (!this.attackFired) {
          // 2) il colpo parte adesso
          this.attackFired = true;
          if (this.isAlive()) {
            this.module.attack(this, this.attackAngle, this.combat);
            dustPuff(this.scene, this.x, this.y, this.attackAngle, this.y - 1);
          }
        }
        if (t < windup + STRIKE_TIME) {
          const p = Phaser.Math.Easing.Cubic.Out((t - windup) / STRIKE_TIME);
          weaponRot = Phaser.Math.Linear(WEAPON_WINDUP, WEAPON_STRIKE, p);
          lean = Phaser.Math.Linear(-0.6, 1, p);
        } else if (t < windup + STRIKE_TIME + RECOVER_TIME) {
          // 3) ritorno in posizione
          const p = Phaser.Math.Easing.Sine.InOut((t - windup - STRIKE_TIME) / RECOVER_TIME);
          weaponRot = Phaser.Math.Linear(WEAPON_STRIKE, WEAPON_REST, p);
          lean = 1 - p;
        } else {
          this.attackTime = -1;
          lean = 0;
        }
      }
      this.sprite.x = this.facing * lean * 9;
      this.sprite.y = 2;
      this.sprite.rotation = this.facing * lean * 0.16;
      this.sprite.setScale(1 + Math.max(0, lean) * 0.04, 1 - Math.max(0, lean) * 0.03);
      this.shadow.setScale(1 + Math.max(0, lean) * 0.08, 1);
    } else if (this.moving) {
      // corsa: piccoli saltelli e leggero dondolio
      const hop = Math.abs(Math.sin(this.animTime * 12));
      this.sprite.x = 0;
      this.sprite.y = 2 - hop * 6;
      this.sprite.rotation = Math.sin(this.animTime * 12) * 0.05;
      this.sprite.setScale(1, 1);
      this.shadow.setScale(1 - hop * 0.12);
      weaponRot = WEAPON_REST + Math.sin(this.animTime * 12) * 0.12;
    } else {
      // attesa: respiro
      const breath = Math.sin(this.animTime * 3);
      this.sprite.x = 0;
      this.sprite.y = 2;
      this.sprite.rotation = 0;
      this.sprite.setScale(1 - breath * 0.01, 1 + breath * 0.018);
      this.shadow.setScale(1);
    }

    if (this.weapon) {
      // la mano segue il corpo (che può piegarsi e saltellare); lo specchio vale anche per l'arma
      const f = this.facing;
      const rot = this.sprite.rotation;
      const hx = this.hand.x * f * this.sprite.scaleX;
      const hy = (this.hand.y - 2) * this.sprite.scaleY;
      this.weapon.setPosition(
        this.sprite.x + hx * Math.cos(rot) - hy * Math.sin(rot),
        this.sprite.y + hx * Math.sin(rot) + hy * Math.cos(rot),
      );
      this.weapon.setFlipX(f < 0);
      this.weapon.setOrigin(f < 0 ? 1 - this.weaponOriginX : this.weaponOriginX, this.weapon.originY);
      this.weapon.rotation = rot + f * weaponRot;
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
