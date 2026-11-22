import type { DataConnection, Peer } from 'peerjs';
import { NET } from '../data/net';
import { isNetMessage, type FriendsMode, type Member, type NetMessage, type SetupMsg } from './protocol';

/**
 * Una stanza del multiplayer con gli amici.
 * - Il **capo stanza** (posto 0) si registra sul servizio di PeerJS con il codice della stanza e aspetta gli amici;
 *   ogni amico è collegato solo a lui, e lui gira a tutti quello che serve (a "stella").
 * - Chi **entra** si collega al capo stanza con il codice.
 * PeerJS si carica solo qui (quando si apre "Amici"), così il resto del gioco non ne ha bisogno.
 */

/** Perché non si è riusciti a creare/entrare in una stanza, o perché la stanza si è chiusa. */
export type NetProblem = 'internet' | 'non-trovata' | 'piena' | 'versione' | 'iniziata' | 'tempo' | 'browser' | 'capo-uscito';

/** Frase semplice da mostrare al giocatore per ogni problema. */
export const PROBLEM_TEXT: Record<NetProblem, string> = {
  internet: 'Non riesco a collegarmi.\nControlla che ci sia internet!',
  'non-trovata': 'Stanza non trovata.\nControlla il codice!',
  piena: 'La stanza è piena!',
  versione: 'Avete versioni diverse del gioco.\nChiudetelo e riapritelo tutti e due!',
  iniziata: 'La partita è già cominciata.\nAspetta la prossima!',
  tempo: 'Il collegamento ci mette troppo.\nRiprova tra un attimo!',
  browser: 'Questo telefono non riesce\na giocare con gli amici.',
  'capo-uscito': 'Il capo stanza è uscito.',
};

/** Chi sono io (quello che si manda agli altri). */
export interface Me {
  name: string;
  characterId: string;
  level: number;
}

type Events = {
  /** è arrivato un messaggio (`seat` = da chi; per chi non è capo stanza è sempre 0) */
  msg: (msg: NetMessage, seat: number) => void;
  /** la lista dei giocatori è cambiata */
  members: (members: Member[]) => void;
  /** qualcuno è uscito */
  left: (member: Member) => void;
  /** la stanza si è chiusa (per me) */
  closed: (why: NetProblem | null) => void;
};

type AnyListener = (...args: unknown[]) => void;

/** Avvisi della stanza: `on` restituisce la funzione per smettere di ascoltare. */
class Emitter {
  private readonly map = new Map<keyof Events, Set<AnyListener>>();
  on<K extends keyof Events>(ev: K, fn: Events[K]): () => void {
    let set = this.map.get(ev);
    if (!set) this.map.set(ev, (set = new Set()));
    const listeners = set;
    listeners.add(fn as unknown as AnyListener);
    return () => listeners.delete(fn as unknown as AnyListener);
  }
  emit<K extends keyof Events>(ev: K, ...args: Parameters<Events[K]>): void {
    for (const fn of [...(this.map.get(ev) ?? [])]) fn(...args);
  }
}

let current: NetSession | null = null;

/** La stanza in cui si è adesso (null = nessuna). */
export function getSession(): NetSession | null {
  return current;
}

async function loadPeer(): Promise<typeof Peer> {
  const mod = await import('peerjs');
  return mod.Peer;
}

function randomCode(): string {
  let s = '';
  for (let i = 0; i < NET.codeDigits; i++) s += Math.floor(Math.random() * 10);
  return s;
}

