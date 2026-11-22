import Phaser from 'phaser';
import { playSfx } from '../audio/Sound';
import { DEPTH, FONT_FAMILY } from '../config';
import { PALETTE, css } from '../art/palette';
import { TEX, characterTexture } from '../art';
import { getCharacter } from '../data/characters';
import type { Player } from '../entities/Player';

/** Larghezza e altezza di una scheda (pixel, prima di rimpicciolire la fila se non ci sta). */
const CARD_W = 118;
const CARD_H = 150;
const CARD_GAP = 12;

/**
 * Inizio partita: per qualche secondo nessuno si muove. In mezzo allo schermo si vedono
 * i nemici (e i compagni) con il loro dio, e un grande conto alla rovescia: 5, 4, 3, 2, 1, VIA!
 * Alla fine chiama `onGo`.
 */
export function showMatchIntro(
  scene: Phaser.Scene,
  opt: {
    seconds: number;
    me: Player;
    fighters: Player[];
    onGo: () => void;
    /** mostrare le schede di compagni e avversari (di solito sì; no per la tregua dopo un gol) */
    cards?: boolean;
    /** la scritta sopra il conto alla rovescia */
    hint?: string;
  },
): void {
  const { width, height } = scene.scale;
  const parts: Phaser.GameObjects.GameObject[] = [];

  // velo scuro leggero, così le schede si leggono
  const veil = scene.add.rectangle(0, 0, width, height, PALETTE.bluNotte, 0.35).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.ui + 150);
  parts.push(veil);

  const showCards = opt.cards ?? true;
  const allies = opt.fighters.filter((f) => f !== opt.me && f.team === opt.me.team);
  const enemies = opt.fighters.filter((f) => f.team !== opt.me.team);
  const row = [...allies.map((f) => ({ f, ally: true })), ...enemies.map((f) => ({ f, ally: false }))];

  const title = scene.add
    .text(width / 2, height * 0.5, allies.length ? 'Compagni e avversari' : 'I tuoi avversari', {
      fontFamily: FONT_FAMILY,
      fontSize: '32px',
      color: css(PALETTE.oro),
      stroke: css(PALETTE.bluNotte),
      strokeThickness: 7,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(DEPTH.ui + 152);
  parts.push(title);
  title.setVisible(showCards);

  // la fila di schede: se non ci sta nello schermo si rimpicciolisce
  const rowW = row.length * CARD_W + (row.length - 1) * CARD_GAP;
  const scale = Math.min(1, (width - 40) / rowW);
  const cards = scene.add.container(width / 2, height * 0.5 + 40 + (CARD_H * scale) / 2).setScrollFactor(0).setDepth(DEPTH.ui + 151);
  cards.setScale(scale);
  parts.push(cards);
  cards.setVisible(showCards);
  row.forEach(({ f, ally }, i) => {
    const x = -rowW / 2 + CARD_W / 2 + i * (CARD_W + CARD_GAP);
    cards.add(makeCard(scene, x, f, ally));
  });
  // le schede entrano una dopo l'altra
  cards.list.forEach((c, i) => {
    const card = c as Phaser.GameObjects.Container;
    card.setAlpha(0).setScale(0.6);
    scene.tweens.add({ targets: card, alpha: 1, scale: 1, delay: 80 * i, duration: 220, ease: 'Back.out' });
  });

  // il conto alla rovescia
  const count = scene.add
    .text(width / 2, height * 0.27, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '120px',
      color: '#FFFFFF',
      stroke: css(PALETTE.bluNotte),
      strokeThickness: 12,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(DEPTH.ui + 153);
  const hint = scene.add
    .text(width / 2, height * 0.27 - 90, opt.hint ?? 'Preparati!', {
      fontFamily: FONT_FAMILY,
      fontSize: '34px',
      color: css(PALETTE.oro),
      stroke: css(PALETTE.bluNotte),
      strokeThickness: 7,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(DEPTH.ui + 153);
  parts.push(hint);

  const total = Math.max(1, Math.round(opt.seconds));
  const show = (n: number) => {
    count.setText(String(n));
    playSfx('beep');
    scene.tweens.add({ targets: count, scale: { from: 1.6, to: 1 }, alpha: { from: 0.4, to: 1 }, duration: 300, ease: 'Back.out' });
  };
  show(total);
  for (let n = total - 1; n >= 1; n--) scene.time.delayedCall((total - n) * 1000, () => show(n));
  scene.time.delayedCall(total * 1000, () => {
    for (const p of parts) {
      scene.tweens.add({ targets: p, alpha: 0, duration: 250, onComplete: () => p.destroy() });
    }
    count.setText('VIA!').setColor(css(PALETTE.oro));
    playSfx('go');
    scene.tweens.add({ targets: count, scale: { from: 0.6, to: 1.3 }, duration: 250, ease: 'Back.out' });
    scene.tweens.add({ targets: count, alpha: 0, delay: 500, duration: 300, onComplete: () => count.destroy() });
    opt.onGo();
  });
}

/** Una scheda: il disegno del dio, il nome del giocatore e il nome del dio. Bordo verde = amico, rosso = nemico. */
function makeCard(scene: Phaser.Scene, x: number, f: Player, ally: boolean): Phaser.GameObjects.Container {
  const border = ally ? PALETTE.verdeNilo : PALETTE.rossoDeserto;
  const bg = scene.add.graphics();
  bg.fillStyle(PALETTE.bluNotte, 0.88).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
  bg.lineStyle(4, border, 1).strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);

  const key = characterTexture(f.stats.id, f.variant);
  const pic = scene.add.image(0, 22, scene.textures.exists(key) ? key : TEX.sagomaDio).setOrigin(0.5, 1);
  // il disegno sta dentro la parte alta della scheda
  const fit = Math.min(84 / pic.height, (CARD_W - 16) / pic.width);
  pic.setScale(fit);

  const name = scene.add
    .text(0, 40, f.displayName.replace(' (amico)', '') || '???', {
      fontFamily: FONT_FAMILY,
      fontSize: '19px',
      color: '#FFFFFF',
    })
    .setOrigin(0.5);
  if (name.width > CARD_W - 10) name.setScale((CARD_W - 10) / name.width);
  const god = scene.add
    .text(0, 61, getCharacter(f.stats.id).name, {
      fontFamily: FONT_FAMILY,
      fontSize: '17px',
      color: css(ally ? PALETTE.verdeNilo : PALETTE.sabbia),
    })
    .setOrigin(0.5);
  return scene.add.container(x, 0, [bg, pic, name, god]);
}
