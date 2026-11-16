import Phaser from 'phaser';
import { TEX } from '../art';
import { JOYSTICK } from '../config';

/**
 * Joystick virtuale "mobile": appare dove il dito tocca la metà sinistra dello schermo.
 * Quando non è usato resta, semitrasparente, in basso a sinistra.
 * `direction` ha lunghezza 0 (fermo) oppure 1.
 */
export class Joystick {
  readonly direction = new Phaser.Math.Vector2();
  private readonly base: Phaser.GameObjects.Image;
  private readonly knob: Phaser.GameObjects.Image;
  private pointerId: number | null = null;
  private readonly center = new Phaser.Math.Vector2();

  constructor(private readonly scene: Phaser.Scene) {
    this.base = scene.add.image(0, 0, TEX.joyBase).setScrollFactor(0).setDepth(10000);
    this.knob = scene.add.image(0, 0, TEX.joyPomello).setScrollFactor(0).setDepth(10001);
    this.reset();

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
      scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    });
  }

  get active(): boolean {
    return this.pointerId !== null;
  }

  private restPosition(): { x: number; y: number } {
    return { x: JOYSTICK.margin + JOYSTICK.radius, y: this.scene.scale.height - JOYSTICK.margin - JOYSTICK.radius };
  }

  private reset(): void {
    const rest = this.restPosition();
    this.center.set(rest.x, rest.y);
    this.base.setPosition(rest.x, rest.y).setAlpha(JOYSTICK.idleAlpha);
    this.knob.setPosition(rest.x, rest.y).setAlpha(JOYSTICK.idleAlpha);
    this.direction.set(0, 0);
    this.pointerId = null;
  }

  private onResize(): void {
    if (!this.active) this.reset();
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.active) return;
    if (pointer.x > this.scene.scale.width * JOYSTICK.zoneWidth) return;
    this.pointerId = pointer.id;
    // il centro non deve uscire dallo schermo
    const r = JOYSTICK.radius;
    const x = Phaser.Math.Clamp(pointer.x, r, this.scene.scale.width - r);
    const y = Phaser.Math.Clamp(pointer.y, r, this.scene.scale.height - r);
    this.center.set(x, y);
    this.base.setPosition(x, y).setAlpha(1);
    this.knob.setPosition(x, y).setAlpha(1);
    this.update(pointer);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId) this.update(pointer);
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId) this.reset();
  }

  private update(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.center.x;
    const dy = pointer.y - this.center.y;
    const dist = Math.hypot(dx, dy);
    const r = JOYSTICK.radius;
    const k = dist > r ? r / dist : 1;
    this.knob.setPosition(this.center.x + dx * k, this.center.y + dy * k);
    if (dist < r * JOYSTICK.deadZone) this.direction.set(0, 0);
    else this.direction.set(dx / dist, dy / dist);
  }
}
