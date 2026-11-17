import Phaser from 'phaser';
import { TEX } from '../art';
import { LOGO_SIZE, LOGO_WINK_EYE } from '../art/logo';
import { PALETTE, css } from '../art/palette';
import { PRIZE_SARC_SIZE } from '../art/sarcophagi';
import { FONT_FAMILY } from '../config';
import { getSarcophagus, rollSarcophagus, type SarcophagusLoot, type SarcophagusTier } from '../data/progression';
import { SaveManager } from '../save/SaveManager';
import { createGoldButton } from '../ui/GoldButton';

/** Disegni e colori di ogni tipo di sarcofago. Il Faraone usa il sarcofago del logo (sogghigna). */
const LOOK: Record<SarcophagusTier, { case: string; lid: string; glow: number; title: string }> = {
  legno: { case: TEX.sarcLegnoCassa, lid: TEX.sarcLegnoCoperchio, glow: 0xd49a60, title: '#F2C894' },
  bronzo: { case: TEX.sarcBronzoCassa, lid: TEX.sarcBronzoCoperchio, glow: 0xe08a3c, title: '#F7B77A' },
  oro: { case: TEX.sarcOroCassa, lid: TEX.sarcOroCoperchio, glow: PALETTE.oro, title: css(PALETTE.oro) },
  faraone: { case: TEX.logoCassa, lid: TEX.logoCoperchio, glow: PALETTE.turchese, title: '#7FF5EA' },
};

type State = 'arriving' | 'ready' | 'opening' | 'reward' | 'busy' | 'done';

interface Reward {
  tex: string;
  amount: number;
  name: string;
  /** a quale contatore in alto va (0 scarabei, 1 polvere) */
  pill: number;
}

/**
 * Apertura di un sarcofago (sezione 5): cade giù, si tocca, trema, il coperchio scivola via,
 * esce la luce d'oro e i premi volano fuori uno alla volta.
 * Con `forcedTier` (da "?sarcofago=oro" nella Lobby) è una prova: i premi non vengono salvati.
 */
export class SarcophagusScene extends Phaser.Scene {
  private forcedTier?: SarcophagusTier;
  private state: State = 'arriving';
  private loot!: SarcophagusLoot;
  private rewards: Reward[] = [];
  private rewardIndex = 0;
  private sarc!: Phaser.GameObjects.Container;
  private lid!: Phaser.GameObjects.Container;
  private beam!: Phaser.GameObjects.Image;
  private glow!: Phaser.GameObjects.Image;
  private hint!: Phaser.GameObjects.Text;
  private pillIcons: Phaser.GameObjects.Image[] = [];
  private pillTexts: Phaser.GameObjects.Text[] = [];
  private pillValues: number[] = [];
  private card?: { box: Phaser.GameObjects.Container; icon: Phaser.GameObjects.Image };
  private sarcY = 0;
  private sarcH = 0;

  constructor() {
    super('Sarcophagus');
  }

  init(data: { forcedTier?: SarcophagusTier }): void {
    this.forcedTier = data?.forcedTier;
    this.state = 'arriving';
    this.rewardIndex = 0;
    this.card = undefined;
    this.pillIcons = [];
    this.pillTexts = [];
  }

