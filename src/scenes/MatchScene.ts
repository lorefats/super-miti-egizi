import Phaser from 'phaser';
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
import { GEM, STORM } from '../data/match';
import { BushPatch } from '../entities/BushPatch';
import { Camel } from '../entities/Camel';
import { Minimap } from '../ui/Minimap';
import { addFpsMeter } from '../ui/FpsMeter';
import { Target } from '../entities/Target';
import { MatchHud } from '../ui/MatchHud';
import { showEndOverlay } from '../ui/EndOverlay';
import { showToast } from '../ui/Toast';
import { PlayerControls } from '../ui/PlayerControls';
import { MapView } from './MapView';

/** La partita: Solo (tu contro 9 bot, vince l'ultimo rimasto) o Duo (5 squadre da 2, vince l'ultima squadra). */
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
  private mode: GameMode = 'solo';

  constructor() {
    super('Match');
  }

  create(): void {
    const map = this.chooseMap();
    this.map = map;
    this.combat = new Combat();
    this.currentZone = null;
    this.fighters = [];
    this.over = false;

    this.view = new MapView(this, map, this.combat);
    const walls = this.view.walls;
    const camels = (map.camels ?? []).map((c) => new Camel(this, { x: c.x1, y: c.y1 }, { x: c.x2, y: c.y2 }));
    this.pyramids = (map.bigPyramids ?? []).map((p) => new BigPyramid(this, walls, p.x, p.y));
    const targets = map.targets.map((t) => new Target(this, t.x, t.y, this.combat));
    this.gems = [];
    this.chests = (map.chests ?? []).map((c) => {
      const chest = new Chest(this, c.x, c.y, this.combat);
      chest.hideout = this.pyramids.find((p) => p.contains(c.x, c.y)) ?? null;
      chest.on(CHEST_BROKEN_EVENT, (x: number, y: number, n: number) => this.spawnGems(x, y, n));
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

    // "?duo" nell'indirizzo forza la modalità Duo (solo per le prove)
    this.mode = new URLSearchParams(location.search).has('duo') || SaveManager.getMode() === 'duo' ? 'duo' : 'solo';
    const duo = this.mode === 'duo';

    // partenze a caso. Solo: ognuno nella sua squadra (tutti contro tutti).
    // Duo: 5 squadre da 2, i compagni partono vicini (squadra 0 = tu e il tuo compagno).
    const spawns = Phaser.Utils.Array.Shuffle([map.spawn, ...(map.botSpawns ?? [])]);
    const mySpawn = spawns.shift()!;
    // "?eroe=horus" nell'indirizzo: prova subito un personaggio (solo per le prove)
    const forced = new URLSearchParams(location.search).get('eroe');
    const myId = forced && isPlayable(forced) ? forced : SaveManager.getSelectedCharacter();
    this.player = new Player(this, mySpawn.x, mySpawn.y, {
      characterId: myId,
      level: SaveManager.getLevel(myId),
      team: 0,
      combat: this.combat,
      isHuman: true,
    });
    this.fighters.push(this.player);

    // posti di partenza dei bot, con la loro squadra
    const seats: { x: number; y: number; team: number; ally: boolean }[] = [];
    const nextTo = (sp: { x: number; y: number }) => {
      const a = Math.random() * Math.PI * 2;
      return this.combat.freeSpot(sp.x, sp.y, sp.x + Math.cos(a) * DUO_SETUP.teammateGap, sp.y + Math.sin(a) * DUO_SETUP.teammateGap, 30);
    };
    if (duo) {
      seats.push({ ...nextTo(mySpawn), team: 0, ally: true });
      for (let t = 1; t < DUO_SETUP.teams && t - 1 < spawns.length; t++) {
        const sp = spawns[t - 1];
        seats.push({ x: sp.x, y: sp.y, team: t, ally: false }, { ...nextTo(sp), team: t, ally: false });
      }
    } else {
      const botCount = Math.min(SOLO_SETUP.botCount, spawns.length);
      for (let i = 0; i < botCount; i++) seats.push({ x: spawns[i].x, y: spawns[i].y, team: i + 1, ally: false });
    }

    const names = Phaser.Utils.Array.Shuffle([...BOT_NAMES]);
    const level = currentBotLevel();
    // ogni bot è un dio diverso, scelto a caso (e diverso dal tuo, così non ti confondi)
    const gods = pickBotGods(seats.length, myId);
    seats.forEach((seat, i) => {
      const bot: Bot = new Bot(
        this,
        seat.x,
        seat.y,
        {
          characterId: gods[i],
          level: level.characterLevel,
          team: seat.team,
          combat: this.combat,
          // Solo: tutti con i colori veri. Duo: il compagno con i colori veri, ogni squadra nemica un colore
          variant: duo && !seat.ally ? COLOR_VARIANTS[(seat.team % (COLOR_VARIANTS.length - 1)) + 1] : 'base',
          name: seat.ally ? `${names[i % names.length]} (amico)` : names[i % names.length],
          ally: seat.ally,
        },
        level,
        {
          width: map.width,
          height: map.height,
          stayClose: DUO_SETUP.stayClose,
          teammate: duo ? () => this.fighters.find((f) => f !== bot && f.team === seat.team && f.isAlive()) ?? null : undefined,
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
        },
      );
      this.fighters.push(bot);
    });

    for (const f of this.fighters) {
      this.physics.add.collider(f, walls);
      if (targets.length) this.physics.add.collider(f, targets);
      if (this.chests.length) this.physics.add.collider(f, this.chests);
      if (camels.length) this.physics.add.collider(f, camels);
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
  private chooseMap(): MapData {
    const maps: Record<string, MapData> = { valle: MAPPA_VALLE, nilo: MAPPA_NILO };
    const forced = new URLSearchParams(location.search).get('mappa');
    if (forced && maps[forced]) return maps[forced];
    return Phaser.Utils.Array.GetRandom(Object.values(maps));
  }

  /** Qualcuno è stato sconfitto: aggiorna il contatore e controlla se la partita è finita. */
  private onDefeated(who: Player): void {
    // chi viene sconfitto lascia cadere i suoi gioielli
    if (who.gems > 0) this.spawnGems(who.x, who.y, who.gems);
    const alive = this.aliveCount();
    this.updateRemaining();
    if (this.over) return;

    if (this.mode === 'duo') {
      const teams = this.aliveTeams();
      const mate = this.aliveTeammate();
      const myTeamIn = this.player.isAlive() || !!mate;
      if (!myTeamIn) {
        // la squadra è fuori: il posto è quante squadre erano ancora in gioco
        this.endMatch(teams + 1);
      } else if (teams === 1) {
        this.endMatch(1);
      } else if (who === this.player && mate) {
        // tu sei fuori ma il compagno combatte ancora: la telecamera segue lui
        this.controls.setEnabled(false);
        this.cameras.main.startFollow(mate, true, CAMERA_LERP, CAMERA_LERP);
      } else if (who.team === this.player.team) {
        showToast(this, 'Il tuo compagno è stato sconfitto!');
      }
      return;
    }

    if (who === this.player) {
      // il posto è quanti erano ancora in gioco prima di essere sconfitto
      this.endMatch(alive + 1);
    } else if (alive === 1 && this.player.isAlive()) {
      this.endMatch(1);
    }
  }

  /** Fine partita: salva subito le coppe, mostra la scritta e poi passa ai Risultati. */
  private endMatch(place: number): void {
    this.over = true;
    this.controls.setEnabled(false);

    const characterId = this.player.stats.id;
    const reward = SaveManager.recordMatch(characterId, place, trophiesForPlace(place, this.mode));
    const victory = place === 1;
    const title = victory ? 'VITTORIA!' : this.mode === 'duo' ? `Squadra sconfitta — ${place}° posto` : `Sconfitto — ${place}° posto`;
    this.time.delayedCall(1100, () => showEndOverlay(this, title, victory));
    this.time.delayedCall(3000, () => {
      this.cameras.main.fadeOut(300, 20, 33, 61);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.scene.start('Results', {
          ...reward,
          mode: this.mode,
          playerCount: this.mode === 'duo' ? new Set(this.fighters.map((f) => f.team)).size : this.fighters.length,
        }),
      );
    });
  }

  /** Fa uscire `n` gioielli da (x, y): saltano un po' attorno e atterrano sulla sabbia. */
  private spawnGems(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = (i / Math.max(1, n)) * Math.PI * 2 + Math.random();
      const r = n === 1 ? 50 : 60 + Math.random() * 30;
      const tx = Phaser.Math.Clamp(x + Math.cos(a) * r, 40, this.physics.world.bounds.width - 40);
      const ty = Phaser.Math.Clamp(y + Math.sin(a) * r * 0.6 + 30, 40, this.physics.world.bounds.height - 40);
      this.gems.push(new Gem(this, x, y, tx, ty));
    }
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
    this.view.update(dt, this.cameras.main);
    this.updateZone(dt);
    const mate = this.mode === 'duo' ? this.aliveTeammate() : null;
    this.minimap.update({ x: this.player.x, y: this.player.y, alive: this.player.isAlive() }, this.storm, mate);
    this.updateHideouts(dt);
    this.updateStorm(dt);
    this.pickUpGems();
    if (this.over) return;
    this.controls.update(dt);
  }
}
