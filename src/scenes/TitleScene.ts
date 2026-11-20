import Phaser from 'phaser';
import { startMenuMusic } from '../audio/Music';
import { TEX } from '../art';
import { LOGO_SIZE, LOGO_WINK_EYE } from '../art/logo';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import { fullscreenOnFirstTap } from '../ui/fullscreen';

/**
 * Schermata iniziale con il logo (sezione 1): il sarcofago cade giù, socchiude il coperchio
 * (esce luce d'oro), fa l'occhiolino e si richiude. Poi "Tocca per giocare" → Lobby.
 */
export class TitleScene extends Phaser.Scene {
  private lid!: Phaser.GameObjects.Container;
  private wink!: Phaser.GameObjects.Image;
  private rays!: Phaser.GameObjects.Image;
  private sarc!: Phaser.GameObjects.Container;
  private leaving = false;

  constructor() {
    super('Title');
  }

  create(): void {
    startMenuMusic();
    this.leaving = false;
    const { width: W, height: H } = this.scale;
    fullscreenOnFirstTap(this);
    this.cameras.main.fadeIn(300, 20, 33, 61);

    // cielo notturno con dune
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b1230, 0x0b1230, PALETTE.lapislazzuli, PALETTE.lapislazzuli, 1).fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      const star = this.add
        .image(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.6), TEX.stellaCielo)
        .setScale(Phaser.Math.FloatBetween(0.3, 0.9))
        .setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      this.tweens.add({ targets: star, alpha: 0.15, duration: Phaser.Math.Between(700, 1800), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1500) });
    }
    bg.fillStyle(0xc99a4b, 1).fillEllipse(W * 0.2, H + 60, W * 0.9, 260);
    bg.fillStyle(PALETTE.sabbiaScura, 1).fillEllipse(W * 0.85, H + 70, W * 0.9, 250);
    bg.fillStyle(PALETTE.sabbia, 1).fillEllipse(W * 0.5, H + 90, W * 1.3, 230);

    // ---- il sarcofago (cassa + raggi + coperchio con palpebra) ----
    const scale = Math.min(0.8, (H * 0.5) / LOGO_SIZE.height);
    const cy = H * 0.36;
    this.sarc = this.add.container(W / 2, -300).setScale(scale).setAngle(-6); // "leggermente storto"
    this.rays = this.add.image(-40, -120, TEX.logoRaggi).setScale(1.6).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    const caseImg = this.add.image(0, 0, TEX.logoCassa);
    // il coperchio ruota attorno al bordo destro, così si apre come un'anta
    this.lid = this.add.container(LOGO_SIZE.width / 2, 0);
    const lidImg = this.add.image(-LOGO_SIZE.width / 2, 0, TEX.logoCoperchio);
    this.wink = this.add
      .image(LOGO_WINK_EYE.x - LOGO_SIZE.width, LOGO_WINK_EYE.y - LOGO_SIZE.height / 2, TEX.logoOcchiolino)
      .setVisible(false);
    this.lid.add([lidImg, this.wink]);
    this.sarc.add([this.rays, caseImg, this.lid]);

    // cade giù e rimbalza
    this.tweens.add({
      targets: this.sarc,
      y: cy,
      duration: 800,
      ease: 'Bounce.out',
      onComplete: () => {
        this.cameras.main.shake(140, 0.006);
        this.dust(W / 2, cy + (LOGO_SIZE.height / 2) * scale);
        this.time.delayedCall(350, () => this.openAndWink());
      },
    });

    // ---- la scritta: "SUPER" più piccolo sopra, "MITI EGIZI" grande ----
    const titleY = cy + (LOGO_SIZE.height / 2) * scale + 24;
    const superText = this.goldText(W / 2, titleY + 24, 'SUPER', 52);
    const mainText = this.goldText(W / 2, titleY + 92, 'MITI EGIZI', 104);
    for (const [t, delay] of [[superText, 900], [mainText, 1050]] as const) {
      t.setScale(0);
      this.tweens.add({ targets: t, scale: 1, duration: 450, delay, ease: 'Back.out' });
    }

    const tap = this.add
      .text(W / 2, H - 40, 'Tocca per giocare', {
        fontFamily: FONT_FAMILY,
        fontSize: '32px',
        color: '#FFFFFF',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: tap, alpha: 1, delay: 2600, duration: 300 });
    this.tweens.add({ targets: tap, scale: 1.08, delay: 2900, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // ogni tanto rifà l'occhiolino
    this.time.addEvent({ delay: 6000, startAt: 0, loop: true, callback: () => this.openAndWink() });

    this.time.delayedCall(500, () => this.input.once(Phaser.Input.Events.POINTER_UP, () => this.goToLobby()));
  }

  /** Il coperchio si socchiude (esce la luce), occhiolino, poi si richiude con un colpo. */
  private openAndWink(): void {
    if (this.leaving) return;
    this.tweens.add({ targets: this.lid, angle: 14, duration: 380, ease: 'Back.out' });
    this.tweens.add({ targets: this.rays, alpha: 0.9, duration: 380 });
    this.sparkles();
    this.time.delayedCall(650, () => {
      this.wink.setVisible(true);
      this.tweens.add({ targets: this.sarc, scaleY: this.sarc.scaleX * 0.97, duration: 90, yoyo: true });
    });
    this.time.delayedCall(1150, () => this.wink.setVisible(false));
    this.time.delayedCall(1400, () => {
      this.tweens.add({ targets: this.rays, alpha: 0, duration: 250 });
      this.tweens.add({
        targets: this.lid,
        angle: 0,
        duration: 220,
        ease: 'Quad.in',
        onComplete: () => this.tweens.add({ targets: this.sarc, angle: -4, duration: 80, yoyo: true }),
      });
    });
  }

  private sparkles(): void {
    const m = this.sarc.getWorldTransformMatrix();
    for (let i = 0; i < 14; i++) {
      const p = this.add.image(m.tx + Phaser.Math.Between(-90, 40), m.ty + Phaser.Math.Between(-120, 60), TEX.scintilla);
      p.setScale(Phaser.Math.FloatBetween(0.6, 1.3)).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-140, 40),
        y: p.y - Phaser.Math.Between(60, 180),
        alpha: 0,
        angle: 180,
        duration: Phaser.Math.Between(700, 1200),
        onComplete: () => p.destroy(),
      });
    }
  }

  private dust(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const g = this.add.image(x + Phaser.Math.Between(-90, 90), y, TEX.granello).setScale(Phaser.Math.FloatBetween(1.5, 3));
      this.tweens.add({
        targets: g,
        x: g.x + (g.x - x) * 1.5,
        y: y - Phaser.Math.Between(10, 50),
        alpha: 0,
        duration: 600,
        onComplete: () => g.destroy(),
      });
    }
  }

  /** Scritta spessa color oro (sfumata) con contorno blu notte. */
  private goldText(x: number, y: number, text: string, size: number): Phaser.GameObjects.Text {
    const t = this.add
      .text(x, y, text, {
        fontFamily: FONT_FAMILY,
        fontSize: `${size}px`,
        color: css(PALETTE.oro),
        stroke: css(PALETTE.bluNotte),
        strokeThickness: Math.round(size * 0.14),
        shadow: { offsetX: 0, offsetY: Math.round(size * 0.08), color: css(PALETTE.bluNotte), fill: true, stroke: true },
      })
      .setOrigin(0.5);
    const grad = t.context.createLinearGradient(0, 0, 0, t.height);
    grad.addColorStop(0.15, '#FFE59A');
    grad.addColorStop(0.55, css(PALETTE.oro));
    grad.addColorStop(0.9, '#C98714');
    t.setFill(grad);
    return t;
  }

  private goToLobby(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 20, 33, 61);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Lobby'));
  }
}
