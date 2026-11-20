import Phaser from 'phaser';
import { playSfx } from '../audio/Sound';
import { startMenuMusic } from '../audio/Music';
import { TEX } from '../art';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import {
  RARITIES,
  ROLES,
  ROSTER,
  SPEED_NAMES,
  getCharacter,
  isPlayable,
  type RosterEntry,
} from '../data/characters';
import { MAX_LEVEL, PRESTIGE_TROPHIES, ROAD_CHARACTERS, TROPHY_ROAD, UPGRADE_COST, levelMultiplier } from '../data/progression';
import { SaveManager } from '../save/SaveManager';
import { createCharacterPose } from '../ui/CharacterPose';
import { backButton, currencyPill, goTo, makePressable, menuBackground, outlinedText, sparkBurst } from '../ui/MenuKit';
import { showToast } from '../ui/Toast';

const COLS = 8;
const CARD_W = 136;
const CARD_H = 168;
const GAP = 12;
const PANEL_W = 940;
const PANEL_H = 580;

/**
 * Schermata Personaggi: tutti e 24, in ordine di rarità. Quelli bloccati sono sagome in ombra.
 * Toccando una carta si apre la scheda: dati, livello, coppe, Prestigio, "Potenzia" e "Scegli".
 */
export class CharactersScene extends Phaser.Scene {
  private grid?: Phaser.GameObjects.Container;
  private panel?: Phaser.GameObjects.Container;
  private pills: { text: Phaser.GameObjects.Text; icon: Phaser.GameObjects.Image }[] = [];
  private countText!: Phaser.GameObjects.Text;

  constructor() {
    super('Characters');
  }

  create(): void {
    startMenuMusic();
    const { width: W, height: H } = this.scale;
    this.grid = undefined;
    this.panel = undefined;
    this.cameras.main.fadeIn(250, 20, 33, 61);
    menuBackground(this, W, H);

    backButton(this, () => goTo(this, 'Lobby'));
    outlinedText(this, W / 2, 40, 'Personaggi', 46, css(PALETTE.oro));
    this.countText = this.add
      .text(W / 2, 80, '', { fontFamily: FONT_FAMILY, fontSize: '22px', color: '#B9C4E8' })
      .setOrigin(0.5);

    const money = SaveManager.getCurrencies();
    this.pills = [
      currencyPill(this, W - 380, 22, TEX.scarabeo, money.scarabs),
      currencyPill(this, W - 196, 22, TEX.polvereStelle, money.stardust),
    ];
    this.buildGrid();
  }

  // ------------------------------------------------------------ griglia

  private sorted(): RosterEntry[] {
    return [...ROSTER].sort((a, b) => RARITIES[a.rarity].order - RARITIES[b.rarity].order || ROSTER.indexOf(a) - ROSTER.indexOf(b));
  }

  private buildGrid(): void {
    this.grid?.destroy();
    const { width: W } = this.scale;
    const totalW = COLS * CARD_W + (COLS - 1) * GAP;
    const left = W / 2 - totalW / 2 + CARD_W / 2;
    const top = 110 + CARD_H / 2;
    const grid = (this.grid = this.add.container(0, 0).setDepth(0));
    this.sorted().forEach((entry, i) => {
      const x = left + (i % COLS) * (CARD_W + GAP);
      const y = top + Math.floor(i / COLS) * (CARD_H + GAP);
      grid.add(this.buildCard(entry, x, y));
    });
    const unlocked = ROSTER.filter((c) => SaveManager.isUnlocked(c.id)).length;
    this.countText.setText(`${unlocked} / ${ROSTER.length} sbloccati`);
  }

