import Phaser from 'phaser';
import { stopMenuMusic } from '../audio/Music';
import { COLOR_VARIANTS } from '../art/palette';
import { CAMERA_LERP } from '../config';
import type { MapData, ZoneData } from '../data/maps';
import { MAPPA_VALLE } from '../data/valle';
import { MAPPA_NILO } from '../data/nilo';
import { BOT_NAMES, DUO_SETUP, SOLO_SETUP } from '../data/bots';
import { trophiesForPlace, type GameMode } from '../data/progression';
import { currentBotLevel, pickBotGods } from '../ai/botPicks';
import { SaveManager } from '../save/SaveManager';
import { isPlayable } from '../data/characters';
import { HIDEOUT_REVEAL_DISTANCE } from '../data/combat';
import { Combat } from '../entities/Combat';
import { Player, DEFEATED_EVENT } from '../entities/Player';
import { Bot } from '../entities/Bot';
import { BigPyramid } from '../entities/BigPyramid';
import { Chest, CHEST_BROKEN_EVENT } from '../entities/Chest';
import { Gem } from '../entities/Gem';
import { Storm } from '../entities/Storm';
import { GEM, MATCH_INTRO, STORM } from '../data/match';
import { BushPatch } from '../entities/BushPatch';
import { Camel } from '../entities/Camel';
import { Minimap } from '../ui/Minimap';
import { addFpsMeter } from '../ui/FpsMeter';
import { Target } from '../entities/Target';
import { MatchHud } from '../ui/MatchHud';
import { showEndOverlay } from '../ui/EndOverlay';
import { showToast } from '../ui/Toast';
import { showMatchIntro } from '../ui/MatchIntro';
import { PlayerControls } from '../ui/PlayerControls';
import { SEAT_VARIANTS } from '../data/net';
import { PROBLEM_TEXT, getSession, type NetSession } from '../net/Session';
import { NetFighters } from '../net/NetFighters';
import type { FighterSetup, SetupMsg } from '../net/protocol';
import { goTo, outlinedText } from '../ui/MenuKit';
import { MapView } from './MapView';
import type { ResultsData } from './ResultsScene';

/** Le mappe della battaglia (il nome serve per dirla agli amici). */
const MAPS: Record<string, MapData> = { valle: MAPPA_VALLE, nilo: MAPPA_NILO };

/** Numero del primo bot (0-3 sono i posti degli amici). */
const FIRST_BOT_ID = 10;

/**
 * La partita: Solo (tu contro 9 bot, vince l'ultimo rimasto) o Duo (5 squadre da 2, vince l'ultima squadra).
 * Con gli amici (GAME_DESIGN.md, sezione 13) il capo stanza prepara la partita (mappa, posti, bot) e la manda
 * agli altri; bot, tempesta, bauli, gioielli e classifica li decide lui. I posti liberi sono bot.
 */
export class MatchScene extends Phaser.Scene {
  private player!: Player;
  private fighters: Player[] = [];
  private pyramids: BigPyramid[] = [];
  private view!: MapView;
  private map!: MapData;
  private minimap!: Minimap;
  private currentZone: ZoneData | null = null;
  private zoneCheck = 0;
  private chests: Chest[] = [];
  private gems: Gem[] = [];
  private storm!: Storm;
  private stormTick = 0;
  private controls!: PlayerControls;
  private hud!: MatchHud;
  private combat!: Combat;
  private over = false;
  /** Conto alla rovescia iniziale in corso: nessuno si muove e la tempesta aspetta. */
  private intro = false;
  private mode: GameMode = 'solo';
  /** la stanza degli amici (null = partita contro i bot da soli) */
  private net: NetSession | null = null;
  private netFighters: NetFighters | null = null;
  /** numero di ogni personaggio (0-3 amici, da 10 in su bot) */
  private readonly ids = new Map<Player, number>();
  private readonly byId = new Map<number, Player>();
  /** gioielli per numero (con gli amici il capo stanza li numera) */
  private readonly gemById = new Map<number, Gem>();
  private readonly gemIdOf = new Map<Gem, number>();
  private nextGemId = 1;
  /** capo stanza: cose da mandare agli amici */
  private outGems: { add: [number, number, number, number, number][]; taken: [number, number][] } = { add: [], taken: [] };
  private outChests = new Map<number, number>();
  private worldTimer = 0;
  /** amici (numeri) che hanno già finito la loro battaglia */
  private readonly placed = new Set<number>();
  private humanIds: number[] = [];
  /** il mio risultato è già salvato (il capo stanza può restare a guardare gli amici) */
  private finished = false;
  private leaving = false;
  private unsubscribe: (() => void)[] = [];
  private waitText: Phaser.GameObjects.Text | null = null;
  private resultData: ResultsData | null = null;
  private camels: Camel[] = [];
  private targets: Target[] = [];

