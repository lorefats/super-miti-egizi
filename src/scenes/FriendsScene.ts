import Phaser from 'phaser';
import { playSfx } from '../audio/Sound';
import { TEX, characterTexture } from '../art';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import { getCharacter, isPlayable } from '../data/characters';
import { NET, SEAT_VARIANTS } from '../data/net';
import { SaveManager } from '../save/SaveManager';
import { SOCCER } from '../data/soccer';
import { NetSession, PROBLEM_TEXT, getSession, type Me, type NetProblem } from '../net/Session';
import type { FriendsMode, Member } from '../net/protocol';
import { createGoldButton } from '../ui/GoldButton';
import { backButton, goTo, makePressable, outlinedText } from '../ui/MenuKit';
import { showToast } from '../ui/Toast';

type View = 'scelta' | 'codice' | 'collegamento' | 'stanza';

/**
 * "Gioca con gli amici" (GAME_DESIGN.md, sezione 13): crea una stanza (si riceve un codice di 4 cifre)
 * oppure entra con il codice di un amico. Nella stanza si vede chi c'è; il capo stanza preme "Andiamo!".
 */
export class FriendsScene extends Phaser.Scene {
  private ui!: Phaser.GameObjects.Container;
  private view: View = 'scelta';
  private typed = '';
  private codeText: Phaser.GameObjects.Text | null = null;
  private unsubscribe: (() => void)[] = [];
  /** si va nella partita: la stanza resta aperta */
  private goingToMatch = false;

  constructor() {
    super('Friends');
  }