/** Aspetta che il Peer sia registrato sul servizio di PeerJS (o fallisca). */
function waitOpen(peer: Peer): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('tempo')), NET.connectTimeoutSeconds * 1000);
    peer.once('open', () => {
      clearTimeout(timer);
      resolve();
    });
    peer.once('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

function problemFrom(e: unknown): NetProblem {
  const type = (e as { type?: string })?.type ?? (e as Error)?.message;
  if (type === 'peer-unavailable') return 'non-trovata';
  if (type === 'browser-incompatible') return 'browser';
  if (type === 'tempo') return 'tempo';
  return 'internet';
}

export class NetSession {
  readonly events = new Emitter();
  members: Member[] = [];
  /** la partita è partita (il capo stanza non fa più entrare nessuno) */
  started = false;
  /** cosa si gioca (lo sceglie il capo stanza) e, nel Duo, chi sta in squadra con chi */
  choice: { mode: FriendsMode; teams: number[][] } = { mode: 'allenamento', teams: [] };
  /** capo stanza: chi è nella stanza pronto a partire (non sta guardando i risultati) */
  readonly ready = new Set<number>();
  /** l'ultima battaglia preparata dal capo stanza (chi entra può arrivarci dopo che è stata mandata) */
  lastSetup: SetupMsg | null = null;
  private closedFlag = false;
  /** capo stanza: collegamento con ogni amico (posto → collegamento) */
  private readonly guests = new Map<number, DataConnection>();
  /** chi entra: il collegamento con il capo stanza */
  private hostConn: DataConnection | null = null;
  /** ultima volta (ms) in cui si è sentito qualcuno (posto → tempo) */
  private readonly lastHeard = new Map<number, number>();
  private readonly pingTimer: ReturnType<typeof setInterval>;

  private constructor(
    private readonly peer: Peer,
    readonly isHost: boolean,
    readonly code: string,
    public mySeat: number,
  ) {
    this.pingTimer = setInterval(() => this.keepAlive(), 2000);
    // se l'app va in secondo piano a lungo il collegamento cade: il controllo dei silenzi se ne accorge
    window.addEventListener('pagehide', this.onPageHide);
  }

  // ------------------------------------------------------------------ creare / entrare

  /** Crea una stanza nuova: si diventa capo stanza (posto 0). */
  static async host(me: Me): Promise<NetSession> {
    current?.close();
    const PeerCtor = await loadPeer().catch(() => {
      throw 'internet' as NetProblem;
    });
    for (let attempt = 0; attempt < NET.codeAttempts; attempt++) {
      const code = randomCode();
      const peer = new PeerCtor(NET.peerPrefix + code, { debug: 0 });
      try {
        await waitOpen(peer);
      } catch (e) {
        peer.destroy();
        // codice già usato da un'altra stanza: se ne prova un altro
        if ((e as { type?: string }).type === 'unavailable-id') continue;
        throw problemFrom(e);
      }
      const s = new NetSession(peer, true, code, 0);
      s.members = [{ seat: 0, ...me }];
      s.listenAsHost();
      current = s;
      return s;
    }
    throw 'internet' as NetProblem;
  }

  /** Entra nella stanza con questo codice. */
  static async join(code: string, me: Me): Promise<NetSession> {
    current?.close();
    const PeerCtor = await loadPeer().catch(() => {
      throw 'internet' as NetProblem;
    });
    const peer = new PeerCtor({ debug: 0 });
    try {
      await waitOpen(peer);
    } catch (e) {
      peer.destroy();
      throw problemFrom(e);
    }
    return new Promise<NetSession>((resolve, reject) => {
      let done = false;
      const fail = (p: NetProblem) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        peer.destroy();
        reject(p);
      };
      const timer = setTimeout(() => fail('tempo'), NET.connectTimeoutSeconds * 1000);
      peer.on('error', (e) => fail(problemFrom(e)));
      const conn = peer.connect(NET.peerPrefix + code, { serialization: 'json', reliable: true });
      conn.on('open', () => {
        conn.send({ t: 'ciao', protocol: NET.protocol, ...me } satisfies NetMessage);
      });
      conn.on('data', (data) => {
        if (done || !isNetMessage(data)) return;
        if (data.t === 'no') fail(data.reason);
        else if (data.t === 'benvenuto') {
          done = true;
          clearTimeout(timer);
          const s = new NetSession(peer, false, code, data.seat);
          s.members = data.members;
          s.hostConn = conn;
          s.listenAsGuest(conn);
          current = s;
          resolve(s);
        }
      });
      conn.on('close', () => fail('non-trovata'));
    });
  }

  // ------------------------------------------------------------------ capo stanza

  private listenAsHost(): void {
    this.peer.on('connection', (conn) => {
      let seat = -1;
      conn.on('data', (data) => {
        if (!isNetMessage(data)) return;
        if (seat < 0) {
          if (data.t === 'ciao') seat = this.admit(conn, data.protocol, { name: data.name, characterId: data.characterId, level: data.level });
          return;
        }
        this.lastHeard.set(seat, performance.now());
        if (data.t === 'esco') {
          this.dropGuest(seat);
          return;
        }
        if (data.t === 'pronto') {
          if (data.ready) this.ready.add(seat);
          else this.ready.delete(seat);
          this.events.emit('members', this.members);
          return;
        }
        // nessuno può parlare a nome di un altro
        if (data.t === 'mossa') data.m[0] = seat;
        if (data.t === 'colpo') data.seat = seat;
        this.events.emit('msg', data, seat);
      });
      conn.on('close', () => {
        if (seat >= 0) this.dropGuest(seat);
      });
      conn.on('error', () => {
        if (seat >= 0) this.dropGuest(seat);
      });
    });
    // se si perde il contatto con il servizio di PeerJS, i collegamenti con gli amici restano; ci si riprova
    this.peer.on('disconnected', () => {
      if (!this.closedFlag) setTimeout(() => !this.closedFlag && this.peer.reconnect(), 1500);
    });
  }

  /** Fa entrare un amico (se si può). Restituisce il suo posto, oppure -1. */
  private admit(conn: DataConnection, protocol: number, me: Me): number {
    const refuse = (reason: 'piena' | 'versione' | 'iniziata') => {
      conn.send({ t: 'no', reason } satisfies NetMessage);
      setTimeout(() => conn.close(), 800);
      return -1;
    };
    if (protocol !== NET.protocol) return refuse('versione');
    if (this.started) return refuse('iniziata');
    if (this.members.length >= NET.maxPlayers) return refuse('piena');
    let seat = 1;
    while (this.members.some((m) => m.seat === seat)) seat++;
    // due amici con lo stesso dio: il secondo ha un numerino accanto al nome
    const same = this.members.filter((m) => m.characterId === me.characterId).length;
    const member: Member = { seat, ...me, name: same ? `${me.name} ${same + 1}` : me.name };
    this.members.push(member);
    this.members.sort((a, b) => a.seat - b.seat);
    this.guests.set(seat, conn);
    this.ready.add(seat);
    this.lastHeard.set(seat, performance.now());
    conn.send({ t: 'benvenuto', seat, members: this.members } satisfies NetMessage);
    conn.send({ t: 'scelta', ...this.choice } satisfies NetMessage);
    this.broadcast({ t: 'giocatori', members: this.members }, seat);
    this.events.emit('members', this.members);
    return seat;
  }

  private dropGuest(seat: number): void {
    const conn = this.guests.get(seat);
    if (!conn) return;
    this.guests.delete(seat);
    this.ready.delete(seat);
    this.lastHeard.delete(seat);
    conn.close();
    const member = this.members.find((m) => m.seat === seat);
    this.members = this.members.filter((m) => m.seat !== seat);
    this.broadcast({ t: 'giocatori', members: this.members });
    this.events.emit('members', this.members);
    if (member) this.events.emit('left', member);
  }

  /** Capo stanza: sceglie cosa giocare (e le squadre del Duo) e lo dice a tutti. */
  setChoice(mode: FriendsMode, teams: number[][]): void {
    if (!this.isHost) return;
    this.choice = { mode, teams };
    this.broadcast({ t: 'scelta', mode, teams });
  }

  /** Capo stanza: tutti gli amici sono nella stanza, pronti a partire? */
  allReady(): boolean {
    return this.members.every((m) => m.seat === 0 || this.ready.has(m.seat));
  }

  /** Capo stanza: si parte con la scelta attuale, nessun altro può entrare. */
  start(): void {
    if (!this.isHost) return;
    this.started = true;
    this.lastSetup = null;
    this.ready.clear();
    this.broadcast({ t: 'via', ...this.choice, members: this.members });
  }

  /** Capo stanza: si è tornati nella stanza, possono entrare altri amici. */
  reopen(): void {
    this.started = false;
  }

  /** Chi entra: dice al capo stanza se è nella stanza pronto a partire. */
  setReady(ready: boolean): void {
    if (!this.isHost) this.send({ t: 'pronto', ready });
  }

  // ------------------------------------------------------------------ chi entra

  private listenAsGuest(conn: DataConnection): void {
    this.lastHeard.set(0, performance.now());
    conn.on('data', (data) => {
      if (!isNetMessage(data)) return;
      this.lastHeard.set(0, performance.now());
      if (data.t === 'giocatori') {
        const gone = this.members.filter((m) => !data.members.some((n) => n.seat === m.seat));
        this.members = data.members;
        this.events.emit('members', this.members);
        for (const m of gone) this.events.emit('left', m);
        return;
      }
      if (data.t === 'via') {
        this.started = true;
        this.lastSetup = null;
        this.members = data.members;
        this.choice = { mode: data.mode, teams: data.teams };
      }
      if (data.t === 'scelta') this.choice = { mode: data.mode, teams: data.teams };
      if (data.t === 'partita') this.lastSetup = data;
      if (data.t === 'esco') {
        this.shutdown('capo-uscito');
        return;
      }
      this.events.emit('msg', data, 0);
    });
    conn.on('close', () => this.shutdown('capo-uscito'));
    conn.on('error', () => this.shutdown('capo-uscito'));
  }

  // ------------------------------------------------------------------ per tutti

  /** Chi entra: manda al capo stanza. Capo stanza: manda a tutti gli amici. */
  send(msg: NetMessage): void {
    if (this.closedFlag) return;
    if (this.isHost) this.broadcast(msg);
    else if (this.hostConn?.open) this.hostConn.send(msg);
  }

  /** Capo stanza: gira a tutti gli altri un messaggio arrivato dal posto `from`. */
  relay(msg: NetMessage, from: number): void {
    if (this.isHost && !this.closedFlag) this.broadcast(msg, from);
  }

  /** Capo stanza: manda a tutti (tranne, se indicato, il posto `except`). */
  private broadcast(msg: NetMessage, except = -1): void {
    for (const [seat, conn] of this.guests) if (seat !== except && conn.open) conn.send(msg);
  }

  /** Il mio posto nella lista. */
  me(): Member | undefined {
    return this.members.find((m) => m.seat === this.mySeat);
  }

  /** Esce dalla stanza (avvisa gli altri). */
  close(): void {
    if (this.closedFlag) return;
    this.send({ t: 'esco' });
    // un attimo perché il messaggio parta, poi si chiude tutto
    setTimeout(() => this.peer.destroy(), 300);
    this.shutdown(null, false);
  }

  get closed(): boolean {
    return this.closedFlag;
  }

  private shutdown(why: NetProblem | null, destroyNow = true): void {
    if (this.closedFlag) return;
    this.closedFlag = true;
    clearInterval(this.pingTimer);
    window.removeEventListener('pagehide', this.onPageHide);
    if (destroyNow) this.peer.destroy();
    if (current === this) current = null;
    this.events.emit('closed', why);
  }

  private readonly onPageHide = (): void => this.close();

  /** Ogni 2 secondi: "ci sono ancora", e chi tace da troppo si considera uscito. */
  private keepAlive(): void {
    if (this.closedFlag) return;
    this.send({ t: 'eco' });
    const now = performance.now();
    for (const [seat, t] of this.lastHeard) {
      if (now - t < NET.silenceSeconds * 1000) continue;
      if (this.isHost) this.dropGuest(seat);
      else this.shutdown('capo-uscito');
    }
  }
}
