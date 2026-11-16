import Phaser from 'phaser';
import { TEX } from '../art';
import { COLOR_VARIANTS } from '../art/palette';
import { AIM_STICK, AUTO_AIM_RANGE_FACTOR, CAMERA_LERP, DEPTH, JOYSTICK } from '../config';
import { MAPPA_MEDIA, type MapData } from '../data/maps';
import { BOT_LEVELS, BOT_NAMES, SOLO_SETUP } from '../data/bots';
import { HIDEOUT_REVEAL_DISTANCE } from '../data/combat';
import { Combat } from '../entities/Combat';
import { createObstacle } from '../entities/Obstacle';
import { Player, DEFEATED_EVENT } from '../entities/Player';
import { Bot } from '../entities/Bot';
import { BigPyramid } from '../entities/BigPyramid';
import { Chest, CHEST_BROKEN_EVENT } from '../entities/Chest';
import { Gem } from '../entities/Gem';
import { Storm } from '../entities/Storm';
import { GEM, STORM } from '../data/match';
import { Target } from '../entities/Target';
import { VirtualStick } from '../ui/VirtualStick';
import { AimIndicator } from '../ui/AimIndicator';
import { SuperButton } from '../ui/SuperButton';
import { MatchHud } from '../ui/MatchHud';
import { showEndOverlay } from '../ui/EndOverlay';
import { fullscreenOnFirstTap } from '../ui/fullscreen';

type KeyName = 'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'space' | 'e';

/** La partita Solo: tu contro i bot, vince l'ultimo rimasto. */
export class MatchScene extends Phaser.Scene {
  private player!: Player;
  private fighters: Player[] = [];
  private pyramids: BigPyramid[] = [];
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
    const map: MapData = MAPPA_MEDIA;
    this.combat = new Combat();
    this.fighters = [];
    this.over = false;

    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.add.tileSprite(0, 0, map.width, map.height, TEX.sabbia).setOrigin(0).setDepth(DEPTH.ground);

    const walls = this.physics.add.staticGroup();
    this.combat.walls = walls;
    for (const o of map.obstacles) createObstacle(this, walls, o.kind, o.x, o.y);
    this.pyramids = (map.bigPyramids ?? []).map((p) => new BigPyramid(this, walls, p.x, p.y));
    const targets = map.targets.map((t) => new Target(this, t.x, t.y, this.combat));
    this.gems = [];
    this.chests = (map.chests ?? []).map((c) => {
      const chest = new Chest(this, c.x, c.y, this.combat);
      chest.hideout = this.pyramids.find((p) => p.contains(c.x, c.y)) ?? null;
      chest.on(CHEST_BROKEN_EVENT, (x: number, y: number, n: number) => this.spawnGems(x, y, n));
      return chest;
    });
    this.storm = new Storm(this, map.width, map.height, map.stormCenter ?? { x: map.width / 2, y: map.height / 2 });
    this.stormTick = 0;

    // il giocatore (squadra 0) e i bot (ognuno nella sua squadra: tutti contro tutti)
    this.player = new Player(this, map.spawn.x, map.spawn.y, {
      characterId: 'anubi',
      team: 0,
      combat: this.combat,
      isHuman: true,
    });
    this.fighters.push(this.player);

    const spawns = Phaser.Utils.Array.Shuffle([...(map.botSpawns ?? [])]);
    const names = Phaser.Utils.Array.Shuffle([...BOT_NAMES]);
    const level = BOT_LEVELS[SOLO_SETUP.botLevel];
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

  /** Qualcuno è stato sconfitto: aggiorna il contatore e controlla se la partita è finita. */
  private onDefeated(who: Player): void {
    // chi viene sconfitto lascia cadere i suoi gioielli
    if (who.gems > 0) this.spawnGems(who.x, who.y, who.gems);
    const alive = this.aliveCount();
    this.hud.setRemaining(alive);
    if (this.over) return;

    if (who === this.player) {
      // il posto è quanti erano ancora in gioco prima di essere sconfitto
      this.endMatch(`Sconfitto — ${alive + 1}° posto`, false);
    } else if (alive === 1 && this.player.isAlive()) {
      this.endMatch('VITTORIA!', true);
    }
  }

  private endMatch(title: string, victory: boolean): void {
    this.over = true;
    this.moveStick.setEnabled(false);
    this.aimStick.setEnabled(false);
    this.superButton.setEnabled(false);
    this.aimIndicator.hide();
    this.player.move(this.dir.set(0, 0));
    this.time.delayedCall(1100, () => showEndOverlay(this, title, victory, () => this.scene.restart()));
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
    this.storm.update(dt);
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
    for (const f of this.fighters) {
      f.hideout = this.pyramids.find((p) => p.contains(f.x, f.y)) ?? null;
    }
    const me = this.player;
    for (const p of this.pyramids) p.updateView(me.x, me.y, dt);
    for (const c of this.chests) if (c.hideout) c.setRevealed(c.hideout === me.hideout);
    for (const f of this.fighters) {
      if (f === me) continue;
      const near = Phaser.Math.Distance.Between(f.x, f.y, me.x, me.y) < HIDEOUT_REVEAL_DISTANCE;
      f.setRevealed(!f.hideout || f.hideout === me.hideout || near);
    }
  }

  update(_time: number, delta: number): void {
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