  constructor() {
    super('Match');
  }

  init(data: { net?: boolean }): void {
    const s = data?.net ? getSession() : null;
    this.net = s && !s.closed ? s : null;
  }

  create(): void {
    stopMenuMusic();
    this.combat = new Combat();
    this.currentZone = null;
    this.fighters = [];
    this.over = false;
    this.finished = false;
    this.leaving = false;
    this.resultData = null;
    this.ids.clear();
    this.byId.clear();
    this.gemById.clear();
    this.gemIdOf.clear();
    this.nextGemId = 1;
    this.outGems = { add: [], taken: [] };
    this.outChests = new Map();
    this.worldTimer = 0;
    this.placed.clear();
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
      if (s.lastSetup) this.startFromSetup(s.lastSetup);
      else {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x14213d);
        this.waitText = outlinedText(this, width / 2, height / 2, 'Il capo stanza prepara la partita...', 40);
      }
      return;
    }

    // da soli o capo stanza: si prepara la partita (e la si manda agli amici)
    const mapKey = this.chooseMapKey();
    const mode: 'solo' | 'duo' = s
      ? s.choice.mode === 'duo'
        ? 'duo'
        : 'solo'
      : new URLSearchParams(location.search).has('duo') || SaveManager.getMode() === 'duo'
        ? 'duo'
        : 'solo';
    this.buildWorld(mapKey, mode);
    const setup: SetupMsg = { t: 'partita', mode, map: mapKey, fighters: this.makeFighters(mode) };
    s?.send(setup);
    this.buildFighters(setup);
  }

  /** Un amico: è arrivata la partita dal capo stanza. */
  private startFromSetup(setup: SetupMsg): void {
    if (this.fighters.length) return; // già costruita
    this.waitText?.destroy();
    this.waitText = null;
    this.buildWorld(setup.map, setup.mode);
    this.buildFighters(setup);
  }

  /** La mappa con tutto quello che c'è sopra: ostacoli, piramidi, bauli, cammelli, tempesta. */
  private buildWorld(mapKey: string, mode: 'solo' | 'duo'): void {
    const map = MAPS[mapKey] ?? MAPPA_VALLE;
    this.map = map;
    this.mode = mode;
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.view = new MapView(this, map, this.combat);
    const walls = this.view.walls;
    this.camels = (map.camels ?? []).map((c) => new Camel(this, { x: c.x1, y: c.y1 }, { x: c.x2, y: c.y2 }));
    this.pyramids = (map.bigPyramids ?? []).map((p) => new BigPyramid(this, walls, p.x, p.y));
    this.targets = map.targets.map((t) => new Target(this, t.x, t.y, this.combat));
    this.gems = [];
    const authority = !this.net || this.net.isHost;
    this.chests = (map.chests ?? []).map((c, i) => {
      const chest = new Chest(this, c.x, c.y, this.combat);
      chest.hideout = this.pyramids.find((p) => p.contains(c.x, c.y)) ?? null;
      // con gli amici i gioielli dei bauli li fa uscire il capo stanza (e li manda agli altri)
      chest.on(CHEST_BROKEN_EVENT, (x: number, y: number, n: number) => authority && this.spawnGems(x, y, n));
      if (this.net) chest.net = { authority, onHit: authority ? (hp) => this.outChests.set(i, Math.round(hp)) : undefined };
      this.view.culler.addCustom(new Phaser.Geom.Rectangle(c.x - 60, c.y - 130, 120, 140), (on) => chest.setInView(on));
      return chest;
    });
    this.storm = new Storm(
      this,
      map.width,
      map.height,
      map.stormCenter ?? { x: map.width / 2, y: map.height / 2 },
      map.storm ?? STORM,
    );
    this.stormTick = 0;
  }

  /**
   * Chi gioca e dove parte. Solo: ognuno nella sua squadra (tutti contro tutti).
   * Duo: 5 squadre da 2, i compagni partono vicini. Con gli amici le squadre del Duo le ha scelte il capo stanza;
   * chi resta senza compagno ha un bot.
   */
  private makeFighters(mode: 'solo' | 'duo'): FighterSetup[] {
    const map = this.map;
    const s = this.net;
    const spawns = Phaser.Utils.Array.Shuffle([map.spawn, ...(map.botSpawns ?? [])]);
    const nextTo = (sp: { x: number; y: number }) => {
      const a = Math.random() * Math.PI * 2;
      return this.combat.freeSpot(sp.x, sp.y, sp.x + Math.cos(a) * DUO_SETUP.teammateGap, sp.y + Math.sin(a) * DUO_SETUP.teammateGap, 30);
    };
    // gli amici (da soli: solo io, posto 0)
    // "?eroe=horus" nell'indirizzo: prova subito un personaggio (solo per le prove)
    const forced = new URLSearchParams(location.search).get('eroe');
    const myId = forced && isPlayable(forced) ? forced : SaveManager.getSelectedCharacter();
    const humans = s
      ? s.members.map((m) => ({ id: m.seat, characterId: isPlayable(m.characterId) ? m.characterId : 'horus', level: m.level, name: m.name }))
      : [{ id: 0, characterId: myId, level: SaveManager.getLevel(myId), name: '' }];

    // le squadre: liste di amici (Solo: uno per squadra)
    let humanTeams: number[][];
    if (mode === 'duo') humanTeams = s ? s.choice.teams.filter((t) => t.length) : [[0]];
    else humanTeams = humans.map((h) => [h.id]);
    const totalTeams = mode === 'duo' ? DUO_SETUP.teams : SOLO_SETUP.botCount + 1;
    const teamSize = mode === 'duo' ? 2 : 1;

    const level = currentBotLevel();
    const names = Phaser.Utils.Array.Shuffle([...BOT_NAMES]);
    const botCount = Math.min(totalTeams, spawns.length) * teamSize - humans.length;
    const gods = pickBotGods(Math.max(0, botCount), myId);
    let botIndex = 0;
    const out: FighterSetup[] = [];
    const addBot = (team: number, at: { x: number; y: number }) => {
      if (botIndex >= gods.length) return;
      out.push({
        id: FIRST_BOT_ID + botIndex,
        characterId: gods[botIndex],
        level: level.characterLevel,
        team,
        x: Math.round(at.x),
        y: Math.round(at.y),
        name: names[botIndex % names.length],
      });
      botIndex++;
    };
    for (let team = 0; team < totalTeams && spawns.length; team++) {
      const sp = spawns.shift()!;
      const members = humanTeams[team] ?? [];
      members.forEach((id, i) => {
        const h = humans.find((x) => x.id === id)!;
        const at = i === 0 ? sp : nextTo(sp);
        out.push({ id, characterId: h.characterId, level: h.level, team, x: Math.round(at.x), y: Math.round(at.y), name: h.name });
      });
      for (let i = members.length; i < teamSize; i++) addBot(team, i === 0 ? sp : nextTo(sp));
    }
    return out;
  }

  /** Mette in campo i personaggi della partita: io, gli amici e i bot. */
  private buildFighters(setup: SetupMsg): void {
    const map = this.map;
    const s = this.net;
    const host = !s || s.isHost;
    const myId = s ? s.mySeat : 0;
    const duo = setup.mode === 'duo';
    const mine = setup.fighters.find((f) => f.id === myId) ?? setup.fighters[0];
    const myTeam = mine.team;
    const level = currentBotLevel();
    this.humanIds = setup.fighters.filter((f) => f.id < FIRST_BOT_ID).map((f) => f.id);

    for (const f of setup.fighters) {
      const isMe = f.id === mine.id;
      const isBot = f.id >= FIRST_BOT_ID;
      const ally = !isMe && f.team === myTeam;
      // Solo: tutti con i colori veri. Duo: ogni squadra nemica un colore. Gli amici: il loro colore di posto.
      const variant = isMe
        ? 'base'
        : duo && !ally
          ? COLOR_VARIANTS[(f.team % (COLOR_VARIANTS.length - 1)) + 1]
          : !isBot
            ? SEAT_VARIANTS[f.id % SEAT_VARIANTS.length]
            : 'base';
      const opt = {
        characterId: f.characterId,
        level: f.level,
        team: f.team,
        combat: this.combat,
        variant,
        name: isMe ? undefined : isBot && ally ? `${f.name} (amico)` : f.name,
        ally,
      };
      let p: Player;
      if (isMe) p = new Player(this, f.x, f.y, { ...opt, isHuman: true });
      else if (isBot && host) p = this.makeBot(f, opt, level, duo);
      // un amico (o, sul telefono di un amico, un bot): lo muovono i messaggi del suo telefono
      else p = new Player(this, f.x, f.y, opt);
      if (isMe) this.player = p;
      this.fighters.push(p);
      this.ids.set(p, f.id);
      this.byId.set(f.id, p);
    }

    const walls = this.view.walls;
    for (const f of this.fighters) {
      const local = f === this.player || f instanceof Bot;
      if (local) {
        this.physics.add.collider(f, walls);
        if (this.targets.length) this.physics.add.collider(f, this.targets);
        if (this.chests.length) this.physics.add.collider(f, this.chests);
        if (this.camels.length) this.physics.add.collider(f, this.camels);
      }
      f.on(DEFEATED_EVENT, (who: Player) => this.onDefeated(who));
    }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.width, map.height);
    cam.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
    cam.setRoundPixels(true);

    // Controlli touch: movimento a sinistra, mira/attacco a destra
    this.controls = new PlayerControls(this, this.player);
    this.hud = new MatchHud(this);
    this.updateRemaining();
    this.minimap = new Minimap(this, map);
    // all'inizio il nome della mappa, poi quello delle zone
    this.zoneCheck = 0;
    if (map.name) {
      this.hud.showZone(map.name);
      this.zoneCheck = 2.6;
    }
    addFpsMeter(this);

    if (s) {
      const others = new Map<number, Player>();
      for (const [id, p] of this.byId) if (p !== this.player) others.set(id, p);
      this.netFighters = new NetFighters(this, {
        session: s,
        me: this.player,
        others,
        local: host ? [...this.byId.keys()].filter((id) => id >= FIRST_BOT_ID) : [],
        removeOnLeave: false,
        onLeft: (m) => {
          showToast(this, `${m.name} è uscito`);
          // il suo dio è sconfitto (lo decide il capo stanza)
          if (s.isHost) this.byId.get(m.seat)?.forceDefeat();
        },
      });
    }
    this.startIntro();
  }

  /** Un bot con il suo cervello (da soli o sul telefono del capo stanza). */
  private makeBot(f: FighterSetup, opt: ConstructorParameters<typeof Player>[3], level: ReturnType<typeof currentBotLevel>, duo: boolean): Bot {
    const map = this.map;
    const bot: Bot = new Bot(this, f.x, f.y, opt, level, {
      width: map.width,
      height: map.height,
      stayClose: DUO_SETUP.stayClose,
      teammate: duo ? () => this.fighters.find((x) => x !== bot && x.team === f.team && x.isAlive()) ?? null : undefined,
      safeZone: () => ({ x: this.storm.cx, y: this.storm.cy, r: this.storm.radius }),
      nearestGem: (x, y, maxDist) => {
        let best: Gem | null = null;
        let bestD = maxDist;
        for (const g of this.gems) {
          const d = Phaser.Math.Distance.Between(x, y, g.x, g.y);
          if (d < bestD) {
            bestD = d;
            best = g;
          }
        }
        return best;
      },
      nearestBush: (x, y, maxDist) => this.view.nearestBush(x, y, maxDist),
      routeVia: (fx, fy, tx, ty) => {
        for (const p of this.pyramids) {
          const via = p.routeVia(fx, fy, tx, ty);
          if (via) return via;
        }
        return null;
      },
    });
    return bot;
  }

  // ------------------------------------------------------------------ amici (multiplayer)

  private listenNet(s: NetSession): void {
    this.unsubscribe.push(
      s.events.on('msg', (msg) => {
        if (msg.t === 'partita' && !s.isHost) this.startFromSetup(msg);
        else if (msg.t === 'mondo' && !s.isHost) {
          this.storm?.syncElapsed(msg.storm);
          for (const [i, hp] of msg.chests ?? []) this.chests[i]?.netSetHealth(hp);
        } else if (msg.t === 'gioielli' && !s.isHost) {
          for (const [id, fx, fy, x, y] of msg.add ?? []) this.addGem(id, fx, fy, x, y);
          for (const [id, who] of msg.taken ?? []) {
            const g = this.gemById.get(id);
            const f = this.byId.get(who);
            if (!g || g.isTaken) continue;
            g.pick(f?.x ?? g.x, f?.y ?? g.y);
            f?.addGem();
          }
          this.gems = this.gems.filter((g) => !g.isTaken);
        } else if (msg.t === 'piazzamento' && !s.isHost && msg.seat === s.mySeat) {
          this.endMatch(msg.place);
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

  /** Capo stanza: manda agli amici gioielli, bauli e tempesta. */
  private sendWorld(dt: number): void {
    const s = this.net;
    if (!s?.isHost || s.closed) return;
    if (this.outGems.add.length || this.outGems.taken.length) {
      s.send({ t: 'gioielli', ...this.outGems });
      this.outGems = { add: [], taken: [] };
    }
    this.worldTimer -= dt;
    if (this.worldTimer > 0 && !this.outChests.size) return;
    this.worldTimer = 0.5;
    const chests = [...this.outChests];
    this.outChests.clear();
    s.send({ t: 'mondo', storm: Math.round(this.storm.secondsElapsed * 100) / 100, chests: chests.length ? chests : undefined });
  }

  /** I secondi di preparazione: tutti fermi, si vedono gli avversari, poi "VIA!". */
  private startIntro(): void {
    this.intro = true;
    this.controls.setEnabled(false);
    const bots = this.fighters.filter((f): f is Bot => f instanceof Bot);
    for (const b of bots) b.frozen = true;
    showMatchIntro(this, {
      seconds: MATCH_INTRO.seconds,
      me: this.player,
      fighters: this.fighters,
      onGo: () => {
        this.intro = false;
        for (const b of bots) b.frozen = false;
        if (!this.over) this.controls.setEnabled(true);
      },
    });
  }

  private aliveCount(): number {
    return this.fighters.filter((f) => f.isAlive()).length;
  }

  /** Quante squadre hanno ancora almeno un personaggio in piedi. */
  private aliveTeams(): number {
    return new Set(this.fighters.filter((f) => f.isAlive()).map((f) => f.team)).size;
  }

  /** Il contatore in alto: giocatori rimasti (Solo) o squadre rimaste (Duo). */
  private updateRemaining(): void {
    if (this.mode === 'duo') this.hud.setRemaining(this.aliveTeams(), 'Squadre');
    else this.hud.setRemaining(this.aliveCount());
  }

  /** Il compagno di squadra ancora in piedi (Duo), oppure null. */
  private aliveTeammate(): Player | null {
    return this.fighters.find((f) => f !== this.player && f.team === this.player.team && f.isAlive()) ?? null;
  }

  /** Una mappa a caso tra le due ("?mappa=nilo" o "?mappa=valle" nell'indirizzo la sceglie, per le prove). */
  private chooseMapKey(): string {
    const forced = new URLSearchParams(location.search).get('mappa');
    if (forced && MAPS[forced]) return forced;
    return Phaser.Utils.Array.GetRandom(Object.keys(MAPS));
  }

  /** Qualcuno è stato sconfitto: aggiorna il contatore e controlla se la partita è finita. */
  private onDefeated(who: Player): void {
    const authority = !this.net || this.net.isHost;
    // chi viene sconfitto lascia cadere i suoi gioielli (con gli amici li fa uscire il capo stanza)
    if (who.gems > 0 && authority) this.spawnGems(who.x, who.y, who.gems);
    this.updateRemaining();

    if (authority) {
      // chi ha finito la sua battaglia? (da soli: solo io; con gli amici: tutti gli amici)
      for (const id of this.humanIds) {
        if (this.placed.has(id)) continue;
        const h = this.byId.get(id);
        if (!h) continue;
        const place = this.placeOf(h);
        if (place === null) continue;
        this.placed.add(id);
        if (h === this.player) this.endMatch(place);
        else this.net?.send({ t: 'piazzamento', seat: id, place });
      }
      this.maybeLeave();
    }
    if (this.finished && !this.player.isAlive()) this.watchSomeone();

    // la telecamera e gli avvisi per il Duo
    if (this.mode === 'duo' && !this.finished) {
      const mate = this.aliveTeammate();
      if (who === this.player && mate) {
        // tu sei fuori ma il compagno combatte ancora: la telecamera segue lui
        this.controls.setEnabled(false);
        this.cameras.main.startFollow(mate, true, CAMERA_LERP, CAMERA_LERP);
      } else if (who !== this.player && who.team === this.player.team) {
        showToast(this, 'Il tuo compagno è stato sconfitto!');
      }
    }
  }

  /**
   * Il posto in classifica di un giocatore (null = sta ancora giocando). Si chiama subito dopo ogni sconfitta.
   * Solo: chi è appena stato sconfitto prende "quanti erano ancora in gioco"; l'ultimo rimasto vince.
   * Duo: quando la sua squadra è fuori prende "quante squadre erano ancora in gioco"; l'ultima squadra vince.
   */
  private placeOf(h: Player): number | null {
    if (this.mode === 'duo') {
      const teams = this.aliveTeams();
      const teamIn = this.fighters.some((f) => f.team === h.team && f.isAlive());
      if (!teamIn) return teams + 1;
      return teams === 1 ? 1 : null;
    }
    const alive = this.aliveCount();
    if (!h.isAlive()) return alive + 1;
    return alive === 1 ? 1 : null;
  }

  /** Il capo stanza ha finito ma gli amici giocano ancora: la telecamera segue un amico (o chiunque sia in piedi). */
  private watchSomeone(): void {
    const friend = this.humanIds.map((id) => this.byId.get(id)).find((p) => p && p !== this.player && p.isAlive());
    const target = friend ?? this.fighters.find((f) => f.isAlive());
    if (target) this.cameras.main.startFollow(target, true, CAMERA_LERP, CAMERA_LERP);
  }

  /** Fine della mia partita: salva subito le coppe e mostra la scritta. Poi (quando si può) si va ai Risultati. */
  private endMatch(place: number): void {
    if (this.finished) return;
    this.finished = true;
    this.over = true;
    this.controls.setEnabled(false);

    const characterId = this.player.stats.id;
    const reward = SaveManager.recordMatch(characterId, place, trophiesForPlace(place, this.mode));
    const victory = place === 1;
    const title = victory ? 'VITTORIA!' : this.mode === 'duo' ? `Squadra sconfitta — ${place}° posto` : `Sconfitto — ${place}° posto`;
    this.time.delayedCall(1100, () => showEndOverlay(this, title, victory));
    this.resultData = {
      ...reward,
      mode: this.mode,
      playerCount: this.mode === 'duo' ? new Set(this.fighters.map((f) => f.team)).size : this.fighters.length,
      net: !!this.net,
    };
    if (this.net?.isHost && this.placed.size < this.humanIds.length) {
      this.time.delayedCall(3000, () => {
        if (!this.leaving) showToast(this, 'I tuoi amici giocano ancora:\nguardali finché non finiscono!', 3);
      });
    }
    this.maybeLeave();
  }

  /** Si va ai Risultati: da soli e per gli amici subito; il capo stanza quando hanno finito tutti. */
  private maybeLeave(): void {
    if (!this.finished || this.leaving || !this.resultData) return;
    if (this.net?.isHost && this.placed.size < this.humanIds.length) return;
    this.leaving = true;
    const data = this.resultData;
    this.time.delayedCall(3000, () => {
      this.cameras.main.fadeOut(300, 20, 33, 61);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Results', data));
    });
  }

  /** Fa uscire `n` gioielli da (x, y): saltano un po' attorno e atterrano sulla sabbia. */
  private spawnGems(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = (i / Math.max(1, n)) * Math.PI * 2 + Math.random();
      const r = n === 1 ? 50 : 60 + Math.random() * 30;
      const tx = Phaser.Math.Clamp(x + Math.cos(a) * r, 40, this.physics.world.bounds.width - 40);
      const ty = Phaser.Math.Clamp(y + Math.sin(a) * r * 0.6 + 30, 40, this.physics.world.bounds.height - 40);
      const id = this.nextGemId++;
      this.addGem(id, x, y, tx, ty);
      if (this.net) this.outGems.add.push([id, Math.round(x), Math.round(y), Math.round(tx), Math.round(ty)]);
    }
  }

  private addGem(id: number, fromX: number, fromY: number, x: number, y: number): void {
    const g = new Gem(this, fromX, fromY, x, y);
    this.gems.push(g);
    this.gemById.set(id, g);
    this.gemIdOf.set(g, id);
  }

  /** Chi passa sopra un gioiello lo raccoglie. */
  private pickUpGems(): void {
    for (const g of this.gems) {
      if (!g.canBePicked()) continue;
      for (const f of this.fighters) {
        if (!f.canAct()) continue;
        if (Phaser.Math.Distance.Between(f.x, f.y, g.x, g.y) < GEM.pickupRadius) {
          f.addGem();
          g.pick(f.x, f.y);
          if (this.net) this.outGems.taken.push([this.gemIdOf.get(g) ?? 0, this.ids.get(f) ?? 0]);
          break;
        }
      }
    }
    this.gems = this.gems.filter((g) => !g.isTaken);
  }

  /** La tempesta si stringe; ogni secondo toglie vita a chi è fuori dal cerchio. */
  private updateStorm(dt: number): void {
    this.storm.update(dt, this.cameras.main.worldView);
    this.stormTick += dt;
    if (this.stormTick >= 1) {
      this.stormTick -= 1;
      // con gli amici la vita la toglie il capo stanza (sugli altri telefoni questo colpo non conta)
      for (const f of this.fighters) {
        if (f.isTargetable() && this.storm.isInside(f.x, f.y)) {
          f.takeDamage(STORM.damagePerSecond);
          if (f === this.player) this.cameras.main.shake(90, 0.004);
        }
      }
    }
    const inStorm = this.player.isAlive() && this.storm.isInside(this.player.x, this.player.y);
    let msg: string;
    if (!this.player.isAlive() && this.aliveTeammate()) msg = 'Il tuo compagno combatte ancora!';
    else if (inStorm) msg = 'Esci dalla tempesta!';
    else if (this.storm.secondsToStart > 0) msg = `Tempesta tra ${Math.ceil(this.storm.secondsToStart)}`;
    else if (!this.storm.finished) msg = 'La tempesta si stringe!';
    else msg = '';
    this.hud.setStorm(msg, inStorm);
  }

  /** Chi è dentro una piramide? Il tetto diventa trasparente per il giocatore e chi è nascosto sparisce. */
  private updateHideouts(dt: number): void {
    const now = this.time.now;
    for (const f of this.fighters) {
      const place = this.pyramids.find((p) => p.contains(f.x, f.y)) ?? this.view.bushAt(f.x, f.y);
      // chi ha appena attaccato da un cespuglio si vede per un attimo
      f.hideout = f.isInvisible() ? Player.INVISIBLE : place instanceof BushPatch && f.revealedUntil > now ? null : place;
      this.view.applyTerrain(f);
    }
    const me = this.player;
    this.view.setSeeThroughBush(this.view.bushAt(me.x, me.y));
    me.setHiddenLook(!!me.hideout);
    this.view.updateTallThings(me, dt);
    for (const p of this.pyramids) p.updateView(me.x, me.y, dt);
    for (const c of this.chests) if (c.hideout) c.setRevealed(c.hideout === me.hideout);
    for (const f of this.fighters) {
      if (f === me) continue;
      const near = Phaser.Math.Distance.Between(f.x, f.y, me.x, me.y) < HIDEOUT_REVEAL_DISTANCE;
      // con l'Occhio di Horus si vedono tutti, anche quelli nascosti
      // il compagno di squadra si vede sempre
      f.setRevealed(!f.hideout || f.hideout === me.hideout || near || me.seesAll() || f.team === me.team);
    }
  }

  /** Nome della zona quando il giocatore ci entra. */
  private updateZone(dt: number): void {
    this.zoneCheck -= dt;
    if (this.zoneCheck > 0) return;
    this.zoneCheck = 0.3;
    const me = this.player;
    const zone = (this.map.zones ?? []).find((z) => me.x >= z.x && me.x < z.x + z.w && me.y >= z.y && me.y < z.y + z.h) ?? null;
    if (zone && zone !== this.currentZone) this.hud.showZone(zone.name);
    this.currentZone = zone;
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    if (!this.player || !this.fighters.length) return; // un amico che aspetta la partita
    this.netFighters?.update(dt);
    this.view.update(dt, this.cameras.main);
    this.updateZone(dt);
    const mate = this.mode === 'duo' ? this.aliveTeammate() : null;
    this.minimap.update({ x: this.player.x, y: this.player.y, alive: this.player.isAlive() }, this.storm, mate);
    this.updateHideouts(dt);
    // durante il conto alla rovescia la tempesta non avanza
    this.updateStorm(this.intro ? 0 : dt);
    // i gioielli li raccoglie chi decide (da soli o il capo stanza)
    if (!this.net || this.net.isHost) this.pickUpGems();
    this.sendWorld(dt);
    if (this.over) return;
    this.controls.update(dt);
  }
}
