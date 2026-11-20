import Phaser from 'phaser';
import { TEX } from '../art';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import { getCharacter } from '../data/characters';
import { trophyTable, type GameMode } from '../data/progression';
import type { MatchReward } from '../save/SaveManager';
import { createGoldButton } from '../ui/GoldButton';
import { createCharacterPose } from '../ui/CharacterPose';

/** `playerCount` = giocatori (Solo) o squadre (Duo). `score` = gol (tuoi, loro) nel Calcio. */
export type ResultsData = MatchReward & { playerCount: number; mode?: GameMode; score?: [number, number] };

/** Nel Calcio il "posto" è il risultato: 1 = vinta, 2 = pareggio, 3 = persa. */
const CALCIO_RESULTS = ['Vinta', 'Pari', 'Persa'];

/** Al massimo quante coppette volano verso il contatore (con +10 ne volano 10). */
const MAX_FLYING = 10;

/**
 * Schermata Risultati: posizione, personaggio, coppe guadagnate (animate) e pulsante per continuare.
 * Le coppe sono già salvate quando si arriva qui: l'animazione è solo da guardare.
 */
export class ResultsScene extends Phaser.Scene {
  private result!: ResultsData;

  constructor() {
    super('Results');
  }

  init(data: ResultsData): void {
    this.result = data;
  }