  create(): void {
    const { width: W, height: H } = this.scale;
    this.goingToMatch = false;
    this.unsubscribe = [];
    this.cameras.main.fadeIn(250, 20, 33, 61);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b1230, 0x0b1230, PALETTE.lapislazzuli, PALETTE.lapislazzuli, 1).fillRect(0, 0, W, H);
    bg.fillStyle(PALETTE.sabbia, 1).fillEllipse(W * 0.5, H + 90, W * 1.3, 230);
    outlinedText(this, W / 2, 56, 'Gioca con gli amici', 50, css(PALETTE.oro));
    backButton(this, () => this.leave());
    this.ui = this.add.container(0, 0);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const u of this.unsubscribe) u();
      // si esce verso la Lobby: si lascia la stanza
      if (!this.goingToMatch) getSession()?.close();
    });

    // si torna qui con una stanza ancora aperta (per esempio dopo l'Allenamento con gli amici)
    const s = getSession();
    if (s && !s.closed) this.enterRoom(s);
    else this.show('scelta');
  }

  private me(): Me {
    const id = SaveManager.getSelectedCharacter();
    const characterId = isPlayable(id) ? id : 'horus';
    // il nome scelto nel Profilo (se non c'è: il nome del dio)
    const name = SaveManager.hasPlayerName() ? SaveManager.getPlayerName() : getCharacter(characterId).name;
    return { name, characterId, level: SaveManager.getLevel(characterId) };
  }

  // ------------------------------------------------------------------ le schermate

  private show(view: View): void {
    this.view = view;
    this.ui.removeAll(true);
    this.codeText = null;
    const { width: W, height: H } = this.scale;
    if (view === 'scelta') {
      this.ui.add(createGoldButton(this, W / 2, H * 0.4, 'Crea una stanza', () => void this.createRoom(), 420, 96, 40));
      this.ui.add(createGoldButton(this, W / 2, H * 0.4 + 130, 'Entra con il codice', () => this.startTyping(), 420, 96, 40));
      this.ui.add(
        outlinedText(this, W / 2, H - 70, 'Serve internet. Giocate solo con chi ha il codice della stanza.', 24),
      );
    } else if (view === 'codice') {
      this.drawKeypad();
    } else if (view === 'collegamento') {
      const t = outlinedText(this, W / 2, H * 0.48, 'Mi collego...', 48);
      this.ui.add(t);
      this.tweens.add({ targets: t, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    }
  }

  /** Il tastierino con le cifre: quando si scrive l'ultima cifra si entra da soli. */
  private drawKeypad(): void {
    const { width: W, height: H } = this.scale;
    this.ui.add(outlinedText(this, W * 0.27, H * 0.3, 'Scrivi il codice\ndella stanza', 38));
    this.codeText = outlinedText(this, W * 0.27, H * 0.55, '', 96, css(PALETTE.oro));
    this.ui.add(this.codeText);
    this.updateTyped();
    const key = Math.min(104, (H - 190) / 4 - 12);
    const gap = 14;
    const x0 = W * 0.68 - (key + gap);
    const y0 = 130 + key / 2;
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '<', '0', ''];
    keys.forEach((k, i) => {
      if (!k) return;
      const x = x0 + (i % 3) * (key + gap);
      const y = y0 + Math.floor(i / 3) * (key + gap);
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      g.fillStyle(PALETTE.oroOmbra, 1).fillRoundedRect(-key / 2, -key / 2 + 6, key, key, 18);
      g.fillStyle(k === '<' ? PALETTE.sabbiaScura : PALETTE.oro, 1).fillRoundedRect(-key / 2, -key / 2, key, key, 18);
      g.lineStyle(4, PALETTE.bluNotte, 1).strokeRoundedRect(-key / 2, -key / 2, key, key, 18);
      const label = k === '<' ? '⌫' : k;
      c.add([g, this.add.text(0, -2, label, { fontFamily: FONT_FAMILY, fontSize: `${Math.round(key * 0.5)}px`, color: css(PALETTE.bluNotte) }).setOrigin(0.5)]);
      makePressable(c, key, key + 6, () => this.press(k));
      this.ui.add(c);
    });
  }

  private press(k: string): void {
    if (this.view !== 'codice') return;
    if (k === '<') this.typed = this.typed.slice(0, -1);
    else if (this.typed.length < NET.codeDigits) this.typed += k;
    this.updateTyped();
    if (this.typed.length === NET.codeDigits) this.time.delayedCall(200, () => void this.joinRoom(this.typed));
  }

  private updateTyped(): void {
    const slots = Array.from({ length: NET.codeDigits }, (_, i) => this.typed[i] ?? '_');
    this.codeText?.setText(slots.join(' '));
  }

  private startTyping(): void {
    this.typed = '';
    this.show('codice');
  }

  // ------------------------------------------------------------------ creare / entrare

  /** Crea la stanza e mostra il codice da dire agli amici. */
  async createRoom(): Promise<NetSession | null> {
    this.show('collegamento');
    try {
      const s = await NetSession.host(this.me());
      if (!this.scene.isActive()) return s;
      this.enterRoom(s);
      return s;
    } catch (e) {
      this.problem(e);
      this.show('scelta');
      return null;
    }
  }

  /** Entra nella stanza di un amico. */
  async joinRoom(code: string): Promise<NetSession | null> {
    if (this.view === 'collegamento') return null;
    this.show('collegamento');
    try {
      const s = await NetSession.join(code, this.me());
      if (!this.scene.isActive()) return s;
      playSfx('go');
      this.enterRoom(s);
      return s;
    } catch (e) {
      this.problem(e);
      this.startTyping();
      return null;
    }
  }

  private problem(e: unknown): void {
    const p = typeof e === 'string' && e in PROBLEM_TEXT ? (e as NetProblem) : 'internet';
    playSfx('denied');
    showToast(this, PROBLEM_TEXT[p], 3.5);
  }

  // ------------------------------------------------------------------ nella stanza

  private enterRoom(s: NetSession): void {
    for (const u of this.unsubscribe) u();
    this.unsubscribe = [
      s.events.on('members', () => {
        if (s.isHost) this.fixTeams(s);
        this.drawRoom(s);
      }),
      s.events.on('left', (m) => showToast(this, `${m.name} è uscito`)),
      s.events.on('msg', (msg) => {
        if (msg.t === 'via') this.startPlaying(msg.mode);
        else if (msg.t === 'scelta') this.drawRoom(s);
      }),
      s.events.on('closed', (why) => {
        if (why) showToast(this, PROBLEM_TEXT[why], 3);
        this.show('scelta');
      }),
    ];
    // di nuovo nella stanza: il capo stanza fa entrare altri amici, gli altri dicono "sono pronto"
    if (s.isHost) {
      s.reopen();
      this.fixTeams(s);
    } else {
      s.setReady(true);
    }
    this.drawRoom(s);
  }

  /** Capo stanza: le squadre (Duo e Calcio) vanno rifatte se qualcuno entra o esce, o se cambia cosa si gioca. */
  private fixTeams(s: NetSession): void {
    const options = teamOptions(s.choice.mode, s.members.map((m) => m.seat));
    const same = (a: number[][], b: number[][]) => JSON.stringify(a) === JSON.stringify(b);
    const still = options.find((o) => same(o, s.choice.teams));
    s.setChoice(s.choice.mode, still ?? options[0]);
  }

  /** Codice grande, i posti della stanza, cosa si gioca e (per il capo stanza) il pulsante "Andiamo!". */
  private drawRoom(s: NetSession): void {
    this.view = 'stanza';
    this.ui.removeAll(true);
    const { width: W, height: H } = this.scale;
    const mode = s.choice.mode;
    this.ui.add(outlinedText(this, W / 2, 112, s.isHost ? 'Codice della stanza: dillo ai tuoi amici!' : 'Sei nella stanza', 26));
    this.ui.add(outlinedText(this, W / 2, 168, s.code.split('').join(' '), 72, css(PALETTE.oro)));

    // le squadre del Duo: numero di squadra per ogni posto
    const teamOf = new Map<number, number>();
    if (mode === 'duo' || mode === 'calcio') s.choice.teams.forEach((t, i) => t.forEach((seat) => teamOf.set(seat, i)));

    const cardW = 190;
    const gap = 22;
    const total = NET.maxPlayers * cardW + (NET.maxPlayers - 1) * gap;
    const scale = Math.min(1, (W - 40) / total);
    const row = this.add.container(W / 2, 340).setScale(scale);
    for (let seat = 0; seat < NET.maxPlayers; seat++) {
      const m = s.members.find((x) => x.seat === seat);
      const waiting = !!m && s.isHost && m.seat !== 0 && !s.ready.has(m.seat);
      row.add(this.seatCard(-total / 2 + cardW / 2 + seat * (cardW + gap), cardW, m, m?.seat === s.mySeat, teamOf.get(seat), waiting));
    }
    this.ui.add(row);

    const modes: [FriendsMode, string][] = [
      ['allenamento', 'Allenamento'],
      ['solo', 'Battaglia Solo'],
      ['duo', 'Battaglia Duo'],
      ['calcio', 'Calcio del Nilo'],
    ];
    const rowY = H - 168;
    if (s.isHost) {
      const step = Math.min(250, (W - 40) / modes.length);
      modes.forEach(([m, label], i) => {
        const b = this.modeButton(W / 2 + (i - (modes.length - 1) / 2) * step, rowY, label, m === mode, () => {
          if (m === s.choice.mode) return;
          // il Calcio con gli amici si sblocca con le coppe del capo stanza, come da soli
          if (m === 'calcio' && SaveManager.getTotalTrophies() < SOCCER.unlockTrophies) {
            showToast(this, `Il Calcio del Nilo si sblocca\na ${SOCCER.unlockTrophies} coppe!`);
            return;
          }
          s.setChoice(m, []);
          this.fixTeams(s);
          this.drawRoom(s);
        }, step - 16);
        this.ui.add(b);
      });
      if (teamOptions(mode, s.members.map((x) => x.seat)).length > 1) {
        this.ui.add(
          createGoldButton(this, W - 150, 470, 'Cambia squadre', () => {
            const options = teamOptions(s.choice.mode, s.members.map((x) => x.seat));
            const i = options.findIndex((o) => JSON.stringify(o) === JSON.stringify(s.choice.teams));
            s.setChoice(s.choice.mode, options[(i + 1) % options.length]);
            this.drawRoom(s);
          }, 240, 56, 24),
        );
      }
    } else {
      const label = modes.find(([m]) => m === mode)?.[1] ?? '';
      this.ui.add(outlinedText(this, W / 2, rowY, `Si gioca: ${label}`, 34, css(PALETTE.oro)));
    }

    if (s.isHost) {
      const notReady = s.members.filter((m) => m.seat !== 0 && !s.ready.has(m.seat));
      if (s.members.length < 2) {
        this.ui.add(outlinedText(this, W / 2, H - 70, 'Aspetta che entri almeno un amico...', 28));
      } else if (notReady.length) {
        this.ui.add(outlinedText(this, W / 2, H - 70, `Aspetta: ${notReady.map((m) => m.name).join(', ')} sta guardando i risultati...`, 26));
      } else {
        const go = createGoldButton(this, W / 2, H - 70, 'Andiamo!', () => this.hostStart(), 320, 84, 42);
        this.tweens.add({ targets: go, scale: 1.05, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.ui.add(go);
      }
    } else {
      this.ui.add(outlinedText(this, W / 2, H - 70, 'Aspetta che il capo stanza prema "Andiamo!"', 28));
    }
  }

  /** Pulsante per scegliere cosa giocare: quello scelto è d'oro, gli altri blu. */
  private modeButton(x: number, y: number, label: string, on: boolean, onPress: () => void, w = 230): Phaser.GameObjects.Container {
    const h = 60;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(on ? PALETTE.oro : PALETTE.bluNotte, on ? 1 : 0.85).fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    g.lineStyle(4, on ? PALETTE.bluNotte : PALETTE.oro, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    const t = this.add
      .text(0, -1, label, { fontFamily: FONT_FAMILY, fontSize: '26px', color: on ? css(PALETTE.bluNotte) : '#FFFFFF' })
      .setOrigin(0.5);
    if (t.width > w - 16) t.setScale((w - 16) / t.width);
    c.add([g, t]);
    makePressable(c, w, h, onPress);
    return c;
  }

  /** Un posto della stanza: il dio e il nome, oppure "libero". Bordo d'oro = sei tu. Nel Duo, la squadra. */
  private seatCard(x: number, w: number, m: Member | undefined, mine: boolean, team: number | undefined, waiting: boolean): Phaser.GameObjects.Container {
    const h = 210;
    const c = this.add.container(x, 0);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.bluNotte, m ? 0.9 : 0.5).fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    g.lineStyle(mine ? 6 : 3, mine ? PALETTE.oro : m ? PALETTE.turchese : 0x6b7aa8, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    c.add(g);
    if (!m) {
      c.add(this.add.text(0, 0, 'libero', { fontFamily: FONT_FAMILY, fontSize: '26px', color: '#8E9AC4' }).setOrigin(0.5));
      return c;
    }
    const key = characterTexture(m.characterId, mine ? 'base' : SEAT_VARIANTS[m.seat]);
    const pic = this.add.image(0, 30, this.textures.exists(key) ? key : TEX.sagomaDio).setOrigin(0.5, 1);
    pic.setScale(Math.min(125 / pic.height, (w - 24) / pic.width));
    if (waiting) pic.setAlpha(0.45);
    const name = this.add.text(0, 54, m.name, { fontFamily: FONT_FAMILY, fontSize: '26px', color: '#FFFFFF' }).setOrigin(0.5);
    if (name.width > w - 16) name.setScale((w - 16) / name.width);
    const role = this.add
      .text(0, 82, waiting ? 'sta arrivando...' : m.seat === 0 ? 'capo stanza' : mine ? 'tu' : 'amico', { fontFamily: FONT_FAMILY, fontSize: '20px', color: css(PALETTE.oro) })
      .setOrigin(0.5);
    c.add([pic, name, role]);
    if (team !== undefined) {
      // etichetta della squadra in alto
      const color = TEAM_COLORS[team % TEAM_COLORS.length];
      const badge = this.add.graphics();
      badge.fillStyle(color, 1).fillRoundedRect(-62, -h / 2 - 16, 124, 34, 17);
      badge.lineStyle(3, PALETTE.bluNotte, 1).strokeRoundedRect(-62, -h / 2 - 16, 124, 34, 17);
      c.add([badge, this.add.text(0, -h / 2 + 1, `Squadra ${team + 1}`, { fontFamily: FONT_FAMILY, fontSize: '20px', color: '#FFFFFF' }).setOrigin(0.5)]);
    }
    return c;
  }

  /** Capo stanza: si parte per tutti. */
  hostStart(): void {
    const s = getSession();
    if (!s?.isHost || s.members.length < 2 || !s.allReady()) return;
    s.start();
    this.startPlaying(s.choice.mode);
  }

  private startPlaying(mode: FriendsMode): void {
    if (this.goingToMatch) return;
    this.goingToMatch = true;
    playSfx('go');
    const scene = mode === 'allenamento' ? 'Training' : mode === 'calcio' ? 'Soccer' : 'Match';
    goTo(this, scene, { net: true });
  }

  private leave(): void {
    // dal tastierino si torna alla scelta, non alla Lobby
    if (this.view === 'codice') {
      this.show('scelta');
      return;
    }
    getSession()?.close();
    goTo(this, 'Lobby');
  }
}

/** Colori delle etichette "Squadra 1", "Squadra 2"... */
const TEAM_COLORS = [PALETTE.turchese, PALETTE.violaNotte, PALETTE.verdeNilo, PALETTE.oroOmbra];

/**
 * Tutti i modi di mettere gli amici in squadre da 2 nel Duo (chi resta da solo avrà un bot come compagno).
 * Esempio con 2 amici: insieme, oppure uno contro l'altro.
 */
export function duoPairings(seats: number[]): number[][][] {
  const s = [...seats].sort((a, b) => a - b);
  if (s.length <= 1) return [s.length ? [s] : []];
  if (s.length === 2) return [[s], [[s[0]], [s[1]]]];
  if (s.length === 3) return [[[s[0], s[1]], [s[2]]], [[s[0], s[2]], [s[1]]], [[s[1], s[2]], [s[0]]]];
  return [
    [[s[0], s[1]], [s[2], s[3]]],
    [[s[0], s[2]], [s[1], s[3]]],
    [[s[0], s[3]], [s[1], s[2]]],
  ];
}

/**
 * Calcio: tutti i modi di dividere gli amici tra la squadra di sinistra e quella di destra (3 posti per parte,
 * i posti liberi sono bot). Esempio con 2 amici: insieme, oppure uno contro l'altro.
 */
export function calcioSplits(seats: number[]): number[][][] {
  const s = [...seats].sort((a, b) => a - b);
  if (s.length <= 1) return [[s, []]];
  if (s.length === 2) return [[s, []], [[s[0]], [s[1]]]];
  if (s.length === 3) return [[s, []], [[s[0], s[1]], [s[2]]], [[s[0], s[2]], [s[1]]], [[s[1], s[2]], [s[0]]]];
  return [
    [[s[0], s[1]], [s[2], s[3]]],
    [[s[0], s[2]], [s[1], s[3]]],
    [[s[0], s[3]], [s[1], s[2]]],
    [[s[0], s[1], s[2]], [s[3]]],
  ];
}

/** Le squadre possibili per cosa si gioca (Allenamento e Solo: nessuna). */
function teamOptions(mode: FriendsMode, seats: number[]): number[][][] {
  if (mode === 'duo') return duoPairings(seats);
  if (mode === 'calcio') return calcioSplits(seats);
  return [[]];
}