  private buildCard(entry: RosterEntry, x: number, y: number): Phaser.GameObjects.Container {
    const id = entry.id;
    const locked = !SaveManager.isUnlocked(id);
    const prestige = !locked && SaveManager.hasPrestige(id);
    const selected = !locked && SaveManager.getSelectedCharacter() === id;
    const rarity = RARITIES[entry.rarity];
    const hw = CARD_W / 2;
    const hh = CARD_H / 2;

    const c = this.add.container(x, y);
    const g = this.add.graphics();
    // ombra, cornice del colore della rarità, riquadro scuro per il ritratto
    g.fillStyle(0x000000, 0.35).fillRoundedRect(-hw, -hh + 6, CARD_W, CARD_H, 16);
    g.fillStyle(locked ? 0x3a4266 : rarity.color, 1).fillRoundedRect(-hw, -hh, CARD_W, CARD_H, 16);
    g.fillStyle(PALETTE.bluNotte, locked ? 0.75 : 0.45).fillRoundedRect(-hw + 6, -hh + 6, CARD_W - 12, CARD_H - 50, 11);
    g.fillStyle(0xffffff, locked ? 0.04 : 0.12).fillRoundedRect(-hw + 6, -hh + 6, CARD_W - 12, 30, 11);
    g.lineStyle(3, PALETTE.bluNotte, 1).strokeRoundedRect(-hw, -hh, CARD_W, CARD_H, 16);
    c.add(g);

    // ritratto (in ombra se bloccato)
    const feetY = hh - 52;
    const pose = createCharacterPose(this, id, 0, feetY, 0.18, locked).container.setScale(0.6);
    c.add(pose);
    if (locked) c.add(this.add.image(0, -18, TEX.lucchetto).setScale(1.1));

    c.add(
      this.add
        .text(0, hh - 22, entry.name, {
          fontFamily: FONT_FAMILY,
          fontSize: entry.name.length > 6 ? '21px' : '24px',
          color: locked ? '#AEB6CF' : '#FFFFFF',
          stroke: css(PALETTE.bluNotte),
          strokeThickness: 5,
        })
        .setOrigin(0.5),
    );

    if (!locked) {
      // livello in alto a sinistra, coppe in alto a destra
      const lv = this.add.graphics();
      lv.fillStyle(PALETTE.lapislazzuli, 1).fillRoundedRect(-hw + 2, -hh + 2, 48, 28, 12);
      lv.lineStyle(2, PALETTE.bluNotte, 1).strokeRoundedRect(-hw + 2, -hh + 2, 48, 28, 12);
      c.add(lv);
      c.add(this.add.text(-hw + 26, -hh + 16, `Liv ${SaveManager.getLevel(id)}`, { fontFamily: FONT_FAMILY, fontSize: '15px', color: '#FFFFFF' }).setOrigin(0.5));
      const tr = this.add
        .text(hw - 6, -hh + 17, String(SaveManager.getTrophies(id)), {
          fontFamily: FONT_FAMILY,
          fontSize: '16px',
          color: css(PALETTE.oro),
          stroke: css(PALETTE.bluNotte),
          strokeThickness: 4,
        })
        .setOrigin(1, 0.5);
      c.add([this.add.image(tr.x - tr.width - 9, -hh + 17, TEX.coppa).setScale(0.26), tr]);
    }

    if (prestige) {
      // Prestigio 1: doppia cornice d'oro e stemma
      const f = this.add.graphics();
      f.lineStyle(5, PALETTE.oro, 1).strokeRoundedRect(-hw - 4, -hh - 4, CARD_W + 8, CARD_H + 8, 19);
      f.lineStyle(2, 0xfff1c1, 1).strokeRoundedRect(-hw - 8, -hh - 8, CARD_W + 16, CARD_H + 16, 22);
      c.add(f);
      c.add(this.add.image(0, -hh - 4, TEX.stemmaPrestigio).setScale(0.5));
      this.tweens.add({ targets: f, alpha: 0.55, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    if (selected) {
      const s = this.add.graphics();
      s.lineStyle(5, PALETTE.turchese, 1).strokeRoundedRect(-hw + 2, -hh + 2, CARD_W - 4, CARD_H - 4, 15);
      c.add(s);
      this.tweens.add({ targets: s, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });
    }

    makePressable(c, CARD_W, CARD_H, () => this.openPanel(id));
    return c;
  }

  private refreshPills(): void {
    const money = SaveManager.getCurrencies();
    this.pills[0].text.setText(String(money.scarabs));
    this.pills[1].text.setText(String(money.stardust));
  }

  // ------------------------------------------------------------ scheda del personaggio

  private closePanel(): void {
    this.panel?.destroy();
    this.panel = undefined;
  }

  private openPanel(id: string, celebrate = false): void {
    this.panel?.destroy();
    const { width: W, height: H } = this.scale;
    const entry = ROSTER.find((c) => c.id === id)!;
    const rarity = RARITIES[entry.rarity];
    const locked = !SaveManager.isUnlocked(id);
    const playable = isPlayable(id);
    const prestige = !locked && SaveManager.hasPrestige(id);
    const level = SaveManager.getLevel(id);

    const root = (this.panel = this.add.container(0, 0).setDepth(100));
    // sfondo scuro: toccandolo si chiude la scheda
    const shade = this.add.rectangle(0, 0, W, H, 0x050914, 0.7).setOrigin(0).setInteractive();
    shade.on('pointerup', () => this.closePanel());
    root.add(shade);

    const px = W / 2;
    const py = H / 2 + 26;
    const box = this.add.container(px, py);
    root.add(box);
    // il riquadro ferma i tocchi (così non si chiude toccando dentro)
    const card = this.add.rectangle(0, 0, PANEL_W, PANEL_H, 0, 0).setInteractive();
    box.add(card);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4).fillRoundedRect(-PANEL_W / 2, -PANEL_H / 2 + 8, PANEL_W, PANEL_H, 28);
    g.fillStyle(PALETTE.bluNotte, 1).fillRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 28);
    g.fillStyle(locked ? 0x3a4266 : rarity.color, 0.35).fillRoundedRect(-PANEL_W / 2 + 10, -PANEL_H / 2 + 10, 340, PANEL_H - 20, 22);
    g.lineStyle(5, prestige ? PALETTE.oro : rarity.color, 1).strokeRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 28);
    box.add(g);

    // ---- a sinistra: il personaggio sul piedistallo ----
    const hx = -PANEL_W / 2 + 180;
    const feetY = 150;
    const glow = this.add.image(hx, feetY - 110, TEX.bagliore).setScale(3).setTint(prestige ? PALETTE.oro : rarity.color).setAlpha(locked ? 0.15 : 0.5);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    box.add(glow);
    this.tweens.add({ targets: glow, scale: 3.4, alpha: glow.alpha * 0.6, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    box.add(this.add.image(hx, feetY, TEX.piedistallo).setOrigin(0.5, 34 / 168).setScale(0.62));
    const pose = createCharacterPose(this, id, hx, feetY, 0.18, locked);
    const hero = pose.container.setScale(1.3);
    box.add(hero);
    this.tweens.add({ targets: hero, scaleY: 1.33, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    if (locked) box.add(this.add.image(hx, feetY - 110, TEX.lucchetto).setScale(1.8));
    if (prestige) {
      box.add(this.add.image(hx, -PANEL_H / 2 + 46, TEX.stemmaPrestigio).setScale(0.9));
      const sparks = this.add.particles(0, 0, TEX.scintilla, {
        x: { min: hx - 90, max: hx + 90 },
        y: { min: feetY - 220, max: feetY },
        speedY: { min: -40, max: -15 },
        scale: { start: 0.7, end: 0 },
        lifespan: 1400,
        frequency: 140,
        blendMode: Phaser.BlendModes.ADD,
      });
      box.add(sparks);
    }

    // ---- a destra: nome, rarità, dati ----
    const rx = -PANEL_W / 2 + 390;
    let y = -PANEL_H / 2 + 52;
    box.add(
      this.add
        .text(rx, y, entry.name, { fontFamily: FONT_FAMILY, fontSize: '56px', color: '#FFFFFF', stroke: '#000000', strokeThickness: 2 })
        .setOrigin(0, 0.5),
    );
    y += 50;
    if (prestige) {
      box.add(this.add.text(rx, y, `${entry.title} · Prestigio 1`, { fontFamily: FONT_FAMILY, fontSize: '26px', color: css(PALETTE.oro) }).setOrigin(0, 0.5));
      y += 42;
    }
    // etichetta della rarità + ruoli
    const chip = this.add.graphics();
    chip.fillStyle(rarity.color, 1).fillRoundedRect(rx, y - 17, 150, 34, 17);
    chip.lineStyle(3, 0x000000, 0.4).strokeRoundedRect(rx, y - 17, 150, 34, 17);
    box.add(chip);
    box.add(this.add.text(rx + 75, y, rarity.name, { fontFamily: FONT_FAMILY, fontSize: '22px', color: css(PALETTE.bluNotte) }).setOrigin(0.5));
    box.add(
      this.add
        .text(rx + 166, y, entry.roles.map((r) => ROLES[r].name).join(' · '), { fontFamily: FONT_FAMILY, fontSize: '24px', color: '#DCE4FF' })
        .setOrigin(0, 0.5),
    );
    y += 52;

    const line = (label: string, value: string, extra = '') => {
      const t = this.add.text(rx, y, `${label}: `, { fontFamily: FONT_FAMILY, fontSize: '26px', color: '#B9C4E8' }).setOrigin(0, 0.5);
      const v = this.add.text(t.x + t.width, y, value, { fontFamily: FONT_FAMILY, fontSize: '26px', color: '#FFFFFF' }).setOrigin(0, 0.5);
      box.add([t, v]);
      if (extra) box.add(this.add.text(v.x + v.width + 10, y, extra, { fontFamily: FONT_FAMILY, fontSize: '24px', color: '#7CF08A' }).setOrigin(0, 0.5));
      y += 38;
    };
    const canGrow = !locked && level < MAX_LEVEL;
    const health = Math.round(entry.maxHealth * levelMultiplier(level));
    const nextHealth = Math.round(entry.maxHealth * levelMultiplier(level + 1));
    line('Vita', String(health), canGrow ? `→ ${nextHealth}` : '');
    line('Velocità', SPEED_NAMES[entry.speed]);
    if (playable) {
      const data = getCharacter(id);
      const dmg = Math.round(data.weapon.damage * levelMultiplier(level));
      const nextDmg = Math.round(data.weapon.damage * levelMultiplier(level + 1));
      line(data.weapon.name, `danno ${dmg}`, canGrow ? `→ ${nextDmg}` : '');
      line('Super', data.super.name);
    } else {
      line('Arma e super', 'in arrivo!');
    }
    y += 8;

    if (locked) {
      this.addHowToGet(box, rx, y, id);
    } else {
      y = this.addLevelAndTrophies(box, rx, y, id, level, celebrate);
      this.addButtons(box, rx, PANEL_H / 2 - 66, id, level, playable);
    }

    // pulsante per chiudere
    const close = this.add.container(PANEL_W / 2 - 14, -PANEL_H / 2 + 14);
    const cg = this.add.graphics();
    cg.fillStyle(PALETTE.rossoDeserto, 1).fillCircle(0, 0, 30);
    cg.lineStyle(4, PALETTE.bluNotte, 1).strokeCircle(0, 0, 30);
    cg.lineStyle(7, 0xffffff, 1).beginPath().moveTo(-10, -10).lineTo(10, 10).moveTo(10, -10).lineTo(-10, 10).strokePath();
    close.add(cg);
    makePressable(close, 70, 70, () => this.closePanel());
    box.add(close);

    if (celebrate) {
      this.cameras.main.flash(200, 255, 240, 190);
      sparkBurst(this, px + hx, py + feetY - 100, 26, 220);
      this.tweens.add({ targets: hero, y: feetY - 30, duration: 180, yoyo: true, ease: 'Quad.out' });
    } else {
      box.setScale(0.85).setAlpha(0);
      this.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 200, ease: 'Back.out' });
    }
  }

  /** Livello (con le 11 tacche) e coppe, con la barra verso il Prestigio 1. */
  private addLevelAndTrophies(box: Phaser.GameObjects.Container, rx: number, y: number, id: string, level: number, celebrate: boolean): number {
    const lvText = this.add.text(rx, y, `Livello ${level}`, { fontFamily: FONT_FAMILY, fontSize: '30px', color: css(PALETTE.oro) }).setOrigin(0, 0.5);
    box.add(lvText);
    if (celebrate) {
      lvText.setScale(1.6);
      this.tweens.add({ targets: lvText, scale: 1, duration: 400, ease: 'Back.out' });
    }
    const pips = this.add.graphics();
    for (let i = 0; i < MAX_LEVEL; i++) {
      const x = rx + 150 + i * 32;
      pips.fillStyle(i < level ? PALETTE.oro : 0x2a3a6b, 1).fillRoundedRect(x, y - 11, 26, 22, 6);
      pips.lineStyle(2, 0x000000, 0.5).strokeRoundedRect(x, y - 11, 26, 22, 6);
    }
    box.add(pips);
    y += 46;

    const trophies = SaveManager.getTrophies(id);
    const best = SaveManager.getBestTrophies(id);
    box.add(this.add.image(rx + 16, y, TEX.coppa).setScale(0.45));
    box.add(this.add.text(rx + 40, y, `${trophies} coppe`, { fontFamily: FONT_FAMILY, fontSize: '28px', color: '#FFFFFF' }).setOrigin(0, 0.5));
    // barra del prestigio
    const bx = rx + 220;
    const bw = 280;
    const frac = Math.min(1, best / PRESTIGE_TROPHIES);
    const bar = this.add.graphics();
    bar.fillStyle(0x0b1230, 1).fillRoundedRect(bx, y - 15, bw, 30, 15);
    if (frac > 0) bar.fillStyle(PALETTE.oro, 1).fillRoundedRect(bx, y - 15, Math.max(30, bw * frac), 30, 15);
    bar.lineStyle(3, PALETTE.oro, 1).strokeRoundedRect(bx, y - 15, bw, 30, 15);
    box.add(bar);
    const label = frac >= 1 ? 'Prestigio 1 raggiunto!' : `Prestigio 1: ${best} / ${PRESTIGE_TROPHIES}`;
    box.add(
      this.add
        .text(bx + bw / 2, y, label, { fontFamily: FONT_FAMILY, fontSize: '19px', color: '#FFFFFF', stroke: css(PALETTE.bluNotte), strokeThickness: 4 })
        .setOrigin(0.5),
    );
    return y + 40;
  }

  /** Personaggio bloccato: dove si trova. */
  private addHowToGet(box: Phaser.GameObjects.Container, rx: number, y: number, id: string): void {
    let text: string;
    if (ROAD_CHARACTERS.includes(id)) {
      const step = TROPHY_ROAD.find((s) => s.reward.kind === 'personaggio' && s.reward.characterId === id);
      text = `Il premio più grande del gioco!\nSi sblocca nel Cammino delle Coppe\na ${step?.trophies ?? 6000} coppe totali.`;
    } else if (isPlayable(id)) {
      text = 'Si trova nei sarcofagi:\nun po’ in quelli di bronzo,\nspesso in quelli d’oro e del Faraone!';
    } else {
      text = 'Questo dio sta ancora\nscendendo dal cielo...\nArriverà presto!';
    }
    const g = this.add.graphics();
    g.fillStyle(0x0b1230, 0.8).fillRoundedRect(rx, y, 500, 150, 20);
    g.lineStyle(3, PALETTE.oro, 0.8).strokeRoundedRect(rx, y, 500, 150, 20);
    box.add(g);
    box.add(this.add.image(rx + 50, y + 75, TEX.lucchetto).setScale(1.4));
    box.add(this.add.text(rx + 96, y + 75, text, { fontFamily: FONT_FAMILY, fontSize: '25px', color: '#FFFFFF', lineSpacing: 2 }).setOrigin(0, 0.5));
  }

  /** "Potenzia" (con il costo) e "Scegli". */
  private addButtons(box: Phaser.GameObjects.Container, rx: number, y: number, id: string, level: number, playable: boolean): void {
    // ---- Potenzia ----
    const up = this.add.container(rx + 160, y);
    const w = 320;
    const h = 96;
    const ug = this.add.graphics();
    up.add(ug);
    if (level >= MAX_LEVEL) {
      ug.fillStyle(0x2a3a6b, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 22);
      ug.lineStyle(4, PALETTE.oro, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 22);
      up.add(this.add.text(0, 0, 'Livello massimo!', { fontFamily: FONT_FAMILY, fontSize: '32px', color: css(PALETTE.oro) }).setOrigin(0.5));
    } else {
      const cost = UPGRADE_COST[level + 1];
      const money = SaveManager.getCurrencies();
      const ok = money.scarabs >= cost.scarabs && money.stardust >= cost.stardust;
      ug.fillStyle(ok ? PALETTE.oroOmbra : 0x3a4266, 1).fillRoundedRect(-w / 2, -h / 2 + 7, w, h, 22);
      ug.fillStyle(ok ? PALETTE.oro : 0x6a7397, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 22);
      ug.fillStyle(0xffffff, 0.22).fillRoundedRect(-w / 2 + 10, -h / 2 + 6, w - 20, 26, 12);
      ug.lineStyle(5, PALETTE.bluNotte, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 22);
      up.add(this.add.text(0, -20, `Potenzia → ${level + 1}`, { fontFamily: FONT_FAMILY, fontSize: '32px', color: css(PALETTE.bluNotte) }).setOrigin(0.5));
      const enoughS = money.scarabs >= cost.scarabs;
      const enoughD = money.stardust >= cost.stardust;
      up.add(this.add.image(-96, 22, TEX.scarabeo).setScale(0.42));
      up.add(this.add.text(-78, 22, String(cost.scarabs), { fontFamily: FONT_FAMILY, fontSize: '26px', color: enoughS ? '#FFFFFF' : '#FF8A8A', stroke: css(PALETTE.bluNotte), strokeThickness: 5 }).setOrigin(0, 0.5));
      up.add(this.add.image(30, 22, TEX.polvereStelle).setScale(0.42));
      up.add(this.add.text(48, 22, String(cost.stardust), { fontFamily: FONT_FAMILY, fontSize: '26px', color: enoughD ? '#FFFFFF' : '#FF8A8A', stroke: css(PALETTE.bluNotte), strokeThickness: 5 }).setOrigin(0, 0.5));
      if (ok) this.tweens.add({ targets: up, scale: 1.04, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    makePressable(up, w, h, () => this.tryUpgrade(id));
    box.add(up);

    // ---- Scegli ----
    const pick = this.add.container(rx + 420, y);
    const pw = 170;
    const pg = this.add.graphics();
    pick.add(pg);
    const selected = SaveManager.getSelectedCharacter() === id;
    if (selected || !playable) {
      pg.fillStyle(0x2a3a6b, 1).fillRoundedRect(-pw / 2, -h / 2, pw, h, 22);
      pg.lineStyle(4, selected ? PALETTE.turchese : 0x6a7397, 1).strokeRoundedRect(-pw / 2, -h / 2, pw, h, 22);
      pick.add(
        this.add
          .text(0, 0, selected ? 'In uso' : 'Presto\nin battaglia', { fontFamily: FONT_FAMILY, fontSize: selected ? '32px' : '22px', color: selected ? '#7FF5EA' : '#AEB6CF', align: 'center' })
          .setOrigin(0.5),
      );
      if (!selected) makePressable(pick, pw, h, () => showToast(this, 'Questo dio arriverà presto\nin battaglia!'));
    } else {
      pg.fillStyle(0x1a8f84, 1).fillRoundedRect(-pw / 2, -h / 2 + 7, pw, h, 22);
      pg.fillStyle(PALETTE.turchese, 1).fillRoundedRect(-pw / 2, -h / 2, pw, h, 22);
      pg.lineStyle(5, PALETTE.bluNotte, 1).strokeRoundedRect(-pw / 2, -h / 2, pw, h, 22);
      pick.add(this.add.text(0, -2, 'Scegli', { fontFamily: FONT_FAMILY, fontSize: '36px', color: css(PALETTE.bluNotte) }).setOrigin(0.5));
      makePressable(pick, pw, h, () => this.choose(id));
    }
    box.add(pick);
  }

  private tryUpgrade(id: string): void {
    const result = SaveManager.upgrade(id);
    if (result === 'ok') {
      playSfx('reward');
      this.refreshPills();
      this.buildGrid();
      this.openPanel(id, true);
      showToast(this, `${ROSTER.find((c) => c.id === id)?.name} è al livello ${SaveManager.getLevel(id)}!`);
    } else if (result === 'scarabei') {
      playSfx('denied');
      showToast(this, "Ti servono più scarabei d'oro!\nVinci partite per trovarli nei sarcofagi");
    } else if (result === 'polvere') {
      playSfx('denied');
      showToast(this, 'Ti serve più polvere di stelle!\nVinci partite per trovarla nei sarcofagi');
    } else if (result === 'max') {
      showToast(this, 'È già al livello massimo!');
    }
  }

  private choose(id: string): void {
    if (!SaveManager.selectCharacter(id)) return;
    this.buildGrid();
    this.openPanel(id);
    showToast(this, `Hai scelto ${ROSTER.find((c) => c.id === id)?.name}!`);
  }
}
