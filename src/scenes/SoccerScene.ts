import Phaser from 'phaser';
import { playSfx, vibrate } from '../audio/Sound';
import { stopMenuMusic } from '../audio/Music';
import { TEX } from '../art';
import { PALETTE, css } from '../art/palette';
import { GOAL_ART_TOP } from '../art/soccer';
import { CAMERA_LERP, DEPTH, FONT_FAMILY } from '../config';
import { BOT_NAMES } from '../data/bots';
import { isPlayable } from '../data/characters';
import { HIDEOUT_REVEAL_DISTANCE } from '../data/combat';
import { trophiesForPlace } from '../data/progression';
import { MATCH_INTRO } from '../data/match';
import { CAMPO_CALCIO, GOALS, GOAL_DEPTH, GOAL_MOUTH, KICKOFF, RESPAWN, SOCCER, SOCCER_RIVER, mirror } from '../data/soccer';
import { SaveManager } from '../save/SaveManager';
import { currentBotLevel, pickBotGods } from '../ai/botPicks';
import { SoccerBrain, type SoccerWorld } from '../ai/SoccerBrain';
import { Combat } from '../entities/Combat';
import { Player, DEFEATED_EVENT } from '../entities/Player';
import { Bot } from '../entities/Bot';
import { SoccerBall } from '../entities/SoccerBall';
import { MatchHud } from '../ui/MatchHud';
import { PlayerControls } from '../ui/PlayerControls';
import { showEndOverlay } from '../ui/EndOverlay';
import { showToast } from '../ui/Toast';
import { showMatchIntro } from '../ui/MatchIntro';
import { addFpsMeter } from '../ui/FpsMeter';
import { NET, SEAT_VARIANTS } from '../data/net';
import { PROBLEM_TEXT, getSession, type NetSession } from '../net/Session';
import { NetFighters } from '../net/NetFighters';
import type { FighterSetup, SetupMsg } from '../net/protocol';
import { goTo, outlinedText } from '../ui/MenuKit';
import { MapView } from './MapView';
import type { ResultsData } from './ResultsScene';

/** Numero del primo bot (0-3 sono i posti degli amici). */
const FIRST_BOT_ID = 10;

const FIELD = CAMPO_CALCIO;

/**
 * Calcio del Nilo: 3 contro 3 (tu + 2 compagni bot, a sinistra, contro 3 bot a destra).
 * Si porta la palla e la si calcia con il colpo; chi viene colpito la perde. Vince chi arriva a 2 gol,
 * oppure chi ne ha di più allo scadere. Chi viene sconfitto riappare dopo qualche secondo nella sua metà.
 * Con gli amici (GAME_DESIGN.md, sezione 13) il capo stanza decide palla, gol, tempo e bot; chi porta la palla
 * la vede ai suoi piedi e quando la calcia parte subito sul suo telefono.
 */
export class SoccerScene extends Phaser.Scene {
  private view!: MapView;
  private combat!: Combat;
  private player!: Player;
  private fighters: Player[] = [];
  private ball!: SoccerBall;
  private controls!: PlayerControls;
  private hud!: MatchHud;
  private ballMarker!: Phaser.GameObjects.Image;
  private score: [number, number] = [0, 0];
  private timeLeft = SOCCER.seconds;
  private pause = 0;
  private over = false;
  /** Conto alla rovescia iniziale in corso. */
  private intro = false;
  /** la stanza degli amici (null = partita contro i bot) */
  private net: NetSession | null = null;
  private netFighters: NetFighters | null = null;
  private readonly ids = new Map<Player, number>();
  private readonly byId = new Map<number, Player>();
  private unsubscribe: (() => void)[] = [];
  private waitText: Phaser.GameObjects.Text | null = null;
  private sendTimer = 0;
  private leaving = false;

  constructor() {
    super('Soccer');
  }

  init(data: { net?: boolean }): void {
    const s = data?.net ? getSession() : null;
    this.net = s && !s.closed ? s : null;
  }

