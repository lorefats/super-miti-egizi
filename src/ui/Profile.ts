import Phaser from 'phaser';
import { TEX, characterTexture } from '../art';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import { ROSTER, getCharacter, isPlayable } from '../data/characters';
import { PRESTIGE_TROPHIES, PROFILE } from '../data/progression';
import { SaveManager } from '../save/SaveManager';
import { createGoldButton } from './GoldButton';
import { makePressable } from './MenuKit';
import { askPlayerName } from './NameDialog';

const CARD_W = 350;
const CARD_H = 122;
const PANEL_W = 840;
const PANEL_H = 560;
const DEPTH = 5000;

/** Testo semplice (bianco, o del colore dato). */
function label(scene: Phaser.Scene, x: number, y: number, text: string, size: number, color = '#FFFFFF'): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, { fontFamily: FONT_FAMILY, fontSize: `${size}px`, color });
}

/**
 * Ritratto rotondo di un dio (si vede la parte alta: testa e spalle) con la cornice; d'oro se ha il Prestigio.
 * (x, y) = centro del cerchio in coordinate dello schermo (serve per la maschera).
 */
function portrait(scene: Phaser.Scene, x: number, y: number, r: number, id: string, depth = 0): Phaser.GameObjects.GameObject[] {
  const prestige = SaveManager.hasPrestige(id);
  const back = scene.add.circle(x, y, r, PALETTE.lapislazzuli).setDepth(depth);
  const key = characterTexture(id, 'base');
  const pic = scene.add.image(x, y - r * 0.95, scene.textures.exists(key) ? key : TEX.sagomaDio).setOrigin(0.5, 0).setDepth(depth);
  pic.setScale((r * 2.3) / pic.width);
  const shape = scene.make.graphics({}, false);
  shape.fillStyle(0xffffff).fillCircle(x, y, r);
  pic.setMask(shape.createGeometryMask());
  const ring = scene.add.circle(x, y, r).setStrokeStyle(prestige ? 6 : 4, prestige ? PALETTE.oro : PALETTE.sabbia).setDepth(depth);
  const out: Phaser.GameObjects.GameObject[] = [back, pic, ring, shape];
  if (prestige) out.push(scene.add.image(x, y + r - 4, TEX.stemmaPrestigio).setScale((r / 40) * 0.42).setDepth(depth));
  return out;
}

/** Barra "coppe massime / 1000" verso il Prestigio. */
function prestigeBar(scene: Phaser.Scene, x: number, y: number, w: number, best: number, depth = 0): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  const frac = Math.min(1, best / PRESTIGE_TROPHIES);
  g.fillStyle(PALETTE.bluNotte, 1).fillRoundedRect(x, y, w, 14, 7);
  if (frac > 0) g.fillStyle(PALETTE.oro, 1).fillRoundedRect(x, y, Math.max(14, w * frac), 14, 7);
  g.lineStyle(2, PALETTE.sabbia, 1).strokeRoundedRect(x, y, w, 14, 7);
  return g;
}

function prestigeCountText(n: number): string {
  if (n === 0) return 'Nessun prestigio ancora';
  return n === 1 ? '1 Prestigio' : `${n} Prestigi`;
}

/**
 * Scheda del giocatore in alto a sinistra nella Lobby: ritratto del dio scelto, nome, quanti prestigi
 * e il dio più vicino al prossimo prestigio. Toccandola si apre il Profilo.
 */
export class ProfileCard {
  private parts: Phaser.GameObjects.GameObject[] = [];
  private hit!: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
  ) {
    this.draw();
  }

  /** Ridisegna (dopo aver cambiato nome). */
  refresh(): void {
    for (const p of this.parts) p.destroy();
    this.parts = [];
    this.hit.destroy();
    this.draw();
  }

  private draw(): void {
    const { scene, x, y } = this;
    const summary = SaveManager.getPrestigeSummary();
    const g = scene.add.graphics();
    g.fillStyle(PALETTE.bluNotte, 0.88).fillRoundedRect(x, y, CARD_W, CARD_H, 22);
    g.lineStyle(summary.prestiges.length ? 5 : 3, PALETTE.oro, 1).strokeRoundedRect(x, y, CARD_W, CARD_H, 22);
    this.parts.push(g);
    this.parts.push(...portrait(scene, x + 60, y + CARD_H / 2, 44, SaveManager.getSelectedCharacter()));

    const tx = x + 118;
    const name = label(scene, tx, y + 14, SaveManager.getPlayerName(), 30);
    if (name.width > CARD_W - 130) name.setScale((CARD_W - 130) / name.width);
    this.parts.push(name);
    // quanti prestigi (con lo stemma)
    const n = summary.prestiges.length;
    if (n) this.parts.push(scene.add.image(tx + 12, y + 66, TEX.stemmaPrestigio).setScale(0.3));
    this.parts.push(label(scene, tx + (n ? 30 : 0), y + 54, prestigeCountText(n), 20, css(n ? PALETTE.oro : PALETTE.sabbia)));
    // il dio più vicino al prestigio, con la sua barra
    const next = summary.closest[0];
    if (next) {
      const t = label(scene, tx, y + 84, `${getCharacter(next.id).name}`, 18);
      this.parts.push(t);
      const bx = tx + t.width + 10;
      const bw = Math.max(40, x + CARD_W - 18 - bx);
      this.parts.push(prestigeBar(scene, bx, y + 89, bw, next.best));
    } else if (n) {
      this.parts.push(label(scene, tx, y + 84, 'Tutti i tuoi dèi al Prestigio!', 18, css(PALETTE.oro)));
    }

    // tutta la scheda si tocca
    this.hit = scene.add.container(x + CARD_W / 2, y + CARD_H / 2);
    makePressable(this.hit, CARD_W, CARD_H, () => showProfilePanel(scene, () => this.refresh()));
  }
}

