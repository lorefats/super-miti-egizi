import Phaser from 'phaser';
import { stopMenuMusic } from '../audio/Music';
import { CAMERA_LERP, DEPTH } from '../config';
import { ROSTER, getCharacter, isPlayable } from '../data/characters';
import { MAPPA_ALLENAMENTO, TRAINING } from '../data/training';
import { NET, SEAT_VARIANTS } from '../data/net';
import { PROBLEM_TEXT, getSession, type NetSession } from '../net/Session';
import { RemoteMotion } from '../net/RemoteMotion';
import type { Member, MotionTuple } from '../net/protocol';
import { SaveManager } from '../save/SaveManager';
import { Combat } from '../entities/Combat';
import { Player } from '../entities/Player';
import { Target } from '../entities/Target';
import { addFpsMeter } from '../ui/FpsMeter';
import { createGoldButton } from '../ui/GoldButton';
import { MatchHud } from '../ui/MatchHud';
import { backButton, goTo } from '../ui/MenuKit';
import { PlayerControls } from '../ui/PlayerControls';
import { showToast } from '../ui/Toast';
import { MapView } from './MapView';

/** Un posto dove sta un bersaglio: quando viene distrutto, dopo qualche secondo ne torna uno nuovo. */
interface TargetSlot {
  x: number;
  y: number;
  target: Target | null;
  /** secondi che mancano al ritorno del bersaglio */
  wait: number;
}

/** Un amico nel multiplayer: il suo dio sulla mappa e le sue ultime posizioni arrivate. */
interface Friend {
  member: Member;
  player: Player;
  motion: RemoteMotion;
  /** l'ultima posizione arrivata (il capo stanza la gira agli altri) */
  last: MotionTuple | null;
}

/** Dove parte ogni posto della stanza, attorno al punto di partenza della mappa. */
const SEAT_OFFSETS = [
  { x: 0, y: 0 },
  { x: 140, y: 0 },
  { x: 0, y: 140 },
  { x: 140, y: 140 },
];

/**
 * Allenamento (sezione 2): mappa piccola con bersagli fermi, per provare i personaggi.
 * Niente bot, niente tempesta, niente coppe. In alto a destra si cambia dio e si carica la super al volo.
 * Con gli amici (multiplayer, passo M1): ognuno vede gli altri dèi camminare sulla stessa mappa.
 */
export class TrainingScene extends Phaser.Scene {
  private player!: Player;
  private combat!: Combat;
  private view!: MapView;
  private controls!: PlayerControls;
  private slots: TargetSlot[] = [];
  private characterId = '';
  /** la stanza degli amici (null = Allenamento da soli) */
  private net: NetSession | null = null;
  private friends = new Map<number, Friend>();
  private sendTimer = 0;
  private unsubscribe: (() => void)[] = [];

  constructor() {
    super('Training');
  }

  init(data: { characterId?: string; net?: boolean }): void {
    const s = data?.net ? getSession() : null;
    this.net = s && !s.closed ? s : null;
    const forced = new URLSearchParams(location.search).get('eroe');
    const wanted = data?.characterId ?? (forced && isPlayable(forced) ? forced : SaveManager.getSelectedCharacter());
    this.characterId = isPlayable(wanted) ? wanted : SaveManager.getSelectedCharacter();
    // con gli amici si usa il dio con cui si è entrati nella stanza
    const mine = this.net?.me();
    if (mine && isPlayable(mine.characterId)) this.characterId = mine.characterId;
  }

  create(): void {
    stopMenuMusic();
    const map = MAPPA_ALLENAMENTO;
    this.combat = new Combat();
    this.view = new MapView(this, map, this.combat);
    this.cameras.main.fadeIn(250, 20, 33, 61);

    const off = SEAT_OFFSETS[(this.net?.mySeat ?? 0) % SEAT_OFFSETS.length];
    this.player = new Player(this, map.spawn.x + off.x, map.spawn.y + off.y, {
      characterId: this.characterId,
      level: SaveManager.getLevel(this.characterId),
      team: 0,
      combat: this.combat,
      isHuman: true,
    });
    this.physics.add.collider(this.player, this.view.walls);

    this.slots = map.targets.map((t) => ({ x: t.x, y: t.y, target: null, wait: 0 }));
    for (const s of this.slots) this.placeTarget(s);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.width, map.height);
    cam.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
    cam.setRoundPixels(true);

