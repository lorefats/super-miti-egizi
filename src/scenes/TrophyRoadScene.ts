import Phaser from 'phaser';
import { TEX } from '../art';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import { getRosterEntry } from '../data/characters';
import { TROPHY_ROAD, getSarcophagus, type RoadReward, type RoadStep, type SarcophagusTier } from '../data/progression';
import { SaveManager } from '../save/SaveManager';
import { createCharacterPose } from '../ui/CharacterPose';
import { backButton, currencyPill, goTo, makePressable, outlinedText, sparkBurst, sunRays } from '../ui/MenuKit';
import { showToast } from '../ui/Toast';

/** Distanza tra due tappe e margini della strada (pixel). */
const STEP_GAP = 250;
const START_X = 260;
const END_PAD = 520;
/** Un tocco che si muove più di così è un trascinamento (non preme i pulsanti). */
const DRAG_SLOP = 14;

/** Colore dell'icona del sarcofago per tipo (sull'icona dorata della Lobby). */
const SARC_TINT: Record<SarcophagusTier, number> = { legno: 0xc08a5a, bronzo: 0xe0995a, oro: 0xffffff, faraone: 0x7ff5ea };

/**
 * Cammino delle Coppe (sezione 6): una strada di sabbia illuminata da torce, da trascinare col dito.
 * Le tappe raggiunte con le coppe totali hanno un premio da ritirare toccandolo.
 * A 6000 coppe c'è Rà, con il sole che sorge quando si sblocca; poi la strada continua fino a 15000. Per provarlo: "?ra".
 */
export class TrophyRoadScene extends Phaser.Scene {
  private road!: Phaser.GameObjects.Container;
  private roadWidth = 0;
  private minX = 0;
  private dragStartX = 0;
  private roadStartX = 0;
  private dragDist = 0;
  private dragging = false;
  private velocity = 0;
  private lastMoveX = 0;
  private busy = false;
  private pills: { text: Phaser.GameObjects.Text; icon: Phaser.GameObjects.Image }[] = [];

  constructor() {
    super('TrophyRoad');
  }

  create(): void {
    const { width: W, height: H } = this.scale;
    this.busy = false;
    this.velocity = 0;
    this.dragging = false;
    this.cameras.main.fadeIn(250, 20, 33, 61);

    this.drawSky(W, H);
    this.roadWidth = START_X + (TROPHY_ROAD.length - 1) * STEP_GAP + END_PAD;
    this.minX = Math.min(0, W - this.roadWidth);
    this.road = this.add.container(0, 0);
    this.buildRoad(H);

    // interfaccia fissa sopra la strada
    const top = this.add.graphics();
    top.fillStyle(PALETTE.bluNotte, 0.75).fillRect(0, 0, W, 100);
    top.fillStyle(PALETTE.oro, 1).fillRect(0, 100, W, 3);
    backButton(this, () => goTo(this, 'Lobby'));
    outlinedText(this, W / 2, 50, 'Cammino delle Coppe', 44, css(PALETTE.oro));
    const money = SaveManager.getCurrencies();
    this.pills = [
      currencyPill(this, 116, 26, TEX.coppa, SaveManager.getTotalTrophies(), 0.55, 160),
      currencyPill(this, W - 380, 26, TEX.scarabeo, money.scarabs),
      currencyPill(this, W - 196, 26, TEX.polvereStelle, money.stardust),
    ];
    this.add
      .text(W / 2, H - 22, 'Trascina per scorrere · tocca i premi che brillano', { fontFamily: FONT_FAMILY, fontSize: '22px', color: '#FFFFFF' })
      .setOrigin(0.5)
      .setAlpha(0.8);

    // si parte dal primo premio da ritirare, o da dove sei arrivato
    const total = SaveManager.getTotalTrophies();
    const firstFree = TROPHY_ROAD.findIndex((s) => s.trophies <= total && !SaveManager.isRoadClaimed(s.trophies));
    const focusX = firstFree >= 0 ? this.stepX(firstFree) : this.progressX(total);
    this.road.x = Phaser.Math.Clamp(W * 0.4 - focusX, this.minX, 0);

    this.setupDrag();

    if (new URLSearchParams(location.search).has('ra')) this.time.delayedCall(400, () => this.sunrise('ra', true));
  }

  update(_t: number, dtMs: number): void {
    if (this.dragging || Math.abs(this.velocity) < 0.01) return;
    // scivola ancora un po' dopo aver lasciato il dito
    this.road.x = Phaser.Math.Clamp(this.road.x + this.velocity * dtMs, this.minX, 0);
    this.velocity *= Math.pow(0.92, dtMs / 16.7);
  }

