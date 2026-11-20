import Phaser from 'phaser';
import { TEX, characterTexture, weaponTexture, legTexture, getHeldWeapon, getLegs } from '../art';
import { dustPuff, footstepDust, turnToSand } from '../art/effects';
import { PALETTE, type ColorVariant } from '../art/palette';
import { playSfx, playSfxAt, vibrate, type SfxName } from '../audio/Sound';
import { PUSH, REGEN, REVIVE_SECONDS, SLIP } from '../data/combat';
import { BUSH, GEM } from '../data/match';
import { playImprison, playRevive } from '../art/sarcophagusFx';
import { levelMultiplier } from '../data/progression';
import { getCharacter, SPEED_VALUES, type CharacterData, type WeaponKind } from '../data/characters';
import { getCharacterModule } from '../characters';
import type { CharacterModule } from '../characters/types';
import type { Attacker, Combat, Damageable, StunStyle } from './Combat';
import { HealthBar } from '../ui/HealthBar';
import { showDamageNumber } from '../ui/DamageNumber';

/** Suono dell'attacco base per ogni tipo di arma. */
const WEAPON_SOUND: Record<WeaponKind, SfxName> = { ventaglio: 'swing', linea: 'shoot', lancio: 'throw' };
/** Dimensioni della "impronta" dei piedi usata per le collisioni. */
const FEET_W = 40;
const FEET_H = 22;
/** Altezza a cui sta la barra della vita sopra i piedi. */
const BAR_OFFSET_Y = 182;
/** Durata del fendente e del ritorno in posizione, in secondi (la carica dipende dal personaggio). */
const STRIKE_TIME = 0.1;
const RECOVER_TIME = 0.16;
/** Rotazioni dell'arma in mano (radianti): alzata all'indietro, colpo in avanti (se il disegno non dice altro). */
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
/** Quanto si accorcia la gamba che viene sollevata (ginocchio piegato). */
const KNEE_LIFT = 0.22;
/** Ondeggiamento dei fianchi di lato (pixel). */
const HIP_SWAY = 1.5;
/** Rapidità con cui si raggiunge la velocità piena (più alto = più scattante). */
const ACCEL = 18;
/** Durata del piccolo "rimbalzo" quando si ferma (secondi). */
const SETTLE_TIME = 0.22;

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
  /** Livello del personaggio (1-11): più vita e più danno. */
  level?: number;
  /** È il compagno di squadra del giocatore (Duo)? La sua barra è azzurra. */
  ally?: boolean;
}

/** Evento emesso quando il personaggio viene sconfitto. */
export const DEFEATED_EVENT = 'sconfitto';

/**
 * Un personaggio sulla mappa (sia il giocatore sia i bot). La posizione (x, y) è il punto dei piedi:
 * serve per l'ordinamento per Y (chi è più in basso viene disegnato sopra).
 * Munizioni, ricarica e vita sono qui; cosa fa l'attacco lo decide il modulo del personaggio.
 */
