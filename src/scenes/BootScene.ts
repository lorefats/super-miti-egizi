import Phaser from 'phaser';
import { FONT_FAMILY } from '../config';
import { PALETTE, css } from '../art/palette';

/** Prima scena: per ora mostra solo il titolo su sfondo sabbia. */
export class BootScene extends Phaser.Scene {
  private title?: Phaser.GameObjects.Text;
  private hint?: Phaser.GameObjects.Text;

  constructor() {
    super('Boot');
  }

  async create(): Promise<void> {
    // Aspetta che il font sia pronto, così la scritta non appare col font sbagliato.
    try {
      await document.fonts.load(`64px ${FONT_FAMILY}`);
    } catch {
      /* se fallisce usiamo il font di riserva */
    }

    this.title = this.add
      .text(0, 0, 'Super Miti Egizi', {
        fontFamily: FONT_FAMILY,
        fontSize: '96px',
        color: css(PALETTE.oro),
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 12,
        shadow: { offsetX: 0, offsetY: 8, color: css(PALETTE.oroOmbra), fill: true, stroke: true },
      })
      .setOrigin(0.5);

    this.hint = this.add
      .text(0, 0, 'Tocca per lo schermo intero', {
        fontFamily: FONT_FAMILY,
        fontSize: '32px',
        color: css(PALETTE.bluNotte),
      })
      .setOrigin(0.5);

    this.tweens.add({ targets: this.title, scale: 1.04, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this));

    // Lo schermo intero si può chiedere solo dopo un tocco (regola dei browser).
    this.input.on('pointerup', () => this.goFullscreen());
  }

  private layout(): void {
    const { width, height } = this.scale;
    this.title?.setPosition(width / 2, height / 2);
    this.hint?.setPosition(width / 2, height / 2 + 110);
  }

  private goFullscreen(): void {
    if (this.scale.isFullscreen) return;
    if (!this.scale.fullscreen.available) {
      // iPhone non permette lo schermo intero dal browser: si otterrà con "Aggiungi a Home" (passo PWA).
      this.hint?.setText('Gira il telefono e gioca!');
      return;
    }
    this.scale.startFullscreen();
    this.hint?.setVisible(false);
    // Su Android prova a bloccare l'orientamento in orizzontale.
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation.lock?.('landscape').catch(() => undefined);
  }
}