  create(): void {
    const { width: W, height: H } = this.scale;
    const d = this.result;
    const victory = d.place === 1;
    this.cameras.main.fadeIn(300, 20, 33, 61);

    this.drawBackground(W, H, victory);

    // ---- titolo: posizione ----
    const title = this.add
      .text(W / 2, 78, victory ? 'VITTORIA!' : d.mode === 'calcio' ? (d.place === 2 ? 'PAREGGIO' : 'SCONFITTA') : `${d.place}° posto`, {
        fontFamily: FONT_FAMILY,
        fontSize: victory ? '96px' : '84px',
        color: victory ? css(PALETTE.oro) : '#FFFFFF',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 12,
        shadow: { offsetX: 0, offsetY: 7, color: victory ? css(PALETTE.oroOmbra) : '#000000', fill: true, stroke: true },
      })
      .setOrigin(0.5)
      .setScale(0.3);
    this.tweens.add({ targets: title, scale: 1, duration: 450, ease: 'Back.out' });
    this.add
      .text(W / 2, 146, this.subtitle(victory), {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        color: '#DCE4FF',
      })
      .setOrigin(0.5);

    // ---- personaggio sul piedistallo ----
    const cx = W * 0.27;
    const feetY = H * 0.78;
    this.drawPedestal(cx, feetY);
    // vittoria: scettro puntato in avanti, verso l'alto
    const hero = createCharacterPose(this, d.characterId, cx, feetY, victory ? 0.45 : 0.18).container;
    hero.setScale(2.1);
    this.add
      .text(cx, feetY + 54, getCharacter(d.characterId).name, {
        fontFamily: FONT_FAMILY,
        fontSize: '34px',
        color: '#FFFFFF',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    if (d.sarcophagiWon > 0) this.showSarcophagusWon(cx, Math.min(H - 34, feetY + 108), d.sarcophagiWon);
    if (victory) {
      // saltelli di gioia
      this.tweens.add({ targets: hero, y: feetY - 26, duration: 260, yoyo: true, repeat: -1, repeatDelay: 380, ease: 'Quad.out' });
    } else {
      // respiro tranquillo
      this.tweens.add({ targets: hero, scaleY: 2.14, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }

    // ---- pannello delle coppe ----
    const px = Math.min(W * 0.68, W - 300);
    const panelW = 500;
    const panelH = 400;
    const panelTop = 190;
    const panel = this.add.graphics();
    panel.fillStyle(PALETTE.bluNotte, 0.82).fillRoundedRect(px - panelW / 2, panelTop, panelW, panelH, 26);
    panel.lineStyle(5, PALETTE.oro, 1).strokeRoundedRect(px - panelW / 2, panelTop, panelW, panelH, 26);

    this.add
      .text(px, panelTop + 36, 'Coppe', { fontFamily: FONT_FAMILY, fontSize: '36px', color: css(PALETTE.oro) })
      .setOrigin(0.5);

    // quante coppe in questa partita (grande)
    const delta = d.trophiesDelta;
    const deltaColor = delta > 0 ? '#7CF08A' : delta < 0 ? '#FF8A8A' : '#FFFFFF';
    const deltaText = this.add
      .text(px - 20, panelTop + 112, `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta)}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '84px',
        color: deltaColor,
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setScale(0);
    const deltaIcon = this.add.image(px + 70, panelTop + 112, TEX.coppa).setScale(0);

    // contatore delle coppe del personaggio
    const counterY = panelTop + 210;
    const counterIcon = this.add.image(px - 90, counterY, TEX.coppa).setScale(0.9);
    const counter = this.add
      .text(px - 52, counterY, String(d.trophiesBefore), {
        fontFamily: FONT_FAMILY,
        fontSize: '56px',
        color: '#FFFFFF',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 8,
      })
      .setOrigin(0, 0.5);
    const total = this.add
      .text(px, counterY + 48, `Coppe totali: ${d.totalTrophies - delta}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#B9C4E8',
      })
      .setOrigin(0.5);

    this.drawPlaceTable(px, panelTop + 330, d.place);

    // ---- pulsanti: tornare alla Lobby o rigiocare subito ----
    const btnY = Math.min(H - 70, panelTop + panelH + 70);
    let leaving = false;
    const leave = (scene: string, data: object) => {
      if (leaving) return;
      leaving = true;
      this.cameras.main.fadeOut(250, 20, 33, 61);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(scene, data));
    };
    // i sarcofagi vinti restano salvati: si aprono la prossima volta che si passa dalla Lobby
    const lobbyBtn = createGoldButton(this, px - 128, btnY, 'Lobby', () => leave('Lobby', { newSarcophagi: d.sarcophagiWon }), 236, 84, 36);
    const againBtn = createGoldButton(this, px + 128, btnY, 'Gioca ancora', () => leave(d.mode === 'calcio' ? 'Soccer' : 'Match', {}), 236, 84, 32);
    const buttons = [lobbyBtn, againBtn];
    for (const b of buttons) b.setAlpha(0).disableInteractive();
    let prestigeShown = false;
    const showButton = () => {
      total.setText(`Coppe totali: ${d.totalTrophies}`);
      if (d.prestigeReached && !prestigeShown) {
        prestigeShown = true;
        this.showPrestige(cx, hero);
      }
      if (lobbyBtn.input?.enabled) return;
      for (const b of buttons) b.setInteractive();
      this.tweens.add({ targets: buttons, alpha: 1, duration: 250 });
    };

    // ---- sequenza animata ----
    this.time.delayedCall(600, () => {
      this.tweens.add({ targets: [deltaText, deltaIcon], scale: 1, duration: 380, ease: 'Back.out' });
    });
    this.time.delayedCall(1100, () =>
      this.animateCounter(delta, deltaIcon, counterIcon, counter, d.trophiesBefore, d.trophiesAfter, showButton),
    );
    // per sicurezza il pulsante compare comunque
    this.time.delayedCall(4500, showButton);
  }

  /** Il personaggio ha appena raggiunto 1000 coppe: Prestigio 1 con il suo titolo. */
  private showPrestige(cx: number, hero: Phaser.GameObjects.Container): void {
    const data = getCharacter(this.result.characterId);
    this.cameras.main.flash(400, 255, 230, 160);
    const halo = this.add.image(hero.x, hero.y - 170, TEX.bagliore).setTint(PALETTE.oro).setBlendMode(Phaser.BlendModes.ADD).setScale(0);
    this.children.moveBelow(halo, hero);
    this.tweens.add({ targets: halo, scale: 5, alpha: 0.7, duration: 600, ease: 'Back.out' });
    const box = this.add.container(cx - 30, 200).setScale(0);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.bluNotte, 0.92).fillRoundedRect(-200, -52, 400, 104, 22);
    g.lineStyle(5, PALETTE.oro, 1).strokeRoundedRect(-200, -52, 400, 104, 22);
    box.add(g);
    box.add(this.add.image(-152, 0, TEX.stemmaPrestigio).setScale(0.75));
    box.add(this.add.text(36, -18, 'PRESTIGIO 1!', { fontFamily: FONT_FAMILY, fontSize: '40px', color: css(PALETTE.oro) }).setOrigin(0.5));
    box.add(this.add.text(36, 24, `${data.name} — ${data.title}`, { fontFamily: FONT_FAMILY, fontSize: '24px', color: '#FFFFFF' }).setOrigin(0.5));
    this.tweens.add({ targets: box, scale: 1, duration: 450, ease: 'Back.out' });
    for (let i = 0; i < 24; i++) {
      const p = this.add.image(hero.x, hero.y - 150, TEX.scintilla).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-220, 220),
        y: p.y - Phaser.Math.Between(40, 260),
        alpha: 0,
        angle: 180,
        duration: Phaser.Math.Between(600, 1200),
        onComplete: () => p.destroy(),
      });
    }
  }

  /** Vittoria: "+1 sarcofago", che poi si apre nella Lobby. */
  private showSarcophagusWon(x: number, y: number, count: number): void {
    const box = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.bluNotte, 0.85).fillRoundedRect(-150, -28, 300, 56, 28);
    g.lineStyle(3, PALETTE.oro, 1).strokeRoundedRect(-150, -28, 300, 56, 28);
    const icon = this.add.image(-112, -6, TEX.sarcofagoIcona).setScale(0.55).setAngle(-8);
    const text = this.add
      .text(12, 0, `+${count} sarcofago!`, { fontFamily: FONT_FAMILY, fontSize: '28px', color: css(PALETTE.oro) })
      .setOrigin(0.5);
    box.add([g, icon, text]).setScale(0);
    this.tweens.add({ targets: box, scale: 1, delay: 900, duration: 380, ease: 'Back.out' });
    this.tweens.add({ targets: icon, angle: 8, duration: 260, yoyo: true, repeat: -1, delay: 1300, repeatDelay: 900 });
  }

  /** Le coppe volano una alla volta nel contatore (o, se si perdono, il numero scende). */
  private animateCounter(
    delta: number,
    from: Phaser.GameObjects.Image,
    to: Phaser.GameObjects.Image,
    counter: Phaser.GameObjects.Text,
    before: number,
    after: number,
    done: () => void,
  ): void {
    if (delta === 0) {
      done();
      return;
    }
    const steps = Math.min(Math.abs(delta), MAX_FLYING);
    const gap = 120;
    for (let i = 0; i < steps; i++) {
      this.time.delayedCall(i * gap, () => {
        const value = Math.round(before + ((after - before) * (i + 1)) / steps);
        if (delta > 0) {
          const cup = this.add.image(from.x, from.y, TEX.coppa).setScale(0.6);
          const midX = (from.x + to.x) / 2 + Phaser.Math.Between(-60, 60);
          const midY = Math.min(from.y, to.y) - 70;
          // volo ad arco: prima su, poi giù nel contatore
          this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 420,
            ease: 'Sine.in',
            onUpdate: (tw) => {
              const t = tw.getValue() ?? 0;
              const u = 1 - t;
              cup.setPosition(u * u * from.x + 2 * u * t * midX + t * t * to.x, u * u * from.y + 2 * u * t * midY + t * t * to.y);
              cup.setScale(0.6 + 0.3 * t);
            },
            onComplete: () => {
              cup.destroy();
              this.bumpCounter(counter, to, value, '#7CF08A');
              if (i === steps - 1) done();
            },
          });
        } else {
          this.bumpCounter(counter, to, value, '#FF8A8A');
          if (i === steps - 1) this.time.delayedCall(200, done);
        }
      });
    }
  }

  private bumpCounter(counter: Phaser.GameObjects.Text, icon: Phaser.GameObjects.Image, value: number, flash: string): void {
    counter.setText(String(value)).setColor(flash);
    this.tweens.killTweensOf([counter, icon]);
    counter.setScale(1);
    icon.setScale(0.9);
    this.tweens.add({ targets: counter, scale: 1.2, duration: 70, yoyo: true });
    this.tweens.add({ targets: icon, scale: 1.08, duration: 70, yoyo: true });
    this.time.delayedCall(150, () => counter.setColor('#FFFFFF'));
  }

  /** Tabellina dei posti: quante coppe dà ogni posizione, con la tua evidenziata. */
  /** Riga sotto il titolo: com'è andata, in Solo o in Duo. */
  private subtitle(victory: boolean): string {
    const d = this.result;
    if (d.mode === 'calcio') return `Calcio del Nilo — Noi ${d.score?.[0] ?? 0} – ${d.score?.[1] ?? 0} Loro`;
    if (d.mode === 'duo') return victory ? 'La tua squadra è l’ultima rimasta!' : `su ${d.playerCount} squadre`;
    return victory ? 'Sei l’ultimo rimasto!' : `su ${d.playerCount} giocatori`;
  }

  private drawPlaceTable(cx: number, y: number, place: number): void {
    const table = trophyTable(this.result.mode ?? 'solo');
    const n = table.length;
    const calcio = this.result.mode === 'calcio';
    const cellW = calcio ? 110 : n <= 5 ? 74 : 44;
    const gap = 3;
    const startX = cx - ((cellW + gap) * n - gap) / 2 + cellW / 2;
    const g = this.add.graphics();
    table.forEach((t, i) => {
      const x = startX + i * (cellW + gap);
      const mine = i + 1 === place;
      g.fillStyle(mine ? PALETTE.oro : 0x24345e, 1).fillRoundedRect(x - cellW / 2, y - 30, cellW, 60, 8);
      if (mine) g.lineStyle(3, 0xffffff, 1).strokeRoundedRect(x - cellW / 2, y - 30, cellW, 60, 8);
      const color = mine ? css(PALETTE.bluNotte) : '#B9C4E8';
      this.add.text(x, y - 13, calcio ? CALCIO_RESULTS[i] : `${i + 1}°`, { fontFamily: FONT_FAMILY, fontSize: '18px', color }).setOrigin(0.5);
      this.add
        .text(x, y + 12, t > 0 ? `+${t}` : t < 0 ? `−${-t}` : '0', { fontFamily: FONT_FAMILY, fontSize: '20px', color })
        .setOrigin(0.5);
    });
  }

  private drawBackground(W: number, H: number, victory: boolean): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.lapislazzuli, PALETTE.lapislazzuli, PALETTE.bluNotte, PALETTE.bluNotte, 1);
    bg.fillRect(0, 0, W, H);
    // pavimento di sabbia in basso
    bg.fillStyle(PALETTE.sabbiaScura, 1).fillRect(0, H * 0.82, W, H * 0.18);
    bg.fillStyle(PALETTE.sabbia, 1).fillRect(0, H * 0.82, W, 10);

    // raggi di luce che girano dietro al personaggio (più forti se hai vinto)
    const rays = this.add.graphics({ x: W * 0.27, y: H * 0.5 });
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      rays.fillStyle(victory ? PALETTE.oro : 0x6f86d6, victory ? 0.22 : 0.1);
      rays.slice(0, 0, 520, a, a + Math.PI / n, false).fillPath();
    }
    this.tweens.add({ targets: rays, angle: 360, duration: 30000, repeat: -1 });

    if (victory) {
      // scintille d'oro che salgono
      this.add.particles(0, 0, TEX.scintilla, {
        x: { min: 0, max: W },
        y: H + 20,
        speedY: { min: -160, max: -70 },
        speedX: { min: -20, max: 20 },
        scale: { start: 0.7, end: 0.1 },
        alpha: { start: 1, end: 0 },
        lifespan: 4500,
        frequency: 90,
        tint: [PALETTE.oro, 0xfff1c1, PALETTE.turchese],
      });
    }
  }

  private drawPedestal(cx: number, feetY: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x8c6a3f, 1).fillRect(cx - 120, feetY, 240, 34);
    g.fillStyle(0xc9a36a, 1).fillEllipse(cx, feetY, 240, 46);
    g.lineStyle(4, PALETTE.bluNotte, 1).strokeEllipse(cx, feetY, 240, 46);
    g.lineStyle(4, PALETTE.oro, 1).strokeEllipse(cx, feetY, 200, 34);
  }
}
