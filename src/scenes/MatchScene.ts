import Phaser from 'phaser';
import { TEX } from '../art';
import { AIM_STICK, AUTO_AIM_RANGE_FACTOR, CAMERA_LERP, DEPTH, JOYSTICK } from '../config';
import { MAPPA_PROVA, type MapData } from '../data/maps';
import { Combat } from '../entities/Combat';
import { createObstacle } from '../entities/Obstacle';
import { Player } from '../entities/Player';
import { Target } from '../entities/Target';
import { VirtualStick } from '../ui/VirtualStick';
import { AimIndicator } from '../ui/AimIndicator';
import { fullscreenOnFirstTap } from '../ui/fullscreen';

type KeyName = 'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'space';

/** La partita. Per ora: Anubi cammina e colpisce i bersagli sulla mappa di prova. */
export class MatchScene extends Phaser.Scene {
  private player!: Player;
  private moveStick!: VirtualStick;
  private aimStick!: VirtualStick;
  private aimIndicator!: AimIndicator;
  private combat!: Combat;
  private keys?: Record<KeyName, Phaser.Input.Keyboard.Key>;
  private readonly dir = new Phaser.Math.Vector2();

  constructor() {
    super('Match');
  }

  create(): void {
    const map: MapData = MAPPA_PROVA;
    this.combat = new Combat();

    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.add.tileSprite(0, 0, map.width, map.height, TEX.sabbia).setOrigin(0).setDepth(DEPTH.ground);

    const walls = this.physics.add.staticGroup();
    for (const o of map.obstacles) createObstacle(this, walls, o.kind, o.x, o.y);

    const targets = map.targets.map((t) => new Target(this, t.x, t.y, this.combat));

    this.player = new Player(this, map.spawn.x, map.spawn.y, 'anubi', 0, this.combat);
    this.physics.add.collider(this.player, walls);
    this.physics.add.collider(this.player, targets);

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

    this.input.mouse?.disableContextMenu();
    fullscreenOnFirstTap(this);

    // Tastiera: solo un extra per provare al computer (frecce/WASD per muoversi, spazio = colpo automatico)
    const kb = this.input.keyboard;
    if (kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      this.keys = kb.addKeys({
        up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT, w: K.W, a: K.A, s: K.S, d: K.D, space: K.SPACE,
      }) as Record<KeyName, Phaser.Input.Keyboard.Key>;
      this.keys.space.on('down', () => this.player.autoAttack(this.player.stats.weapon.range * AUTO_AIM_RANGE_FACTOR));
    }
  }

  update(): void {
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
