import Phaser from 'phaser';
import { TEX } from '../art';
import { COLOR_VARIANTS } from '../art/palette';
import { AIM_STICK, AUTO_AIM_RANGE_FACTOR, CAMERA_LERP, DEPTH, JOYSTICK } from '../config';
import { MAPPA_MEDIA, type MapData } from '../data/maps';
import { BOT_LEVELS, BOT_NAMES, SOLO_SETUP } from '../data/bots';
import { Combat } from '../entities/Combat';
import { createObstacle } from '../entities/Obstacle';
import { Player, DEFEATED_EVENT } from '../entities/Player';
import { Bot } from '../entities/Bot';
import { Target } from '../entities/Target';
import { VirtualStick } from '../ui/VirtualStick';
import { AimIndicator } from '../ui/AimIndicator';
import { MatchHud } from '../ui/MatchHud';
import { showEndOverlay } from '../ui/EndOverlay';
import { fullscreenOnFirstTap } from '../ui/fullscreen';

type KeyName = 'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'space';

/** La partita Solo: tu contro i bot, vince l'ultimo rimasto. */
export class MatchScene extends Phaser.Scene {
  private player!: Player;
  private fighters: Player[] = [];
  private moveStick!: VirtualStick;
  private aimStick!: VirtualStick;
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
    for (const o of map.obstacles) createObstacle(this, walls, o.kind, o.x, o.y);
    const targets = map.targets.map((t) => new Target(this, t.x, t.y, this.combat));

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
        map,
      );
      this.fighters.push(bot);
    }

    for (const f of this.fighters) {
      this.physics.add.collider(f, walls);
      if (targets.length) this.physics.add.collider(f, targets);
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
    this.aimStick = new VirtualStick(this, {
      side: 'right',
      baseTexture: TEX.joyBase,
      knobTexture: TEX.miraPomello,
      ...AIM_STICK,
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

    // Tastiera: solo un extra per provare al computer (frecce/WASD per muoversi, spazio = colpo automatico)
    const kb = this.input.keyboard;
    if (kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      this.keys = kb.addKeys({
        up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT, w: K.W, a: K.A, s: K.S, d: K.D, space: K.SPACE,
      }) as Record<KeyName, Phaser.Input.Keyboard.Key>;
      this.keys.space.on('down', () => {
        if (!this.over) this.player.autoAttack(this.player.stats.weapon.range * AUTO_AIM_RANGE_FACTOR);
      });
    }
  }

  private aliveCount(): number {
    return this.fighters.filter((f) => f.isAlive()).length;
  }

  /** Qualcuno è stato sconfitto: aggiorna il contatore e controlla se la partita è finita. */
  private onDefeated(who: Player): void {
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
    this.aimIndicator.hide();
    this.player.move(this.dir.set(0, 0));
    this.time.delayedCall(1100, () => showEndOverlay(this, title, victory, () => this.scene.restart()));
  }

  update(): void {
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

    if (this.aimStick.engaged) {
      this.aimIndicator.show(this.player.x, this.player.y, this.aimStick.angle, this.player.stats.weapon, this.player.ammo >= 1);
    } else {
      this.aimIndicator.hide();
    }
  }
}
