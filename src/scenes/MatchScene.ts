import Phaser from 'phaser';
import { TEX } from '../art';
import { COLOR_VARIANTS } from '../art/palette';
import { AIM_STICK, AUTO_AIM_RANGE_FACTOR, CAMERA_LERP, DEPTH, JOYSTICK } from '../config';
import type { GroundKind, MapData, ZoneData } from '../data/maps';
import { MAPPA_VALLE } from '../data/valle';
import { BOT_LEVELS, BOT_NAMES, SOLO_SETUP } from '../data/bots';
import { BOT_LEVEL_BY_TROPHIES, trophiesForPlace } from '../data/progression';
import { SaveManager } from '../save/SaveManager';
import { HIDEOUT_REVEAL_DISTANCE } from '../data/combat';
import { Combat } from '../entities/Combat';
import { createObstacle, type PlacedObstacle } from '../entities/Obstacle';
import { Player, DEFEATED_EVENT } from '../entities/Player';
import { Bot } from '../entities/Bot';
import { BigPyramid } from '../entities/BigPyramid';
import { Chest, CHEST_BROKEN_EVENT } from '../entities/Chest';
import { Gem } from '../entities/Gem';
import { Storm } from '../entities/Storm';
import { GEM, STORM, WATER } from '../data/match';
import { BushPatch } from '../entities/BushPatch';
import { Culler } from '../entities/Culler';
import { Camel } from '../entities/Camel';
import { Minimap } from '../ui/Minimap';
import { addFpsMeter } from '../ui/FpsMeter';
import { Target } from '../entities/Target';
import { VirtualStick } from '../ui/VirtualStick';
import { AimIndicator } from '../ui/AimIndicator';
import { SuperButton } from '../ui/SuperButton';
import { MatchHud } from '../ui/MatchHud';
import { showEndOverlay } from '../ui/EndOverlay';
import { fullscreenOnFirstTap } from '../ui/fullscreen';

/** Terreno di ogni zona → disegno da ripetere. */
const GROUND_TEXTURE: Record<GroundKind, string> = {
  sabbia: TEX.sabbia,
  roccia: TEX.terrenoRoccia,
  lastre: TEX.terrenoLastre,
  asfalto: TEX.terrenoAsfalto,
  bazar: TEX.terrenoBazar,
  erba: TEX.terrenoErba,
  oasi: TEX.terrenoOasi,
};

type KeyName = 'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'space' | 'e';

/** La partita Solo: tu contro i bot, vince l'ultimo rimasto. */
export class MatchScene extends Phaser.Scene {
  private player!: Player;
  private fighters: Player[] = [];
  private pyramids: BigPyramid[] = [];
  private bushes: BushPatch[] = [];
  private tallThings: (PlacedObstacle & { bounds: Phaser.Geom.Rectangle })[] = [];
  private waterTiles: Phaser.GameObjects.TileSprite[] = [];
  private map!: MapData;
  private minimap!: Minimap;
  private currentZone: ZoneData | null = null;
  private zoneCheck = 0;
  private culler!: Culler;
  private chests: Chest[] = [];
  private gems: Gem[] = [];
  private storm!: Storm;
  private stormTick = 0;
  private moveStick!: VirtualStick;
  private aimStick!: VirtualStick;
  private superButton!: SuperButton;
  private aimIndicator!: AimIndicator;
  private hud!: MatchHud;
  private combat!: Combat;
  private keys?: Record<KeyName, Phaser.Input.Keyboard.Key>;
  private readonly dir = new Phaser.Math.Vector2();
  private over = false;

  constructor() {
    super('Match');
  }

