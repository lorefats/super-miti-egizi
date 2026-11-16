import Phaser from 'phaser';
import { DEPTH } from '../config';

export interface StickOptions {
  side: 'left' | 'right';
  baseTexture: string;
  knobTexture: string;
  radius: number;
  margin: number;
  /** Frazione di schermo (dal proprio lato) in cui il tocco viene preso dallo stick. */
  zoneWidth: number;
  /** Sotto questa frazione del raggio la direzione è zero. */
  deadZone: number;
  idleAlpha: number;
}

export interface StickRelease {
  /** Il dito non è mai uscito dalla zona morta: "tocco veloce". */
  tap: boolean;
  /** Al rilascio il pomello era fuori dalla zona morta: c'è una direzione valida. */
  aimed: boolean;
  /** Angolo in radianti (valido solo se aimed). */
  angle: number;
}

/**
 * Stick virtuale "mobile": appare dove il dito tocca il proprio lato dello schermo.
 * Quando non è usato resta semitrasparente nell'angolo in basso.
 * Usato sia per il movimento (sinistra) sia per la mira (destra).
 */
export class VirtualStick {
  /** Direzione attuale: lunghezza 0 (dentro la zona morta) oppure 1. */
  readonly direction = new Phaser.Math.Vector2();
  /** Chiamato quando il dito si stacca. */
  onRelease?: (r: StickRelease) => void;

  private readonly base: Phaser.GameObjects.Image;
  private readonly knob: Phaser.GameObjects.Image;
  private pointerId: number | null = null;
  private everEngaged = false;
  private enabled = true;
  private readonly center = new Phaser.Math.Vector2();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly opt: StickOptions,
  ) {
    this.base = scene.add.image(0, 0, opt.baseTexture).setScrollFactor(0).setDepth(DEPTH.ui);
    this.knob = scene.add.image(0, 0, opt.knobTexture).setScrollFactor(0).setDepth(DEPTH.ui + 1);
    this.reset();

    const I = Phaser.Input.Events;
    scene.input.on(I.POINTER_DOWN, this.onDown, this);
    scene.input.on(I.POINTER_MOVE, this.onMove, this);
    scene.input.on(I.POINTER_UP, this.onUp, this);
    scene.input.on(I.POINTER_UP_OUTSIDE, this.onUp, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off(I.POINTER_DOWN, this.onDown, this);
      scene.input.off(I.POINTER_MOVE, this.onMove, this);
      scene.input.off(I.POINTER_UP, this.onUp, this);
      scene.input.off(I.POINTER_UP_OUTSIDE, this.onUp, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    });
  }

  /** Accende o spegne lo stick (spento: invisibile e non risponde ai tocchi). */
  setEnabled(on: boolean): void {
    this.enabled = on;
    this.reset();
    this.base.setVisible(on);
    this.knob.setVisible(on);
  }

  /** Un dito sta usando lo stick. */
  get active(): boolean {
    return this.pointerId !== null;
  }

  /** Il pomello è fuori dalla zona morta (c'è una direzione). */
  get engaged(): boolean {
    return this.direction.lengthSq() > 0;
  }

  get angle(): number {
    return this.direction.angle();
  }

  private restPosition(): { x: number; y: number } {
    const { width, height } = this.scene.scale;
    const off = this.opt.margin + this.opt.radius;
    return { x: this.opt.side === 'left' ? off : width - off, y: height - off };
  }

  private reset(): void {
    const rest = this.restPosition();
    this.center.set(rest.x, rest.y);
    this.base.setPosition(rest.x, rest.y).setAlpha(this.opt.idleAlpha);
    this.knob.setPosition(rest.x, rest.y).setAlpha(this.opt.idleAlpha);
    this.direction.set(0, 0);
    this.pointerId = null;
    this.everEngaged = false;
  }

  private onResize(): void {
    if (!this.active) this.reset();
  }

  private inZone(x: number): boolean {
    const w = this.scene.scale.width;
    return this.opt.side === 'left' ? x <= w * this.opt.zoneWidth : x >= w * (1 - this.opt.zoneWidth);
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || this.active || !this.inZone(pointer.x)) return;
    this.pointerId = pointer.id;
    const r = this.opt.radius;
    const x = Phaser.Math.Clamp(pointer.x, r, this.scene.scale.width - r);
    const y = Phaser.Math.Clamp(pointer.y, r, this.scene.scale.height - r);
    this.center.set(x, y);
    this.base.setPosition(x, y).setAlpha(1);
    this.knob.setPosition(x, y).setAlpha(1);
    this.follow(pointer);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId) this.follow(pointer);
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.follow(pointer);
    const release: StickRelease = { tap: !this.everEngaged, aimed: this.engaged, angle: this.angle };
    this.reset();
    this.onRelease?.(release);
  }

  private follow(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.center.x;
    const dy = pointer.y - this.center.y;
    const dist = Math.hypot(dx, dy);
    const r = this.opt.radius;
    const k = dist > r ? r / dist : 1;
    this.knob.setPosition(this.center.x + dx * k, this.center.y + dy * k);
    if (dist < r * this.opt.deadZone) {
      this.direction.set(0, 0);
    } else {
      this.direction.set(dx / dist, dy / dist);
      this.everEngaged = true;
    }
  }
}
