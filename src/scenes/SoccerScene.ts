import Phaser from 'phaser';
import { TEX } from '../art';
import { PALETTE, css } from '../art/palette';
import { GOAL_ART_TOP } from '../art/soccer';
import { CAMERA_LERP, DEPTH, FONT_FAMILY } from '../config';
import { BOT_NAMES } from '../data/bots';
import { isPlayable } from '../data/characters';
import { HIDEOUT_REVEAL_DISTANCE } from '../data/combat';
import { trophiesForPlace } from '../data/progression';
import { CAMPO_CALCIO, GOALS, GOAL_DEPTH, GOAL_MOUTH, KICKOFF, RESPAWN, SOCCER, SOCCER_RIVER, mirror } from '../data/soccer';
import { SaveManager } from '../save/SaveManager';
import { currentBotLevel, pickBotGods } from '../ai/botPicks';
import { SoccerBrain, type SoccerWorld } from '../ai/SoccerBrain';
import { Combat } from '../entities/Combat';
import { Player, DEFEATED_EVENT } from '../entities/Player';
import { Bot } from '../entities/Bot';
import { SoccerBall } from '../entities/SoccerBall';
import { MatchHud } from '../ui/MatchHud';
import { PlayerControls } from '../ui/PlayerControls';
import { showEndOverlay } from '../ui/EndOverlay';
import { showToast } from '../ui/Toast';
import { addFpsMeter } from '../ui/FpsMeter';
import { MapView } from './MapView';

const FIELD = CAMPO_CALCIO;

/**
 * Calcio del Nilo: 3 contro 3 (tu + 2 compagni bot, a sinistra, contro 3 bot a destra).
 * Si porta la palla e la si calcia con il colpo; chi viene colpito la perde. Vince chi arriva a 2 gol,
 * oppure chi ne ha di più allo scadere. Chi viene sconfitto riappare dopo qualche secondo nella sua metà.
 */
export class SoccerScene extends Phaser.Scene {
  private view!: MapView;
  private combat!: Combat;
  private player!: Player;
  private fighters: Player[] = [];
  private ball!: SoccerBall;
  private controls!: PlayerControls;
  private hud!: MatchHud;
  private ballMarker!: Phaser.GameObjects.Image;
  private score: [number, number] = [0, 0];
  private timeLeft = SOCCER.seconds;
  private pause = 0;
  private over = false;

  constructor() {
    super('Soccer');
  }

  create(): void {
    this.combat = new Combat();
    this.fighters = [];
    this.score = [0, 0];
    this.timeLeft = SOCCER.seconds;
    this.pause = 0;
    this.over = false;

    this.view = new MapView(this, FIELD, this.combat);
    this.drawLines();
    this.addGoals();

    // squadre: 0 = la tua (a sinistra), 1 = gli avversari (a destra)
    const forced = new URLSearchParams(location.search).get('eroe');
    const myId = forced && isPlayable(forced) ? forced : SaveManager.getSelectedCharacter();
    this.player = new Player(this, KICKOFF[0].x, KICKOFF[0].y, {
      characterId: myId,
      level: SaveManager.getLevel(myId),
      team: 0,
      combat: this.combat,
      isHuman: true,
    });
    this.fighters.push(this.player);

    this.ball = new SoccerBall(this, this.centerSpot().x, this.centerSpot().y, (x, y) => this.view.waterAt(x, y)?.flow ?? null);
    this.physics.add.collider(this.ball, this.view.walls);

    const level = currentBotLevel();
    const names = Phaser.Utils.Array.Shuffle([...BOT_NAMES]);
    const gods = pickBotGods(SOCCER.teamSize * 2 - 1, myId);
    const world: SoccerWorld = {
      ball: this.ball,
      attackGoal: (team) => this.goalCenter(1 - team),
      ownGoal: (team) => this.goalCenter(team),
      goalMouth: GOAL_MOUTH,
      players: () => this.fighters,
      bridgeVia: (fx, fy, tx, ty) => this.bridgeVia(fx, fy, tx, ty),
      paused: () => this.pause > 0 || this.over,
    };
    gods.forEach((god, i) => {
      const team = i < SOCCER.teamSize - 1 ? 0 : 1;
      const spot = this.kickoffSpot(team, team === 0 ? i + 1 : i - (SOCCER.teamSize - 1));
      const bot = new Bot(
        this,
        spot.x,
        spot.y,
        {
          characterId: god,
          level: level.characterLevel,
          team,
          combat: this.combat,
          // gli avversari tutti dello stesso colore, così si riconosce la squadra
          variant: team === 0 ? 'base' : 'rosso',
          name: team === 0 ? `${names[i]} (amico)` : names[i],
          ally: team === 0,
        },
        level,
        (b) => new SoccerBrain(b, this.combat, level, world),
      );
      this.fighters.push(bot);
    });
    for (const f of this.fighters) {
      this.physics.add.collider(f, this.view.walls);
      f.on(DEFEATED_EVENT, (who: Player) => this.onDefeated(who));
    }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, FIELD.width, FIELD.height);
    cam.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
    cam.setRoundPixels(true);

