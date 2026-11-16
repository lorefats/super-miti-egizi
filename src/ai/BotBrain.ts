import Phaser from 'phaser';
import { BOT_FLEE_HEALTH, BOT_RECOVER_HEALTH, type BotLevel } from '../data/bots';
import type { Combat, Damageable } from '../entities/Combat';
import type { Player } from '../entities/Player';

type Mode = 'tempesta' | 'scappa' | 'combatti' | 'baule' | 'gioiello' | 'esplora';

/** Cosa sa un bot della mappa. */
export interface BotWorld {
  width: number;
  height: number;
  /**
   * Se per andare da (fx, fy) a (tx, ty) bisogna passare da una porta (es. piramide grande),
   * restituisce il punto verso cui andare prima; altrimenti null.
   */
  routeVia?(fx: number, fy: number, tx: number, ty: number): { x: number; y: number } | null;
  /** Cerchio sicuro della tempesta (fuori si perde vita). */
  safeZone?(): { x: number; y: number; r: number };
  /** Gioiello a terra più vicino entro maxDist, oppure null. */
  nearestGem?(x: number, y: number, maxDist: number): { x: number; y: number } | null;
}

/** Margine (pixel) dal bordo della tempesta entro cui il bot comincia già a rientrare. */
const STORM_MARGIN = 80;

/**
 * Il "cervello" di un bot (sezione 11 di GAME_DESIGN.md), in ordine di priorità:
 * 1. nella tempesta → verso il centro
 * 2. vita sotto il 30% → scappa              (i cespugli arriveranno nel Passo 6)
 * 3. nemico a tiro → attacca con un piccolo errore di mira
 * 4. super carica e buon bersaglio → usala
 * 5. altrimenti → gioielli e bauli più vicini, poi esplora
 */
export class BotBrain {
  private mode: Mode = 'esplora';
  private thinkTimer = 0;
  private target: Damageable | null = null;
  private readonly goal = new Phaser.Math.Vector2();
  private readonly wanted = new Phaser.Math.Vector2();
  private readonly wander = new Phaser.Math.Vector2();
  private attackWait = 0;
  private strafeSign = 1;
  private strafeTimer = 0;
  // per capire se è bloccato contro un muro
  private readonly lastPos = new Phaser.Math.Vector2();
  private stuckCheck = 0;
  private detourTimer = 0;
  private readonly detour = new Phaser.Math.Vector2();
  private readonly out = new Phaser.Math.Vector2();

  constructor(
    private readonly bot: Player,
    private readonly combat: Combat,
    private readonly level: BotLevel,
    private readonly world: BotWorld,
  ) {
    this.pickWanderPoint();
    this.lastPos.set(bot.x, bot.y);
    this.thinkTimer = Math.random() * level.thinkSeconds;
    this.attackWait = this.randomPause();
  }

  /** Restituisce la direzione in cui il bot vuole camminare (lunghezza 0 o 1). */
  update(dt: number): Phaser.Math.Vector2 {
    const bot = this.bot;
    this.thinkTimer -= dt;
    if (this.thinkTimer <= 0) {
      this.thinkTimer = this.level.thinkSeconds;
      this.think();
    }
    this.attackWait -= dt;
    this.wanted.set(0, 0);

    switch (this.mode) {
      case 'tempesta':
      case 'gioiello':
        this.headTo(this.goal.x, this.goal.y);
        break;
      case 'scappa':
        if (this.target) this.wanted.set(bot.x - this.target.x, bot.y - this.target.y).normalize();
        break;
      case 'combatti':
        if (this.target) this.fight(this.target, dt, true);
        break;
      case 'baule':
        if (this.target) this.fight(this.target, dt, false);
        break;
      default:
        // esplora: cammina verso un punto a caso (dentro il cerchio sicuro)
        if (Phaser.Math.Distance.Between(bot.x, bot.y, this.wander.x, this.wander.y) < 60) this.pickWanderPoint();
        this.headTo(this.wander.x, this.wander.y);
    }

    return this.avoidGettingStuck(dt);
  }

  /** Avvicinati e colpisci. Con un nemico gira anche attorno a lui; con un baule sta fermo e picchia. */
  private fight(t: Damageable, dt: number, strafe: boolean): void {
    const bot = this.bot;
    const range = bot.stats.weapon.range;
    const dist = Phaser.Math.Distance.Between(bot.x, bot.y, t.x, t.y);
    const toTarget = new Phaser.Math.Vector2(t.x - bot.x, t.y - bot.y).normalize();
    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeTimer = Phaser.Math.FloatBetween(0.6, 1.4);
      this.strafeSign = Math.random() < 0.5 ? -1 : 1;
    }
    if (dist - t.hitRadius > range * 0.6) this.headTo(t.x, t.y);
    else if (strafe) {
      this.wanted
        .set(-toTarget.y * this.strafeSign, toTarget.x * this.strafeSign)
        .add(toTarget.clone().scale(0.2))
        .normalize();
    }