/**
 * Pannello Profilo: ritratto e nome (con "Cambia nome"), coppe e partite, i dèi con il Prestigio
 * e quelli più vicini al prestigio con la loro barra. `onChange` = il nome è cambiato.
 */
export function showProfilePanel(scene: Phaser.Scene, onChange: () => void): void {
  const { width: W, height: H } = scene.scale;
  let parts: Phaser.GameObjects.GameObject[] = [];
  const dim = scene.add.rectangle(0, 0, W, H, PALETTE.bluNotte, 0.65).setOrigin(0).setDepth(DEPTH).setInteractive();
  const scale = Math.min(1, (W - 30) / PANEL_W, (H - 30) / PANEL_H);
  const cx = W / 2;
  const cy = H / 2;
  const L = cx - (PANEL_W / 2) * scale;
  const T = cy - (PANEL_H / 2) * scale;
  const s = (v: number) => v * scale;

  const build = () => {
    for (const p of parts) p.destroy();
    parts = [];
    const add = <O extends Phaser.GameObjects.GameObject>(o: O): O => {
      parts.push(o);
      (o as unknown as Phaser.GameObjects.Components.Depth).setDepth?.(DEPTH + 1);
      return o;
    };
    const bg = add(scene.add.graphics());
    bg.fillStyle(PALETTE.lapislazzuli, 1).fillRoundedRect(L, T, s(PANEL_W), s(PANEL_H), s(26));
    bg.lineStyle(6, PALETTE.oro, 1).strokeRoundedRect(L, T, s(PANEL_W), s(PANEL_H), s(26));
    add(
      scene.add
        .text(cx, T + s(42), 'Profilo', { fontFamily: FONT_FAMILY, fontSize: `${s(42)}px`, color: css(PALETTE.oro), stroke: css(PALETTE.bluNotte), strokeThickness: 8 })
        .setOrigin(0.5),
    );

    // ---- a sinistra: ritratto, nome, numeri ----
    const lx = L + s(170);
    for (const o of portrait(scene, lx, T + s(165), s(78), SaveManager.getSelectedCharacter(), DEPTH + 1)) parts.push(o);
    const name = add(label(scene, lx, T + s(262), SaveManager.getPlayerName(), s(34)).setOrigin(0.5, 0));
    if (name.width > s(300)) name.setScale(s(300) / name.width);
    const rename = createGoldButton(scene, lx, T + s(340), 'Cambia nome', async () => {
      const typed = await askPlayerName(SaveManager.hasPlayerName() ? SaveManager.getPlayerName() : '');
      if (typed === null) return;
      SaveManager.setPlayerName(typed);
      onChange();
      build();
    }, s(240), s(62), s(26));
    add(rename);
    const stats = SaveManager.getStats();
    const playable = ROSTER.filter((c) => isPlayable(c.id));
    const unlocked = playable.filter((c) => SaveManager.isUnlocked(c.id)).length;
    const lines = [
      `Coppe totali: ${SaveManager.getTotalTrophies()}`,
      `Partite: ${stats.matches} · Vittorie: ${stats.victories}`,
      `Dèi trovati: ${unlocked} / ${playable.length}`,
    ];
    lines.forEach((t, i) => add(label(scene, lx, T + s(395 + i * 34), t, s(22)).setOrigin(0.5, 0)));

    // ---- a destra: prestigi e più vicini ----
    const rx = L + s(360);
    const rw = s(PANEL_W - 360 - 40);
    const summary = SaveManager.getPrestigeSummary();
    add(label(scene, rx, T + s(92), 'Prestigi', s(30), css(PALETTE.oro)));
    if (!summary.prestiges.length) {
      add(label(scene, rx, T + s(134), `Ancora nessuno: porta un dio a ${PRESTIGE_TROPHIES} coppe!`, s(21)).setWordWrapWidth(rw));
    } else {
      const size = s(34);
      const perRow = Math.floor(rw / (size * 2 + s(10)));
      summary.prestiges.forEach((id, i) => {
        const px = rx + size + (i % perRow) * (size * 2 + s(10));
        const py = T + s(140) + size + Math.floor(i / perRow) * (size * 2 + s(12));
        for (const o of portrait(scene, px, py, size, id, DEPTH + 1)) parts.push(o);
      });
    }
    const listY = T + s(summary.prestiges.length > Math.floor(rw / (s(78))) ? 300 : 236);
    add(label(scene, rx, listY, 'Più vicini al Prestigio', s(30), css(PALETTE.oro)));
    const closest = summary.closest.slice(0, PROFILE.closestShown);
    if (!closest.length) add(label(scene, rx, listY + s(46), 'Tutti i tuoi dèi hanno il Prestigio!', s(22)));
    closest.forEach((c, i) => {
      const y = listY + s(66 + i * 72);
      for (const o of portrait(scene, rx + s(26), y, s(26), c.id, DEPTH + 1)) parts.push(o);
      add(label(scene, rx + s(64), y - s(28), getCharacter(c.id).name, s(24)));
      add(label(scene, rx + rw, y - s(26), `${c.best} / ${PRESTIGE_TROPHIES}`, s(20), css(PALETTE.sabbia)).setOrigin(1, 0));
      add(prestigeBar(scene, rx + s(64), y + s(4), rw - s(64), c.best));
    });

    const close = createGoldButton(scene, cx + s(PANEL_W / 2 - 130), T + s(PANEL_H - 50), 'Chiudi', () => {
      for (const p of parts) p.destroy();
      dim.destroy();
    }, s(200), s(64), s(30));
    add(close);
  };
  build();
}
