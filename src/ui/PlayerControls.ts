import Phaser from 'phaser';
import { TEX } from '../art';
import { AIM_STICK, AUTO_AIM_RANGE_FACTOR, JOYSTICK } from '../config';
import type { Player } from '../entities/Player';
import { AimIndicator, LOB_MIN } from './AimIndicator';
import { BlindVeil } from './BlindVeil';
import { SuperButton } from './SuperButton';
import { VirtualStick } from './VirtualStick';
import { fullscreenOnFirstTap } from './fullscreen';

type KeyName = 'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'space' | 'e';

/**
 * Il colpo del giocatore, prima che diventi un attacco. Se la funzione restituisce true, il colpo
 * l'ha già usato qualcun altro (nel Calcio, chi ha la palla la calcia invece di attaccare).
 * `angle` = null per il tocco veloce (mira automatica).
 */
export type AttackOverride = (angle: number | null, strength: number) => boolean;

/**
 * I comandi del giocatore: joystick a sinistra, mira/attacco a destra, pulsante super, mirino,
 * velo della tempesta di sabbia. Al computer anche tastiera (frecce/WASD, spazio, E).
 */
export class PlayerControls {
  private readonly moveStick: VirtualStick;
  private readonly aimStick: VirtualStick;
  private readonly superButton: SuperButton;
  private readonly aimIndicator: AimIndicator;
  private readonly blindVeil: BlindVeil;
  private keys?: Record<KeyName, Phaser.Input.Keyboard.Key>;
  private readonly dir = new Phaser.Math.Vector2();
  private enabled = true;
  /** Nel Calcio: chi ha la palla calcia invece di attaccare. */
  attackOverride: AttackOverride | null = null;

  constructor(
    scene: Phaser.Scene,
    private player: Player,
  ) {
    this.moveStick = new VirtualStick(scene, { side: 'left', baseTexture: TEX.joyBase, knobTexture: TEX.joyPomello, ...JOYSTICK });
    this.superButton = new SuperButton(scene);
    this.superButton.onRelease = (r) => {
      const me = this.player;
      const sup = me.stats.super;
      if (r.tap) me.autoSuper(sup.range);
      else if (sup.aim === 'sestesso') me.tryUseSuper(me.facingSign > 0 ? 0 : Math.PI);
      else if (r.aimed) me.tryUseSuper(r.angle, sup.range * (r.strength ?? 1));
    };
    this.aimStick = new VirtualStick(scene, {
      side: 'right',
      baseTexture: TEX.joyBase,
      knobTexture: TEX.miraPomello,
      ...AIM_STICK,
      ignore: (x, y) => this.superButton.covers(x, y),
    });
    this.aimStick.onRelease = (r) => {
      // se il dito è tornato al centro dopo aver mirato: attacco annullato
      if (r.tap) this.attack(null, 1);
      else if (r.aimed) this.attack(r.angle, r.strength ?? 1);
    };
    this.aimIndicator = new AimIndicator(scene);
    this.blindVeil = new BlindVeil(scene);

    scene.input.mouse?.disableContextMenu();
    fullscreenOnFirstTap(scene);

    // Tastiera: solo un extra per provare al computer (frecce/WASD per muoversi, spazio = colpo automatico, E = super)
    const kb = scene.input.keyboard;
    if (kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      this.keys = kb.addKeys({
        up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT, w: K.W, a: K.A, s: K.S, d: K.D, space: K.SPACE, e: K.E,
      }) as Record<KeyName, Phaser.Input.Keyboard.Key>;
      this.keys.space.on('down', () => this.enabled && this.attack(null, 1));
      this.keys.e.on('down', () => this.enabled && this.player.autoSuper(this.player.stats.super.range));
    }
  }

  /** Il personaggio comandato (cambia se il giocatore riappare con un nuovo personaggio). */
  setPlayer(p: Player): void {
    this.player = p;
  }

  private attack(angle: number | null, strength: number): void {
    if (this.attackOverride?.(angle, strength)) return;
    const me = this.player;
    const w = me.stats.weapon;
    if (angle === null) me.autoAttack(w.range * AUTO_AIM_RANGE_FACTOR);
    else me.tryAttack(angle, w.kind === 'lancio' ? Math.max(LOB_MIN, w.range * strength) : undefined);
  }

  /** Accende o spegne tutti i comandi (fine partita, giocatore sconfitto). */
  setEnabled(on: boolean): void {
    this.enabled = on;
    this.moveStick.setEnabled(on);
    this.aimStick.setEnabled(on);
    this.superButton.setEnabled(on);
    if (!on) {
      this.aimIndicator.hide();
      this.player.move(this.dir.set(0, 0));
    }
  }

  /** Da chiamare ogni fotogramma: muove il giocatore e disegna il mirino. */
  update(dt: number): void {
    const me = this.player;
    this.blindVeil.update(me.x, me.y, me.isAlive() && me.hasBuff('accecato'), dt);
    if (!this.enabled) return;
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
    me.move(this.dir);

    this.superButton.update(me.superCharge, dt);
    const sup = me.stats.super;
    if (this.superButton.engaged) {
      const a = this.superButton.angle;
      if (sup.aim === 'zona') {
        const d = sup.range * this.superButton.strength;
        this.aimIndicator.showArea(me.x, me.y, me.x + Math.cos(a) * d, me.y + Math.sin(a) * d, sup.aimWidth / 2);
      } else if (sup.aim === 'sestesso') {
        this.aimIndicator.showSelf(me.x, me.y, 90);
      } else {
        this.aimIndicator.showLine(me.x, me.y, a, sup.range, sup.aimWidth);
      }
    } else if (this.aimStick.engaged) {
      this.aimIndicator.show(me.x, me.y, this.aimStick.angle, me.stats.weapon, me.ammo >= 1, this.aimStick.strength);
    } else {
      this.aimIndicator.hide();
    }
  }
}
