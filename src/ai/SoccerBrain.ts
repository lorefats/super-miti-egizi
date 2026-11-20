import Phaser from 'phaser';
import type { BotLevel } from '../data/bots';
import { SOCCER } from '../data/soccer';
import type { Brain } from '../entities/Bot';
import type { Combat } from '../entities/Combat';
import type { Player } from '../entities/Player';
import type { SoccerBall } from '../entities/SoccerBall';

/** Cosa sa un bot del campo di calcio. */
export interface SoccerWorld {
  ball: SoccerBall;
  /** Centro della porta in cui segnare / da difendere, per la squadra `team`. */
  attackGoal(team: number): { x: number; y: number };
  ownGoal(team: number): { x: number; y: number };
  /** Altezza dell'apertura della porta (per mirare un po' di lato). */
  goalMouth: number;
  /** Tutti i giocatori in campo. */
  players(): Player[];
  /** Se per andare da (fx, fy) a (tx, ty) bisogna attraversare il fiume: il punto del ponte verso cui andare. */
  bridgeVia(fx: number, fy: number, tx: number, ty: number): { x: number; y: number } | null;
  /** La partita è ferma (dopo un gol)? */
  paused(): boolean;
}

type Role = 'palla' | 'difesa' | 'appoggio';

/**
 * Il "cervello" di un bot nel Calcio del Nilo:
 * - con la palla → corre verso la porta, tira quando è vicino, passa se un nemico lo pressa;
 * - palla libera → il compagno più vicino la insegue, uno resta in difesa, uno si smarca avanti;
 * - palla ai nemici → il più vicino attacca chi la porta, uno si mette davanti alla porta;
 * - intanto colpisce i nemici a tiro e usa la super quando è carica.
 */
export class SoccerBrain implements Brain {
  private thinkTimer = 0;
  private role: Role = 'appoggio';
  private readonly goal = new Phaser.Math.Vector2();
  private readonly wanted = new Phaser.Math.Vector2();
  private readonly out = new Phaser.Math.Vector2();
  private attackWait = 0;
  private holdTime = 0;
  /** di quanto si sposta in alto o in basso quando si smarca (ognuno il suo) */
  private readonly laneY = Phaser.Math.Between(-280, 280);
  private readonly lastPos = new Phaser.Math.Vector2();
  private stuckCheck = 0;
  private detourTimer = 0;
  private readonly detour = new Phaser.Math.Vector2();

  constructor(
    private readonly bot: Player,
    private readonly combat: Combat,
    private readonly level: BotLevel,
    private readonly world: SoccerWorld,
  ) {
    this.thinkTimer = Math.random() * level.thinkSeconds;
    this.attackWait = this.randomPause();
    this.lastPos.set(bot.x, bot.y);
  }

  update(dt: number): Phaser.Math.Vector2 {
    const bot = this.bot;
    if (this.world.paused()) return this.out.set(0, 0);
    this.attackWait -= dt;
    this.thinkTimer -= dt;
    if (this.thinkTimer <= 0) {
      this.thinkTimer = this.level.thinkSeconds;
      this.think();
    }
    const ball = this.world.ball;
    if (ball.holder === bot) {
      this.holdTime += dt;
      this.withBall();
    } else {
      this.holdTime = 0;
      // la palla libera la si insegue sempre (non solo quando si "pensa")
      if (this.role === 'palla' && !ball.holder) this.goal.set(ball.x, ball.y);
      this.headTo(this.goal.x, this.goal.y, 30);
      this.fightNearby();
    }
    return this.avoidGettingStuck(dt);
  }

  /** Decide il ruolo e il punto dove andare. */
  private think(): void {
    const bot = this.bot;
    const ball = this.world.ball;
    const mates = this.world.players().filter((p) => p.team === bot.team && p.isAlive());
    const own = this.world.ownGoal(bot.team);
    const att = this.world.attackGoal(bot.team);
    const dist = (p: { x: number; y: number }, q: { x: number; y: number }) => Phaser.Math.Distance.Between(p.x, p.y, q.x, q.y);
    // il compagno più vicino alla palla (il giocatore vero conta solo se è proprio lì)
    const chaser = mates
      .filter((m) => !m.isHuman || dist(m, ball) < 160)
      .sort((a, b) => dist(a, ball) - dist(b, ball))[0];
    // il difensore: tra gli altri, quello più vicino alla propria porta
    const defender = mates
      .filter((m) => m !== chaser && !m.isHuman)
      .sort((a, b) => dist(a, own) - dist(b, own))[0];

    const holder = ball.holder;
    if (holder && holder.team !== bot.team) {
      // palla ai nemici: il più vicino va a prendersela, il difensore si mette davanti alla porta
      if (bot === defender) this.guardGoal(own, holder);
      else {
        this.role = 'palla';
        this.goal.set(holder.x, holder.y);
      }
      return;
    }
    if (holder && holder.team === bot.team) {
      // palla a un compagno: uno resta indietro, gli altri si smarcano verso la porta avversaria
      if (bot === defender && mates.length > 2) this.guardGoal(own, ball);
      else {
        this.role = 'appoggio';
        const ahead = Math.sign(att.x - own.x) * 380;
        const x = Phaser.Math.Clamp(holder.x + ahead, Math.min(own.x, att.x) + 150, Math.max(own.x, att.x) - 150);
        this.goal.set(x, att.y + this.laneY);
      }
      return;
    }
    // palla libera
    if (bot === chaser) {
      this.role = 'palla';
      this.goal.set(ball.x, ball.y);
    } else if (bot === defender) {
      this.guardGoal(own, ball);
    } else {
      this.role = 'appoggio';
      this.goal.set(Phaser.Math.Linear(ball.x, att.x, 0.35), Phaser.Math.Clamp(ball.y + this.laneY, 150, own.y * 2 - 150));
    }
  }

