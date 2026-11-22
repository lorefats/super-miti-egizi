import Phaser from 'phaser';
import { NET } from '../data/net';
import { DEFEATED_EVENT, type Player } from '../entities/Player';
import type { Member, MotionTuple, NetEffect, NetMessage } from './protocol';
import { RemoteMotion } from './RemoteMotion';
import type { NetSession } from './Session';

export interface NetFightersOptions {
  session: NetSession;
  /** il personaggio comandato da questo telefono (il suo numero è il mio posto nella stanza) */
  me: Player;
  /** tutti gli altri personaggi da tenere uguali: numero → personaggio (0-3 amici, da 10 in su bot) */
  others: Map<number, Player>;
  /** numeri degli altri personaggi comandati da questo telefono (i bot, sul telefono del capo stanza) */
  local?: number[];
  /** quando un amico esce: true (di solito) = il suo personaggio sparisce; false = resta, ci pensa la partita */
  removeOnLeave?: boolean;
  /** capo stanza: dove riappare chi viene sconfitto (se manca, non si riappare) */
  respawnSpot?(seat: number): { x: number; y: number };
  respawnSeconds?: number;
  /** qualcuno è riapparso (anche io) */
  onRespawn?(p: Player, seat: number): void;
  /** un amico è uscito dalla stanza (il suo personaggio è già stato tolto) */
  onLeft?(m: Member): void;
}

/**
 * I personaggi di tutti i giocatori della stanza, tenuti uguali su tutti i telefoni (GAME_DESIGN.md, sezione 13):
 * - ogni telefono muove il proprio dio e manda dove si trova; gli altri lo mostrano in modo morbido;
 * - quando qualcuno inizia un colpo, tutti i telefoni lo rifanno uguale (così si vedono proiettili e super);
 * - danni, effetti, sconfitte e ricomparse li decide il capo stanza e li racconta agli altri.
 * Non conosce i singoli personaggi: usa solo i metodi di Player.
 */