  /** Decide il capo stanza (o si gioca da soli)? */
  private get authority(): boolean {
    return !this.net || this.net.isHost;
  }

  create(): void {
    stopMenuMusic();
    this.combat = new Combat();
    this.fighters = [];
    this.score = [0, 0];
    this.timeLeft = SOCCER.seconds;
    this.pause = 0;
    this.over = false;
    this.intro = false;
    this.leaving = false;
    this.sendTimer = 0;
    this.ids.clear();
    this.byId.clear();
    this.netFighters = null;
    this.unsubscribe = [];
    this.waitText = null;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const u of this.unsubscribe) u();
      this.unsubscribe = [];
    });

    const s = this.net;
    if (s) this.listenNet(s);
    if (s && !s.isHost) {
      // un amico: aspetta la partita preparata dal capo stanza (può essere già arrivata)
      if (s.lastSetup?.mode === 'calcio') this.startFromSetup(s.lastSetup);
      else this.waitText = outlinedText(this, this.scale.width / 2, this.scale.height / 2, 'Il capo stanza prepara la partita...', 40);
      return;
    }
    this.buildField();
    const setup: SetupMsg = { t: 'partita', mode: 'calcio', map: 'calcio', fighters: this.makeFighters() };
    s?.send(setup);
    this.buildFighters(setup);
  }

  private startFromSetup(setup: SetupMsg): void {
    if (this.fighters.length || setup.mode !== 'calcio') return;
    this.waitText?.destroy();
    this.waitText = null;
    this.buildField();
    this.buildFighters(setup);
  }

  /** Il campo con righe, porte e palla. */
  private buildField(): void {
    this.view = new MapView(this, FIELD, this.combat);
    this.drawLines();
    this.addGoals();
    this.ball = new SoccerBall(this, this.centerSpot().x, this.centerSpot().y, (x, y) => this.view.waterAt(x, y)?.flow ?? null);
    if (this.net) this.ball.net = { authority: this.authority };
    this.physics.add.collider(this.ball, this.view.walls);
  }

  /**
   * Le due squadre da 3: 0 = sinistra, 1 = destra. Da soli: tu a sinistra con 2 bot, contro 3 bot.
   * Con gli amici le squadre le ha scelte il capo stanza; i posti liberi sono bot.
   */
  private makeFighters(): FighterSetup[] {
    const s = this.net;
    const forced = new URLSearchParams(location.search).get('eroe');
    const myId = forced && isPlayable(forced) ? forced : SaveManager.getSelectedCharacter();
    const humans = s
      ? s.members.map((m) => ({ id: m.seat, characterId: isPlayable(m.characterId) ? m.characterId : 'horus', level: m.level, name: m.name }))
      : [{ id: 0, characterId: myId, level: SaveManager.getLevel(myId), name: '' }];
    const sides: number[][] = s ? [s.choice.teams[0] ?? [], s.choice.teams[1] ?? []] : [[0], []];
    const level = currentBotLevel();
    const names = Phaser.Utils.Array.Shuffle([...BOT_NAMES]);
    const gods = pickBotGods(SOCCER.teamSize * 2 - humans.length, myId);
    let bot = 0;
    const out: FighterSetup[] = [];
    for (const team of [0, 1]) {
      for (let i = 0; i < SOCCER.teamSize; i++) {
        const spot = this.kickoffSpot(team, i);
        const hid = sides[team][i];
        const h = hid !== undefined ? humans.find((x) => x.id === hid) : undefined;
        if (h) out.push({ id: h.id, characterId: h.characterId, level: h.level, team, x: spot.x, y: spot.y, name: h.name });
        else if (bot < gods.length) {
          out.push({ id: FIRST_BOT_ID + bot, characterId: gods[bot], level: level.characterLevel, team, x: spot.x, y: spot.y, name: names[bot % names.length] });
          bot++;
        }
      }
    }
    return out;
  }

  private buildFighters(setup: SetupMsg): void {
    const s = this.net;
    const myId = s ? s.mySeat : 0;
    const mine = setup.fighters.find((f) => f.id === myId) ?? setup.fighters[0];
    const level = currentBotLevel();
    const world: SoccerWorld = {
      ball: this.ball,
      attackGoal: (team) => this.goalCenter(1 - team),
      ownGoal: (team) => this.goalCenter(team),
      goalMouth: GOAL_MOUTH,
      players: () => this.fighters,
      bridgeVia: (fx, fy, tx, ty) => this.bridgeVia(fx, fy, tx, ty),
      paused: () => this.pause > 0 || this.over || this.intro,
    };
    for (const f of setup.fighters) {
      const isMe = f.id === mine.id;
      const isBot = f.id >= FIRST_BOT_ID;
      const ally = !isMe && f.team === mine.team;
      const opt = {
        characterId: f.characterId,
        level: f.level,
        team: f.team,
        combat: this.combat,
        // gli avversari tutti dello stesso colore, così si riconosce la squadra; gli amici della mia squadra col loro colore
        variant: isMe ? ('base' as const) : !ally ? ('rosso' as const) : isBot ? ('base' as const) : SEAT_VARIANTS[f.id % SEAT_VARIANTS.length],
        name: isMe ? undefined : isBot && ally ? `${f.name} (amico)` : f.name,
        ally,
      };
      let p: Player;
      if (isMe) p = new Player(this, f.x, f.y, { ...opt, isHuman: true });
      else if (isBot && this.authority) p = new Bot(this, f.x, f.y, opt, level, (b) => new SoccerBrain(b, this.combat, level, world));
      else p = new Player(this, f.x, f.y, opt);
      if (isMe) this.player = p;
      this.fighters.push(p);
      this.ids.set(p, f.id);
      this.byId.set(f.id, p);
    }
    for (const f of this.fighters) {
      if (f === this.player || f instanceof Bot) this.physics.add.collider(f, this.view.walls);
      f.on(DEFEATED_EVENT, (who: Player) => this.onDefeated(who));
    }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, FIELD.width, FIELD.height);
    cam.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
    cam.setRoundPixels(true);

    this.controls = new PlayerControls(this, this.player);
    // chi ha la palla la calcia invece di attaccare
    this.controls.attackOverride = (angle, strength) => this.humanKick(angle, strength);
    this.hud = new MatchHud(this);
    this.updateScore();
    this.hud.showZone('Calcio del Nilo');
    // la palla fuori dallo schermo: una pallina sul bordo indica dov'è
    this.ballMarker = this.add.image(0, 0, TEX.palla).setScrollFactor(0).setDepth(DEPTH.ui).setScale(0.8).setVisible(false);
    addFpsMeter(this);
    // mentre si mira con la palla: una linea dorata mostra dove andrà il tiro
    this.controls.aimPreview = (_angle, strength) => this.kickPreview(strength);

    if (s) {
      const others = new Map<number, Player>();
      for (const [id, p] of this.byId) if (p !== this.player) others.set(id, p);
      this.netFighters = new NetFighters(this, {
        session: s,
        me: this.player,
        others,
        local: s.isHost ? [...this.byId.keys()].filter((id) => id >= FIRST_BOT_ID) : [],
        removeOnLeave: false,
        respawnSpot: (id) => {
          const team = this.byId.get(id)?.team ?? 0;
          return Phaser.Utils.Array.GetRandom(team === 0 ? RESPAWN : RESPAWN.map(mirror));
        },
        respawnSeconds: SOCCER.respawnSeconds,
        onRespawn: (p) => {
          if (p === this.player && !this.over && this.pause <= 0 && !this.intro) this.controls.setEnabled(true);
        },
        onLeft: (m) => {
          showToast(this, `${m.name} è uscito`);
          if (s.isHost) this.byId.get(m.seat)?.forceDefeat();
        },
      });
    }
    // qualche secondo per prepararsi e vedere le due squadre, poi "VIA!"
    this.startTruce(MATCH_INTRO.seconds, true);
  }

  // ------------------------------------------------------------------ amici (multiplayer)

  private listenNet(s: NetSession): void {
    this.unsubscribe.push(
      s.events.on('msg', (msg, from) => {
        if (s.isHost) {
          // un amico ha calciato: vale se ha davvero la palla
          if (msg.t === 'calcia') {
            const p = this.byId.get(from);
            if (p && this.ball?.holder === p && this.pause <= 0 && !this.over) this.ball.kick(msg.a, msg.sp);
          }
          return;
        }
        switch (msg.t) {
          case 'partita':
            this.startFromSetup(msg);
            break;
          case 'pallone': {
            if (!this.ball) break;
            const [x, y, vx, vy, holder] = msg.b;
            this.ball.netState(x, y, vx, vy, holder >= 0 ? (this.byId.get(holder) ?? null) : null);
            this.timeLeft = msg.time;
            if (msg.score[0] !== this.score[0] || msg.score[1] !== this.score[1]) {
              this.score = msg.score;
              this.updateScore();
            }
            break;
          }
          case 'gol':
            this.score = msg.score;
            this.updateScore();
            this.celebrateGoal(msg.team);
            break;
          case 'inizio':
            for (const [id, x, y] of msg.spots) {
              if (this.byId.get(id) === this.player) {
                if (this.player.isAlive()) {
                  this.player.body.reset(x, y);
                  this.player.setPosition(x, y);
                } else this.player.respawn(x, y);
              } else this.netFighters?.placeAt(id, x, y);
            }
            this.pause = 0;
            this.startTruce(msg.first ? MATCH_INTRO.seconds : SOCCER.kickoffTruce, msg.first);
            break;
          case 'fischio':
            this.score = msg.score;
            this.updateScore();
            this.endMatch();
            break;
        }
      }),
      s.events.on('closed', (why) => {
        if (!why || this.leaving) return;
        showToast(this, `${PROBLEM_TEXT[why]}\nSi torna alla Lobby.`, 2.5);
        this.leaving = true;
        this.time.delayedCall(2500, () => goTo(this, 'Lobby'));
      }),
    );
  }

  /** Capo stanza: ogni tanto manda palla, tempo e gol a tutti. */
  private sendBall(dt: number): void {
    const s = this.net;
    if (!s?.isHost || s.closed) return;
    this.sendTimer -= dt;
    if (this.sendTimer > 0) return;
    this.sendTimer = 1 / NET.sendRate;
    const b = this.ball;
    const v = b.body.velocity;
    const holder = b.holder ? (this.ids.get(b.holder) ?? -1) : -1;
    s.send({
      t: 'pallone',
      b: [Math.round(b.x), Math.round(b.y), Math.round(v.x), Math.round(v.y), holder],
      time: Math.round(this.timeLeft * 10) / 10,
      score: this.score,
    });
  }

  /**
   * Tregua: tutti fermi, palla bloccata al centro e conto alla rovescia, poi "VIA!".
   * All'inizio (con le schede delle squadre) e prima di ogni calcio d'inizio dopo un gol.
   */
  private startTruce(seconds: number, firstTime: boolean): void {
    this.intro = true;
    this.ball.frozen = true;
    this.controls.setEnabled(false);
    const bots = this.fighters.filter((f): f is Bot => f instanceof Bot);
    for (const b of bots) {
      b.frozen = true;
      b.move(new Phaser.Math.Vector2(0, 0));
    }
    showMatchIntro(this, {
      seconds,
      me: this.player,
      fighters: this.fighters,
      cards: firstTime,
      hint: firstTime ? 'Preparati!' : 'Tregua! Tutti fermi',
      onGo: () => {
        this.intro = false;
        if (this.over) return;
        this.ball.frozen = false;
        for (const b of bots) b.frozen = false;
        this.controls.setEnabled(this.player.isAlive());
      },
    });
  }

  /** Lunghezza della linea di mira per un calcio con questa forza (circa dove si fermerà la palla). */
  private kickPreview(strength: number): { length: number; width: number } | null {
    if (this.ball.holder !== this.player) return null;
    const speed = SOCCER.ball.shotSpeed * (0.55 + 0.45 * strength);
    return { length: Math.min(900, (speed / SOCCER.ball.drag) * 0.8), width: SOCCER.ball.radius * 2 };
  }

  // ------------------------------------------------------------------ campo

  /** Righe bianche del campo e cerchio di centrocampo. */
  private drawLines(): void {
    const g = this.add.graphics().setDepth(DEPTH.ground + 1);
    const W = FIELD.width;
    const H = FIELD.height;
    g.lineStyle(8, 0xffffff, 0.75);
    g.strokeRect(GOAL_DEPTH, 30, W - GOAL_DEPTH * 2, H - 60);
    g.strokeCircle(W / 2, H / 2, 230);
    const box = 300;
    for (const side of [0, 1]) {
      const x = side === 0 ? GOAL_DEPTH : W - GOAL_DEPTH - box;
      g.strokeRect(x, H / 2 - 330, box, 660);
    }
    g.fillStyle(0xffffff, 0.75);
    g.fillCircle(GOAL_DEPTH + 220, H / 2, 8).fillCircle(W - GOAL_DEPTH - 220, H / 2, 8);
  }

  /** Le due porte, con i pali che non si attraversano. */
  private addGoals(): void {
    GOALS.forEach((r, side) => {
      this.add
        .image(side === 0 ? 0 : FIELD.width, r.y - GOAL_ART_TOP, TEX.porta)
        .setOrigin(side === 0 ? 0 : 1, 0)
        .setFlipX(side === 1)
        .setDepth(DEPTH.ground + 7);
      for (const y of [r.y - 14, r.y + r.h]) {
        const post = this.add.zone(r.x + r.w / 2, y + 7, r.w + 20, 14);
        this.physics.add.existing(post, true);
        this.view.walls.add(post);
      }
    });
  }

  private centerSpot(): { x: number; y: number } {
    return { x: FIELD.width / 2, y: FIELD.height / 2 };
  }

  /** Centro della porta della squadra `team` (0 = sinistra). */
  private goalCenter(team: number): { x: number; y: number } {
    const r = GOALS[team];
    return { x: team === 0 ? r.x + r.w : r.x, y: r.y + r.h / 2 };
  }

  private kickoffSpot(team: number, i: number): { x: number; y: number } {
    const p = KICKOFF[i % KICKOFF.length];
    return team === 0 ? p : mirror(p);
  }

  /** Se tra (fx, fy) e (tx, ty) c'è il fiume, il punto del ponte verso cui andare; altrimenti null. */
  private bridgeVia(fx: number, fy: number, tx: number, ty: number): { x: number; y: number } | null {
    const r = SOCCER_RIVER;
    const left = r.x;
    const right = r.x + r.w;
    const mid = left + r.w / 2;
    // la meta è nell'acqua (es. la palla) o si è già nell'acqua: dritti
    if (tx > left - 20 && tx < right + 20) return null;
    if (this.view.waterAt(fx, fy)) return null;
    if (fx < mid === tx < mid) return null;
    const bridges = FIELD.bridges ?? [];
    let best = bridges[0];
    let bestCost = Infinity;
    for (const b of bridges) {
      const cy = b.y + b.h / 2;
      const cost = Math.abs(fy - cy) + Math.abs(ty - cy);
      if (cost < bestCost) {
        bestCost = cost;
        best = b;
      }
    }
    const cy = best.y + best.h / 2;
    const onBridge = Math.abs(fy - cy) < best.h / 2 - 30 && fx > left - 90 && fx < right + 90;
    if (onBridge) return { x: tx < mid ? left - 80 : right + 80, y: cy };
    return { x: fx < mid ? left - 60 : right + 60, y: cy };
  }

  // ------------------------------------------------------------------ palla e gol

  /** Il giocatore usa il colpo: se ha la palla la calcia (tocco veloce = verso la porta o a un compagno). */
  private humanKick(angle: number | null, strength: number): boolean {
    const me = this.player;
    if (this.ball.holder !== me || this.pause > 0 || this.over || this.intro) return false;
    const k = this.chooseKick(angle, strength);
    if (this.authority) this.ball.kick(k.angle, k.speed);
    else {
      // un amico: la palla parte subito sul suo telefono, e il capo stanza fa lo stesso calcio
      this.ball.netKick(k.angle, k.speed);
      this.net?.send({ t: 'calcia', a: Math.round(k.angle * 1000) / 1000, sp: Math.round(k.speed) });
    }
    return true;
  }

  /** Dove e quanto forte calciare: mirato, oppure tocco veloce (tiro in porta da vicino, passaggio da lontano). */
  private chooseKick(angle: number | null, strength: number): { angle: number; speed: number } {
    const me = this.player;
    if (angle !== null) return { angle, speed: SOCCER.ball.shotSpeed * (0.55 + 0.45 * strength) };
    const goal = this.goalCenter(1 - me.team);
    const d = Phaser.Math.Distance.Between(me.x, me.y, goal.x, goal.y);
    const toGoal = Phaser.Math.Angle.Between(me.x, me.y, goal.x, goal.y);
    if (d < SOCCER.ball.autoShotRange) return { angle: toGoal, speed: SOCCER.ball.shotSpeed };
    // lontano dalla porta: passaggio al compagno più avanti, altrimenti un calcio in avanti
    const fwd = me.team === 0 ? 1 : -1;
    const mate = this.fighters
      .filter((f) => f !== me && f.team === me.team && f.isAlive() && (f.x - me.x) * fwd > 100)
      .sort((a, b) => (b.x - a.x) * fwd)[0];
    if (mate) return { angle: Phaser.Math.Angle.Between(me.x, me.y, mate.x, mate.y), speed: SOCCER.ball.passSpeed };
    return { angle: toGoal, speed: SOCCER.ball.shotSpeed };
  }

  /** Chi tocca la palla libera la prende (il più vicino). */
  private pickUpBall(dt: number): void {
    const ball = this.ball;
    if (ball.holder) return;
    let best: Player | null = null;
    let bestD = SOCCER.ball.pickupRadius;
    for (const f of this.fighters) {
      if (!ball.canBeTakenBy(f)) continue;
      const d = Phaser.Math.Distance.Between(f.x, f.y, ball.x, ball.y);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    if (best) {
      ball.take(best);
      return;
    }
    // "calamita": una palla lenta lì vicino scivola verso i piedi di chi le è più vicino
    if (ball.frozen || ball.speed > SOCCER.ball.magnetMaxSpeed) return;
    let near: Player | null = null;
    let nearD = SOCCER.ball.magnetRadius;
    for (const f of this.fighters) {
      if (!ball.canBeTakenBy(f)) continue;
      const d = Phaser.Math.Distance.Between(f.x, f.y, ball.x, ball.y);
      if (d < nearD) {
        nearD = d;
        near = f;
      }
    }
    if (near) ball.pullToward(near.x, near.y, SOCCER.ball.magnetPull, dt);
  }

  /** La palla è entrata in una porta? */
  private checkGoal(): void {
    const b = this.ball;
    GOALS.forEach((r, side) => {
      if (this.pause > 0) return;
      const inside = b.x > r.x - 4 && b.x < r.x + r.w + 4 && b.y > r.y && b.y < r.y + r.h;
      const deep = side === 0 ? b.x < r.x + r.w - 20 : b.x > r.x + 20;
      if (inside && deep) this.goalScored(1 - side);
    });
  }

  /** Gol della squadra `team`. */
  private goalScored(team: number): void {
    this.score[team]++;
    this.updateScore();
    if (this.ball.holder) this.ball.drop();
    this.net?.send({ t: 'gol', team, score: this.score });
    this.celebrateGoal(team);
    if (this.score[team] >= SOCCER.goalsToWin) {
      this.time.delayedCall(900, () => this.endMatch());
      return;
    }
    this.time.delayedCall(SOCCER.goalPause * 1000, () => this.kickoff());
  }

  /** Gol: palla ferma, pausa, scritta e suono (per chi ha segnato o per gli avversari). */
  private celebrateGoal(team: number): void {
    this.ball.frozen = true;
    this.pause = SOCCER.goalPause;
    this.controls.setEnabled(false);
    const mine = team === this.player.team;
    this.cameras.main.flash(250, mine ? 120 : 255, mine ? 255 : 120, mine ? 160 : 120);
    this.bigText(mine ? 'GOL!' : 'Gol degli avversari!', mine);
    playSfx(mine ? 'goal' : 'denied');
    if (mine) vibrate('goal');
  }

  /** Tutti al proprio posto e palla al centro. */
  private kickoff(): void {
    if (this.over) return;
    const count = [0, 0];
    const spots: [number, number, number][] = [];
    for (const f of this.fighters) {
      const spot = this.kickoffSpot(f.team, count[f.team]++);
      const id = this.ids.get(f) ?? 0;
      spots.push([id, spot.x, spot.y]);
      if (this.netFighters && f !== this.player && !(f instanceof Bot)) this.netFighters.placeAt(id, spot.x, spot.y);
      else if (f.isAlive()) {
        f.body.reset(spot.x, spot.y);
        f.setPosition(spot.x, spot.y);
      } else {
        f.respawn(spot.x, spot.y);
      }
    }
    // con gli amici: ognuno va al suo posto anche sul suo telefono
    this.net?.send({ t: 'inizio', spots, first: false });
    const c = this.centerSpot();
    this.ball.placeAt(c.x, c.y);
    this.pause = 0;
    // tregua prima di ripartire: nessuno si muove finché non arriva il "VIA!"
    this.startTruce(SOCCER.kickoffTruce, false);
  }

  // ------------------------------------------------------------------ sconfitte

  /** Chi viene sconfitto riappare dopo qualche secondo nella sua metà campo. */
  private onDefeated(who: Player): void {
    if (this.over) return;
    if (who === this.player) {
      this.controls.setEnabled(false);
      showToast(this, `Riappari tra ${SOCCER.respawnSeconds} secondi!`);
    }
    // con gli amici la ricomparsa la decide il capo stanza (e la dice a tutti)
    if (this.net) return;
    this.time.delayedCall(SOCCER.respawnSeconds * 1000, () => {
      if (this.over || who.isAlive()) return;
      const spots = who.team === 0 ? RESPAWN : RESPAWN.map(mirror);
      const spot = Phaser.Utils.Array.GetRandom(spots);
      who.respawn(spot.x, spot.y);
      if (who === this.player && this.pause <= 0 && !this.intro) this.controls.setEnabled(true);
    });
  }

  // ------------------------------------------------------------------ punteggio e fine

  private updateScore(): void {
    if (!this.hud || !this.player) return;
    const mine = this.player.team;
    this.hud.setTitle(`Noi ${this.score[mine]} – ${this.score[1 - mine]} Loro`);
  }

  private bigText(text: string, good: boolean): void {
    const { width, height } = this.scale;
    const t = this.add
      .text(width / 2, height * 0.38, text, {
        fontFamily: FONT_FAMILY,
        fontSize: good ? '110px' : '64px',
        color: good ? css(PALETTE.oro) : '#FFFFFF',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 12,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.ui + 50)
      .setScale(0.2);
    this.tweens.add({ targets: t, scale: 1, duration: 380, ease: 'Back.out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1500, duration: 400, onComplete: () => t.destroy() });
  }

  /** Fine partita: 1 = vinta, 2 = pareggio, 3 = persa. Salva subito le coppe e passa ai Risultati. */
  private endMatch(): void {
    if (this.over) return;
    this.over = true;
    this.controls.setEnabled(false);
    if (this.net?.isHost) this.net.send({ t: 'fischio', score: this.score });
    const mine = this.score[this.player.team];
    const theirs = this.score[1 - this.player.team];
    const place = mine > theirs ? 1 : mine === theirs ? 2 : 3;
    const reward = SaveManager.recordMatch(this.player.stats.id, place, trophiesForPlace(place, 'calcio'));
    const title = place === 1 ? 'VITTORIA!' : place === 2 ? 'Pareggio!' : 'Sconfitta';
    this.time.delayedCall(700, () => showEndOverlay(this, `${title}\n${mine} – ${theirs}`, place === 1));
    this.time.delayedCall(2800, () => {
      this.cameras.main.fadeOut(300, 20, 33, 61);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.scene.start('Results', { ...reward, mode: 'calcio', playerCount: 2, score: [mine, theirs], net: !!this.net } satisfies ResultsData),
      );
    });
  }

  // ------------------------------------------------------------------ ogni fotogramma

  /** Cespugli e terreno (come nella battaglia, ma senza piramidi). */
  private updateHideouts(dt: number): void {
    const now = this.time.now;
    const me = this.player;
    for (const f of this.fighters) {
      const bush = this.view.bushAt(f.x, f.y);
      // chi porta la palla non si può nascondere: la palla si vede!
      const hidden = bush && f.revealedUntil <= now && this.ball.holder !== f;
      f.hideout = f.isInvisible() ? Player.INVISIBLE : hidden ? bush : null;
      this.view.applyTerrain(f);
    }
    this.view.setSeeThroughBush(this.view.bushAt(me.x, me.y));
    me.setHiddenLook(!!me.hideout);
    this.view.updateTallThings(me, dt);
    for (const f of this.fighters) {
      if (f === me) continue;
      const near = Phaser.Math.Distance.Between(f.x, f.y, me.x, me.y) < HIDEOUT_REVEAL_DISTANCE;
      f.setRevealed(!f.hideout || f.hideout === me.hideout || near || me.seesAll() || f.team === me.team);
    }
  }

  /** Pallina sul bordo dello schermo quando la palla non si vede. */
  private updateBallMarker(): void {
    const cam = this.cameras.main;
    const v = cam.worldView;
    const b = this.ball;
    if (v.contains(b.x, b.y - 20)) {
      this.ballMarker.setVisible(false);
      return;
    }
    const m = 40;
    const x = Phaser.Math.Clamp(b.x - v.x, m, cam.width - m);
    const y = Phaser.Math.Clamp(b.y - v.y, m + 90, cam.height - m);
    this.ballMarker.setPosition(x, y).setVisible(true).setAlpha(0.6 + 0.4 * Math.abs(Math.sin(this.time.now / 250)));
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    if (!this.player || !this.fighters.length) return; // un amico che aspetta la partita
    this.netFighters?.update(dt);
    if (this.authority) this.sendBall(dt);
    this.view.update(dt, this.cameras.main);
    this.updateHideouts(dt);
    this.updateBallMarker();
    if (this.over || this.intro) return;
    if (this.pause > 0) {
      this.pause -= dt;
      return;
    }
    if (this.authority) {
      this.pickUpBall(dt);
      this.checkGoal();
    }
    this.controls.update(dt);

    // il tempo: con gli amici lo decide il capo stanza (gli altri lo ricevono con la palla)
    if (this.authority) this.timeLeft -= dt;
    const t = Math.max(0, Math.ceil(this.timeLeft));
    this.hud.setStorm(`${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, t <= 10);
    if (this.timeLeft <= 0 && this.authority) this.endMatch();
  }
}