  create(): void {
    const map: MapData = MAPPA_VALLE;
    this.map = map;
    this.combat = new Combat();
    this.currentZone = null;
    this.fighters = [];
    this.over = false;

    this.physics.world.setBounds(0, 0, map.width, map.height);
    // terreno: ogni zona ha il suo; senza zone, sabbia dappertutto (un solo strato: meno fatica per il telefono)
    const zones = map.zones ?? [];
    if (zones.length === 0) this.add.tileSprite(0, 0, map.width, map.height, TEX.sabbia).setOrigin(0).setDepth(DEPTH.ground);
    for (const z of zones) {
      this.add
        .tileSprite(Math.floor(z.x), Math.floor(z.y), Math.ceil(z.w) + 1, Math.ceil(z.h) + 1, GROUND_TEXTURE[z.ground])
        .setOrigin(0)
        .setDepth(DEPTH.ground);
    }
    this.waterTiles = (map.water ?? []).map((w) => {
      const edge = this.add.graphics().setDepth(DEPTH.ground + 3);
      edge.lineStyle(10, 0xe9d3a0, 0.9).strokeRoundedRect(w.x, w.y, w.w, w.h, 30);
      edge.lineStyle(3, 0x14213d, 0.5).strokeRoundedRect(w.x, w.y, w.w, w.h, 30);
      return this.add.tileSprite(w.x, w.y, w.w, w.h, TEX.acqua).setOrigin(0).setDepth(DEPTH.ground + 2);
    });

    const walls = this.physics.add.staticGroup();
    this.combat.walls = walls;
    this.tallThings = [];
    this.culler = new Culler();
    for (const o of map.obstacles) {
      const placed = createObstacle(this, walls, o.kind, o.x, o.y);
      if (placed.tall) this.tallThings.push({ ...placed, bounds: placed.image.getBounds() });
      this.culler.add(placed.image);
      for (const e of placed.extras) this.culler.add(e);
    }
    this.bushes = (map.bushes ?? []).map((b) => new BushPatch(this, b.kind, b.spots));
    for (const b of this.bushes) for (const img of b.images) this.culler.add(img);
    const camels = (map.camels ?? []).map((c) => new Camel(this, { x: c.x1, y: c.y1 }, { x: c.x2, y: c.y2 }));
    this.pyramids = (map.bigPyramids ?? []).map((p) => new BigPyramid(this, walls, p.x, p.y));
    const targets = map.targets.map((t) => new Target(this, t.x, t.y, this.combat));
    this.gems = [];
    this.chests = (map.chests ?? []).map((c) => {
      const chest = new Chest(this, c.x, c.y, this.combat);
      chest.hideout = this.pyramids.find((p) => p.contains(c.x, c.y)) ?? null;
      chest.on(CHEST_BROKEN_EVENT, (x: number, y: number, n: number) => this.spawnGems(x, y, n));
      this.culler.addCustom(new Phaser.Geom.Rectangle(c.x - 60, c.y - 130, 120, 140), (on) => chest.setInView(on));
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

    // il giocatore (squadra 0) e i bot (ognuno nella sua squadra: tutti contro tutti); partenze a caso
    const spawns = Phaser.Utils.Array.Shuffle([map.spawn, ...(map.botSpawns ?? [])]);
    const mySpawn = spawns.shift()!;
    this.player = new Player(this, mySpawn.x, mySpawn.y, {
      characterId: 'anubi',
      team: 0,
      combat: this.combat,
      isHuman: true,
    });
    this.fighters.push(this.player);

    const names = Phaser.Utils.Array.Shuffle([...BOT_NAMES]);
    const level = BOT_LEVELS[this.botLevelIndex()];
    const botCount = Math.min(SOLO_SETUP.botCount, spawns.length);
    for (let i = 0; i < botCount; i++) {
      const bot = new Bot(
        this,
        spawns[i].x,
        spawns[i].y,
        {
          characterId: 'anubi',
          team: i + 1,
          combat: this.combat,
          variant: COLOR_VARIANTS[(i % (COLOR_VARIANTS.length - 1)) + 1],
          name: names[i % names.length],
        },
        level,
        {
          width: map.width,
          height: map.height,
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
          nearestBush: (x, y, maxDist) => {
            let best: { x: number; y: number } | null = null;
            let bestD = maxDist;
            for (const b of this.bushes) {
              const sp = b.nearestSpot(x, y);
              const d = Phaser.Math.Distance.Between(x, y, sp.x, sp.y);
              if (d < bestD) {
                bestD = d;
                best = sp;
              }
            }
            return best;
          },
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
    }

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
    this.moveStick = new VirtualStick(this, {
      side: 'left',
      baseTexture: TEX.joyBase,
      knobTexture: TEX.joyPomello,
      ...JOYSTICK,
    });
    this.superButton = new SuperButton(this);
    this.superButton.onRelease = (r) => {
      if (r.tap) this.player.autoSuper(this.player.stats.super.range);
      else if (r.aimed) this.player.tryUseSuper(r.angle);
    };
    this.aimStick = new VirtualStick(this, {
      side: 'right',
      baseTexture: TEX.joyBase,
      knobTexture: TEX.miraPomello,
      ...AIM_STICK,
      ignore: (x, y) => this.superButton.covers(x, y),
    });
    this.aimStick.onRelease = (r) => {
      if (r.tap) this.player.autoAttack(this.player.stats.weapon.range * AUTO_AIM_RANGE_FACTOR);
      else if (r.aimed) this.player.tryAttack(r.angle);
      // se il dito è tornato al centro dopo aver mirato: attacco annullato
    };
    this.aimIndicator = new AimIndicator(this);
    this.hud = new MatchHud(this);
    this.hud.setRemaining(this.aliveCount());
    this.minimap = new Minimap(this, map);
    addFpsMeter(this);

    this.input.mouse?.disableContextMenu();
    fullscreenOnFirstTap(this);

    // Tastiera: solo un extra per provare al computer (frecce/WASD per muoversi, spazio = colpo automatico, E = super)
    const kb = this.input.keyboard;
    if (kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      this.keys = kb.addKeys({
        up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT, w: K.W, a: K.A, s: K.S, d: K.D, space: K.SPACE, e: K.E,
      }) as Record<KeyName, Phaser.Input.Keyboard.Key>;
      this.keys.space.on('down', () => {
        if (!this.over) this.player.autoAttack(this.player.stats.weapon.range * AUTO_AIM_RANGE_FACTOR);
      });
      this.keys.e.on('down', () => {
        if (!this.over) this.player.autoSuper(this.player.stats.super.range);
      });
    }
  }

  private aliveCount(): number {
    return this.fighters.filter((f) => f.isAlive()).length;
  }

  /** Più coppe hai, più i bot sono bravi (principiante → esperto → campione). */
  private botLevelIndex(): number {
    const total = SaveManager.getTotalTrophies();
    let level = SOLO_SETUP.botLevel;
    BOT_LEVEL_BY_TROPHIES.forEach((min, i) => {
      if (total >= min) level = Math.max(level, i);
    });
    return Math.min(level, BOT_LEVELS.length - 1);
  }

  /** Qualcuno è stato sconfitto: aggiorna il contatore e controlla se la partita è finita. */
  private onDefeated(who: Player): void {
    // chi viene sconfitto lascia cadere i suoi gioielli
    if (who.gems > 0) this.spawnGems(who.x, who.y, who.gems);
    const alive = this.aliveCount();
    this.hud.setRemaining(alive);
    if (this.over) return;

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
    this.moveStick.setEnabled(false);
    this.aimStick.setEnabled(false);
    this.superButton.setEnabled(false);
    this.aimIndicator.hide();
    this.player.move(this.dir.set(0, 0));

    const characterId = this.player.stats.id;
    const reward = SaveManager.recordMatch(characterId, place, trophiesForPlace(place));
    const victory = place === 1;
    const title = victory ? 'VITTORIA!' : `Sconfitto — ${place}° posto`;
    this.time.delayedCall(1100, () => showEndOverlay(this, title, victory));
    this.time.delayedCall(3000, () => {
      this.cameras.main.fadeOut(300, 20, 33, 61);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.scene.start('Results', { ...reward, playerCount: this.fighters.length }),
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
    if (inStorm) msg = 'Esci dalla tempesta!';
    else if (this.storm.secondsToStart > 0) msg = `Tempesta tra ${Math.ceil(this.storm.secondsToStart)}`;
    else if (!this.storm.finished) msg = 'La tempesta si stringe!';
    else msg = '';
    this.hud.setStorm(msg, inStorm);
  }

  /** Chi è dentro una piramide? Il tetto diventa trasparente per il giocatore e chi è nascosto sparisce. */
  private updateHideouts(dt: number): void {
    const now = this.time.now;
    for (const f of this.fighters) {
      const place = this.pyramids.find((p) => p.contains(f.x, f.y)) ?? this.bushes.find((b) => b.contains(f.x, f.y)) ?? null;
      // chi ha appena attaccato da un cespuglio si vede per un attimo
      f.hideout = place instanceof BushPatch && f.revealedUntil > now ? null : place;
      // terreno: nell'acqua si va più piano
      f.terrainSpeed = (this.map.water ?? []).some((w) => f.x > w.x && f.x < w.x + w.w && f.y > w.y && f.y < w.y + w.h)
        ? WATER.speedFactor
        : 1;
    }
    const me = this.player;
    const myPlace = this.bushes.find((b) => b.contains(me.x, me.y)) ?? null;
    for (const b of this.bushes) b.setSeeThrough(b === myPlace);
    me.setHiddenLook(!!me.hideout);
    this.updateTallThings(me, dt);
    for (const p of this.pyramids) p.updateView(me.x, me.y, dt);
    for (const c of this.chests) if (c.hideout) c.setRevealed(c.hideout === me.hideout);
    for (const f of this.fighters) {
      if (f === me) continue;
      const near = Phaser.Math.Distance.Between(f.x, f.y, me.x, me.y) < HIDEOUT_REVEAL_DISTANCE;
      f.setRevealed(!f.hideout || f.hideout === me.hideout || near);
    }
  }

  /** Gli oggetti alti diventano semitrasparenti quando il giocatore ci passa dietro. */
  private updateTallThings(me: Player, dt: number): void {
    const k = Math.min(1, dt * 10);
    for (const t of this.tallThings) {
      const behind = me.y < t.baseY - 4 && t.bounds.contains(me.x, me.y - 50);
      const target = behind ? 0.45 : 1;
      if (t.image.alpha !== target) {
        t.image.alpha = Math.abs(t.image.alpha - target) < 0.02 ? target : Phaser.Math.Linear(t.image.alpha, target, k);
      }
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
    for (const w of this.waterTiles) {
      w.tilePositionX += dt * 22;
      w.tilePositionY += dt * 6;
    }
    this.updateZone(dt);
    this.culler.update(this.cameras.main);
    this.minimap.update({ x: this.player.x, y: this.player.y, alive: this.player.isAlive() }, this.storm);
    this.updateHideouts(delta / 1000);
    this.updateStorm(delta / 1000);
    this.pickUpGems();
    if (this.over) return;
    if (this.moveStick.active) {
      this.dir.copy(this.moveStick.direction);
    } else if (this.keys) {
      const k = this.keys;
      this.dir.set(
        (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0),
        (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0),
      );
      this.dir.normalize();
    } else {
      this.dir.set(0, 0);
    }
    this.player.move(this.dir);

    this.superButton.update(this.player.superCharge, delta / 1000);
    const sup = this.player.stats.super;
    if (this.superButton.engaged) {
      this.aimIndicator.showLine(this.player.x, this.player.y, this.superButton.angle, sup.range, sup.aimWidth);
    } else if (this.aimStick.engaged) {
      this.aimIndicator.show(this.player.x, this.player.y, this.aimStick.angle, this.player.stats.weapon, this.player.ammo >= 1);
    } else {
      this.aimIndicator.hide();
    }
  }
}