  create(): void {
    const { width: W, height: H } = this.scale;
    const test = this.forcedTier !== undefined;
    const before = SaveManager.getCurrencies();
    this.loot = rollSarcophagus(this.forcedTier);
    if (!test && !SaveManager.openSarcophagus(this.loot)) {
      this.scene.start('Lobby');
      return;
    }
    this.rewards = [
      { tex: TEX.scarabeo, amount: this.loot.scarabs, name: "Scarabei d'oro", pill: 0 },
      { tex: TEX.polvereStelle, amount: this.loot.stardust, name: 'Polvere di stelle', pill: 1 },
    ];
    this.pillValues = [before.scarabs, before.stardust];

    this.cameras.main.fadeIn(250, 20, 33, 61);
    this.drawBackground(W, H);
    this.drawPills();
    if (test) {
      this.add
        .text(W - 20, 20, 'Prova: i premi non si salvano', { fontFamily: FONT_FAMILY, fontSize: '20px', color: '#B9C4E8' })
        .setOrigin(1, 0);
    }
    this.buildSarcophagus(W, H);

    this.hint = this.add
      .text(W / 2, H - 46, 'Tocca per aprirlo!', {
        fontFamily: FONT_FAMILY,
        fontSize: '36px',
        color: '#FFFFFF',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: this.hint, scale: 1.08, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const tap = () => this.onTap();
    this.input.on(Phaser.Input.Events.POINTER_UP, tap);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.off(Phaser.Input.Events.POINTER_UP, tap));
  }

  // ------------------------------------------------------------ disegno

  private drawBackground(W: number, H: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b1230, 0x0b1230, PALETTE.lapislazzuli, PALETTE.lapislazzuli, 1).fillRect(0, 0, W, H);
    // raggi che girano piano dietro al sarcofago
    const rays = this.add.graphics({ x: W / 2, y: H * 0.56 });
    rays.fillStyle(LOOK[this.loot.tier].glow, 0.12);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays.slice(0, 0, Math.max(W, H), a, a + 0.18, false).fillPath();
    }
    this.tweens.add({ targets: rays, angle: 360, duration: 30000, repeat: -1 });
    // pavimento di sabbia
    bg.fillStyle(PALETTE.sabbiaScura, 1).fillEllipse(W / 2, H + 40, W * 1.2, 230);
    bg.fillStyle(PALETTE.sabbia, 1).fillEllipse(W / 2, H + 70, W * 1.1, 220);
  }

  /** In alto: scarabei e polvere di stelle (si riempiono quando prendi i premi). */
  private drawPills(): void {
    const items: [string, number][] = [
      [TEX.scarabeo, 0.7],
      [TEX.polvereStelle, 0.7],
    ];
    items.forEach(([tex, scale], i) => {
      const x = 24 + i * 196;
      const y = 22;
      const g = this.add.graphics();
      g.fillStyle(PALETTE.bluNotte, 0.85).fillRoundedRect(x, y, 180, 50, 25);
      g.lineStyle(3, PALETTE.oro, 1).strokeRoundedRect(x, y, 180, 50, 25);
      this.pillIcons.push(this.add.image(x + 30, y + 25, tex).setScale(scale));
      this.pillTexts.push(
        this.add
          .text(x + 60, y + 25, String(this.pillValues[i]), { fontFamily: FONT_FAMILY, fontSize: '30px', color: '#FFFFFF' })
          .setOrigin(0, 0.5),
      );
    });
  }

  private buildSarcophagus(W: number, H: number): void {
    const tier = this.loot.tier;
    const look = LOOK[tier];
    const pharaoh = tier === 'faraone';
    const size = pharaoh ? LOGO_SIZE : PRIZE_SARC_SIZE;
    const scale = (H * 0.5) / size.height;
    this.sarcY = H * 0.56;
    this.sarcH = size.height * scale;

    this.glow = this.add.image(W / 2, this.sarcY, TEX.bagliore).setScale(0).setTint(look.glow).setBlendMode(Phaser.BlendModes.ADD);
    this.sarc = this.add.container(W / 2, -this.sarcH).setScale(scale);
    const caseImg = this.add.image(0, 0, look.case);
    this.beam = this.add
      .image(0, size.height * 0.1, TEX.raggioLuce)
      .setOrigin(0.5, 1)
      .setScale(1.3, 1.6)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.lid = this.add.container(0, 0, [this.add.image(0, 0, look.lid)]);
    this.sarc.add([caseImg, this.beam, this.lid]);

    // nome del sarcofago
    const name = this.add
      .text(W / 2, Math.max(110, this.sarcY - this.sarcH / 2 - 44), getSarcophagus(tier).name, {
        fontFamily: FONT_FAMILY,
        fontSize: pharaoh ? '50px' : '44px',
        color: look.title,
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 9,
      })
      .setOrigin(0.5)
      .setScale(0);

    // cade giù e rimbalza
    this.tweens.add({
      targets: this.sarc,
      y: this.sarcY,
      duration: 750,
      ease: 'Bounce.out',
      onComplete: () => {
        this.cameras.main.shake(140, 0.006);
        this.dust(W / 2, this.sarcY + this.sarcH / 2);
        this.tweens.add({ targets: name, scale: 1, duration: 380, ease: 'Back.out' });
        this.tweens.add({ targets: this.glow, scale: 3.2, alpha: 0.6, duration: 500 });
        if (pharaoh) this.time.delayedCall(450, () => this.pharaohGrin(size.width, size.height));
        else this.time.delayedCall(350, () => this.ready());
      },
    });
  }

  /** Il Sarcofago del Faraone, prima di aprirsi, sogghigna e fa l'occhiolino come il logo. */
  private pharaohGrin(w: number, h: number): void {
    const wink = this.add.image(LOGO_WINK_EYE.x - w / 2, LOGO_WINK_EYE.y - h / 2, TEX.logoOcchiolino);
    this.lid.add(wink);
    this.tweens.add({ targets: this.sarc, angle: -6, duration: 160, yoyo: true });
    const bubble = this.add
      .text(this.sarc.x + 150, this.sarcY - this.sarcH * 0.32, 'Eh eh eh!', {
        fontFamily: FONT_FAMILY,
        fontSize: '38px',
        color: css(PALETTE.oro),
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 8,
      })
      .setOrigin(0, 0.5)
      .setScale(0)
      .setAngle(-8);
    this.tweens.add({ targets: bubble, scale: 1, duration: 300, ease: 'Back.out' });
    this.time.delayedCall(550, () => wink.destroy());
    this.time.delayedCall(1300, () => {
      this.tweens.add({ targets: bubble, alpha: 0, duration: 250, onComplete: () => bubble.destroy() });
      this.ready();
    });
  }

  private ready(): void {
    this.state = 'ready';
    this.tweens.add({ targets: this.hint, alpha: 1, duration: 250 });
  }

  // ------------------------------------------------------------ apertura

  private onTap(): void {
    if (this.state === 'ready') this.open();
    else if (this.state === 'reward') this.collect();
  }

  /** Trema sempre più forte, poi il coperchio scivola via ed esce la luce. */
  private open(): void {
    this.state = 'opening';
    this.hint.setAlpha(0);
    [3, 6, 10].forEach((amp, i) => {
      this.time.delayedCall(i * 330, () => {
        this.sarc.setAngle(0);
        this.tweens.add({ targets: this.sarc, angle: amp, duration: 45, yoyo: true, repeat: 3 });
        this.tweens.add({ targets: this.glow, scale: 3.2 + (i + 1) * 0.4, duration: 300 });
        this.sparkles(4 + i * 3, 0.6);
      });
    });
    this.time.delayedCall(1050, () => {
      this.sarc.setAngle(0);
      // il coperchio scivola verso sinistra e cade
      this.tweens.add({
        targets: this.lid,
        x: -PRIZE_SARC_SIZE.width * 1.25,
        y: 60,
        angle: -28,
        duration: 480,
        ease: 'Quad.in',
        onComplete: () => this.tweens.add({ targets: this.lid, y: 400, alpha: 0, duration: 380, ease: 'Quad.in' }),
      });
      this.time.delayedCall(220, () => {
        this.cameras.main.flash(260, 255, 244, 200);
        this.tweens.add({ targets: this.beam, alpha: 1, duration: 300 });
        this.tweens.add({ targets: this.beam, scaleX: 1.45, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.sparkles(22, 1);
      });
      this.time.delayedCall(900, () => this.nextReward());
    });
  }

  /** Il premio successivo vola fuori dal sarcofago e si mostra in grande. */
  private nextReward(): void {
    const r = this.rewards[this.rewardIndex];
    if (!r) {
      this.showSummary();
      return;
    }
    this.state = 'busy';
    const { width: W, height: H } = this.scale;
    const rx = Math.min(W * 0.76, W / 2 + 360);
    const ry = H * 0.5;
    const fromX = this.sarc.x;
    const fromY = this.sarcY - this.sarcH * 0.2;

    const box = this.add.container(rx, ry).setScale(0);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.bluNotte, 0.85).fillRoundedRect(-150, -150, 300, 300, 26);
    g.lineStyle(5, PALETTE.oro, 1).strokeRoundedRect(-150, -150, 300, 300, 26);
    const amount = this.add
      .text(0, 62, '+0', { fontFamily: FONT_FAMILY, fontSize: '64px', color: '#FFFFFF', stroke: css(PALETTE.bluNotte), strokeThickness: 9 })
      .setOrigin(0.5);
    const name = this.add.text(0, 114, r.name, { fontFamily: FONT_FAMILY, fontSize: '26px', color: '#DCE4FF' }).setOrigin(0.5);
    box.add([g, amount, name]);
    this.tweens.add({ targets: box, scale: 1, duration: 300, ease: 'Back.out' });

    // l'icona esce dal sarcofago con un arco e si mette nel riquadro
    const icon = this.add.image(fromX, fromY, r.tex).setScale(0.4);
    const toX = rx;
    const toY = ry - 40;
    const midX = (fromX + toX) / 2;
    const midY = Math.min(fromY, toY) - 180;
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 520,
      ease: 'Sine.out',
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        const u = 1 - t;
        icon.setPosition(u * u * fromX + 2 * u * t * midX + t * t * toX, u * u * fromY + 2 * u * t * midY + t * t * toY);
        icon.setScale(0.4 + 2.2 * t).setAngle(360 * t);
      },
      onComplete: () => {
        this.tweens.add({ targets: icon, scale: 2.8, duration: 120, yoyo: true });
        this.sparklesAt(toX, toY, 10);
        // il numero conta fino al premio
        this.tweens.addCounter({
          from: 0,
          to: r.amount,
          duration: 600,
          onUpdate: (tw) => amount.setText(`+${Math.round(tw.getValue() ?? 0)}`),
          onComplete: () => {
            amount.setText(`+${r.amount}`);
            this.tweens.add({ targets: amount, scale: 1.2, duration: 90, yoyo: true });
            this.hint.setText('Tocca per prenderlo!');
            this.tweens.add({ targets: this.hint, alpha: 1, duration: 200 });
            this.state = 'reward';
          },
        });
      },
    });
    this.card = { box, icon };
  }

  /** Il premio vola nel contatore in alto, che sale. */
  private collect(): void {
    const r = this.rewards[this.rewardIndex];
    const card = this.card;
    if (!r || !card) return;
    this.state = 'busy';
    this.hint.setAlpha(0);
    const target = this.pillIcons[r.pill];
    this.tweens.add({ targets: card.box, scale: 0, alpha: 0, duration: 250, onComplete: () => card.box.destroy() });
    this.tweens.add({
      targets: card.icon,
      x: target.x,
      y: target.y,
      scale: 0.7,
      angle: 0,
      duration: 480,
      ease: 'Quad.in',
      onComplete: () => {
        card.icon.destroy();
        const text = this.pillTexts[r.pill];
        const from = this.pillValues[r.pill];
        this.tweens.add({ targets: target, scale: 1, duration: 90, yoyo: true });
        this.tweens.addCounter({
          from,
          to: from + r.amount,
          duration: 450,
          onUpdate: (tw) => text.setText(String(Math.round(tw.getValue() ?? 0))),
          onComplete: () => {
            text.setText(String(from + r.amount));
            this.tweens.add({ targets: text, scale: 1.2, duration: 80, yoyo: true });
          },
        });
        this.pillValues[r.pill] = from + r.amount;
        this.rewardIndex++;
        this.time.delayedCall(300, () => this.nextReward());
      },
    });
  }

  /** Riepilogo dei premi, con "Apri il prossimo" se nella pila ce ne sono altri. */
  private showSummary(): void {
    this.state = 'done';
    const { width: W, height: H } = this.scale;
    const rx = Math.min(W * 0.76, W / 2 + 360);
    const box = this.add.container(rx, H * 0.36).setScale(0);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.bluNotte, 0.85).fillRoundedRect(-160, -100, 320, 200, 24);
    g.lineStyle(4, PALETTE.oro, 1).strokeRoundedRect(-160, -100, 320, 200, 24);
    box.add(g);
    box.add(this.add.text(0, -68, 'Hai trovato:', { fontFamily: FONT_FAMILY, fontSize: '30px', color: css(PALETTE.oro) }).setOrigin(0.5));
    this.rewards.forEach((r, i) => {
      const y = -10 + i * 64;
      box.add(this.add.image(-70, y, r.tex).setScale(0.9));
      box.add(
        this.add
          .text(-30, y, `+${r.amount}`, { fontFamily: FONT_FAMILY, fontSize: '40px', color: '#FFFFFF' })
          .setOrigin(0, 0.5),
      );
    });
    this.tweens.add({ targets: box, scale: 1, duration: 320, ease: 'Back.out' });

    const left = this.forcedTier === undefined ? SaveManager.getPendingSarcophagi() : 0;
    const buttons: Phaser.GameObjects.Container[] = [];
    if (left > 0) {
      buttons.push(createGoldButton(this, rx, H * 0.36 + 170, `Apri il prossimo (${left})`, () => this.leave('Sarcophagus'), 340, 76));
    }
    buttons.push(createGoldButton(this, rx, H * 0.36 + (left > 0 ? 262 : 180), 'Continua', () => this.leave('Lobby'), 300, 76));
    for (const b of buttons) {
      b.setAlpha(0);
      this.tweens.add({ targets: b, alpha: 1, delay: 300, duration: 250 });
    }
  }

  private leave(to: 'Lobby' | 'Sarcophagus'): void {
    if (this.state !== 'done') return;
    this.state = 'busy';
    this.cameras.main.fadeOut(250, 20, 33, 61);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(to, {}));
  }

  // ------------------------------------------------------------ effetti

  private sparkles(count: number, power: number): void {
    this.sparklesAt(this.sarc.x, this.sarcY - this.sarcH * 0.1, count, power);
  }

  private sparklesAt(x: number, y: number, count: number, power = 1): void {
    for (let i = 0; i < count; i++) {
      const p = this.add
        .image(x + Phaser.Math.Between(-60, 60), y + Phaser.Math.Between(-60, 40), TEX.scintilla)
        .setScale(Phaser.Math.FloatBetween(0.6, 1.4))
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-200, 200) * power,
        y: p.y - Phaser.Math.Between(80, 260) * power,
        alpha: 0,
        angle: 180,
        duration: Phaser.Math.Between(600, 1100),
        onComplete: () => p.destroy(),
      });
    }
  }

  private dust(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      const g = this.add.image(x + Phaser.Math.Between(-100, 100), y, TEX.granello).setScale(Phaser.Math.FloatBetween(1.5, 3));
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
}
