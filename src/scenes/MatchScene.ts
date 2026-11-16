import Phaser from 'phaser';
import { TEX } from '../art';
import { CAMERA_LERP } from '../config';
import { MAPPA_PROVA, type MapData } from '../data/maps';
import { createObstacle } from '../entities/Obstacle';
import { Player } from '../entities/Player';
import { Joystick } from '../ui/Joystick';
import { fullscreenOnFirstTap } from '../ui/fullscreen';

/** La partita. Per ora: Anubi cammina sulla mappa di prova. */
export class MatchScene extends Phaser.Scene {
  private player!: Player;
  private joystick!: Joystick;
  private keys?: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;
  private readonly dir = new Phaser.Math.Vector2();

  constructor() {
    super('Match');
  }

  create(): void {
    const map: MapData = MAPPA_PROVA;

    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.add.tileSprite(0, 0, map.width, map.height, TEX.sabbia).setOrigin(0).setDepth(-100000);

    const walls = this.physics.add.staticGroup();
    for (const o of map.obstacles) createObstacle(this, walls, o.kind, o.x, o.y);

    this.player = new Player(this, map.spawn.x, map.spawn.y, 'anubi');
    this.physics.add.collider(this.player, walls);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.width, map.height);
    cam.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
    cam.setRoundPixels(true);

    this.joystick = new Joystick(this);
    this.input.mouse?.disableContextMenu();
    fullscreenOnFirstTap(this);

    // Tastiera: solo un extra per provare al computer
    const kb = this.input.keyboard;
    if (kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      this.keys = kb.addKeys({
        up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT, w: K.W, a: K.A, s: K.S, d: K.D,
      }) as typeof this.keys;
    }
  }

  update(): void {
    if (this.joystick.active) {
      this.dir.copy(this.joystick.direction);
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
  }
}