    this.controls = new PlayerControls(this, this.player);
    // chi ha la palla la calcia invece di attaccare
    this.controls.attackOverride = (angle, strength) => this.humanKick(angle, strength);
    this.hud = new MatchHud(this);
    this.updateScore();
    this.hud.showZone('Calcio del Nilo');
    // la palla fuori dallo schermo: una pallina sul bordo indica dov'è
    this.ballMarker = this.add.image(0, 0, TEX.palla).setScrollFactor(0).setDepth(DEPTH.ui).setScale(0.8).setVisible(false);
    addFpsMeter(this);
  }

  // ------------------------------------------------------------------ campo

  /** Righe bianche del campo e cerchio di centrocampo. */
  private drawLines(): void {
    const g = this.add.graphics().setDepth(DEPTH.ground + 1);
    const W = FIELD.width;
    const H = FIELD.height;
    g.lineStyle(8, 0xffffff, 0.75);
    g.strokeRect(GOAL_DEPTH, 30, W - GOAL_DEPTH * 2, H - 60);
    g.strokeCircle(W / 2, H / 2, 230);
    const box = 300;
    for (const side of [0, 1]) {
      const x = side === 0 ? GOAL_DEPTH : W - GOAL_DEPTH - box;
      g.strokeRect(x, H / 2 - 330, box, 660);
    }
    g.fillStyle(0xffffff, 0.75);
    g.fillCircle(GOAL_DEPTH + 220, H / 2, 8).fillCircle(W - GOAL_DEPTH - 220, H / 2, 8);
  }

  /** Le due porte, con i pali che non si attraversano. */
  private addGoals(): void {
    GOALS.forEach((r, side) => {
      this.add
        .image(side === 0 ? 0 : FIELD.width, r.y - GOAL_ART_TOP, TEX.porta)
        .setOrigin(side === 0 ? 0 : 1, 0)
        .setFlipX(side === 1)
        .setDepth(DEPTH.ground + 7);
      for (const y of [r.y - 14, r.y + r.h]) {
        const post = this.add.zone(r.x + r.w / 2, y + 7, r.w + 20, 14);
        this.physics.add.existing(post, true);
        this.view.walls.add(post);
      }
    });
  }

  private centerSpot(): { x: number; y: number } {
    return { x: FIELD.width / 2, y: FIELD.height / 2 };
  }

  /** Centro della porta della squadra `team` (0 = sinistra). */
  private goalCenter(team: number): { x: number; y: number } {
    const r = GOALS[team];
    return { x: team === 0 ? r.x + r.w : r.x, y: r.y + r.h / 2 };
  }

  private kickoffSpot(team: number, i: number): { x: number; y: number } {
    const p = KICKOFF[i % KICKOFF.length];
    return team === 0 ? p : mirror(p);
  }

  /** Se tra (fx, fy) e (tx, ty) c'è il fiume, il punto del ponte verso cui andare; altrimenti null. */
  private bridgeVia(fx: number, fy: number, tx: number, ty: number): { x: number; y: number } | null {
    const r = SOCCER_RIVER;
    const left = r.x;
    const right = r.x + r.w;
    const mid = left + r.w / 2;
    // la meta è nell'acqua (es. la palla) o si è già nell'acqua: dritti
    if (tx > left - 20 && tx < right + 20) return null;
    if (this.view.waterAt(fx, fy)) return null;
    if (fx < mid === tx < mid) return null;
    const bridges = FIELD.bridges ?? [];
    let best = bridges[0];
    let bestCost = Infinity;
    for (const b of bridges) {
      const cy = b.y + b.h / 2;
      const cost = Math.abs(fy - cy) + Math.abs(ty - cy);
      if (cost < bestCost) {
        bestCost = cost;
        best = b;
      }
    }
    const cy = best.y + best.h / 2;
    const onBridge = Math.abs(fy - cy) < best.h / 2 - 30 && fx > left - 90 && fx < right + 90;
    if (onBridge) return { x: tx < mid ? left - 80 : right + 80, y: cy };
    return { x: fx < mid ? left - 60 : right + 60, y: cy };
  }

  // ------------------------------------------------------------------ palla e gol

  /** Il giocatore usa il colpo: se ha la palla la calcia (tocco veloce = verso la porta o a un compagno). */
  private humanKick(angle: number | null, strength: number): boolean {
    const me = this.player;
    if (this.ball.holder !== me || this.pause > 0 || this.over) return false;
    if (angle !== null) {
      this.ball.kick(angle, SOCCER.ball.shotSpeed * (0.55 + 0.45 * strength));
      return true;
    }
    const goal = this.goalCenter(1);
    const d = Phaser.Math.Distance.Between(me.x, me.y, goal.x, goal.y);
    if (d < SOCCER.ball.autoShotRange) {
      this.ball.kick(Phaser.Math.Angle.Between(me.x, me.y, goal.x, goal.y), SOCCER.ball.shotSpeed);
      return true;
    }
    // lontano dalla porta: passaggio al compagno più avanti, altrimenti un calcio in avanti
    const mate = this.fighters
      .filter((f) => f !== me && f.team === me.team && f.isAlive() && f.x > me.x + 100)
      .sort((a, b) => b.x - a.x)[0];
    if (mate) this.ball.kick(Phaser.Math.Angle.Between(me.x, me.y, mate.x, mate.y), SOCCER.ball.passSpeed);
    else this.ball.kick(Phaser.Math.Angle.Between(me.x, me.y, goal.x, goal.y), SOCCER.ball.shotSpeed);
    return true;
  }

  /** Chi tocca la palla libera la prende (il più vicino). */
  private pickUpBall(): void {
    const ball = this.ball;
    if (ball.holder) return;
    let best: Player | null = null;
    let bestD = SOCCER.ball.pickupRadius;
    for (const f of this.fighters) {
      if (!ball.canBeTakenBy(f)) continue;
      const d = Phaser.Math.Distance.Between(f.x, f.y, ball.x, ball.y);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    if (best) ball.take(best);
  }

  /** La palla è entrata in una porta? */
  private checkGoal(): void {
    const b = this.ball;
    GOALS.forEach((r, side) => {
      if (this.pause > 0) return;
      const inside = b.x > r.x - 4 && b.x < r.x + r.w + 4 && b.y > r.y && b.y < r.y + r.h;
      const deep = side === 0 ? b.x < r.x + r.w - 20 : b.x > r.x + 20;
      if (inside && deep) this.goalScored(1 - side);
    });
  }

  /** Gol della squadra `team`. */
  private goalScored(team: number): void {
    this.score[team]++;
    this.updateScore();
    if (this.ball.holder) this.ball.drop();
    this.ball.frozen = true;
    this.pause = SOCCER.goalPause;
    this.controls.setEnabled(false);
    const mine = team === this.player.team;
    this.cameras.main.flash(250, mine ? 120 : 255, mine ? 255 : 120, mine ? 160 : 120);
    this.bigText(mine ? 'GOL!' : 'Gol degli avversari!', mine);
    if (this.score[team] >= SOCCER.goalsToWin) {
      this.time.delayedCall(900, () => this.endMatch());
      return;
    }
    this.time.delayedCall(SOCCER.goalPause * 1000, () => this.kickoff());
  }

  /** Tutti al proprio posto e palla al centro. */
  private kickoff(): void {
    if (this.over) return;
    const count = [0, 0];
    for (const f of this.fighters) {
      const spot = this.kickoffSpot(f.team, count[f.team]++);
      if (f.isAlive()) {
        f.body.reset(spot.x, spot.y);
        f.setPosition(spot.x, spot.y);
      } else {
        f.respawn(spot.x, spot.y);
      }
    }
    const c = this.centerSpot();
    this.ball.placeAt(c.x, c.y);
    this.ball.frozen = false;
    this.pause = 0;
    this.controls.setEnabled(this.player.isAlive());
  }

  // ------------------------------------------------------------------ sconfitte

  /** Chi viene sconfitto riappare dopo qualche secondo nella sua metà campo. */
  private onDefeated(who: Player): void {
    if (this.over) return;
    if (who === this.player) {
      this.controls.setEnabled(false);
      showToast(this, `Riappari tra ${SOCCER.respawnSeconds} secondi!`);
    }
    this.time.delayedCall(SOCCER.respawnSeconds * 1000, () => {
      if (this.over || who.isAlive()) return;
      const spots = who.team === 0 ? RESPAWN : RESPAWN.map(mirror);
      const spot = Phaser.Utils.Array.GetRandom(spots);
      who.respawn(spot.x, spot.y);
      if (who === this.player && this.pause <= 0) this.controls.setEnabled(true);
    });
  }

  // ------------------------------------------------------------------ punteggio e fine

  private updateScore(): void {
    this.hud.setTitle(`Noi ${this.score[0]} – ${this.score[1]} Loro`);
  }

  private bigText(text: string, good: boolean): void {
    const { width, height } = this.scale;
    const t = this.add
      .text(width / 2, height * 0.38, text, {
        fontFamily: FONT_FAMILY,
        fontSize: good ? '110px' : '64px',
        color: good ? css(PALETTE.oro) : '#FFFFFF',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 12,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.ui + 50)
      .setScale(0.2);
    this.tweens.add({ targets: t, scale: 1, duration: 380, ease: 'Back.out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1500, duration: 400, onComplete: () => t.destroy() });
  }

  /** Fine partita: 1 = vinta, 2 = pareggio, 3 = persa. Salva subito le coppe e passa ai Risultati. */
  private endMatch(): void {
    if (this.over) return;
    this.over = true;
    this.controls.setEnabled(false);
    const [mine, theirs] = this.score;
    const place = mine > theirs ? 1 : mine === theirs ? 2 : 3;
    const reward = SaveManager.recordMatch(this.player.stats.id, place, trophiesForPlace(place, 'calcio'));
    const title = place === 1 ? 'VITTORIA!' : place === 2 ? 'Pareggio!' : 'Sconfitta';
    this.time.delayedCall(700, () => showEndOverlay(this, `${title}\n${mine} – ${theirs}`, place === 1));
    this.time.delayedCall(2800, () => {
      this.cameras.main.fadeOut(300, 20, 33, 61);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.scene.start('Results', { ...reward, mode: 'calcio', playerCount: 2, score: [mine, theirs] }),
      );
    });
  }

  // ------------------------------------------------------------------ ogni fotogramma

  /** Cespugli e terreno (come nella battaglia, ma senza piramidi). */
  private updateHideouts(dt: number): void {
    const now = this.time.now;
    const me = this.player;
    for (const f of this.fighters) {
      const bush = this.view.bushAt(f.x, f.y);
      // chi porta la palla non si può nascondere: la palla si vede!
      const hidden = bush && f.revealedUntil <= now && this.ball.holder !== f;
      f.hideout = f.isInvisible() ? Player.INVISIBLE : hidden ? bush : null;
      this.view.applyTerrain(f);
    }
    this.view.setSeeThroughBush(this.view.bushAt(me.x, me.y));
    me.setHiddenLook(!!me.hideout);
    this.view.updateTallThings(me, dt);
    for (const f of this.fighters) {
      if (f === me) continue;
      const near = Phaser.Math.Distance.Between(f.x, f.y, me.x, me.y) < HIDEOUT_REVEAL_DISTANCE;
      f.setRevealed(!f.hideout || f.hideout === me.hideout || near || me.seesAll() || f.team === me.team);
    }
  }

  /** Pallina sul bordo dello schermo quando la palla non si vede. */
  private updateBallMarker(): void {
    const cam = this.cameras.main;
    const v = cam.worldView;
    const b = this.ball;
    if (v.contains(b.x, b.y - 20)) {
      this.ballMarker.setVisible(false);
      return;
    }
    const m = 40;
    const x = Phaser.Math.Clamp(b.x - v.x, m, cam.width - m);
    const y = Phaser.Math.Clamp(b.y - v.y, m + 90, cam.height - m);
    this.ballMarker.setPosition(x, y).setVisible(true).setAlpha(0.6 + 0.4 * Math.abs(Math.sin(this.time.now / 250)));
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.view.update(dt, this.cameras.main);
    this.updateHideouts(dt);
    this.updateBallMarker();
    if (this.over) return;
    if (this.pause > 0) {
      this.pause -= dt;
      return;
    }
    this.pickUpBall();
    this.checkGoal();
    this.controls.update(dt);

    this.timeLeft -= dt;
    const t = Math.max(0, Math.ceil(this.timeLeft));
    this.hud.setStorm(`${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, t <= 10);
    if (this.timeLeft <= 0) this.endMatch();
  }
}