export class Player extends Phaser.GameObjects.Container implements Damageable, Attacker {
  /** "Nascondiglio" speciale di chi è invisibile (super di Amon): nessuno lo vede se non da vicino. */
  static readonly INVISIBLE = {};
  declare body: Phaser.Physics.Arcade.Body;
  private readonly ownStats: CharacterData;
  readonly team: number;
  readonly kind = 'personaggio' as const;
  readonly hitRadius = 26;
  /** Gioielli raccolti in questa partita (ognuno: +10% vita e +10% danno). */
  gems = 0;
  readonly isHuman: boolean;
  readonly displayName: string;
  /** Colori del personaggio (es. "rosso" per una squadra nemica in Duo). */
  readonly variant: ColorVariant;
  /** Nascondiglio in cui si trova adesso (lo aggiorna la partita). */
  hideout: object | null = null;
  /** Velocità in più o in meno per il terreno (acqua = più lento). La aggiorna la partita. */
  terrainSpeed = 1;
  /** Corrente del fiume che trascina chi nuota (pixel al secondo). */
  readonly terrainFlow = new Phaser.Math.Vector2();
  /** Fino a quando (tempo di gioco, ms) resta visibile anche dentro un cespuglio, perché ha attaccato. */
  revealedUntil = 0;
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
  /** Fin dove è stata mirata la super (pixel), per le super "a zona". */
  private attackDistance = 0;
  /** Velocità della camminata (senza spinte). */
  private readonly walkVel = new Phaser.Math.Vector2();
  /** Spinta ricevuta (vento, acqua, onde): si smorza da sola. */
  private readonly impulse = new Phaser.Math.Vector2();
  /** Corrente che lo trascina in questo fotogramma (tornado). */
  private readonly flow = new Phaser.Math.Vector2();
  /** Secondi in cui scivola. */
  private slipTime = 0;
  /** Poteri temporanei (nome → secondi rimasti), es. l'Occhio di Horus. */
  private readonly buffs = new Map<string, number>();
  /** Velocità cambiate per qualche secondo (nome → secondi rimasti e moltiplicatore). */
  private readonly speedMods = new Map<string, { left: number; factor: number }>();
  /** Direzione a caso mentre è confuso, e fra quanto cambia. */
  private readonly confusedDir = new Phaser.Math.Vector2();
  private confusedTimer = 0;
  /** Rapidità degli attacchi cambiata per qualche secondo (nome → secondi rimasti e moltiplicatore). */
  private readonly rateMods = new Map<string, { left: number; factor: number }>();
  /** Moltiplicatore del prossimo colpo (Amon, Nefti). */
  private nextHitFactor = 1;
  /** Da dove scappa quando è spaventato. */
  private readonly scaredFrom = new Phaser.Math.Vector2();
  /** Secondi rimasti sotto terra (si muove ma non si vede, non si colpisce e non attacca). */
  private undergroundTime = 0;
  /** Sta saltando o si sta tuffando (lo muove la super, non il giocatore). */
  private dashing = false;
  /** Stelline che girano sulla testa quando è stordito. */
  private dizzy: Phaser.GameObjects.Container | null = null;
  private weaponWindup = WEAPON_WINDUP;
  private weaponStrike = WEAPON_STRIKE;

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
  /** Velocità desiderata (la velocità vera la raggiunge in fretta ma senza scatti). */
  private readonly targetVel = new Phaser.Math.Vector2();
  /** Quanto si sta camminando in verticale (0 = di lato, 1 = su/giù). */
  private vertical = 0;
  private settleTimer = SETTLE_TIME;
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
  readonly combat: Combat;
  /** Moltiplicatore di vita e danno dato dal livello del personaggio. */
  private readonly levelFactor: number;

