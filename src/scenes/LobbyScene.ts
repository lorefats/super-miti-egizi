import Phaser from 'phaser';
import { TEX } from '../art';
import { LOBBY_SKIES, type TimeOfDay } from '../art/lobby';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import { getCharacter } from '../data/characters';
import { makePressable } from '../ui/MenuKit';
import { LOBBY_POSE_EVERY, timeOfDayAt } from '../data/lobby';
import { SARCOPHAGI, type SarcophagusTier } from '../data/progression';
import { SaveManager } from '../save/SaveManager';
import { createCharacterPose, type CharacterPose } from '../ui/CharacterPose';
import { fullscreenOnFirstTap } from '../ui/fullscreen';
import { showToast } from '../ui/Toast';

const TIMES: TimeOfDay[] = ['alba', 'giorno', 'tramonto', 'notte'];
/** Metà larghezza dell'apertura del tempio da cui si vedono le piramidi. */
const OPENING = 330;
/** Altezza della barra in basso. */
const BAR_H = 96;

/**
 * Lobby (sezione 8): sala del trono di un tempio con le piramidi dietro,
 * il personaggio scelto sul piedistallo, le valute in alto, GIOCA a destra,
 * sarcofagi e Cammino delle Coppe a sinistra, barra delle schermate in basso.
 * Lo sfondo cambia con l'ora vera (alba, giorno, tramonto, notte). Per provarlo: "?ora=notte".
 */
export class LobbyScene extends Phaser.Scene {
  private hero!: CharacterPose;
  private heroScale = 1.7;
  private leaving = false;
  private pile!: Phaser.GameObjects.Container;
  private newSarcophagi = 0;

  constructor() {
    super('Lobby');
  }

  init(data: { newSarcophagi?: number }): void {
    this.newSarcophagi = data?.newSarcophagi ?? 0;
  }

  create(): void {
    this.leaving = false;
    const { width: W, height: H } = this.scale;
    fullscreenOnFirstTap(this);
    this.cameras.main.fadeIn(300, 20, 33, 61);

    const time = this.pickTime();
    const floorY = H * 0.66;
    this.drawHall(W, H, floorY, time);
    this.drawHero(W, H);
    this.drawTopBar();
    this.drawLeftSide(H);
    this.drawRightSide(W, H);
    this.drawBottomBar(W, H);
    if (this.newSarcophagi > 0) this.time.delayedCall(450, () => this.sarcophagusArrives(W, H));
  }

  private pickTime(): TimeOfDay {
    const forced = new URLSearchParams(location.search).get('ora');
    if (forced && (TIMES as string[]).includes(forced)) return forced as TimeOfDay;
    return timeOfDayAt(new Date().getHours());
  }

  // ------------------------------------------------------------ sfondo

