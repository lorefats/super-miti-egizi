import Phaser from 'phaser';
import { TEX, characterTexture, getHeldWeapon, getLegs, legTexture, weaponTexture } from '../art';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import { getCharacter } from '../data/characters';
import { TROPHIES_SOLO } from '../data/progression';
import type { MatchReward } from '../save/SaveManager';
import { createGoldButton } from '../ui/GoldButton';

export type ResultsData = MatchReward & { playerCount: number };

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
      .text(W / 2, 78, victory ? 'VITTORIA!' : `${d.place}° posto`, {
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
      .text(W / 2, 146, victory ? 'Sei l’ultimo rimasto!' : `su ${d.playerCount} giocatori`, {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        color: '#DCE4FF',
      })
      .setOrigin(0.5);

    // ---- personaggio sul piedistallo ----
    const cx = W * 0.27;
    const feetY = H * 0.78;
    this.drawPedestal(cx, feetY);
    const hero = this.buildCharacter(d.characterId, cx, feetY, victory);
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

    // ---- pulsante per continuare (per ora riparte una partita; dal Passo 8 tornerà alla Lobby) ----
    const btn = createGoldButton(this, px, Math.min(H - 70, panelTop + panelH + 70), 'Continua', () => {
      this.cameras.main.fadeOut(250, 20, 33, 61);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Match'));
    });
    btn.setAlpha(0).disableInteractive();
    const showButton = () => {
      total.setText(`Coppe totali: ${d.totalTrophies}`);
      if (btn.input?.enabled) return;
      btn.setInteractive();
      this.tweens.add({ targets: btn, alpha: 1, duration: 250 });
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
  private drawPlaceTable(cx: number, y: number, place: number): void {
    const n = TROPHIES_SOLO.length;
    const cellW = 44;
    const gap = 3;
    const startX = cx - ((cellW + gap) * n - gap) / 2 + cellW / 2;
    const g = this.add.graphics();
    TROPHIES_SOLO.forEach((t, i) => {
      const x = startX + i * (cellW + gap);
      const mine = i + 1 === place;
      g.fillStyle(mine ? PALETTE.oro : 0x24345e, 1).fillRoundedRect(x - cellW / 2, y - 30, cellW, 60, 8);
      if (mine) g.lineStyle(3, 0xffffff, 1).strokeRoundedRect(x - cellW / 2, y - 30, cellW, 60, 8);
      const color = mine ? css(PALETTE.bluNotte) : '#B9C4E8';
      this.add.text(x, y - 13, `${i + 1}°`, { fontFamily: FONT_FAMILY, fontSize: '18px', color }).setOrigin(0.5);
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

  /** Il personaggio intero (gambe, corpo, arma) in posa, con i piedi in (x, y). */
  private buildCharacter(id: string, x: number, y: number, victory: boolean): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    c.add(this.add.image(0, 0, TEX.ombra));
    const legs = getLegs(id);
    if (legs) {
      const key = legTexture(id);
      c.add(this.add.image(legs.hips.back.x, legs.hips.back.y, key).setOrigin(legs.originX, legs.originY).setTint(0xb8b8c8).setRotation(-0.12));
      c.add(this.add.image(legs.hips.front.x, legs.hips.front.y, key).setOrigin(legs.originX, legs.originY).setRotation(0.1));
    }
    c.add(this.add.image(0, 2, characterTexture(id)).setOrigin(0.5, 1));
    const held = getHeldWeapon(id);
    if (held) {
      // vittoria: scettro puntato in avanti, verso l'alto
      c.add(
        this.add
          .image(held.hand.x, held.hand.y, weaponTexture(id))
          .setOrigin(held.originX, held.originY)
          .setRotation(victory ? 0.45 : 0.18),
      );
    }
    return c;
  }
}
