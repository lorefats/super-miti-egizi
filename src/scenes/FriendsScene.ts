import Phaser from 'phaser';
import { playSfx } from '../audio/Sound';
import { TEX, characterTexture } from '../art';
import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import { getCharacter, isPlayable } from '../data/characters';
import { NET, SEAT_VARIANTS } from '../data/net';
import { SaveManager } from '../save/SaveManager';
import { NetSession, PROBLEM_TEXT, getSession, type Me, type NetProblem } from '../net/Session';
import type { Member } from '../net/protocol';
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
    return { name: getCharacter(characterId).name, characterId, level: SaveManager.getLevel(characterId) };
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
      s.events.on('members', () => this.drawRoom(s)),
      s.events.on('left', (m) => showToast(this, `${m.name} è uscito`)),
      s.events.on('msg', (msg) => {
        if (msg.t === 'via') this.startTraining();
      }),
      s.events.on('closed', (why) => {
        if (why) showToast(this, PROBLEM_TEXT[why], 3);
        this.show('scelta');
      }),
    ];
    this.drawRoom(s);
  }

  /** Codice grande, i posti della stanza e (per il capo stanza) il pulsante "Andiamo!". */
  private drawRoom(s: NetSession): void {
    this.view = 'stanza';
    this.ui.removeAll(true);
    const { width: W, height: H } = this.scale;
    this.ui.add(outlinedText(this, W / 2, 128, s.isHost ? 'Codice della stanza: dillo ai tuoi amici!' : 'Sei nella stanza', 28));
    this.ui.add(outlinedText(this, W / 2, 200, s.code.split('').join(' '), 92, css(PALETTE.oro)));

    const cardW = 190;
    const gap = 22;
    const total = NET.maxPlayers * cardW + (NET.maxPlayers - 1) * gap;
    const scale = Math.min(1, (W - 40) / total);
    const row = this.add.container(W / 2, H * 0.58).setScale(scale);
    for (let seat = 0; seat < NET.maxPlayers; seat++) {
      const m = s.members.find((x) => x.seat === seat);
      row.add(this.seatCard(-total / 2 + cardW / 2 + seat * (cardW + gap), cardW, m, m?.seat === s.mySeat));
    }
    this.ui.add(row);

    if (s.isHost) {
      const ready = s.members.length >= 2;
      if (ready) {
        const go = createGoldButton(this, W / 2, H - 80, 'Andiamo!', () => this.hostStart(), 340, 90, 44);
        this.tweens.add({ targets: go, scale: 1.05, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.ui.add(go);
      } else {
        this.ui.add(outlinedText(this, W / 2, H - 80, 'Aspetta che entri almeno un amico...', 28));
      }
    } else {
      this.ui.add(outlinedText(this, W / 2, H - 80, 'Aspetta che il capo stanza prema "Andiamo!"', 28));
    }
  }

  /** Un posto della stanza: il dio e il nome, oppure "libero". Bordo d'oro = sei tu. */
  private seatCard(x: number, w: number, m: Member | undefined, mine: boolean): Phaser.GameObjects.Container {
    const h = 230;
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
    const pic = this.add.image(0, 40, this.textures.exists(key) ? key : TEX.sagomaDio).setOrigin(0.5, 1);
    pic.setScale(Math.min(140 / pic.height, (w - 24) / pic.width));
    const name = this.add.text(0, 66, m.name, { fontFamily: FONT_FAMILY, fontSize: '26px', color: '#FFFFFF' }).setOrigin(0.5);
    if (name.width > w - 16) name.setScale((w - 16) / name.width);
    const role = this.add
      .text(0, 96, m.seat === 0 ? 'capo stanza' : mine ? 'tu' : 'amico', { fontFamily: FONT_FAMILY, fontSize: '20px', color: css(PALETTE.oro) })
      .setOrigin(0.5);
    c.add([pic, name, role]);
    return c;
  }

  /** Capo stanza: si parte per tutti. */
  hostStart(): void {
    const s = getSession();
    if (!s?.isHost || s.members.length < 2) return;
    s.start('allenamento');
    this.startTraining();
  }

  private startTraining(): void {
    if (this.goingToMatch) return;
    this.goingToMatch = true;
    playSfx('go');
    goTo(this, 'Training', { net: true });
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