  constructor(scene: Phaser.Scene, x: number, y: number, opt: FighterOptions) {
    super(scene, x, y);
    const { characterId, team, combat } = opt;
    const variant = opt.variant ?? 'base';
    this.variant = variant;
    this.combat = combat;
    this.isHuman = opt.isHuman ?? false;
    this.displayName = opt.name ?? '';
    this.ownStats = getCharacter(characterId);
    this.levelFactor = levelMultiplier(opt.level ?? 1);
    this.module = getCharacterModule(characterId);
    this.team = team;
    this.health = this.maxHealth;
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
      if (held.swing) {
        this.weaponWindup = held.swing.windup;
        this.weaponStrike = held.swing.strike;
      }
      this.weapon = scene.add.image(0, 0, weaponTexture(characterId, variant)).setOrigin(held.originX, held.originY);
      this.add(this.weapon);
    }
    const barColor = this.isHuman ? PALETTE.verdeNilo : opt.ally ? PALETTE.turchese : PALETTE.rossoDeserto;
    this.bar = new HealthBar(scene, barColor, this.isHuman, this.displayName);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(FEET_W, FEET_H);
    this.body.setOffset(-FEET_W / 2, -FEET_H / 2);
    this.body.setCollideWorldBounds(true);
    combat.add(this);
  }

  /** Numeri del personaggio (arma, super, vita...). */
  get stats(): CharacterData {
    return this.ownStats;
  }

  /** Sparisce e riappare subito in (x, y) (Passo nell'Ombra di Nefti). */
  teleportTo(x: number, y: number): void {
    if (!this.canAct()) return;
    this.body.reset(x, y);
    this.setPosition(x, y);
    this.walkVel.set(0, 0);
    this.impulse.set(0, 0);
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  /** Può agire (non è chiuso nel sarcofago e non sta resuscitando)? */
  canAct(): boolean {
    return this.isAlive() && this.stunTime <= 0 && !this.reviving && !this.dashing;
  }

  /** Il personaggio può sparare adesso? */
  canAttack(): boolean {
    return this.canAct() && !this.isUnderground() && this.ammo >= 1 && this.attackCooldown <= 0 && this.attackTime < 0;
  }

  /** La super è carica e si può usare adesso? */
  canUseSuper(): boolean {
    return this.canAct() && !this.isUnderground() && this.superCharge >= 1 && this.attackTime < 0;
  }

  /** Vita massima, compresi i gioielli. */
  get maxHealth(): number {
    return this.stats.maxHealth * this.levelFactor * (1 + GEM.healthBonus * this.gems);
  }

  /** Danno dell'attacco base, compresi i gioielli. */
  attackDamage(): number {
    return this.scaledDamage(this.stats.weapon.damage);
  }

  /** Un danno base (scritto nei dati) con il bonus del livello e dei gioielli. */
  scaledDamage(base: number): number {
    return base * this.levelFactor * (1 + GEM.damageBonus * this.gems);
  }

  /** Raccoglie un gioiello: più vita massima (e la stessa vita in più subito) e più danno. */
  addGem(): void {
    if (!this.isAlive()) return;
    this.gems += 1;
    this.health += this.stats.maxHealth * this.levelFactor * GEM.healthBonus;
    this.bar.setGems(this.gems);
  }

  isTargetable(): boolean {
    return this.isAlive() && !this.reviving && !this.dashing && !this.isUnderground();
  }

  /** È sotto terra (super di Khepri)? */
  isUnderground(): boolean {
    return this.undergroundTime > 0;
  }

  /**
   * Va sotto terra per qualche secondo: si muove ancora (comandato dal giocatore o dal bot)
   * ma non si vede, non si può colpire e non attacca. Chi guarda vede solo la terra smossa (la disegna la super).
   */
  goUnderground(seconds: number): void {
    if (!this.canAct()) return;
    this.undergroundTime = seconds;
    this.attackTime = -1;
    for (const p of this.bodyParts() as Phaser.GameObjects.Image[]) p.setVisible(false);
    this.shadow.setVisible(false);
    if (!this.isHuman) this.bar.setVisible(false);
  }

  private comeUp(): void {
    this.undergroundTime = 0;
    for (const p of this.bodyParts() as Phaser.GameObjects.Image[]) p.setVisible(true);
    this.shadow.setVisible(true);
    this.bar.setVisible(this.revealed);
  }

  /** Cambia la velocità per qualche secondo (0.7 = più lento, 1.3 = più veloce). Si rinnova se arriva di nuovo. */
  changeSpeed(name: string, seconds: number, factor: number): void {
    if (!this.isAlive()) return;
    if (factor < 1 && !this.isTargetable()) return; // i rallentamenti non arrivano a chi non si può colpire
    const old = this.speedMods.get(name);
    this.speedMods.set(name, { left: Math.max(old?.left ?? 0, seconds), factor });
  }

  /** Moltiplicatore della velocità dato da tutti i cambi di velocità attivi. */
  private speedFactor(): number {
    let f = 1;
    for (const m of this.speedMods.values()) f *= m.factor;
    return f;
  }

  /** Cambia la rapidità degli attacchi e della ricarica per qualche secondo (0.4 = al rallentatore, 2 = il doppio). */
  changeAttackRate(name: string, seconds: number, factor: number): void {
    if (!this.isAlive()) return;
    if (factor < 1 && !this.isTargetable()) return;
    const old = this.rateMods.get(name);
    this.rateMods.set(name, { left: Math.max(old?.left ?? 0, seconds), factor });
  }

  /** Moltiplicatore della rapidità degli attacchi. */
  attackRate(): number {
    let f = 1;
    for (const m of this.rateMods.values()) f *= m.factor;
    return f;
  }

  /** Spaventato: per qualche secondo scappa lontano dal punto (x, y) e non lo si comanda. */
  scare(x: number, y: number, seconds: number): void {
    if (!this.isTargetable()) return;
    this.scaredFrom.set(x, y);
    this.addBuff('paura', seconds);
  }

  healthFraction(): number {
    return this.health / this.maxHealth;
  }

  /** Mette la vita a una frazione della vita massima (la Bilancia di Maat). */
  setHealthFraction(f: number): void {
    if (!this.isTargetable()) return;
    this.health = Phaser.Math.Clamp(f, 0.01, 1) * this.maxHealth;
  }

  /** Invisibile per qualche secondo (super di Amon): i nemici lo vedono solo da vicino. */
  goInvisible(seconds: number): void {
    this.addBuff('invisibile', seconds);
  }

  isInvisible(): boolean {
    return this.hasBuff('invisibile');
  }

  /** Toglie un potere prima del tempo. */
  removeBuff(name: string): void {
    this.buffs.delete(name);
  }

  /** Il prossimo colpo farà più danno (`factor` = moltiplicatore), se arriva entro `seconds`. */
  grantNextHitBonus(factor: number, seconds: number): void {
    this.nextHitFactor = factor;
    this.addBuff('colpoForte', seconds);
  }

  /** Usa il bonus del prossimo colpo (se c'è) e restituisce il moltiplicatore. */
  consumeNextHitBonus(): number {
    if (!this.hasBuff('colpoForte')) return 1;
    this.removeBuff('colpoForte');
    return this.nextHitFactor;
  }

  /** Vede solo vicino a sé per qualche secondo (tempesta di sabbia di Seth). */
  blind(seconds: number): void {
    if (!this.isTargetable()) return;
    this.addBuff('accecato', seconds);
  }

  /** Confuso per qualche secondo: si muove a caso (il giocatore o il bot non lo comandano). */
  confuse(seconds: number): void {
    if (!this.isTargetable()) return;
    if (!this.hasBuff('confuso')) this.confusedTimer = 0;
    this.addBuff('confuso', seconds);
  }

  /** Chiamato da Combat quando i colpi di questo personaggio vanno a segno: carica la super. */
  onDealtDamage(amount: number): void {
    if (this.attackIsSuper) return;
    const wasReady = this.superCharge >= 1;
    this.superCharge = Math.min(1, this.superCharge + amount / this.stats.super.chargeDamage);
    if (this.isHuman && !wasReady && this.superCharge >= 1) {
      playSfx('superReady');
      vibrate('superReady');
    }
  }

  /** Muove il personaggio. dir ha lunghezza 0 (fermo) oppure 1. */
  move(dir: Phaser.Math.Vector2): void {
    if (!this.isAlive()) return;
    if (!this.canAct()) {
      // la velocità la decide preUpdate (fermo, oppure trascinato da una spinta)
      this.targetVel.set(0, 0);
      this.moving = false;
      return;
    }
    if (this.hasBuff('paura')) {
      // spaventato: scappa dritto lontano da chi l'ha spaventato
      this.confusedDir.set(this.x - this.scaredFrom.x, this.y - this.scaredFrom.y);
      if (this.confusedDir.lengthSq() < 1) this.confusedDir.set(1, 0);
      dir = this.confusedDir.normalize();
    } else if (this.hasBuff('confuso')) {
      // confuso: cammina dove vuole lui, cambiando direzione ogni tanto
      this.confusedTimer -= this.scene.game.loop.delta / 1000;
      if (this.confusedTimer <= 0) {
        this.confusedTimer = Phaser.Math.FloatBetween(0.3, 0.6);
        this.confusedDir.setToPolar(Math.random() * Math.PI * 2, 1);
      }
      dir = this.confusedDir;
    }
    const speed = SPEED_VALUES[this.stats.speed] * this.terrainSpeed * this.speedFactor();
    this.targetVel.set(dir.x * speed, dir.y * speed);
    const wasMoving = this.moving;
    this.moving = dir.lengthSq() > 0;
    if (this.moving) this.vertical = Phaser.Math.Linear(this.vertical, Math.abs(dir.y), 0.2);
    else if (wasMoving) this.settleTimer = 0; // si è appena fermato
    if (this.attackTime < 0) {
      if (dir.x < -0.1) this.facing = -1;
      else if (dir.x > 0.1) this.facing = 1;
    }
  }

  /** Attacca nella direzione `angle` (radianti). Restituisce false se non ci sono colpi pronti. */
  tryAttack(angle: number, distance?: number): boolean {
    if (!this.canAttack()) {
      if (this.ammo < 1) this.bar.flashAmmo();
      return false;
    }
    this.ammo -= 1;
    this.attackCooldown = this.stats.weapon.attackDelay;
    this.attackDistance = Phaser.Math.Clamp(distance ?? this.stats.weapon.range, 0, this.stats.weapon.range);
    this.startSwing(angle, false);
    if (this.revealed) playSfxAt(this.scene, this.x, this.y, WEAPON_SOUND[this.stats.weapon.kind], this.isHuman ? 1 : 0.7);
    return true;
  }

  /**
   * Usa la super nella direzione `angle`. `distance` = fin dove è stata mirata (per le super "a zona";
   * se manca, tutta la portata). Restituisce false se non è carica.
   */
  tryUseSuper(angle: number, distance?: number): boolean {
    if (!this.canUseSuper()) return false;
    this.superCharge = 0;
    this.attackDistance = Phaser.Math.Clamp(distance ?? this.stats.super.range, 0, this.stats.super.range);
    this.startSwing(angle, true);
    if (this.revealed) playSfxAt(this.scene, this.x, this.y, 'super');
    if (this.isHuman) vibrate('super');
    // luce dorata sulla testa mentre lancia la super
    const glow = this.scene.add.image(this.facing * 20, -120, TEX.bagliore).setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD).setScale(0.4);
    this.add(glow);
    this.scene.tweens.add({ targets: glow, scale: 1.1, alpha: { from: 1, to: 0 }, duration: 450, onComplete: () => glow.destroy() });
    return true;
  }

  /** Super automatica verso il nemico più vicino. */
  autoSuper(maxDistance: number): boolean {
    const target = this.combat.nearestEnemy(this.x, this.y, this.team, maxDistance, this.hideout, undefined, this.seesAll());
    const angle = target ? Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y) : this.facing > 0 ? 0 : Math.PI;
    const distance = target ? Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) : this.stats.super.range * 0.6;
    return this.tryUseSuper(angle, distance);
  }

  private startSwing(angle: number, isSuper: boolean): void {
    this.sinceCombat = 0;
    this.revealedUntil = this.scene.time.now + BUSH.revealAfterAttack * 1000;
    this.attackTime = 0;
    this.attackAngle = angle;
    this.attackFired = false;
    this.attackIsSuper = isSuper;
    if (Math.abs(Math.cos(angle)) > 0.05) this.facing = Math.cos(angle) < 0 ? -1 : 1;
  }

  /**
   * Stordito per qualche secondo: non si muove né attacca.
   * "sarcofago" = chiuso nel sarcofago di Anubi, "stelle" = stelline che girano sulla testa.
   */
  stun(seconds: number, style: StunStyle = 'sarcofago'): void {
    if (!this.isAlive() || this.reviving || this.dashing || this.isUnderground()) return;
    this.stunTime = Math.max(this.stunTime, seconds);
    this.attackTime = -1;
    this.body.setVelocity(0, 0);
    this.walkVel.set(0, 0);
    if (style === 'stelle') {
      if (!this.dizzy) this.showDizzyStars();
    } else if (!this.releaseFromPrison) {
      this.releaseFromPrison = playImprison(this.scene, this, this.bodyParts(), this.isHuman);
    }
  }

  /** Tre stelline che girano sopra la testa. */
  private showDizzyStars(): void {
    const c = this.scene.add.container(0, -150);
    for (let i = 0; i < 3; i++) {
      c.add(this.scene.add.image(0, 0, TEX.scintilla).setScale(1.9).setTint(0xffe08a));
    }
    this.add(c);
    this.dizzy = c;
  }

  private clearDizzy(): void {
    this.dizzy?.destroy();
    this.dizzy = null;
  }

  /** Spinta improvvisa (vento, acqua, onde) che poi si smorza. */
  push(vx: number, vy: number): void {
    if (!this.isTargetable()) return;
    this.impulse.add({ x: vx, y: vy });
  }

  /** Corrente che lo trascina solo per questo fotogramma (il risucchio del tornado). */
  addFlow(vx: number, vy: number): void {
    if (!this.isTargetable()) return;
    this.flow.add({ x: vx, y: vy });
  }

  /** Scivola per qualche secondo: fermarsi e girare diventa difficile. */
  slip(seconds: number): void {
    if (!this.isTargetable()) return;
    this.slipTime = Math.max(this.slipTime, seconds);
  }

  /** Dà un potere temporaneo (es. "occhio" per l'Occhio di Horus). */
  addBuff(name: string, seconds: number): void {
    this.buffs.set(name, Math.max(this.buffs.get(name) ?? 0, seconds));
  }

  hasBuff(name: string): boolean {
    return (this.buffs.get(name) ?? 0) > 0;
  }

  /** Vede tutti i nemici, anche quelli nascosti (Occhio di Horus). */
  seesAll(): boolean {
    return this.hasBuff('occhio') || this.hasBuff('notte');
  }

  /**
   * Salto o tuffo comandato dalla super: va da dove si trova a (tx, ty) in `seconds`, passando sopra i muri.
   * Intanto non si può colpire né comandare. `hidden` = sparisce sotto terra; `hop` = quanto sale in aria (pixel).
   */
  dashTo(tx: number, ty: number, seconds: number, opt: { hidden?: boolean; hop?: number; onArrive?: () => void } = {}): void {
    if (!this.isAlive() || this.dashing) return;
    this.dashing = true;
    this.attackTime = -1;
    this.walkVel.set(0, 0);
    this.impulse.set(0, 0);
    this.targetVel.set(0, 0);
    this.body.setVelocity(0, 0);
    this.body.checkCollision.none = true;
    const parts = this.bodyParts() as Phaser.GameObjects.Image[];
    if (opt.hidden) {
      for (const p of parts) p.setVisible(false);
      this.shadow.setVisible(false);
      this.bar.setVisible(false);
    }
    const baseY = parts.map((p) => p.y);
    const fx = this.x;
    const fy = this.y;
    const hop = opt.hop ?? 0;
    const proxy = { t: 0 };
    this.scene.tweens.add({
      targets: proxy,
      t: 1,
      duration: Math.max(60, seconds * 1000),
      ease: opt.hidden ? 'Sine.inOut' : 'Linear',
      onUpdate: () => {
        if (!this.isAlive()) return;
        this.setPosition(fx + (tx - fx) * proxy.t, fy + (ty - fy) * proxy.t);
        this.setDepth(this.y);
        if (hop) {
          const h = Math.sin(proxy.t * Math.PI) * hop;
          parts.forEach((p, i) => (p.y = baseY[i] - h));
          this.shadow.setScale(1 - (h / hop) * 0.4);
        }
        this.bar.setPosition(this.x, this.y - BAR_OFFSET_Y - (hop ? Math.sin(proxy.t * Math.PI) * hop : 0));
      },
      onComplete: () => {
        this.dashing = false;
        this.body.checkCollision.none = false;
        if (!this.isAlive()) return;
        parts.forEach((p, i) => (p.y = baseY[i]));
        this.shadow.setScale(1);
        if (opt.hidden) {
          for (const p of parts) p.setVisible(true);
          this.shadow.setVisible(true);
          this.bar.setVisible(this.revealed);
        }
        opt.onArrive?.();
      },
    });
  }

  /** Cura una frazione della vita massima (con numero verde). */
  heal(fraction: number): void {
    if (!this.isAlive() || this.reviving) return;
    const amount = Math.min(this.maxHealth - this.health, this.maxHealth * fraction);
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
    const target = this.combat.nearestEnemy(this.x, this.y, this.team, maxDistance, this.hideout, undefined, this.seesAll());
    const angle = target ? Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y) : this.facing > 0 ? 0 : Math.PI;
    const distance = target ? Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) : undefined;
    return this.tryAttack(angle, distance);
  }

  takeDamage(amount: number): void {
    if (!this.isTargetable()) return;
    this.health = Math.max(0, this.health - amount);
    this.sinceCombat = 0;
    if (this.revealed) {
      showDamageNumber(this.scene, this.x, this.y - BAR_OFFSET_Y + 20, amount, this.isHuman ? '#FFB3B8' : '#FFFFFF');
    }
    if (this.isHuman) {
      playSfx('hurt');
      vibrate('hurt');
    } else if (this.revealed) {
      playSfxAt(this.scene, this.x, this.y, 'hit');
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
    this.clearDizzy();
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
      this.health = this.maxHealth * this.reviveHealth;
      this.sinceCombat = 0;
    });
  }

  /** Sconfitto: diventa sabbia e sparisce. Avvisa la partita con l'evento DEFEATED_EVENT. */
  private defeat(): void {
    this.clearDizzy();
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
    playSfxAt(this.scene, this.x, this.y, 'defeated');
    if (this.isHuman) vibrate('defeated');
    this.emit(DEFEATED_EVENT, this);
  }

  /**
   * Riappare in (x, y) con tutta la vita, dopo essere stato sconfitto (Calcio del Nilo).
   * Poteri, rallentamenti e gioielli si perdono; la super carica resta.
   */
  respawn(x: number, y: number): void {
    if (this.isAlive()) return;
    this.health = this.maxHealth;
    this.ammo = this.stats.weapon.maxAmmo;
    this.attackTime = -1;
    this.attackCooldown = 0;
    this.stunTime = 0;
    this.slipTime = 0;
    this.undergroundTime = 0;
    this.dashing = false;
    this.reviving = false;
    this.gems = 0;
    this.buffs.clear();
    this.speedMods.clear();
    this.rateMods.clear();
    this.nextHitFactor = 1;
    this.walkVel.set(0, 0);
    this.targetVel.set(0, 0);
    this.impulse.set(0, 0);
    this.flow.set(0, 0);
    for (const img of this.bodyParts() as Phaser.GameObjects.Image[]) img.clearTint().setAlpha(1).setScale(1);
    this.shadow.setVisible(true).setScale(1);
    this.setVisible(true).setAlpha(1);
    this.revealed = true;
    this.body.enable = true;
    this.body.reset(x, y);
    this.setPosition(x, y);
    this.bar.setVisible(true);
    this.bar.setPosition(x, y - BAR_OFFSET_Y);
    this.combat.add(this);
    dustPuff(this.scene, x, y, 0, y - 1);
    dustPuff(this.scene, x, y, Math.PI, y - 1);
  }

  /** Mostra o nasconde il personaggio e la sua barra (chi è dentro una piramide non si vede da fuori). */
  setRevealed(on: boolean): void {
    if (!this.isAlive() || on === this.revealed) return;
    this.revealed = on;
    this.setVisible(on);
    this.bar.setVisible(on && (this.isHuman || !this.isUnderground()));
  }

  /** Aspetto "nascosto": il giocatore si vede semitrasparente quando è in un nascondiglio. */
  setHiddenLook(on: boolean): void {
    this.setAlpha(on ? 0.55 : 1);
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
    const rate = this.attackRate();
    if (this.ammo < w.maxAmmo) this.ammo = Math.min(w.maxAmmo, this.ammo + (dt * rate) / w.reloadSeconds);
    if (this.attackCooldown > 0) this.attackCooldown -= dt * rate;
    for (const [name, m] of this.rateMods) {
      m.left -= dt;
      if (m.left <= 0) this.rateMods.delete(name);
    }

    // poteri temporanei che scadono
    for (const [name, left] of this.buffs) {
      if (left - dt <= 0) this.buffs.delete(name);
      else this.buffs.set(name, left - dt);
    }
    for (const [name, m] of this.speedMods) {
      m.left -= dt;
      if (m.left <= 0) this.speedMods.delete(name);
    }
    if (this.undergroundTime > 0) {
      this.undergroundTime -= dt;
      if (this.undergroundTime <= 0) this.comeUp();
    }
    if (this.slipTime > 0) {
      this.slipTime -= dt;
      this.shadow.setTint(0x7fd8ff); // pozzanghera sotto i piedi mentre scivola
      if (this.slipTime <= 0) this.shadow.clearTint();
    }
    // spinte e correnti (vento, acqua, tornado)
    const decay = Math.exp(-PUSH.decayPerSecond * dt);
    const pushX = this.impulse.x + this.flow.x;
    const pushY = this.impulse.y + this.flow.y;
    this.impulse.scale(decay);
    if (this.impulse.lengthSq() < 25) this.impulse.set(0, 0);
    this.flow.set(0, 0);

    // chiuso nel sarcofago, stordito o mentre resuscita: niente animazioni del corpo
    if (this.stunTime > 0) {
      this.stunTime -= dt;
      this.dizzy?.list.forEach((o, i) => {
        const a = this.animTime * 6 + (i * Math.PI * 2) / 3;
        (o as Phaser.GameObjects.Image).setPosition(Math.cos(a) * 30, Math.sin(a) * 10).setRotation(a);
      });
      if (this.stunTime <= 0) {
        this.clearDizzy();
        if (this.releaseFromPrison) {
          this.releaseFromPrison();
          this.releaseFromPrison = null;
        }
      }
    }
    if (!this.canAct()) {
      if (!this.dashing) {
        if (!this.reviving) this.body.setVelocity(pushX, pushY);
        this.bar.setPosition(this.x, this.y - BAR_OFFSET_Y);
      }
      this.bar.draw(this.health, this.maxHealth, this.ammo, w.maxAmmo);
      return;
    }

    // velocità: si avvicina a quella desiderata in un attimo (partenza e frenata morbide); chi scivola ci mette molto di più
    const k = Math.min(1, dt * (this.slipTime > 0 ? SLIP.accel : ACCEL));
    let vx = Phaser.Math.Linear(this.walkVel.x, this.targetVel.x, k);
    let vy = Phaser.Math.Linear(this.walkVel.y, this.targetVel.y, k);
    if (Math.abs(vx - this.targetVel.x) < 8) vx = this.targetVel.x; // niente scivolate lente alla fine
    if (Math.abs(vy - this.targetVel.y) < 8) vy = this.targetVel.y;
    this.walkVel.set(vx, vy);
    this.body.setVelocity(vx + pushX + this.terrainFlow.x, vy + pushY + this.terrainFlow.y);

    // rigenerazione lenta se lontano dai combattimenti
    this.sinceCombat += dt;
    if (this.sinceCombat > REGEN.delaySeconds && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.maxHealth * REGEN.fractionPerSecond * dt);
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
    let legBackScale = 1;
    let legFrontScale = 1;
    let legBackLift = 0;
    let legFrontLift = 0;

    if (this.attackTime >= 0) {
      this.attackTime += dt;
      const windup = (this.module.swingSeconds * (this.attackIsSuper ? 2.2 : 1)) / Math.max(0.3, this.attackRate());
      const t = this.attackTime;
      let lean: number; // -1 indietro … +1 in avanti
      if (t < windup) {
        // 1) carica: l'arma si alza all'indietro, il corpo si piega indietro
        const p = Phaser.Math.Easing.Quadratic.Out(t / windup);
        weaponRot = Phaser.Math.Linear(WEAPON_REST, this.weaponWindup, p);
        lean = -0.6 * p;
      } else {
        if (!this.attackFired) {
          // 2) il colpo parte adesso
          this.attackFired = true;
          if (this.canAct()) {
            if (this.attackIsSuper) this.module.useSuper(this, this.attackAngle, this.combat, this.attackDistance);
            else this.module.attack(this, this.attackAngle, this.combat, this.attackDistance);
            dustPuff(this.scene, this.x, this.y, this.attackAngle, this.y - 1);
          }
        }
        if (t < windup + STRIKE_TIME) {
          const p = Phaser.Math.Easing.Cubic.Out((t - windup) / STRIKE_TIME);
          weaponRot = Phaser.Math.Linear(this.weaponWindup, this.weaponStrike, p);
          lean = Phaser.Math.Linear(-0.6, 1, p);
        } else if (t < windup + STRIKE_TIME + RECOVER_TIME) {
          // 3) ritorno in posizione
          const p = Phaser.Math.Easing.Sine.InOut((t - windup - STRIKE_TIME) / RECOVER_TIME);
          weaponRot = Phaser.Math.Linear(this.weaponStrike, WEAPON_REST, p);
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
      const swingDir = Math.cos(this.walkPhase); // > 0: la gamba davanti va avanti (è sollevata)
      // di lato il passo è lungo; su/giù è più corto e le gambe si alternano in altezza
      const stride = STRIDE * (1 - 0.45 * this.vertical) * b;
      // il corpo è più in alto quando le gambe si incrociano, più in basso a gambe aperte
      const lift = (1 - Math.abs(step)) * STEP_BOB * b;
      legFront = step * stride;
      legBack = -step * stride;
      // ginocchio: la gamba che avanza si solleva (si accorcia), quella appoggiata resta lunga
      legFrontScale = 1 - Math.max(0, swingDir) * KNEE_LIFT * b;
      legBackScale = 1 - Math.max(0, -swingDir) * KNEE_LIFT * b;
      legFrontLift = Math.max(0, swingDir) * 3 * this.vertical * b;
      legBackLift = Math.max(0, -swingDir) * 3 * this.vertical * b;
      weaponRot = WEAPON_REST - step * 0.16 * b; // il braccio oscilla al contrario della gamba davanti

      // rimbalzo quando si ferma: si abbassa un attimo e torna su
      this.settleTimer = Math.min(SETTLE_TIME, this.settleTimer + dt);
      const settle = Math.sin((this.settleTimer / SETTLE_TIME) * Math.PI) * (1 - this.settleTimer / SETTLE_TIME);

      // respiro quando è fermo
      const breath = Math.sin(this.animTime * 3) * (1 - b);
      // peso: schiacciato quando il piede tocca terra, allungato a metà passo
      const weight = (Math.abs(step) - 0.5) * 2 * b; // -1 a metà passo, +1 a piede appoggiato
      this.sprite.x = Math.sin(this.walkPhase) * HIP_SWAY * b * (1 - this.vertical * 0.5);
      this.sprite.y = 2 - lift + settle * 3;
      this.sprite.rotation = f * WALK_LEAN * b * (1 - this.vertical * 0.6) + Math.sin(this.walkPhase * 2) * 0.012 * b;
      this.sprite.setScale(
        (1 - breath * 0.01 + weight * 0.012 + settle * 0.04) * turnSquash,
        1 + breath * 0.018 - weight * 0.018 - settle * 0.05,
      );
      this.shadow.setScale(1 - lift * 0.02 + settle * 0.05, 1);
    }

    // arma e gambe seguono il corpo (che può piegarsi, salire e scendere); lo specchio vale anche per loro
    if (this.weapon) {
      this.attach(this.weapon, this.hand.x, this.hand.y - 2, this.weaponOriginX, weaponRot);
    }
    if (this.legs) {
      this.attach(this.legs.back, this.hips.back.x, this.hips.back.y - legBackLift, this.legOriginX, legBack, true, legBackScale);
      this.attach(this.legs.front, this.hips.front.x, this.hips.front.y - legFrontLift, this.legOriginX, legFront, true, legFrontScale);
    }

    this.bar.setPosition(this.x, this.y - BAR_OFFSET_Y);
    this.bar.draw(this.health, this.maxHealth, this.ammo, w.maxAmmo);
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
    scaleY = 1,
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
    img.setScale(Math.abs(this.sprite.scaleX), scaleY);
    img.rotation = (upright ? rot * 0.3 : rot) + f * localRot;
  }

  destroy(fromScene?: boolean): void {
    this.combat.remove(this);
    this.bar.destroy();
    super.destroy(fromScene);
  }
}
