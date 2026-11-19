import Phaser from 'phaser';
import { TEX } from '../art';
import { PALETTE } from '../art/palette';
import { DEPTH, SUPER_BUTTON } from '../config';
import type { StickRelease } from './VirtualStick';

/**
 * Pulsante della super con l'anello di carica.
 * Quando è carica brilla d'oro: si trascina per mirare e si rilascia per lanciarla,
 * oppure un tocco veloce la lancia verso il nemico più vicino.
 */
export class SuperButton {
  readonly direction = new Phaser.Math.Vector2();
  /** Quanto è tirato il pomello (0..1): per le super "a zona" decide quanto lontano cadono. */
  strength = 0;
  onRelease?: (r: StickRelease) => void;

  private readonly icon: Phaser.GameObjects.Image;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly knob: Phaser.GameObjects.Image;
  private readonly center = new Phaser.Math.Vector2();
  private pointerId: number | null = null;
  private everEngaged = false;
  private charge = 0;
  private enabled = true;
  private pulse = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.ring = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.ui);
    this.icon = scene.add.image(0, 0, TEX.pulsanteSuper).setScrollFactor(0).setDepth(DEPTH.ui + 1);
    this.icon.setScale((SUPER_BUTTON.radius * 2) / 128);
    this.knob = scene.add.image(0, 0, TEX.miraPomello).setScrollFactor(0).setDepth(DEPTH.ui + 2).setTint(0xffd27a).setVisible(false);
    this.layout();

    const I = Phaser.Input.Events;
    scene.input.on(I.POINTER_DOWN, this.onDown, this);
    scene.input.on(I.POINTER_MOVE, this.onMove, this);
    scene.input.on(I.POINTER_UP, this.onUp, this);
    scene.input.on(I.POINTER_UP_OUTSIDE, this.onUp, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off(I.POINTER_DOWN, this.onDown, this);
      scene.input.off(I.POINTER_MOVE, this.onMove, this);
      scene.input.off(I.POINTER_UP, this.onUp, this);
      scene.input.off(I.POINTER_UP_OUTSIDE, this.onUp, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });
  }

  /** Il punto (x, y) dello schermo è sopra il pulsante? (così lo stick di mira lo ignora) */
  covers(x: number, y: number): boolean {
    return this.enabled && Phaser.Math.Distance.Between(x, y, this.center.x, this.center.y) < SUPER_BUTTON.radius + 12;
  }

  get engaged(): boolean {
    return this.pointerId !== null && this.direction.lengthSq() > 0;
  }

  get angle(): number {
    return this.direction.angle();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.cancel();
    this.icon.setVisible(on);
    this.ring.setVisible(on);
  }

  /** Aggiorna l'anello di carica (0..1). Da chiamare ogni fotogramma. */
  update(charge: number, dt: number): void {
    const wasFull = this.charge >= 1;
    this.charge = charge;
    const full = charge >= 1;
    if (full && !wasFull) {
      this.scene.tweens.add({ targets: this.icon, scale: this.icon.scale * 1.25, duration: 160, yoyo: true, ease: 'Quad.out' });
    }
    this.pulse += dt;
    this.icon.setAlpha(full ? 1 : 0.6);
    const { x, y } = this.center;
    const r = SUPER_BUTTON.radius + 7;
    const g = this.ring;
    g.clear();
    if (full) {
      const glow = 0.35 + 0.25 * Math.sin(this.pulse * 6);
      g.fillStyle(PALETTE.oro, glow).fillCircle(x, y, r + 10);
    }
    g.lineStyle(9, PALETTE.bluNotte, 0.8).strokeCircle(x, y, r);
    if (charge > 0) {
      g.lineStyle(6, full ? PALETTE.oro : PALETTE.turchese, 1);
      g.beginPath();
      g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, charge), false);
      g.strokePath();
    }
  }

  private layout(): void {
    const { width, height } = this.scene.scale;
    this.center.set(width - SUPER_BUTTON.right, height - SUPER_BUTTON.bottom);
    this.icon.setPosition(this.center.x, this.center.y);
    if (!this.pointerId) this.knob.setPosition(this.center.x, this.center.y);
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || this.pointerId !== null || !this.covers(pointer.x, pointer.y)) return;
    if (this.charge < 1) {
      // non è carica: piccola scossa per dire "non ancora"
      this.scene.tweens.add({ targets: this.icon, x: this.center.x + 6, duration: 40, yoyo: true, repeat: 2 });
      return;
    }
    this.pointerId = pointer.id;
    this.everEngaged = false;
    this.knob.setVisible(true);
    this.follow(pointer);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId) this.follow(pointer);
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.follow(pointer);
    const release: StickRelease = {
      tap: !this.everEngaged,
      aimed: this.direction.lengthSq() > 0,
      angle: this.angle,
      strength: this.strength,
    };
    this.cancel();
    this.onRelease?.(release);
  }

  private cancel(): void {
    this.pointerId = null;
    this.direction.set(0, 0);
    this.strength = 0;
    this.knob.setVisible(false).setPosition(this.center.x, this.center.y);
  }

  private follow(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.center.x;
    const dy = pointer.y - this.center.y;
    const dist = Math.hypot(dx, dy);
    const r = SUPER_BUTTON.dragRadius;
    const k = dist > r ? r / dist : 1;
    this.knob.setPosition(this.center.x + dx * k, this.center.y + dy * k);
    if (dist < r * SUPER_BUTTON.deadZone) {
      this.direction.set(0, 0);
      this.strength = 0;
    } else {
      this.direction.set(dx / dist, dy / dist);
      this.strength = Phaser.Math.Clamp((Math.min(dist, r) / r - SUPER_BUTTON.deadZone) / (1 - SUPER_BUTTON.deadZone), 0, 1);
      this.everEngaged = true;
    }
  }
}