    const angle = Phaser.Math.Angle.Between(bot.x, bot.y, t.x, t.y);
    const error = () => Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-this.level.aimErrorDeg, this.level.aimErrorDeg));
    if (this.attackWait > 0) return;
    // 4) super carica e bersaglio a portata (solo contro i personaggi)
    if (strafe && bot.canUseSuper() && dist < bot.stats.super.range * 0.85) {
      bot.tryUseSuper(angle + error() * 0.5);
      this.attackWait = this.randomPause();
      return;
    }
    // 3) attacca quando è a tiro, dopo un piccolo "tempo di reazione"
    if (dist - t.hitRadius < range * 0.95 && bot.canAttack()) {
      bot.tryAttack(angle + (strafe ? error() : 0));
      this.attackWait = strafe ? this.randomPause() : 0.15;
    }
  }

  private think(): void {
    const bot = this.bot;
    const lifeFrac = bot.health / bot.maxHealth;
    const sight = this.level.sightRange;

    // 1) tempesta: rientra verso il centro del cerchio sicuro
    const zone = this.world.safeZone?.();
    if (zone && Phaser.Math.Distance.Between(bot.x, bot.y, zone.x, zone.y) > zone.r - STORM_MARGIN) {
      this.mode = 'tempesta';
      this.goal.set(zone.x, zone.y);
      this.target = null;
      return;
    }

    const enemy = this.combat.nearestEnemy(bot.x, bot.y, bot.team, sight, bot.hideout, ['personaggio', 'bersaglio']);

    // 2) poca vita: scappa (e continua finché non si è ripreso)
    if (enemy && (lifeFrac < BOT_FLEE_HEALTH || (this.mode === 'scappa' && lifeFrac < BOT_RECOVER_HEALTH))) {
      this.mode = 'scappa';
      this.target = enemy;
      return;
    }

    // 3) nemico in vista: combatti
    if (enemy) {
      if (this.mode !== 'combatti' || this.target !== enemy) this.attackWait = Math.max(this.attackWait, this.randomPause());
      this.mode = 'combatti';
      this.target = enemy;
      return;
    }

    // 5) gioielli a terra, poi bauli
    const gem = this.world.nearestGem?.(bot.x, bot.y, sight);
    if (gem) {
      this.mode = 'gioiello';
      this.goal.set(gem.x, gem.y);
      this.target = null;
      return;
    }
    const chest = this.combat.nearestEnemy(bot.x, bot.y, bot.team, sight, bot.hideout, ['baule']);
    if (chest) {
      this.mode = 'baule';
      this.target = chest;
      return;
    }

    if (this.mode !== 'esplora') this.pickWanderPoint();
    this.mode = 'esplora';
    this.target = null;
  }

  /** Cammina verso (x, y), passando dalla porta se serve. */
  private headTo(x: number, y: number): void {
    const via = this.world.routeVia?.(this.bot.x, this.bot.y, x, y);
    const p = via ?? { x, y };
    this.wanted.set(p.x - this.bot.x, p.y - this.bot.y).normalize();
  }

  /** Se il bot cammina ma non si sposta (muro davanti), prova ad aggirare l'ostacolo per un attimo. */
  private avoidGettingStuck(dt: number): Phaser.Math.Vector2 {
    const bot = this.bot;
    if (this.detourTimer > 0) {
      this.detourTimer -= dt;
      return this.out.copy(this.detour);
    }
    this.stuckCheck += dt;
    if (this.stuckCheck >= 0.4) {
      const moved = Phaser.Math.Distance.Between(bot.x, bot.y, this.lastPos.x, this.lastPos.y);
      this.lastPos.set(bot.x, bot.y);
      this.stuckCheck = 0;
      if (this.wanted.lengthSq() > 0 && moved < 20) {
        const side = Math.random() < 0.5 ? -1 : 1;
        this.detour.set(-this.wanted.y * side, this.wanted.x * side);
        this.detourTimer = Phaser.Math.FloatBetween(0.5, 0.9);
        if (this.mode === 'esplora') this.pickWanderPoint();
        return this.out.copy(this.detour);
      }
    }
    return this.out.copy(this.wanted);
  }

  /** Punto a caso dove andare, dentro la mappa e dentro il cerchio sicuro. */
  private pickWanderPoint(): void {
    const m = 200;
    const zone = this.world.safeZone?.();
    for (let i = 0; i < 10; i++) {
      this.wander.set(Phaser.Math.Between(m, this.world.width - m), Phaser.Math.Between(m, this.world.height - m));
      if (!zone || Phaser.Math.Distance.Between(this.wander.x, this.wander.y, zone.x, zone.y) < zone.r - STORM_MARGIN * 2) return;
    }
    if (zone) this.wander.set(zone.x + Phaser.Math.Between(-80, 80), zone.y + Phaser.Math.Between(-80, 80));
  }

  private randomPause(): number {
    const [a, b] = this.level.attackPause;
    return Phaser.Math.FloatBetween(a, b);
  }
}
