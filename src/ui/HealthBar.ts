import Phaser from 'phaser';
import { DEPTH, FONT_FAMILY } from '../config';
import { PALETTE, css } from '../art/palette';
import { TEX } from '../art';

const W = 92;
const H = 14;
const AMMO_H = 7;
const AMMO_GAP = 3;

/**
 * Barra della vita sopra la testa, con il numero dei punti vita.
 * Se `showAmmo` è vero, sotto mostra i colpi pronti (segmenti dorati che si riempiono durante la ricarica).
 */
export class HealthBar extends Phaser.GameObjects.Container {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private shownHealth = -1;
  private flashUntil = 0;
  private ankh: Phaser.GameObjects.Image | null = null;
  private gemIcon: Phaser.GameObjects.Image | null = null;
  private gemText: Phaser.GameObjects.Text | null = null;

  constructor(
    scene: Phaser.Scene,
    private readonly color: number,
    private readonly showAmmo: boolean,
    name = '',
  ) {
    super(scene, 0, 0);
    this.g = scene.add.graphics();
    this.label = scene.add
      .text(0, -H / 2 - 9, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#FFFFFF',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.add([this.g, this.label]);
    if (name) {
      const nameText = scene.add
        .text(0, -H / 2 - 30, name, {
          fontFamily: FONT_FAMILY,
          fontSize: '16px',
          color: '#FFF3C4',
          stroke: css(PALETTE.bluNotte),
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      this.add(nameText);
    }
    this.setDepth(DEPTH.overhead);
    scene.add.existing(this);
  }

  /** Mostra l'ankh d'oro accanto alla barra quando c'è una vita extra. */
  setExtraLife(on: boolean): void {
    if (on && !this.ankh) {
      this.ankh = this.scene.add.image(-W / 2 - 16, 0, TEX.ankh).setScale(0.6);
      this.add(this.ankh);
      this.scene.tweens.add({ targets: this.ankh, scale: { from: 1.2, to: 0.6 }, duration: 300, ease: 'Back.out' });
    } else if (!on && this.ankh) {
      this.ankh.destroy();
      this.ankh = null;
    }
  }

  /** Mostra quanti gioielli ha il personaggio (a destra della barra). */
  setGems(n: number): void {
    if (n <= 0) {
      this.gemIcon?.setVisible(false);
      this.gemText?.setVisible(false);
      return;
    }
    if (!this.gemIcon || !this.gemText) {
      this.gemIcon = this.scene.add.image(W / 2 + 18, 0, TEX.gioiello).setScale(0.55);
      this.gemText = this.scene.add
        .text(W / 2 + 32, 0, '', {
          fontFamily: FONT_FAMILY,
          fontSize: '20px',
          color: '#8FF5EA',
          stroke: css(PALETTE.bluNotte),
          strokeThickness: 5,
        })
        .setOrigin(0, 0.5);
      this.add([this.gemIcon, this.gemText]);
    }
    this.gemIcon.setVisible(true);
    this.gemText.setVisible(true).setText(String(n));
    this.scene.tweens.add({ targets: this.gemIcon, scale: { from: 0.9, to: 0.55 }, duration: 250, ease: 'Back.out' });
  }

  /** Fa lampeggiare di rosso i colpi (quando provi ad attaccare senza munizioni). */
  flashAmmo(): void {
    this.flashUntil = this.scene.time.now + 300;
  }

  draw(health: number, maxHealth: number, ammo = 0, maxAmmo = 0): void {
    const g = this.g;
    g.clear();
    const x0 = -W / 2;
    // vita
    g.fillStyle(PALETTE.bluNotte, 1).fillRoundedRect(x0 - 3, -H / 2 - 3, W + 6, H + 6, 6);
    g.fillStyle(0x3a2f2f, 1).fillRoundedRect(x0, -H / 2, W, H, 4);
    const frac = Phaser.Math.Clamp(health / maxHealth, 0, 1);
    if (frac > 0) {
      g.fillStyle(this.color, 1).fillRoundedRect(x0, -H / 2, Math.max(8, W * frac), H, 4);
      g.fillStyle(0xffffff, 0.25).fillRect(x0 + 3, -H / 2 + 2, Math.max(2, W * frac - 6), 3);
    }
    if (health !== this.shownHealth) {
      this.shownHealth = health;
      this.label.setText(String(Math.ceil(health)));
    }
    // colpi
    if (this.showAmmo && maxAmmo > 0) {
      const y = H / 2 + 6;
      const segW = (W - AMMO_GAP * (maxAmmo - 1)) / maxAmmo;
      const flashing = this.scene.time.now < this.flashUntil;
      g.fillStyle(PALETTE.bluNotte, 1).fillRoundedRect(x0 - 3, y - 3, W + 6, AMMO_H + 6, 4);
      for (let i = 0; i < maxAmmo; i++) {
        const sx = x0 + i * (segW + AMMO_GAP);
        g.fillStyle(flashing ? PALETTE.rossoDeserto : 0x4a3b22, 1).fillRect(sx, y, segW, AMMO_H);
        const fill = Phaser.Math.Clamp(ammo - i, 0, 1);
        if (fill >= 1) g.fillStyle(PALETTE.oro, 1).fillRect(sx, y, segW, AMMO_H);
        else if (fill > 0) g.fillStyle(PALETTE.oroOmbra, 1).fillRect(sx, y, segW * fill, AMMO_H);
      }
    }
  }
}