    this.controls = new PlayerControls(this, this.player);
    const hud = new MatchHud(this);
    if (this.net) {
      hud.setTitle(`Allenamento con gli amici — stanza ${this.net.code}`);
      hud.setStorm('Andate a trovarvi!', false);
    } else {
      hud.setTitle(`Allenamento — ${getCharacter(this.characterId).name}`);
      hud.setStorm('Colpisci i bersagli!', false);
    }
    if (map.name) hud.showZone(map.name);
    this.drawButtons();
    addFpsMeter(this);
    this.friends = new Map();
    this.unsubscribe = [];
    this.sendTimer = 0;
    if (this.net) this.startNet(this.net);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const u of this.unsubscribe) u();
      this.unsubscribe = [];
    });
  }

  // ------------------------------------------------------------------ amici (multiplayer)

  private startNet(s: NetSession): void {
    for (const m of s.members) if (m.seat !== s.mySeat) this.addFriend(m);
    this.unsubscribe.push(
      s.events.on('msg', (msg) => {
        if (msg.t === 'mossa') this.onMotion(msg.m);
        else if (msg.t === 'mosse') for (const m of msg.all) this.onMotion(m);
      }),
      s.events.on('left', (m) => {
        const f = this.friends.get(m.seat);
        if (!f) return;
        this.friends.delete(m.seat);
        f.player.destroy();
        showToast(this, `${m.name} è uscito`);
      }),
      s.events.on('closed', (why) => {
        if (!why) return;
        showToast(this, `${PROBLEM_TEXT[why]}\nSi torna alla Lobby.`, 2.5);
        this.time.delayedCall(2500, () => goTo(this, 'Lobby'));
      }),
    );
  }

  /** Mette sulla mappa il dio di un amico. Lo muovono i messaggi che arrivano dal suo telefono. */
  private addFriend(m: Member): void {
    const map = MAPPA_ALLENAMENTO;
    const off = SEAT_OFFSETS[m.seat % SEAT_OFFSETS.length];
    const player = new Player(this, map.spawn.x + off.x, map.spawn.y + off.y, {
      characterId: isPlayable(m.characterId) ? m.characterId : 'horus',
      level: m.level,
      team: 0,
      combat: this.combat,
      variant: SEAT_VARIANTS[m.seat % SEAT_VARIANTS.length],
      name: m.name,
      ally: true,
    });
    // per ora (passo M1) gli amici non si colpiscono: i colpi arriveranno con il passo M2
    this.combat.remove(player);
    this.friends.set(m.seat, { member: m, player, motion: new RemoteMotion(), last: null });
  }

  private onMotion(m: MotionTuple): void {
    const f = this.friends.get(m[0]);
    if (!f) return;
    f.last = m;
    f.motion.push(m[1], m[2], m[3], m[4]);
  }

  /** Ogni fotogramma: gli amici dove dice la rete; ogni tanto si manda la propria posizione. */
  private updateNet(dt: number): void {
    const s = this.net;
    if (!s || s.closed) return;
    const now = performance.now();
    for (const f of this.friends.values()) {
      const p = f.motion.sample(now);
      if (p) f.player.driveFromNetwork(p.x, p.y, p.vx, p.vy);
    }
    this.sendTimer -= dt;
    if (this.sendTimer > 0) return;
    this.sendTimer = 1 / NET.sendRate;
    const me = this.player;
    const v = me.body.velocity;
    const mine: MotionTuple = [s.mySeat, Math.round(me.x), Math.round(me.y), Math.round(v.x), Math.round(v.y)];
    if (s.isHost) {
      // il capo stanza manda a tutti dove sono tutti (lui compreso)
      const all: MotionTuple[] = [mine];
      for (const f of this.friends.values()) if (f.last) all.push(f.last);
      s.send({ t: 'mosse', all });
    } else {
      s.send({ t: 'mossa', m: mine });
    }
  }

  /** Mette un bersaglio nuovo nel suo posto (con il "pop" quando torna su). */
  private placeTarget(s: TargetSlot): void {
    const t = new Target(this, s.x, s.y, this.combat);
    this.physics.add.collider(this.player, t);
    s.target = t;
    s.wait = TRAINING.targetRespawnSeconds;
    t.setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 300 });
  }

  /** Indietro (in alto a sinistra), Cambia dio e Super carica (in alto a destra). */
  private drawButtons(): void {
    const back = backButton(this, () => {
      // con gli amici: si esce dalla stanza
      this.net?.close();
      goTo(this, 'Lobby');
    });
    back.setScrollFactor(0, 0, true).setDepth(DEPTH.ui + 10);

    const change = createGoldButton(this, 0, 50, 'Cambia dio', () => this.nextCharacter(), 220, 60, 28);
    change.setDepth(DEPTH.ui + 10);
    // con gli amici il dio è quello scelto entrando nella stanza
    change.setVisible(!this.net);
    const charge = createGoldButton(this, 0, 126, 'Super carica', () => this.fillSuper(), 220, 60, 28);
    charge.setDepth(DEPTH.ui + 10);
    // se lo schermo cambia misura (telefono girato, schermo intero) restano attaccati al bordo destro
    const layout = () => {
      change.setX(this.scale.width - 130);
      charge.setX(this.scale.width - 130);
    };
    layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, layout);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, layout));
  }

  /** Passa al prossimo dio sbloccato e ricomincia l'allenamento con lui. */
  private nextCharacter(): void {
    const mine = ROSTER.map((c) => c.id).filter((id) => isPlayable(id) && SaveManager.isUnlocked(id));
    if (mine.length <= 1) {
      showToast(this, 'Trova altri dèi nei sarcofagi\nper provarli qui!');
      return;
    }
    const next = mine[(mine.indexOf(this.characterId) + 1) % mine.length];
    this.scene.restart({ characterId: next });
  }

  /** Riempie subito la super, così la si può provare quante volte si vuole. */
  private fillSuper(): void {
    if (!this.player.isAlive()) return;
    this.player.superCharge = 1;
    showToast(this, 'Super pronta!');
  }

  /** Il giocatore nei cespugli (si vede trasparente) e nell'acqua (va più piano). */
  private updateTerrain(dt: number): void {
    const me = this.player;
    const bush = this.view.bushAt(me.x, me.y);
    me.hideout = me.isInvisible() ? Player.INVISIBLE : bush && me.revealedUntil <= this.time.now ? bush : null;
    this.view.applyTerrain(me);
    this.view.setSeeThroughBush(bush);
    me.setHiddenLook(!!me.hideout);
    this.view.updateTallThings(me, dt);
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.view.update(dt, this.cameras.main);
    this.updateTerrain(dt);
    // i bersagli distrutti tornano su dopo qualche secondo
    for (const s of this.slots) {
      if (s.target && s.target.isAlive()) continue;
      s.wait -= dt;
      if (s.wait <= 0) this.placeTarget(s);
    }
    this.controls.update(dt);
    this.updateNet(dt);
  }
}
