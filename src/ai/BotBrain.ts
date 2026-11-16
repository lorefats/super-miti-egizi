import Phaser from 'phaser';
import { BOT_FLEE_HEALTH, BOT_RECOVER_HEALTH, type BotLevel } from '../data/bots';
import type { Combat, Damageable } from '../entities/Combat';
import type { Player } from '../entities/Player';

type Mode = 'esplora' | 'combatti' | 'scappa';

/** Cosa sa un bot della mappa. */
export interface BotWorld {
  width: number;
  height: number;
  /**
   * Se per andare da (fx, fy) a (tx, ty) bisogna passare da una porta (es. piramide grande),
   * restituisce il punto verso cui andare prima; altrimenti null.
   */
  routeVia?(fx: number, fy: number, tx: number, ty: number): { x: number; y: number } | null;
}

/**
 * Il "cervello" di un bot (sezione 11 di GAME_DESIGN.md), in ordine di priorità:
 * 1. tempesta → verso il centro          (arriverà con la tempesta, Passo 5)
 * 2. vita sotto il 30% → scappa           (i cespugli arriveranno nel Passo 6)
 * 3. nemico a tiro → attacca con un piccolo errore di mira
 * 4. super carica e buon bersaglio → usala
 * 5. altrimenti → bauli/gioielli, poi esplora (i bauli arriveranno nel Passo 5)
 */
export class BotBrain {
  private mode: Mode = 'esplora';
  private thinkTimer = 0;
  private target: Damageable | null = null;
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

    const range = bot.stats.weapon.range;
    this.wanted.set(0, 0);

    if (this.mode === 'scappa' && this.target) {
      // allontanati dal nemico
      this.wanted.set(bot.x - this.target.x, bot.y - this.target.y).normalize();
    } else if (this.mode === 'combatti' && this.target) {
      const t = this.target;
      const dist = Phaser.Math.Distance.Between(bot.x, bot.y, t.x, t.y);
      const toTarget = new Phaser.Math.Vector2(t.x - bot.x, t.y - bot.y).normalize();
      // avvicinati fin dentro la portata, poi gira attorno al nemico
      this.strafeTimer -= dt;
      if (this.strafeTimer <= 0) {
        this.strafeTimer = Phaser.Math.FloatBetween(0.6, 1.4);
        this.strafeSign = Math.random() < 0.5 ? -1 : 1;
      }
      if (dist > range * 0.7) this.headTo(t.x, t.y);
      else this.wanted.set(-toTarget.y * this.strafeSign, toTarget.x * this.strafeSign).add(toTarget.clone().scale(0.2)).normalize();

      // 4) super carica e bersaglio a portata → usala
      this.attackWait -= dt;
      if (this.attackWait <= 0 && bot.canUseSuper() && dist < bot.stats.super.range * 0.85) {
        const error = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-this.level.aimErrorDeg, this.level.aimErrorDeg) * 0.5);
        bot.tryUseSuper(Phaser.Math.Angle.Between(bot.x, bot.y, t.x, t.y) + error);
        this.attackWait = this.randomPause();
      }
      // 3) attacca quando è a tiro, dopo un piccolo "tempo di reazione"
      if (dist - t.hitRadius < range * 0.95 && this.attackWait <= 0 && bot.canAttack()) {
        const error = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-this.level.aimErrorDeg, this.level.aimErrorDeg));
        bot.tryAttack(Phaser.Math.Angle.Between(bot.x, bot.y, t.x, t.y) + error);
        this.attackWait = this.randomPause();
      }
    } else {
      // esplora: cammina verso un punto a caso della mappa
      if (Phaser.Math.Distance.Between(bot.x, bot.y, this.wander.x, this.wander.y) < 60) this.pickWanderPoint();
      this.headTo(this.wander.x, this.wander.y);
    }

    return this.avoidGettingStuck(dt);
  }

  /** Cammina verso (x, y), passando dalla porta se serve. */
  private headTo(x: number, y: number): void {
    const via = this.world.routeVia?.(this.bot.x, this.bot.y, x, y);
    const p = via ?? { x, y };
    this.wanted.set(p.x - this.bot.x, p.y - this.bot.y).normalize();
  }

  private think(): void {
    const bot = this.bot;
    const lifeFrac = bot.health / bot.stats.maxHealth;
    const enemy = this.combat.nearestEnemy(bot.x, bot.y, bot.team, this.level.sightRange, bot.hideout);

    if (this.mode === 'scappa' && lifeFrac < BOT_RECOVER_HEALTH && enemy) {
      this.target = enemy; // continua a scappare finché non si è ripreso
      return;
    }
    if (lifeFrac < BOT_FLEE_HEALTH && enemy) {
      this.mode = 'scappa';
      this.target = enemy;
      return;
    }
    if (enemy) {
      if (this.mode !== 'combatti' || this.target !== enemy) this.attackWait = Math.max(this.attackWait, this.randomPause());
      this.mode = 'combatti';
      this.target = enemy;
      return;
    }
    this.mode = 'esplora';
    this.target = null;
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

  private pickWanderPoint(): void {
    const m = 200;
    this.wander.set(Phaser.Math.Between(m, this.world.width - m), Phaser.Math.Between(m, this.world.height - m));
  }

  private randomPause(): number {
    const [a, b] = this.level.attackPause;
    return Phaser.Math.FloatBetween(a, b);
  }
}