  // ------------------------------------------------------------ disegno

  private drawSky(W: number, H: number): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0b1230, 0x0b1230, 0x3b2a6e, 0x3b2a6e, 1).fillRect(0, 0, W, H * 0.5);
    g.fillGradientStyle(0x3b2a6e, 0x3b2a6e, 0xd4774a, 0xd4774a, 1).fillRect(0, H * 0.5 - 1, W, H * 0.2);
    for (let i = 0; i < 40; i++) {
      const st = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(110, H * 0.45), TEX.stellaCielo).setScale(Phaser.Math.FloatBetween(0.3, 0.8));
      this.tweens.add({ targets: st, alpha: 0.2, duration: Phaser.Math.Between(700, 1800), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1500) });
    }
  }

  /** x di una tappa sulla strada. */
  private stepX(i: number): number {
    return START_X + i * STEP_GAP;
  }

  /** x della strada che corrisponde a un certo numero di coppe (tra una tappa e l'altra in proporzione). */
  private progressX(trophies: number): number {
    let prevT = 0;
    let prevX = 90;
    for (let i = 0; i < TROPHY_ROAD.length; i++) {
      const t = TROPHY_ROAD[i].trophies;
      const x = this.stepX(i);
      if (trophies <= t) return prevX + ((x - prevX) * (trophies - prevT)) / (t - prevT);
      prevT = t;
      prevX = x;
    }
    return prevX;
  }

  private buildRoad(H: number): void {
    const r = this.road;
    const w = this.roadWidth;
    const roadY = H * 0.6;
    const total = SaveManager.getTotalTrophies();

    // dune lontane e piramidi
    const back = this.add.graphics();
    back.fillStyle(0x8a5a3c, 1);
    for (let x = -100; x < w + 200; x += 380) back.fillTriangle(x, roadY - 90, x + 160, roadY - 230 - (x % 3) * 20, x + 320, roadY - 90);
    back.fillStyle(0xb7794a, 1).fillRect(0, roadY - 92, w, 40);
    r.add(back);

    // la strada di sabbia con i bordi di pietra
    const g = this.add.graphics();
    g.fillStyle(PALETTE.sabbiaScura, 1).fillRect(0, roadY - 60, w, H - roadY + 60);
    g.fillStyle(PALETTE.sabbia, 1).fillRect(0, roadY - 46, w, 132);
    g.fillStyle(0xffffff, 0.12).fillRect(0, roadY - 46, w, 14);
    g.fillStyle(0x9c7a52, 1).fillRect(0, roadY - 52, w, 8).fillRect(0, roadY + 86, w, 8);
    // impronte sulla sabbia
    g.fillStyle(0xc99a4b, 0.5);
    for (let x = 30; x < w; x += 46) g.fillEllipse(x, roadY + 20 + ((x / 46) % 2 ? 14 : -10), 14, 8);
    r.add(g);
    // sotto la strada: papiri, palme e sassi (la sabbia non resta vuota)
    const bottom = this.scale.height;
    for (let x = 60, i = 0; x < w; x += 170, i++) {
      const y = roadY + 190 + ((i * 37) % 3) * 22;
      if (y > bottom - 10) continue;
      const kind = i % 4;
      const tex = kind === 1 ? TEX.palma : kind === 3 ? TEX.masso : TEX.papiro;
      const scale = kind === 1 ? 0.36 : kind === 3 ? 0.45 : 0.5;
      r.add(this.add.image(x, y, tex).setOrigin(0.5, 1).setScale(scale));
    }

    // linea del percorso: d'oro fin dove sei arrivato
    const lineY = roadY + 20;
    const reached = this.progressX(total);
    const line = this.add.graphics();
    line.fillStyle(0x7a5a3a, 1).fillRoundedRect(90, lineY - 9, this.stepX(TROPHY_ROAD.length - 1) - 90, 18, 9);
    line.fillStyle(PALETTE.oro, 1).fillRoundedRect(90, lineY - 9, Math.max(18, reached - 90), 18, 9);
    line.lineStyle(3, PALETTE.bluNotte, 1).strokeRoundedRect(90, lineY - 9, this.stepX(TROPHY_ROAD.length - 1) - 90, 18, 9);
    r.add(line);

    // torce lungo la strada (accese fin dove sei arrivato)
    for (let x = 135; x < w; x += STEP_GAP) {
      const lit = x <= reached;
      r.add(this.add.image(x, roadY - 40, TEX.torciaPalo).setOrigin(0.5, 1).setScale(0.75).setTint(lit ? 0xffffff : 0x6a6a8a));
      if (lit) {
        const glow = this.add.image(x, roadY - 128, TEX.bagliore).setBlendMode(Phaser.BlendModes.ADD).setScale(0.9);
        r.add(glow);
        this.tweens.add({ targets: glow, alpha: { from: 0.6, to: 1 }, scale: 1, duration: 170, yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 200) });
      }
    }

    // partenza
    r.add(this.add.text(90, lineY + 44, 'Partenza', { fontFamily: FONT_FAMILY, fontSize: '22px', color: css(PALETTE.bluNotte) }).setOrigin(0.5));

    TROPHY_ROAD.forEach((step, i) => r.add(this.buildStop(step, this.stepX(i), lineY, total)));

    // segnalino con le tue coppe, sotto la strada (punta alla linea)
    const me = this.add.container(reached, lineY + 102);
    const mg = this.add.graphics();
    mg.fillStyle(PALETTE.turchese, 1).fillRoundedRect(-58, -22, 116, 40, 18);
    mg.lineStyle(3, PALETTE.bluNotte, 1).strokeRoundedRect(-58, -22, 116, 40, 18);
    mg.fillStyle(PALETTE.turchese, 1).fillTriangle(-10, -20, 10, -20, 0, -38);
    me.add(mg);
    me.add(this.add.image(-34, -2, TEX.coppa).setScale(0.3));
    me.add(this.add.text(-18, -2, String(total), { fontFamily: FONT_FAMILY, fontSize: '22px', color: css(PALETTE.bluNotte) }).setOrigin(0, 0.5));
    r.add(me);
    this.tweens.add({ targets: me, y: me.y - 8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  /** Una tappa: medaglione con il premio, il numero di coppe sotto e lo stato (preso, da prendere, lontano). */
  private buildStop(step: RoadStep, x: number, lineY: number, total: number): Phaser.GameObjects.Container {
    const reachedStep = step.trophies <= total;
    const claimed = SaveManager.isRoadClaimed(step.trophies);
    const ready = reachedStep && !claimed;
    const big = step.reward.kind === 'personaggio';
    const c = this.add.container(x, lineY - 120);

    if (ready) {
      const glow = this.add.image(0, 0, TEX.bagliore).setTint(PALETTE.oro).setBlendMode(Phaser.BlendModes.ADD).setScale(2);
      c.add(glow);
      this.tweens.add({ targets: glow, scale: 2.5, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
    }
    if (big) {
      // Rà: un sole grande dietro la tappa
      const sun = this.add.image(0, -10, TEX.discoCielo).setScale(1.6).setTint(0xffb347);
      const rays = sunRays(this, 0, -10, 150, 0xffd166, 0.45, 12);
      c.add([sun, rays]);
      this.tweens.add({ targets: rays, angle: 360, duration: 20000, repeat: -1 });
    }

    const stop = this.add.image(0, 0, TEX.tappaCammino).setScale(big ? 1.3 : 1);
    if (!reachedStep) stop.setTint(0x8a8fa8);
    c.add(stop);
    c.add(this.rewardIcon(step.reward, 0, -4, !reachedStep && big));

    // quantità del premio
    const label = this.rewardLabel(step.reward);
    if (label) {
      c.add(
        this.add
          .text(0, big ? 94 : 64, label, { fontFamily: FONT_FAMILY, fontSize: big ? '30px' : '24px', color: '#FFFFFF', stroke: css(PALETTE.bluNotte), strokeThickness: 6 })
          .setOrigin(0.5),
      );
    }

    // numero di coppe della tappa, sulla strada
    const plaque = this.add.container(0, 168);
    const pg = this.add.graphics();
    pg.fillStyle(reachedStep ? PALETTE.oro : 0x6a7397, 1).fillRoundedRect(-52, -18, 104, 36, 14);
    pg.lineStyle(3, PALETTE.bluNotte, 1).strokeRoundedRect(-52, -18, 104, 36, 14);
    plaque.add(pg);
    plaque.add(this.add.image(-30, 0, TEX.coppa).setScale(0.3));
    plaque.add(this.add.text(-14, 0, String(step.trophies), { fontFamily: FONT_FAMILY, fontSize: '22px', color: css(PALETTE.bluNotte) }).setOrigin(0, 0.5));
    c.add(plaque);

    if (claimed) {
      // preso: segno di spunta verde
      const ok = this.add.graphics();
      ok.fillStyle(PALETTE.verdeNilo, 1).fillCircle(34, -34, 18);
      ok.lineStyle(3, PALETTE.bluNotte, 1).strokeCircle(34, -34, 18);
      ok.lineStyle(5, 0xffffff, 1).beginPath().moveTo(25, -34).lineTo(32, -27).lineTo(43, -41).strokePath();
      c.add(ok);
      stop.setAlpha(0.8);
    } else if (ready) {
      const tag = outlinedText(this, 0, -76 - (big ? 30 : 0), 'Prendi!', 28, css(PALETTE.oro));
      c.add(tag);
      this.tweens.add({ targets: tag, y: tag.y - 8, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: stop, angle: 6, duration: 90, yoyo: true, repeat: -1, repeatDelay: 1400 });
    } else if (!big) {
      c.add(this.add.image(30, 28, TEX.lucchetto).setScale(0.7));
    }

    makePressable(c, big ? 170 : 130, big ? 170 : 130, () => this.onStopTap(step, c), () => this.dragDist < DRAG_SLOP && !this.busy);
    return c;
  }

  private rewardIcon(r: RoadReward, x: number, y: number, hidden: boolean): Phaser.GameObjects.GameObject {
    if (r.kind === 'scarabei') return this.add.image(x, y, TEX.scarabeo).setScale(1);
    if (r.kind === 'polvere') return this.add.image(x, y, TEX.polvereStelle).setScale(1);
    if (r.kind === 'sarcofago') return this.add.image(x, y, TEX.sarcofagoIcona).setScale(0.62).setTint(SARC_TINT[r.tier]);
    // personaggio: il suo ritratto (in ombra finché non ci arrivi)
    const pose = createCharacterPose(this, r.characterId, x, y + 44, 0.18, hidden).container.setScale(0.55);
    return pose;
  }

  private rewardLabel(r: RoadReward): string {
    if (r.kind === 'scarabei' || r.kind === 'polvere') return `+${r.amount}`;
    if (r.kind === 'sarcofago') return getSarcophagus(r.tier).name.replace('Sarcofago ', '');
    return getRosterEntry(r.characterId).name;
  }

  // ------------------------------------------------------------ tocchi

  private setupDrag(): void {
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.dragStartX = p.x;
      this.roadStartX = this.road.x;
      this.lastMoveX = p.x;
      this.dragDist = 0;
      this.velocity = 0;
    });
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (!this.dragging || !p.isDown) return;
      this.dragDist = Math.max(this.dragDist, Math.abs(p.x - this.dragStartX));
      this.road.x = Phaser.Math.Clamp(this.roadStartX + p.x - this.dragStartX, this.minX, 0);
      this.velocity = (p.x - this.lastMoveX) / Math.max(8, this.game.loop.delta);
      this.lastMoveX = p.x;
    });
    const up = () => {
      this.dragging = false;
      if (this.dragDist < DRAG_SLOP) this.velocity = 0;
    };
    this.input.on(Phaser.Input.Events.POINTER_UP, up);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, up);
    // rotella del mouse (per provare al computer)
    this.input.on(Phaser.Input.Events.POINTER_WHEEL, (_p: Phaser.Input.Pointer, _o: unknown, dx: number, dy: number) => {
      this.road.x = Phaser.Math.Clamp(this.road.x - (dx || dy), this.minX, 0);
    });
  }

  private onStopTap(step: RoadStep, c: Phaser.GameObjects.Container): void {
    const total = SaveManager.getTotalTrophies();
    if (SaveManager.isRoadClaimed(step.trophies)) {
      showToast(this, 'Premio già preso!');
      return;
    }
    if (step.trophies > total) {
      showToast(this, `Ti mancano ${step.trophies - total} coppe\nper questo premio!`);
      return;
    }
    const reward = SaveManager.claimRoadReward(step.trophies);
    if (!reward) return;
    this.busy = true;
    const wx = this.road.x + c.x;
    const wy = c.y;
    sparkBurst(this, wx, wy, 18, 180);
    this.tweens.add({ targets: c, scale: 1.25, duration: 120, yoyo: true });

    if (reward.kind === 'scarabei' || reward.kind === 'polvere') {
      const pill = this.pills[reward.kind === 'scarabei' ? 1 : 2];
      const icon = this.add.image(wx, wy, reward.kind === 'scarabei' ? TEX.scarabeo : TEX.polvereStelle).setDepth(500);
      this.tweens.add({
        targets: icon,
        x: pill.icon.x,
        y: pill.icon.y,
        scale: 0.7,
        duration: 600,
        ease: 'Quad.in',
        onComplete: () => {
          icon.destroy();
          const money = SaveManager.getCurrencies();
          pill.text.setText(String(reward.kind === 'scarabei' ? money.scarabs : money.stardust));
          this.tweens.add({ targets: [pill.text, pill.icon], scale: '*=1.25', duration: 90, yoyo: true });
          this.rebuild();
        },
      });
    } else if (reward.kind === 'sarcofago') {
      showToast(this, `${getSarcophagus(reward.tier).name}!\nApriamolo!`);
      this.time.delayedCall(900, () => goTo(this, 'Sarcophagus', { returnTo: 'TrophyRoad' }));
    } else {
      this.time.delayedCall(300, () => this.sunrise(reward.characterId, false));
    }
  }

  /** Ridisegna la strada (dopo aver preso un premio) restando nello stesso punto. */
  private rebuild(): void {
    this.road.removeAll(true);
    this.buildRoad(this.scale.height);
    this.busy = false;
  }

  // ------------------------------------------------------------ Rà: il sole che sorge

  /** Animazione speciale: il cielo si scurisce, il sole sorge e appare il nuovo personaggio. */
  private sunrise(characterId: string, test: boolean): void {
    this.busy = true;
    const { width: W, height: H } = this.scale;
    const entry = getRosterEntry(characterId);
    const layer = this.add.container(0, 0).setDepth(2000);
    const night = this.add.rectangle(0, 0, W, H, 0x050914, 0).setOrigin(0).setInteractive();
    layer.add(night);
    this.tweens.add({ targets: night, fillAlpha: 0.92, duration: 600 });

    const horizon = H * 0.72;
    const rays = sunRays(this, W / 2, horizon - 60, Math.max(W, H), 0xffe08a, 0.35, 16).setScale(0);
    const sun = this.add.image(W / 2, H + 200, TEX.discoCielo).setScale(3.2).setTint(0xffb347);
    const ground = this.add.graphics();
    ground.fillStyle(0x3b1f12, 1).fillRect(0, horizon, W, H - horizon);
    ground.fillStyle(0x6b3a1f, 1).fillRect(0, horizon, W, 6);
    layer.add([rays, sun, ground]);

    // il sole sale dall'orizzonte, il cielo si colora
    this.time.delayedCall(500, () => {
      this.tweens.add({ targets: sun, y: horizon - 60, duration: 2200, ease: 'Sine.out' });
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 2200,
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          const col = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0x050914),
            Phaser.Display.Color.ValueToColor(0xd4774a),
            1,
            t,
          );
          night.setFillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 0.92);
        },
      });
    });
    this.time.delayedCall(2300, () => {
      this.cameras.main.flash(500, 255, 230, 160);
      this.tweens.add({ targets: rays, scale: 1, duration: 700, ease: 'Back.out' });
      this.tweens.add({ targets: rays, angle: 360, duration: 16000, repeat: -1 });
      const hero = createCharacterPose(this, characterId, W / 2, horizon - 10).container.setScale(0);
      layer.add(hero);
      this.tweens.add({ targets: hero, scale: 1.7, duration: 600, ease: 'Back.out' });
      sparkBurst(this, W / 2, horizon - 150, 40, 320);
      const title = outlinedText(this, W / 2, 150, `${entry.name} è tuo!`, 72, css(PALETTE.oro)).setScale(0);
      const sub = outlinedText(this, W / 2, 222, `${entry.title}: il premio più grande del gioco!`, 30);
      sub.setAlpha(0);
      layer.add([title, sub]);
      this.tweens.add({ targets: title, scale: 1, duration: 450, ease: 'Back.out', delay: 300 });
      this.tweens.add({ targets: sub, alpha: 1, duration: 400, delay: 700 });
    });
    this.time.delayedCall(3600, () => {
      const hint = outlinedText(this, W / 2, H - 50, test ? 'Prova: niente è stato salvato · tocca' : 'Tocca per continuare', 30);
      layer.add(hint);
      this.tweens.add({ targets: hint, scale: 1.08, duration: 550, yoyo: true, repeat: -1 });
      night.once('pointerup', () => {
        this.tweens.add({
          targets: layer,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            layer.destroy();
            this.rebuild();
          },
        });
      });
    });
  }
}
