import Phaser from 'phaser';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import { startMenuMusic, stopMenuMusic } from '../audio/Music';
import { playSfx, vibrate } from '../audio/Sound';
import { SaveManager, type Settings } from '../save/SaveManager';
import { createGoldButton } from './GoldButton';
import { makePressable } from './MenuKit';

const PANEL_W = 520;
const PANEL_H = 400;
const DEPTH = 5000;

const ROWS: { key: keyof Settings; label: string }[] = [
  { key: 'sound', label: 'Suoni' },
  { key: 'music', label: 'Musica' },
  { key: 'vibration', label: 'Vibrazione' },
];

/** Pannello Impostazioni: tre interruttori (suoni, musica, vibrazione) e "Chiudi". Si salvano subito. */
export function showSettingsPanel(scene: Phaser.Scene): void {
  const { width: W, height: H } = scene.scale;
  const parts: Phaser.GameObjects.GameObject[] = [];

  // velo scuro che blocca i tocchi sotto il pannello
  const dim = scene.add.rectangle(0, 0, W, H, PALETTE.bluNotte, 0.65).setOrigin(0).setDepth(DEPTH).setInteractive();
  parts.push(dim);

  const box = scene.add.container(W / 2, H / 2).setDepth(DEPTH + 1);
  parts.push(box);
  const bg = scene.add.graphics();
  bg.fillStyle(PALETTE.lapislazzuli, 1).fillRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 26);
  bg.lineStyle(6, PALETTE.oro, 1).strokeRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 26);
  box.add(bg);
  box.add(
    scene.add
      .text(0, -PANEL_H / 2 + 44, 'Impostazioni', {
        fontFamily: FONT_FAMILY,
        fontSize: '42px',
        color: css(PALETTE.oro),
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 8,
      })
      .setOrigin(0.5),
  );

  ROWS.forEach((row, i) => {
    const y = -PANEL_H / 2 + 120 + i * 76;
    box.add(scene.add.text(-PANEL_W / 2 + 50, y, row.label, { fontFamily: FONT_FAMILY, fontSize: '34px', color: '#FFFFFF' }).setOrigin(0, 0.5));
    box.add(makeSwitch(scene, PANEL_W / 2 - 110, y, row.key));
  });

  const close = createGoldButton(scene, W / 2, H / 2 + PANEL_H / 2 - 56, 'Chiudi', () => {
    for (const p of parts) p.destroy();
  }, 220, 70, 34);
  close.setDepth(DEPTH + 2);
  parts.push(close);

  box.setScale(0.7).setAlpha(0);
  scene.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 200, ease: 'Back.out' });
}

/** Interruttore a pillola: verde con "SÌ" quando è acceso, grigio con "NO" quando è spento. */
function makeSwitch(scene: Phaser.Scene, x: number, y: number, key: keyof Settings): Phaser.GameObjects.Container {
  const w = 130;
  const h = 56;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const knob = scene.add.circle(0, 0, h / 2 - 7, 0xffffff).setStrokeStyle(3, PALETTE.bluNotte);
  const text = scene.add.text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: '26px', color: '#FFFFFF' }).setOrigin(0.5);
  c.add([g, text, knob]);

  const draw = () => {
    const on = SaveManager.getSettings()[key];
    g.clear();
    g.fillStyle(on ? PALETTE.verdeNilo : 0x6b7280, 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.lineStyle(4, PALETTE.bluNotte, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    knob.setX(on ? w / 2 - h / 2 : -w / 2 + h / 2);
    text.setText(on ? 'SÌ' : 'NO').setX(on ? -18 : 18);
  };
  draw();

  makePressable(c, w, h, () => {
    const on = !SaveManager.getSettings()[key];
    SaveManager.setSetting(key, on);
    draw();
    if (key === 'music') {
      if (on) startMenuMusic();
      else stopMenuMusic();
    }
    // una piccola prova di come suona / vibra
    if (key === 'sound' && on) playSfx('gem');
    if (key === 'vibration' && on) vibrate('super');
  });
  return c;
}