export class NetFighters {
  /** numero → personaggio (compreso il mio) */
  readonly players = new Map<number, Player>();
  /** personaggi comandati da questo telefono (io, e i bot se sono il capo stanza) */
  private readonly localIds: Set<number>;
  private readonly motions = new Map<number, RemoteMotion>();
  /** ultima posizione arrivata da ogni amico (il capo stanza la gira agli altri) */
  private readonly last = new Map<number, MotionTuple>();
  private effects: [number, NetEffect][] = [];
  private readonly flows = new Map<number, NetEffect>();
  private sendTimer = 0;
  private readonly off: (() => void)[] = [];
  private readonly s: NetSession;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly opt: NetFightersOptions,
  ) {
    const s = (this.s = opt.session);
    this.localIds = new Set([s.mySeat, ...(opt.local ?? [])]);
    this.players.set(s.mySeat, opt.me);
    for (const [id, p] of opt.others) {
      this.players.set(id, p);
      if (!this.localIds.has(id)) this.motions.set(id, new RemoteMotion());
    }
    for (const [id, p] of this.players) this.wire(id, p);
    this.off.push(
      s.events.on('msg', (msg, from) => this.onMessage(msg, from)),
      s.events.on('left', (m) => this.removeSeat(m)),
    );
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private get mySeat(): number {
    return this.s.mySeat;
  }

  /** Collega un personaggio alla stanza: chi decide gli effetti e chi racconta i colpi. */
  private wire(seat: number, p: Player): void {
    const host = this.s.isHost;
    p.net = {
      authority: host,
      onEffect: host ? (e) => this.queueEffect(seat, e) : undefined,
      onSwing: this.localIds.has(seat) ? (a, d, sup) => this.sendSwing(seat, a, d, sup) : undefined,
    };
    if (host && this.opt.respawnSpot) {
      p.on(DEFEATED_EVENT, () => {
        this.scene.time.delayedCall((this.opt.respawnSeconds ?? NET.trainingRespawnSeconds) * 1000, () => this.hostRespawn(seat));
      });
    }
  }

  // ------------------------------------------------------------------ messaggi in arrivo

  private onMessage(msg: NetMessage, from: number): void {
    const host = this.s.isHost;
    switch (msg.t) {
      case 'mossa':
        if (host) this.onMotion(msg.m);
        break;
      case 'mosse':
        if (!host) for (const m of msg.all) this.onMotion(m);
        break;
      case 'colpo':
        if (!this.localIds.has(msg.seat)) this.players.get(msg.seat)?.netSwing(msg.a, msg.d, msg.s);
        if (host) this.s.relay(msg, from);
        break;
      case 'effetti':
        if (!host) for (const [seat, e] of msg.list) this.players.get(seat)?.applyNetEffect(e);
        break;
      case 'riappare':
        if (!host) this.respawnAt(msg.seat, msg.x, msg.y);
        break;
    }
  }

  private onMotion(m: MotionTuple): void {
    const [seat] = m;
    const p = this.players.get(seat);
    if (!p) return;
    // vita e super le manda solo il capo stanza
    if (!this.s.isHost && m[5] !== undefined) p.netSync(m[5], (m[6] ?? 0) / 100);
    if (this.localIds.has(seat)) return;
    this.last.set(seat, m);
    this.motions.get(seat)?.push(m[1], m[2], m[3], m[4]);
  }

  private removeSeat(m: Member): void {
    const p = this.players.get(m.seat);
    if (!p || m.seat === this.mySeat) return;
    this.motions.get(m.seat)?.clear();
    if (this.opt.removeOnLeave === false) {
      this.opt.onLeft?.(m);
      return;
    }
    this.players.delete(m.seat);
    this.motions.delete(m.seat);
    this.last.delete(m.seat);
    p.destroy();
    this.opt.onLeft?.(m);
  }

  // ------------------------------------------------------------------ colpi, effetti, ricomparse

  private sendSwing(id: number, a: number, d: number, sup: boolean): void {
    this.s.send({ t: 'colpo', seat: id, a: Math.round(a * 1000) / 1000, d: Math.round(d), s: sup });
  }

  /** Capo stanza: un effetto da mandare agli altri al prossimo invio (la corrente: solo l'ultima). */
  private queueEffect(seat: number, e: NetEffect): void {
    if (e[0] === 'corrente') {
      this.flows.set(seat, e);
      return;
    }
    // cambi di velocità e di ritmo ripetuti a ogni fotogramma (es. chi porta la palla): basta l'ultimo
    if (e[0] === 'velocita' || e[0] === 'ritmo') {
      const i = this.effects.findIndex(([s2, e2]) => s2 === seat && e2[0] === e[0] && e2[1] === e[1]);
      if (i >= 0) {
        this.effects[i] = [seat, e];
        return;
      }
    }
    this.effects.push([seat, e]);
  }

  /** Sposta subito un personaggio in (x, y) (calcio d'inizio): dimentica le posizioni vecchie arrivate dalla rete. */
  placeAt(id: number, x: number, y: number): void {
    const p = this.players.get(id);
    if (!p) return;
    this.motions.get(id)?.clear();
    this.last.delete(id);
    if (!p.isAlive()) {
      p.respawn(x, y);
      return;
    }
    p.body.reset(x, y);
    p.setPosition(x, y);
  }

  /** Capo stanza: fa riapparire un giocatore sconfitto e lo dice a tutti. */
  private hostRespawn(seat: number): void {
    const p = this.players.get(seat);
    if (!p || p.isAlive() || this.s.closed || !this.opt.respawnSpot) return;
    const spot = this.opt.respawnSpot(seat);
    this.s.send({ t: 'riappare', seat, x: Math.round(spot.x), y: Math.round(spot.y) });
    this.respawnAt(seat, spot.x, spot.y);
  }

  private respawnAt(seat: number, x: number, y: number): void {
    const p = this.players.get(seat);
    if (!p) return;
    this.motions.get(seat)?.clear();
    this.last.delete(seat);
    p.respawn(x, y);
    this.opt.onRespawn?.(p, seat);
  }

  // ------------------------------------------------------------------ ogni fotogramma

  update(dt: number): void {
    if (this.s.closed) return;
    const now = performance.now();
    for (const [seat, motion] of this.motions) {
      const p = this.players.get(seat);
      const at = motion.sample(now);
      if (p && at) p.driveFromNetwork(at.x, at.y, at.vx, at.vy);
    }
    this.sendTimer -= dt;
    if (this.sendTimer > 0) return;
    this.sendTimer = 1 / NET.sendRate;

    const me = this.opt.me;
    const v = me.body.velocity;
    const mine: MotionTuple = [this.mySeat, Math.round(me.x), Math.round(me.y), Math.round(v.x), Math.round(v.y)];
    if (!this.s.isHost) {
      this.s.send({ t: 'mossa', m: mine });
      return;
    }
    // capo stanza: prima gli effetti, poi dove sono tutti con vita e super
    if (this.effects.length || this.flows.size) {
      const list = [...this.effects, ...[...this.flows].map(([seat, e]) => [seat, e] as [number, NetEffect])];
      this.effects = [];
      this.flows.clear();
      this.s.send({ t: 'effetti', list });
    }
    const all: MotionTuple[] = [];
    for (const [id, p] of this.players) {
      let pos: MotionTuple;
      if (this.localIds.has(id)) {
        const pv = p.body?.velocity;
        pos = [id, Math.round(p.x), Math.round(p.y), Math.round(pv?.x ?? 0), Math.round(pv?.y ?? 0)];
      } else {
        pos = this.last.get(id) ?? [id, Math.round(p.x), Math.round(p.y), 0, 0];
      }
      all.push([id, pos[1], pos[2], pos[3], pos[4], Math.round(p.health), Math.round(p.superCharge * 100)]);
    }
    this.s.send({ t: 'mosse', all });
  }

  destroy(): void {
    for (const u of this.off.splice(0)) u();
    for (const p of this.players.values()) p.net = null;
  }
}
