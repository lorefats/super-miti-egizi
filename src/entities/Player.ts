import Phaser from 'phaser';
import { TEX, characterTexture, weaponTexture, legTexture, getHeldWeapon, getLegs } from '../art';
import { dustPuff, footstepDust, turnToSand } from '../art/effects';
import { PALETTE, type ColorVariant } from '../art/palette';
import { REGEN, REVIVE_SECONDS } from '../data/combat';
import { playImprison, playRevive } from '../art/sarcophagusFx';
import { getCharacter, SPEED_VALUES, type CharacterData } from '../data/characters';
import { getCharacterModule } from '../characters';
import type { CharacterModule } from '../characters/types';
import type { Attacker, Combat, Damageable } from './Combat';
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
/** Camminata: quanto oscillano le gambe (radianti) e quanto sale il corpo tra un passo e l'altro (pixel). */
const STRIDE = 0.55;
const STEP_BOB = 4;
/** Passi al secondo alla velocità "normale" (più veloce = passi più rapidi). */
const STEP_RATE = 2.1;
/** Quanto si piega in avanti quando cammina (radianti). */
const WALK_LEAN = 0.07;
/** Durata del "giro" quando cambia lato (secondi). */
const TURN_TIME = 0.14;

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
export class Player extends Phaser.GameObjects.Container implements Damageable, Attacker {
  declare body: Phaser.Physics.Arcade.Body;
  readonly stats: CharacterData;
  readonly team: number;
  readonly hitRadius = 26;
  readonly isHuman: boolean;
  readonly displayName: string;
  /** Nascondiglio in cui si trova adesso (lo aggiorna la partita). */
  hideout: object | null = null;
  /** Visibile al giocatore? (false = nascosto dentro una piramide) */
  private revealed = true;
  health: number;
  ammo: number;
  /** Carica della super: da 0 a 1 (1 = pronta). */
  superCharge = 0;
  /** Vite extra (si resuscita dal sarcofago) e con quanta vita. */
  extraLives = 0;
  private reviveHealth = 0.5;
  /** Secondi rimasti chiuso nel sarcofago (non si muove né attacca). */
  private stunTime = 0;
  private releaseFromPrison: (() => void) | null = null;
  /** Sta resuscitando: non si può colpire. */
  private reviving = false;
  /** Il colpo in corso è una super? */
  private attackIsSuper = false;

  private readonly module: CharacterModule;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly bar: HealthBar;
  private readonly weapon: Phaser.GameObjects.Image | null = null;
  private readonly hand = { x: 0, y: 0 };
  private weaponOriginX = 0.5;
  private readonly legs: { back: Phaser.GameObjects.Image; front: Phaser.GameObjects.Image } | null = null;
  private readonly hips = { back: { x: 0, y: 0 }, front: { x: 0, y: 0 } };
  private legOriginX = 0.5;
  /** Fase della camminata (radianti) e quanto si sta camminando (0 = fermo, 1 = cammina). */
  private walkPhase = 0;
  private walkBlend = 0;
  private turnTimer = TURN_TIME;
  private lastFacing = 1;
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
    this.add(this.shadow);
    const legsArt = getLegs(characterId);
    if (legsArt) {
      // le gambe stanno dietro al corpo (il gonnellino copre l'attacco delle gambe)
      this.hips.back = legsArt.hips.back;
      this.hips.front = legsArt.hips.front;
      this.legOriginX = legsArt.originX;
      const key = legTexture(characterId, variant);
      const back = scene.add.image(0, 0, key).setOrigin(legsArt.originX, legsArt.originY).setTint(0xb8b8c8);
      const front = scene.add.image(0, 0, key).setOrigin(legsArt.originX, legsArt.originY);
      this.legs = { back, front };
      this.add([back, front]);
    }
    this.sprite = scene.add.image(0, 2, characterTexture(characterId, variant)).setOrigin(0.5, 1);
    this.add(this.sprite);
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

  /** Può agire (non è chiuso nel sarcofago e non sta resuscitando)? */
  canAct(): boolean {
    return this.isAlive() && this.stunTime <= 0 && !this.reviving;
  }

  /** Il personaggio può sparare adesso? */
  canAttack(): boolean {
    return this.canAct() && this.ammo >= 1 && this.attackCooldown <= 0 && this.attackTime < 0;
  }

  /** La super è carica e si può usare adesso? */
  canUseSuper(): boolean {
    return this.canAct() && this.superCharge >= 1 && this.attackTime < 0;
  }

