import Phaser from 'phaser';
import { playSfx } from '../audio/Sound';
import { TEX } from '../art';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';

// Pezzi comuni delle schermate di menu (Lobby, Personaggi, Cammino delle Coppe).

/**
 * Rende toccabile un gruppo: si schiaccia un po' sotto il dito e reagisce al rilascio.
 * `canPress` (facoltativo) può bloccare il tocco, per esempio se il dito stava trascinando.
 */
export function makePressable(
  c: Phaser.GameObjects.Container,
  w: number,
  h: number,
  onPress: () => void,
  canPress: () => boolean = () => true,
): void {
  c.setSize(w, h).setInteractive({ useHandCursor: true });
  let pressed = false;
  let base = c.scaleX;
  c.on('pointerdown', () => {
    pressed = true;
    base = c.scaleX;
    c.setScale(base * 0.93);
  });
  c.on('pointerout', () => {
    if (pressed) c.setScale(base);
    pressed = false;
  });
  c.on('pointerup', () => {
    if (!pressed) return;
    pressed = false;
    c.setScale(base);
    if (!canPress()) return;
    playSfx('click');
    onPress();
  });
}

/** Testo bianco con bordo blu notte (titoli e scritte sui menu). */
export function outlinedText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number,
  color = '#FFFFFF',
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT_FAMILY,
      fontSize: `${size}px`,
      color,
      stroke: css(PALETTE.bluNotte),
      strokeThickness: Math.max(4, Math.round(size / 5)),
      align: 'center',
    })
    .setOrigin(0.5);
}

/** Contatore a pillola (icona + numero). Restituisce il testo per poterlo aggiornare. */
export function currencyPill(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tex: string,
  value: number,
  iconScale = 0.7,
  width = 170,
): { text: Phaser.GameObjects.Text; icon: Phaser.GameObjects.Image } {
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.bluNotte, 0.85).fillRoundedRect(x, y, width, 50, 25);
  g.lineStyle(3, PALETTE.oro, 1).strokeRoundedRect(x, y, width, 50, 25);
  const icon = scene.add.image(x + 30, y + 25, tex).setScale(iconScale);
  const text = scene.add
    .text(x + 60, y + 25, String(value), { fontFamily: FONT_FAMILY, fontSize: '30px', color: '#FFFFFF' })
    .setOrigin(0, 0.5);
  return { text, icon };
}

/** Pulsante rotondo con la freccia per tornare indietro (in alto a sinistra). */
export function backButton(scene: Phaser.Scene, onPress: () => void): Phaser.GameObjects.Container {
  const c = scene.add.container(58, 52);
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.oroOmbra, 1).fillCircle(0, 5, 36);
  g.fillStyle(PALETTE.oro, 1).fillCircle(0, 0, 36);
  g.lineStyle(4, PALETTE.bluNotte, 1).strokeCircle(0, 0, 36);
  g.lineStyle(9, PALETTE.bluNotte, 1);
  g.beginPath().moveTo(8, -16).lineTo(-10, 0).lineTo(8, 16).strokePath();
  c.add(g);
  makePressable(c, 80, 80, onPress);
  return c;
}

/** Sfondo blu del tempio con qualche geroglifico chiaro. */
export function menuBackground(scene: Phaser.Scene, W: number, H: number): void {
  const bg = scene.add.graphics();
  bg.fillGradientStyle(PALETTE.lapislazzuli, PALETTE.lapislazzuli, 0x0b1230, 0x0b1230, 1).fillRect(0, 0, W, H);
  // file di piccoli segni come un muro inciso
  bg.fillStyle(0xffffff, 0.035);
  for (let y = 30; y < H; y += 70) {
    for (let x = (y / 70) % 2 ? 20 : 55; x < W; x += 70) {
      bg.fillCircle(x, y, 6);
      bg.fillRect(x - 2, y + 8, 4, 16);
    }
  }
}

/** Passa a un'altra scena con una dissolvenza. */
export function goTo(scene: Phaser.Scene, key: string, data: object = {}): void {
  scene.input.enabled = false;
  scene.cameras.main.fadeOut(250, 20, 33, 61);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.input.enabled = true;
    scene.scene.start(key, data);
  });
}

/** Scintille d'oro che saltano fuori da un punto. */
export function sparkBurst(scene: Phaser.Scene, x: number, y: number, count = 12, spread = 160): void {
  for (let i = 0; i < count; i++) {
    const p = scene.add
      .image(x + Phaser.Math.Between(-30, 30), y + Phaser.Math.Between(-30, 30), TEX.scintilla)
      .setScale(Phaser.Math.FloatBetween(0.6, 1.3))
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(1000);
    scene.tweens.add({
      targets: p,
      x: p.x + Phaser.Math.Between(-spread, spread),
      y: p.y - Phaser.Math.Between(40, spread * 1.3),
      alpha: 0,
      angle: 180,
      duration: Phaser.Math.Between(500, 900),
      onComplete: () => p.destroy(),
    });
  }
}

/** Raggi di sole a ventaglio tutto attorno (da far girare piano). */
export function sunRays(scene: Phaser.Scene, x: number, y: number, radius: number, color: number, alpha: number, count = 14): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(color, alpha);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    g.slice(0, 0, radius, a, a + Math.PI / count, false).fillPath();
  }
  return g;
}