  private drawHall(W: number, H: number, floorY: number, time: TimeOfDay): void {
    const sky = LOBBY_SKIES[time];
    const cx = W / 2;

    // cielo
    const g = this.add.graphics();
    g.fillGradientStyle(sky.top, sky.top, sky.bottom, sky.bottom, 1).fillRect(cx - OPENING - 20, 0, OPENING * 2 + 40, floorY);
    if (time === 'notte' || time === 'alba') {
      const n = time === 'notte' ? 40 : 10;
      for (let i = 0; i < n; i++) {
        const st = this.add
          .image(cx + Phaser.Math.Between(-OPENING, OPENING), Phaser.Math.Between(110, floorY - 140), TEX.stellaCielo)
          .setScale(Phaser.Math.FloatBetween(0.3, 0.8))
          .setAlpha(time === 'notte' ? 0.9 : 0.4);
        this.tweens.add({ targets: st, alpha: 0.2, duration: Phaser.Math.Between(800, 2000), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1500) });
      }
    }
    // sole o luna
    const disc: Record<TimeOfDay, [number, number, number]> = {
      alba: [cx - 170, floorY - 120, 0.9],
      giorno: [cx + 150, 190, 0.8],
      tramonto: [cx + 190, floorY - 110, 1.1],
      notte: [cx - 160, 200, 0.6],
    };
    const [sx, sy, ss] = disc[time];
    const sun = this.add.image(sx, sy, TEX.discoCielo).setScale(ss).setTint(sky.sun);
    this.tweens.add({ targets: sun, scale: ss * 1.05, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // piramidi lontane, colorate dalla luce del momento
    this.add.image(cx, floorY + 8, TEX.lobbyPiramidi).setOrigin(0.5, 1).setScale(0.72).setTint(sky.land);

    // muri ai lati dell'apertura
    const wallW = cx - OPENING;
    this.add.tileSprite(0, 0, wallW, floorY, TEX.lobbyMuro).setOrigin(0).setTint(sky.hall);
    this.add.tileSprite(cx + OPENING, 0, wallW, floorY, TEX.lobbyMuro).setOrigin(0).setTint(sky.hall);
    // ombra interna dell'apertura
    const edge = this.add.graphics();
    edge.fillStyle(PALETTE.bluNotte, 0.35).fillRect(cx - OPENING - 14, 0, 14, floorY).fillRect(cx + OPENING, 0, 14, floorY);

    // pavimento
    this.add.tileSprite(0, floorY, W, H - floorY, TEX.lobbyPavimento).setOrigin(0).setTint(sky.hall);
    const shade = this.add.graphics();
    shade.fillStyle(PALETTE.bluNotte, 0.25).fillRect(0, floorY, W, 10);

    // luce che entra dall'apertura e cade sul pavimento
    const beam = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    beam.fillStyle(sky.sun, time === 'notte' ? 0.06 : 0.14);
    beam.fillPoints(
      [
        new Phaser.Math.Vector2(cx - OPENING, floorY),
        new Phaser.Math.Vector2(cx + OPENING, floorY),
        new Phaser.Math.Vector2(cx + OPENING + 160, H),
        new Phaser.Math.Vector2(cx - OPENING - 160, H),
      ],
      true,
    );
    // granelli di polvere che fluttuano nella luce
    this.add.particles(0, 0, TEX.granello, {
      x: { min: cx - OPENING, max: cx + OPENING },
      y: { min: 140, max: H - 60 },
      speedY: { min: -12, max: -4 },
      speedX: { min: -8, max: 8 },
      scale: { min: 0.6, max: 1.3 },
      alpha: { start: 0, end: 0.7, ease: 'Sine.inOut' },
      lifespan: 4000,
      frequency: 160,
      blendMode: Phaser.BlendModes.ADD,
    });

    // colonne: due per lato, davanti al muro
    const colBottom = floorY + 36;
    const colScale = (colBottom - 90) / 600;
    for (const dx of [-(OPENING + 30), OPENING + 30, -(OPENING + 260), OPENING + 260]) {
      this.add.image(cx + dx, colBottom, TEX.lobbyColonna).setOrigin(0.5, 1).setScale(colScale).setTint(sky.hall);
    }

    // torce accanto all'apertura: di notte e al tramonto illuminano di più
    const strong = time === 'notte' || time === 'tramonto';
    for (const dx of [-(OPENING + 120), OPENING + 120]) {
      this.add.image(cx + dx, floorY + 40, TEX.torciaPalo).setOrigin(0.5, 1).setTint(sky.hall);
      const glow = this.add
        .image(cx + dx, floorY - 62, TEX.bagliore)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(strong ? 1.6 : 0.9);
      this.tweens.add({ targets: glow, alpha: { from: 0.6, to: 1 }, scale: glow.scale * 1.12, duration: 170, yoyo: true, repeat: -1 });
    }

    // architrave con il disco solare alato
    this.add.tileSprite(0, 0, W, 124, TEX.lobbyArchitrave).setOrigin(0).setTint(sky.hall);
    this.add.image(cx, 52, TEX.lobbySoleAlato).setScale(0.8).setTint(sky.hall);
  }

  // ------------------------------------------------------------ personaggio

  private drawHero(W: number, H: number): void {
    const id = SaveManager.getSelectedCharacter();
    const feetY = H - BAR_H - 96;
    this.add.image(W / 2, feetY, TEX.piedistallo).setOrigin(0.5, 34 / 168).setScale(0.8);
    const prestige = SaveManager.hasPrestige(id);
    if (prestige) this.drawPrestigeAura(W / 2, feetY);

    this.hero = createCharacterPose(this, id, W / 2, feetY);
    const c = this.hero.container.setScale(this.heroScale);
    // respiro
    this.tweens.add({ targets: c, scaleY: this.heroScale * 1.02, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // scettro che ondeggia piano
    if (this.hero.weapon) {
      this.tweens.add({ targets: this.hero.weapon, rotation: 0.26, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // ogni tanto fa la sua posa
    this.time.addEvent({ delay: LOBBY_POSE_EVERY * 1000, loop: true, callback: () => this.heroPose() });

    // toccando il personaggio fa un saltello
    c.setSize(120, 170).setInteractive(new Phaser.Geom.Rectangle(-60, -170, 120, 170), Phaser.Geom.Rectangle.Contains);
    c.on('pointerup', () => this.heroJump());

    // targa con nome e coppe del personaggio
    const data = getCharacter(id);
    this.add
      .text(W / 2, feetY + 40, data.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '30px',
        color: '#FFFFFF',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 7,
      })
      .setOrigin(0.5);
    const tr = this.add
      .text(W / 2 + 14, feetY + 74, String(SaveManager.getTrophies(id)), {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: css(PALETTE.oro),
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 6,
      })
      .setOrigin(0, 0.5);
    this.add.image(tr.x - 18, feetY + 74, TEX.coppa).setScale(0.5);
    if (prestige) {
      // titolo del Prestigio 1 su un nastro sopra la testa
      const ribbonY = feetY - 170 * this.heroScale - 30;
      const t = this.add
        .text(W / 2, ribbonY, data.title, { fontFamily: FONT_FAMILY, fontSize: '26px', color: css(PALETTE.bluNotte) })
        .setOrigin(0.5);
      const rw = t.width + 70;
      const rg = this.add.graphics();
      rg.fillStyle(PALETTE.oroOmbra, 1).fillTriangle(-rw / 2 - 18, 4, -rw / 2 + 8, -16, -rw / 2 + 8, 22);
      rg.fillTriangle(rw / 2 + 18, 4, rw / 2 - 8, -16, rw / 2 - 8, 22);
      rg.fillStyle(PALETTE.oro, 1).fillRoundedRect(-rw / 2, -20, rw, 40, 10);
      rg.lineStyle(3, PALETTE.bluNotte, 1).strokeRoundedRect(-rw / 2, -20, rw, 40, 10);
      rg.setPosition(W / 2, ribbonY);
      t.setDepth(1);
      this.add.image(W / 2 - rw / 2 + 4, ribbonY, TEX.stemmaPrestigio).setScale(0.55).setDepth(1);
    }
  }

  /** Prestigio 1: alone d'oro dietro al personaggio e scintille che salgono. */
  private drawPrestigeAura(x: number, feetY: number): void {
    const halo = this.add.image(x, feetY - 140, TEX.bagliore).setTint(PALETTE.oro).setBlendMode(Phaser.BlendModes.ADD).setScale(4.5).setAlpha(0.55);
    this.tweens.add({ targets: halo, scale: 5.2, alpha: 0.3, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.particles(0, 0, TEX.scintilla, {
      x: { min: x - 110, max: x + 110 },
      y: { min: feetY - 260, max: feetY },
      speedY: { min: -50, max: -20 },
      scale: { start: 0.8, end: 0 },
      lifespan: 1600,
      frequency: 120,
      blendMode: Phaser.BlendModes.ADD,
    });
  }

  /** Alza lo scettro al cielo e lo riabbassa. */
  private heroPose(): void {
    const w = this.hero.weapon;
    if (!w) return;
    this.tweens.killTweensOf(w);
    this.tweens.chain({
      targets: w,
      tweens: [
        { rotation: 0.7, duration: 260, ease: 'Back.out' },
        { rotation: 0.7, duration: 500 },
        { rotation: 0.18, duration: 380, ease: 'Sine.inOut' },
      ],
      onComplete: () => {
        this.tweens.add({ targets: w, rotation: 0.26, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      },
    });
  }

  private heroJump(): void {
    const c = this.hero.container;
    if (this.tweens.isTweening(c) && c.y !== c.getData('baseY') && c.getData('baseY') !== undefined) return;
    const baseY = (c.getData('baseY') as number | undefined) ?? c.y;
    c.setData('baseY', baseY);
    this.tweens.add({ targets: c, y: baseY - 40, duration: 200, yoyo: true, ease: 'Quad.out', onComplete: () => c.setY(baseY) });
    for (let i = 0; i < 8; i++) {
      const p = this.add.image(c.x + Phaser.Math.Between(-50, 50), c.y - Phaser.Math.Between(40, 200), TEX.scintilla);
      p.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: p, y: p.y - 60, alpha: 0, angle: 180, duration: 700, onComplete: () => p.destroy() });
    }
  }

  // ------------------------------------------------------------ interfaccia

  /** In alto: coppe totali, scarabei d'oro, polvere di stelle. */
  private drawTopBar(): void {
    const money = SaveManager.getCurrencies();
    const items: [string, number, number][] = [
      [TEX.coppa, SaveManager.getTotalTrophies(), 0.62],
      [TEX.scarabeo, money.scarabs, 0.7],
      [TEX.polvereStelle, money.stardust, 0.7],
    ];
    items.forEach(([tex, value, scale], i) => {
      const x = 24 + i * 186;
      const y = 22;
      const g = this.add.graphics();
      g.fillStyle(PALETTE.bluNotte, 0.85).fillRoundedRect(x, y, 170, 50, 25);
      g.lineStyle(3, PALETTE.oro, 1).strokeRoundedRect(x, y, 170, 50, 25);
      this.add.image(x + 30, y + 25, tex).setScale(scale);
      this.add
        .text(x + 60, y + 25, String(value), { fontFamily: FONT_FAMILY, fontSize: '30px', color: '#FFFFFF' })
        .setOrigin(0, 0.5);
    });
  }

  /** A sinistra: pila dei sarcofagi da aprire e Cammino delle Coppe. */
  private drawLeftSide(H: number): void {
    const x = 96;
    // pila di sarcofagi (con numerino)
    const pending = SaveManager.getPendingSarcophagi();
    const pile = (this.pile = this.add.container(x, 230));
    if (pending > 0) {
      // bagliore dietro la pila: c'è qualcosa da aprire!
      const glow = this.add.image(0, 0, TEX.bagliore).setScale(2.2).setTint(PALETTE.oro).setAlpha(0.7);
      pile.add(glow);
      this.tweens.add({ targets: glow, alpha: 0.25, scale: 1.8, duration: 700, yoyo: true, repeat: -1 });
    }
    pile.add(this.add.image(-16, 6, TEX.sarcofagoIcona).setScale(0.8).setAngle(-10).setTint(0xb0b0b0));
    pile.add(this.add.image(12, 2, TEX.sarcofagoIcona).setScale(0.85).setAngle(8).setTint(0xd0d0d0));
    pile.add(this.add.image(0, 0, TEX.sarcofagoIcona).setScale(0.95));
    const badge = this.add.graphics();
    badge.fillStyle(PALETTE.rossoDeserto, 1).fillCircle(40, -42, 20);
    badge.lineStyle(3, PALETTE.bluNotte, 1).strokeCircle(40, -42, 20);
    pile.add(badge);
    pile.add(this.add.text(40, -43, String(pending), { fontFamily: FONT_FAMILY, fontSize: '24px', color: '#FFFFFF' }).setOrigin(0.5));
    pile.add(this.label(0, 70, pending > 0 ? 'Apri!' : 'Sarcofagi'));
    if (pending > 0) {
      // ogni tanto la pila trema, come se dentro ci fosse qualcosa
      this.time.addEvent({
        delay: 2200,
        loop: true,
        callback: () => this.tweens.add({ targets: pile, angle: 5, duration: 70, yoyo: true, repeat: 3 }),
      });
    }
    this.makeButton(pile, 140, 170, () => this.openSarcophagus());

    // Cammino delle Coppe (con il numerino dei premi da ritirare)
    const road = this.add.container(x, Math.min(H - BAR_H - 110, 420));
    const claimable = SaveManager.getClaimableRoadCount();
    if (claimable > 0) {
      const glow = this.add.image(0, 0, TEX.bagliore).setScale(2).setTint(PALETTE.oro).setAlpha(0.6);
      road.add(glow);
      this.tweens.add({ targets: glow, alpha: 0.2, scale: 1.6, duration: 700, yoyo: true, repeat: -1 });
    }
    road.add(this.add.image(0, 0, TEX.camminoIcona).setScale(0.9));
    if (claimable > 0) {
      const b = this.add.graphics();
      b.fillStyle(PALETTE.rossoDeserto, 1).fillCircle(40, -40, 20);
      b.lineStyle(3, PALETTE.bluNotte, 1).strokeCircle(40, -40, 20);
      road.add(b);
      road.add(this.add.text(40, -41, String(claimable), { fontFamily: FONT_FAMILY, fontSize: '24px', color: '#FFFFFF' }).setOrigin(0.5));
    }
    road.add(this.label(0, 64, 'Cammino\ndelle Coppe', 20));
    this.makeButton(road, 130, 150, () => this.goTo('TrophyRoad'));
  }

  /** A destra: scelta Solo/Duo e il grande pulsante GIOCA a forma di cartiglio. */
  private drawRightSide(W: number, H: number): void {
    const x = W - 206;
    const playY = H - BAR_H - 90;

    // Solo / Duo
    const modeY = playY - 112;
    const solo = this.add.container(x - 76, modeY);
    const soloBg = this.add.graphics();
    soloBg.fillStyle(PALETTE.turchese, 1).fillRoundedRect(-70, -26, 140, 52, 16);
    soloBg.lineStyle(4, PALETTE.bluNotte, 1).strokeRoundedRect(-70, -26, 140, 52, 16);
    solo.add([soloBg, this.add.text(0, -2, 'Solo', { fontFamily: FONT_FAMILY, fontSize: '30px', color: css(PALETTE.bluNotte) }).setOrigin(0.5)]);
    this.makeButton(solo, 140, 52, () => showToast(this, 'Solo: tu contro 9 bot!'));

    const duo = this.add.container(x + 76, modeY);
    const duoBg = this.add.graphics();
    duoBg.fillStyle(0x4a5578, 1).fillRoundedRect(-70, -26, 140, 52, 16);
    duoBg.lineStyle(4, PALETTE.bluNotte, 1).strokeRoundedRect(-70, -26, 140, 52, 16);
    duo.add([
      duoBg,
      this.add.text(-10, -2, 'Duo', { fontFamily: FONT_FAMILY, fontSize: '30px', color: '#AEB6CF' }).setOrigin(0.5),
      this.add.image(42, 0, TEX.lucchetto).setScale(0.7),
    ]);
    this.makeButton(duo, 140, 52, () => showToast(this, 'La modalità Duo\narriva presto!'));

    // GIOCA
    const play = this.add.container(x, playY);
    play.add(this.add.image(0, 0, TEX.pulsanteGioca));
    play.add(
      this.add
        .text(-8, -6, 'GIOCA', {
          fontFamily: FONT_FAMILY,
          fontSize: '64px',
          color: css(PALETTE.bluNotte),
          stroke: '#FFF1C1',
          strokeThickness: 4,
        })
        .setOrigin(0.5),
    );
    this.tweens.add({ targets: play, scale: 1.04, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.makeButton(play, 360, 140, () => this.startMatch());
  }

  /** In basso: Personaggi, Sarcofagi, Coppe, Impostazioni. */
  private drawBottomBar(W: number, H: number): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.bluNotte, 0.9).fillRect(0, H - BAR_H, W, BAR_H);
    g.fillStyle(PALETTE.oro, 1).fillRect(0, H - BAR_H, W, 4);
    const items: [string, string, () => void][] = [
      [TEX.iconaPersonaggi, 'Personaggi', () => this.goTo('Characters')],
      [TEX.iconaSarcofagi, 'Sarcofagi', () => this.openSarcophagus()],
      [TEX.iconaCoppe, 'Coppe', () => this.goTo('TrophyRoad')],
      [TEX.iconaImpostazioni, 'Impostazioni', () => showToast(this, 'Le impostazioni\narrivano presto!')],
    ];
    const step = Math.min(170, (W - 520) / 4);
    items.forEach(([tex, name, action], i) => {
      const b = this.add.container(W / 2 + (i - 1.5) * step, H - BAR_H / 2 + 2);
      b.add(this.add.image(0, -12, tex).setScale(0.72));
      b.add(this.add.text(0, 30, name, { fontFamily: FONT_FAMILY, fontSize: '18px', color: '#FFFFFF' }).setOrigin(0.5));
      this.makeButton(b, step - 10, BAR_H - 6, action);
    });
  }

  private label(x: number, y: number, text: string, size = 22): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: FONT_FAMILY,
        fontSize: `${size}px`,
        color: '#FFFFFF',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 6,
        align: 'center',
        lineSpacing: -6,
      })
      .setOrigin(0.5);
  }

  private makeButton(c: Phaser.GameObjects.Container, w: number, h: number, onPress: () => void): void {
    makePressable(c, w, h, onPress);
  }

  // ------------------------------------------------------------ sarcofagi

  /** Un sarcofago appena vinto vola dal centro e atterra sulla pila. */
  private sarcophagusArrives(W: number, H: number): void {
    const icon = this.add.image(W / 2, H * 0.4, TEX.sarcofagoIcona).setScale(0).setAngle(-20);
    const glow = this.add.image(W / 2, H * 0.4, TEX.bagliore).setScale(0).setTint(PALETTE.oro).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, scale: 4, duration: 400, ease: 'Back.out' });
    this.tweens.add({
      targets: icon,
      scale: 2,
      angle: 0,
      duration: 450,
      ease: 'Back.out',
      onComplete: () => {
        this.tweens.add({ targets: glow, alpha: 0, duration: 500, delay: 300, onComplete: () => glow.destroy() });
        this.tweens.add({
          targets: icon,
          x: this.pile.x,
          y: this.pile.y,
          scale: 0.95,
          angle: 360,
          delay: 400,
          duration: 550,
          ease: 'Quad.in',
          onComplete: () => {
            icon.destroy();
            this.tweens.add({ targets: this.pile, scale: 1.25, duration: 110, yoyo: true });
            showToast(this, 'Hai vinto un sarcofago!\nToccalo per aprirlo');
          },
        });
      },
    });
  }

  /** Apre la schermata del sarcofago (se ce n'è almeno uno). Per provarla: "?sarcofago=oro". */
  private openSarcophagus(): void {
    if (this.leaving) return;
    const test = new URLSearchParams(location.search).get('sarcofago');
    const testTier = SARCOPHAGI.find((s) => s.tier === test)?.tier as SarcophagusTier | undefined;
    if (SaveManager.getPendingSarcophagi() <= 0 && !testTier) {
      showToast(this, 'Vinci una partita per\nguadagnare un sarcofago!');
      return;
    }
    this.leaving = true;
    this.cameras.main.fadeOut(250, 20, 33, 61);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
      this.scene.start('Sarcophagus', { forcedTier: testTier }),
    );
  }

  /** Va a un'altra schermata (Personaggi, Cammino delle Coppe). */
  private goTo(key: string): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(250, 20, 33, 61);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(key));
  }

  private startMatch(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 20, 33, 61);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Match'));
  }
}