  /** Si mette tra la palla e la propria porta, più vicino alla porta. */
  private guardGoal(own: { x: number; y: number }, from: { x: number; y: number }): void {
    this.role = 'difesa';
    this.goal.set(Phaser.Math.Linear(own.x, from.x, 0.3), Phaser.Math.Linear(own.y, from.y, 0.3));
  }

  /** Con la palla: verso la porta, tira da vicino, passa se pressato. */
  private withBall(): void {
    const bot = this.bot;
    const ball = this.world.ball;
    const att = this.world.attackGoal(bot.team);
    const d = Phaser.Math.Distance.Between(bot.x, bot.y, att.x, att.y);
    const error = () => Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-this.level.aimErrorDeg, this.level.aimErrorDeg) * 0.5);
    // un attimo di "tempo di reazione" prima di calciare
    const ready = this.holdTime > this.level.attackPause[0] * 0.6;
    if (ready && d < SOCCER.botShootRange && !this.combat.lineBlocked(bot.x, bot.y, att.x, att.y)) {
      const aimY = att.y + Phaser.Math.FloatBetween(-0.3, 0.3) * this.world.goalMouth;
      ball.kick(Phaser.Math.Angle.Between(bot.x, bot.y, att.x, aimY) + error(), SOCCER.ball.shotSpeed);
      return;
    }
    // pressato da un nemico: passa a un compagno più avanti e libero
    const enemyClose = this.world
      .players()
      .some((p) => p.team !== bot.team && p.isAlive() && Phaser.Math.Distance.Between(p.x, p.y, bot.x, bot.y) < SOCCER.botPassPressure);
    if (ready && enemyClose) {
      const mate = this.world
        .players()
        .filter((p) => p !== bot && p.team === bot.team && p.isAlive())
        .filter((p) => Phaser.Math.Distance.Between(p.x, p.y, att.x, att.y) < d - 120)
        .filter((p) => !this.combat.lineBlocked(bot.x, bot.y, p.x, p.y))
        .sort((a, b) => Phaser.Math.Distance.Between(a.x, a.y, bot.x, bot.y) - Phaser.Math.Distance.Between(b.x, b.y, bot.x, bot.y))[0];
      if (mate) {
        ball.kick(Phaser.Math.Angle.Between(bot.x, bot.y, mate.x, mate.y) + error(), SOCCER.ball.passSpeed);
        return;
      }
    }
    this.headTo(att.x, att.y, 0);
  }

  /** Colpisce i nemici a tiro (e usa la super quando è carica). */
  private fightNearby(): void {
    const bot = this.bot;
    if (this.attackWait > 0) return;
    const t = this.combat.nearestEnemy(bot.x, bot.y, bot.team, Math.max(bot.stats.weapon.range, bot.stats.super.range), bot.hideout, ['personaggio'], bot.seesAll());
    if (!t || this.combat.lineBlocked(bot.x, bot.y, t.x, t.y)) return;
    const dist = Phaser.Math.Distance.Between(bot.x, bot.y, t.x, t.y);
    const angle = Phaser.Math.Angle.Between(bot.x, bot.y, t.x, t.y);
    const error = () => Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-this.level.aimErrorDeg, this.level.aimErrorDeg));
    if (bot.canUseSuper() && dist < bot.stats.super.range * 0.85) {
      bot.tryUseSuper(angle + error() * 0.5, dist);
      this.attackWait = this.randomPause();
    } else if (dist - t.hitRadius < bot.stats.weapon.range * 0.95 && bot.canAttack()) {
      bot.tryAttack(angle + error(), dist);
      this.attackWait = this.randomPause();
    }
  }

  /** Cammina verso (x, y), passando dal ponte se c'è il fiume in mezzo. */
  private headTo(x: number, y: number, stopAt: number): void {
    const bot = this.bot;
    if (Phaser.Math.Distance.Between(bot.x, bot.y, x, y) <= stopAt) {
      this.wanted.set(0, 0);
      return;
    }
    const via = this.world.bridgeVia(bot.x, bot.y, x, y) ?? { x, y };
    this.wanted.set(via.x - bot.x, via.y - bot.y).normalize();
  }

  /** Se cammina ma non si sposta (muro davanti), aggira l'ostacolo per un attimo. */
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
        this.detourTimer = Phaser.Math.FloatBetween(0.4, 0.7);
        return this.out.copy(this.detour);
      }
    }
    return this.out.copy(this.wanted);
  }

  private randomPause(): number {
    const [a, b] = this.level.attackPause;
    return Phaser.Math.FloatBetween(a, b);
  }
}