  isTargetable(): boolean {
    return this.isAlive() && !this.reviving;
  }

  /** Chiamato da Combat quando i colpi di questo personaggio vanno a segno: carica la super. */
  onDealtDamage(amount: number): void {
    if (this.attackIsSuper) return;
    this.superCharge = Math.min(1, this.superCharge + amount / this.stats.super.chargeDamage);
  }

  /** Muove il personaggio. dir ha lunghezza 0 (fermo) oppure 1. */
  move(dir: Phaser.Math.Vector2): void {
    if (!this.isAlive()) return;
    if (!this.canAct()) {
      this.body.setVelocity(0, 0);
      this.moving = false;
      return;
    }
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
    this.attackCooldown = this.stats.weapon.attackDelay;
    this.startSwing(angle, false);
    return true;
  }

  /** Usa la super nella direzione `angle`. Restituisce false se non è carica. */
  tryUseSuper(angle: number): boolean {
    if (!this.canUseSuper()) return false;
    this.superCharge = 0;
    this.startSwing(angle, true);
    // luce dorata sulla testa mentre lancia la super
    const glow = this.scene.add.image(this.facing * 20, -120, TEX.bagliore).setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD).setScale(0.4);
    this.add(glow);
    this.scene.tweens.add({ targets: glow, scale: 1.1, alpha: { from: 1, to: 0 }, duration: 450, onComplete: () => glow.destroy() });
    return true;
  }

  /** Super automatica verso il nemico più vicino. */
  autoSuper(maxDistance: number): boolean {
    const target = this.combat.nearestEnemy(this.x, this.y, this.team, maxDistance, this.hideout);
    const angle = target ? Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y) : this.facing > 0 ? 0 : Math.PI;
    return this.tryUseSuper(angle);
  }

  private startSwing(angle: number, isSuper: boolean): void {
    this.sinceCombat = 0;
    this.attackTime = 0;
    this.attackAngle = angle;
    this.attackFired = false;
    this.attackIsSuper = isSuper;
    if (Math.abs(Math.cos(angle)) > 0.05) this.facing = Math.cos(angle) < 0 ? -1 : 1;
  }

  /** Chiuso nel sarcofago per qualche secondo: non si muove né attacca. */
  stun(seconds: number): void {
    if (!this.isAlive() || this.reviving) return;
    this.stunTime = Math.max(this.stunTime, seconds);
    this.attackTime = -1;
    this.body.setVelocity(0, 0);
    if (!this.releaseFromPrison) {
      this.releaseFromPrison = playImprison(this.scene, this, this.bodyParts(), this.isHuman);
    }
  }

  /** Cura una frazione della vita massima (con numero verde). */
  heal(fraction: number): void {
    if (!this.isAlive() || this.reviving) return;
    const amount = Math.min(this.stats.maxHealth - this.health, this.stats.maxHealth * fraction);
    this.health += amount;
    if (amount > 0 && this.revealed) showDamageNumber(this.scene, this.x, this.y - BAR_OFFSET_Y + 20, amount, '#7CF29A', '+');
  }

  /** Riceve una vita extra (fino a `max`): la prossima sconfitta resusciterà dal sarcofago. */
  grantExtraLife(max: number, reviveHealth: number): void {
    this.reviveHealth = reviveHealth;
    if (this.extraLives >= max) return;
    this.extraLives += 1;
    this.bar.setExtraLife(true);
    // l'ankh salta fuori sopra la testa
    const ankh = this.scene.add.image(this.x, this.y - 150, TEX.ankh).setDepth(this.y + 5000).setScale(0.3);
    this.scene.tweens.add({ targets: ankh, scale: 1.3, y: this.y - 210, duration: 350, ease: 'Back.out' });
    this.scene.tweens.add({ targets: ankh, alpha: 0, delay: 650, duration: 300, onComplete: () => ankh.destroy() });
    if (this.revealed) showDamageNumber(this.scene, this.x, this.y - 230, 1, '#FFE08A', '+', ' vita');
  }

  /** I pezzi visibili del corpo (da nascondere quando è chiuso nel sarcofago). */
  private bodyParts(): Phaser.GameObjects.GameObject[] {
    const parts: Phaser.GameObjects.GameObject[] = [this.sprite];
    if (this.weapon) parts.push(this.weapon);
    if (this.legs) parts.push(this.legs.back, this.legs.front);
    return parts;
  }

  /** Attacco automatico verso il nemico più vicino (tocco veloce). */
  autoAttack(maxDistance: number): boolean {
    const target = this.combat.nearestEnemy(this.x, this.y, this.team, maxDistance, this.hideout);
    const angle = target ? Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y) : this.facing > 0 ? 0 : Math.PI;
    return this.tryAttack(angle);
  }

  takeDamage(amount: number): void {
    if (!this.isTargetable()) return;
    this.health = Math.max(0, this.health - amount);
    this.sinceCombat = 0;
    if (this.revealed) {
      showDamageNumber(this.scene, this.x, this.y - BAR_OFFSET_Y + 20, amount, this.isHuman ? '#FFB3B8' : '#FFFFFF');
    }
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (this.isAlive()) this.sprite.clearTint();
    });
    if (this.health <= 0) {
      if (this.extraLives > 0) this.revive();
      else this.defeat();
    }
  }

  /** Invece di essere sconfitto, resuscita dal suo sarcofago con parte della vita. */
  private revive(): void {
    this.extraLives -= 1;
    this.bar.setExtraLife(this.extraLives > 0);
    this.health = 1; // resta "vivo" ma non si può colpire mentre resuscita
    this.reviving = true;
    this.attackTime = -1;
    this.body.setVelocity(0, 0);
    if (this.releaseFromPrison) {
      this.releaseFromPrison();
      this.releaseFromPrison = null;
      this.stunTime = 0;
    }
    this.sprite.clearTint();
    playRevive(this.scene, this, this.bodyParts(), REVIVE_SECONDS, () => {
      this.reviving = false;
      this.health = this.stats.maxHealth * this.reviveHealth;
      this.sinceCombat = 0;
    });
  }

  /** Sconfitto: diventa sabbia e sparisce. Avvisa la partita con l'evento DEFEATED_EVENT. */
  private defeat(): void {
    if (this.releaseFromPrison) {
      this.releaseFromPrison();
      this.releaseFromPrison = null;
    }
    this.combat.remove(this);
    this.body.stop();
    this.body.enable = false;
    this.bar.setVisible(false);
    const images = [this.sprite];
    if (this.weapon) images.push(this.weapon);
    if (this.legs) {
      this.legs.back.clearTint();
      images.push(this.legs.back, this.legs.front);
    }
    this.shadow.setVisible(false);
    turnToSand(this.scene, images, this.x, this.y, () => this.setVisible(false));
    this.emit(DEFEATED_EVENT, this);
  }

  /** Mostra o nasconde il personaggio e la sua barra (chi è dentro una piramide non si vede da fuori). */
  setRevealed(on: boolean): void {
    if (!this.isAlive() || on === this.revealed) return;
    this.revealed = on;
    this.setVisible(on);
    this.bar.setVisible(on);
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

    // chiuso nel sarcofago o mentre resuscita: niente animazioni del corpo
    if (this.stunTime > 0) {
      this.stunTime -= dt;
      if (this.stunTime <= 0 && this.releaseFromPrison) {
        this.releaseFromPrison();
        this.releaseFromPrison = null;
      }
    }
    if (!this.canAct()) {
      this.bar.setPosition(this.x, this.y - BAR_OFFSET_Y);
      this.bar.draw(this.health, this.stats.maxHealth, this.ammo, w.maxAmmo);
      return;
    }

    // rigenerazione lenta se lontano dai combattimenti
    this.sinceCombat += dt;
    if (this.sinceCombat > REGEN.delaySeconds && this.health < this.stats.maxHealth) {
      this.health = Math.min(this.stats.maxHealth, this.health + this.stats.maxHealth * REGEN.fractionPerSecond * dt);
    }

    const f = this.facing;
    this.sprite.setFlipX(f < 0);
    if (f !== this.lastFacing) {
      this.lastFacing = f;
      this.turnTimer = 0; // ha cambiato lato: piccolo "giro" schiacciando il disegno
    }
    this.turnTimer = Math.min(TURN_TIME, this.turnTimer + dt);
    const turnSquash = 0.55 + 0.45 * Phaser.Math.Easing.Back.Out(this.turnTimer / TURN_TIME);

    // passaggio morbido tra fermo e camminata
    const walkTarget = this.moving && this.attackTime < 0 ? 1 : 0;
    this.walkBlend = Phaser.Math.Linear(this.walkBlend, walkTarget, Math.min(1, dt * 12));
    let weaponRot = WEAPON_REST;
    let legBack = 0;
    let legFront = 0;

    if (this.attackTime >= 0) {
      this.attackTime += dt;
      const windup = this.module.swingSeconds * (this.attackIsSuper ? 2.2 : 1);
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
          if (this.canAct()) {
            if (this.attackIsSuper) this.module.useSuper(this, this.attackAngle, this.combat);
            else this.module.attack(this, this.attackAngle, this.combat);
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
      // affondo: gamba davanti in avanti, gamba dietro distesa
      const fwd = Math.max(0, lean);
      legFront = 0.4 * fwd - 0.15 * Math.max(0, -lean);
      legBack = -0.35 * fwd;
      this.sprite.x = f * lean * 9;
      this.sprite.y = 2 - fwd * 2;
      this.sprite.rotation = f * lean * 0.16;
      this.sprite.setScale((1 + fwd * 0.04) * turnSquash, 1 - fwd * 0.03);
      this.shadow.setScale(1 + fwd * 0.08, 1);
    } else {
      const b = this.walkBlend;
      if (this.moving) {
        const speedFactor = SPEED_VALUES[this.stats.speed] / SPEED_VALUES.normale;
        const prevCos = Math.cos(this.walkPhase);
        this.walkPhase += dt * Math.PI * STEP_RATE * speedFactor;
        // un piede tocca terra quando le gambe sono più aperte: nuvoletta di sabbia
        if (Math.sign(prevCos) !== Math.sign(Math.cos(this.walkPhase))) {
          const foot = Math.sin(this.walkPhase) > 0 ? this.hips.front : this.hips.back;
          footstepDust(this.scene, this.x + foot.x * f + f * 6, this.y);
        }
      }
      const step = Math.sin(this.walkPhase);
      // il corpo è più in alto quando le gambe si incrociano, più in basso a gambe aperte
      const lift = (1 - Math.abs(step)) * STEP_BOB * b;
      legFront = step * STRIDE * b;
      legBack = -step * STRIDE * b;
      weaponRot = WEAPON_REST - step * 0.14 * b; // il braccio oscilla al contrario della gamba davanti

      // respiro quando è fermo
      const breath = Math.sin(this.animTime * 3) * (1 - b);
      this.sprite.x = 0;
      this.sprite.y = 2 - lift;
      this.sprite.rotation = f * WALK_LEAN * b + Math.sin(this.walkPhase * 2) * 0.012 * b;
      this.sprite.setScale((1 - breath * 0.01) * turnSquash, 1 + breath * 0.018 + Math.abs(step) * 0.015 * b);
      this.shadow.setScale(1 - lift * 0.02);
    }

    // arma e gambe seguono il corpo (che può piegarsi, salire e scendere); lo specchio vale anche per loro
    if (this.weapon) {
      this.attach(this.weapon, this.hand.x, this.hand.y - 2, this.weaponOriginX, weaponRot);
    }
    if (this.legs) {
      this.attach(this.legs.back, this.hips.back.x, this.hips.back.y, this.legOriginX, legBack, true);
      this.attach(this.legs.front, this.hips.front.x, this.hips.front.y, this.legOriginX, legFront, true);
    }

    this.bar.setPosition(this.x, this.y - BAR_OFFSET_Y);
    this.bar.draw(this.health, this.stats.maxHealth, this.ammo, w.maxAmmo);
  }

  /**
   * Attacca un pezzo (arma, gamba) al corpo nel punto (lx, ly) misurato dai piedi del personaggio girato a destra,
   * con una sua rotazione. Le gambe non ruotano con il busto (restano dritte sotto il bacino).
   */
  private attach(
    img: Phaser.GameObjects.Image,
    lx: number,
    ly: number,
    originX: number,
    localRot: number,
    upright = false,
  ): void {
    const f = this.facing;
    const rot = this.sprite.rotation;
    const hx = lx * f * this.sprite.scaleX;
    const hy = ly * this.sprite.scaleY;
    img.setPosition(
      this.sprite.x + hx * Math.cos(rot) - hy * Math.sin(rot),
      this.sprite.y + hx * Math.sin(rot) + hy * Math.cos(rot),
    );
    img.setFlipX(f < 0);
    img.setOrigin(f < 0 ? 1 - originX : originX, img.originY);
    img.setScale(Math.abs(this.sprite.scaleX), 1);
    img.rotation = (upright ? rot * 0.3 : rot) + f * localRot;
  }

  destroy(fromScene?: boolean): void {
    this.combat.remove(this);
    this.bar.destroy();
    super.destroy(fromScene);
  }
}
