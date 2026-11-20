import Phaser from 'phaser';
import { playSfxAt } from '../audio/Sound';
import { TEX } from '../art';
import { GEM } from '../data/match';

/** Un Gioiello (Cubo Energia) a terra: salta fuori, galleggia e brilla finché qualcuno non lo raccoglie. */
export class Gem extends Phaser.GameObjects.Container {
  private readonly icon: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Image;
  private readyAt: number;
  private taken = false;

  /** (fromX, fromY) = da dove salta fuori; (x, y) = dove atterra. */
  constructor(scene: Phaser.Scene, fromX: number, fromY: number, x: number, y: number) {
    super(scene, x, y);
    const shadow = scene.add.image(0, 0, TEX.ombra).setScale(0.45);
    this.glow = scene.add.image(0, -26, TEX.bagliore).setScale(0.45).setTint(0x2ec4b6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7);
    this.icon = scene.add.image(0, -26, TEX.gioiello);
    this.add([shadow, this.glow, this.icon]);
    this.setDepth(y);
    scene.add.existing(this);
    this.readyAt = scene.time.now + GEM.pickupDelay * 1000;

    // salto ad arco dal punto di partenza
    this.setPosition(fromX, fromY);
    scene.tweens.add({ targets: this, x, duration: 420, ease: 'Linear' });
    scene.tweens.add({ targets: this, y, duration: 420, ease: 'Linear' });
    scene.tweens.add({ targets: this.icon, y: { from: -26, to: -90 }, duration: 210, yoyo: true, ease: 'Quad.out' });

    // galleggia e brilla
    scene.tweens.add({ targets: this.icon, angle: { from: -6, to: 6 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    scene.tweens.add({ targets: this.glow, alpha: { from: 0.4, to: 0.85 }, scale: { from: 0.4, to: 0.55 }, duration: 700, yoyo: true, repeat: -1 });
  }

  /** Già raccolto da qualcuno? */
  get isTaken(): boolean {
    return this.taken;
  }

  canBePicked(): boolean {
    return !this.taken && this.scene.time.now >= this.readyAt;
  }

  /** Raccolto: vola verso chi l'ha preso e sparisce. */
  pick(byX: number, byY: number): void {
    this.taken = true;
    playSfxAt(this.scene, this.x, this.y, 'gem');
    this.scene.tweens.killTweensOf([this, this.icon, this.glow]);
    this.scene.tweens.add({
      targets: this,
      x: byX,
      y: byY - 60,
      scale: 0.4,
      alpha: 0,
      duration: 220,
      ease: 'Quad.in',
      onComplete: () => this.destroy(),
    });
  }
}
