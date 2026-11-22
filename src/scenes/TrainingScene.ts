import Phaser from 'phaser';
import { stopMenuMusic } from '../audio/Music';
import { CAMERA_LERP, DEPTH } from '../config';
import { ROSTER, getCharacter, isPlayable } from '../data/characters';
import { MAPPA_ALLENAMENTO, TRAINING } from '../data/training';
import { NET, SEAT_VARIANTS } from '../data/net';
import { PROBLEM_TEXT, getSession, type NetSession } from '../net/Session';
import { NetFighters } from '../net/NetFighters';
import type { Member } from '../net/protocol';
import { SaveManager } from '../save/SaveManager';
import { Combat } from '../entities/Combat';
import { DEFEATED_EVENT, Player } from '../entities/Player';
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
 * Con gli amici (multiplayer): ognuno vede gli altri dèi e ci si può sfidare (tutti contro tutti);
 * chi viene sconfitto riappare dopo qualche secondo.
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
  private fighters: NetFighters | null = null;
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
      // con gli amici ognuno ha la sua squadra: tutti contro tutti
      team: this.teamOf(this.net?.mySeat ?? 0),
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
      hud.setStorm('Sfidatevi! Chi è sconfitto riappare', false);
    } else {
      hud.setTitle(`Allenamento — ${getCharacter(this.characterId).name}`);
      hud.setStorm('Colpisci i bersagli!', false);
    }
    if (map.name) hud.showZone(map.name);
    this.drawButtons();
    addFpsMeter(this);
    this.fighters = null;
    this.unsubscribe = [];
    if (this.net) this.startNet(this.net);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const u of this.unsubscribe) u();
      this.unsubscribe = [];
    });
  }

  // ------------------------------------------------------------------ amici (multiplayer)

  /** Squadra di un posto della stanza (con gli amici: ognuno la sua; da soli: 0). */
  private teamOf(seat: number): number {
    return this.net ? 10 + seat : 0;
  }

  private spotOf(seat: number): { x: number; y: number } {
    const map = MAPPA_ALLENAMENTO;
    const off = SEAT_OFFSETS[seat % SEAT_OFFSETS.length];
    return { x: map.spawn.x + off.x, y: map.spawn.y + off.y };
  }

  private startNet(s: NetSession): void {
    this.fighters = new NetFighters(this, {
      session: s,
      me: this.player,
      others: new Map(s.members.filter((m) => m.seat !== s.mySeat).map((m) => [m.seat, this.addFriend(m)])),
      respawnSpot: (seat) => this.spotOf(seat),
      respawnSeconds: NET.trainingRespawnSeconds,
      onRespawn: (p) => {
        if (p === this.player) this.controls.setEnabled(true);
      },
      onLeft: (m) => showToast(this, `${m.name} è uscito`),
    });
    this.player.on(DEFEATED_EVENT, () => {
      this.controls.setEnabled(false);
      showToast(this, `Riappari tra ${NET.trainingRespawnSeconds} secondi!`);
    });
    this.unsubscribe.push(
      s.events.on('msg', (msg) => {
        if (msg.t === 'stanza') goTo(this, 'Friends');
      }),
      s.events.on('closed', (why) => {
        if (!why) return;
        showToast(this, `${PROBLEM_TEXT[why]}\nSi torna alla Lobby.`, 2.5);
        this.time.delayedCall(2500, () => goTo(this, 'Lobby'));
      }),
    );
  }

  /** Mette sulla mappa il dio di un amico. Lo muovono i messaggi che arrivano dal suo telefono. */
  private addFriend(m: Member): Player {
    const spot = this.spotOf(m.seat);
    const player = new Player(this, spot.x, spot.y, {
      characterId: isPlayable(m.characterId) ? m.characterId : 'horus',
      level: m.level,
      team: this.teamOf(m.seat),
      combat: this.combat,
      variant: SEAT_VARIANTS[m.seat % SEAT_VARIANTS.length],
      name: m.name,
    });
    // niente muri per lui: dove sta lo decide il suo telefono (che i muri li ha già)
    return player;
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
      const s = this.net;
      if (!s || s.closed) {
        goTo(this, 'Lobby');
        return;
      }
      // con gli amici si torna nella stanza; se lo fa il capo stanza, ci tornano tutti
      if (s.isHost) s.send({ t: 'stanza' });
      goTo(this, 'Friends');
    });
    back.setScrollFactor(0, 0, true).setDepth(DEPTH.ui + 10);

    const change = createGoldButton(this, 0, 50, 'Cambia dio', () => this.nextCharacter(), 220, 60, 28);
    change.setDepth(DEPTH.ui + 10);
    // con gli amici il dio è quello scelto entrando nella stanza
    change.setVisible(!this.net);
    const charge = createGoldButton(this, 0, 126, 'Super carica', () => this.fillSuper(), 220, 60, 28);
    // con gli amici la super si carica solo colpendo (la carica la decide il capo stanza)
    charge.setVisible(!this.net);
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
    this.fighters?.update(dt);
  }
}
