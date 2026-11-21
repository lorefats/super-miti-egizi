import Phaser from 'phaser';
import { stopMenuMusic } from '../audio/Music';
import { CAMERA_LERP, DEPTH } from '../config';
import { ROSTER, getCharacter, isPlayable } from '../data/characters';
import { MAPPA_ALLENAMENTO, TRAINING } from '../data/training';
import { SaveManager } from '../save/SaveManager';
import { Combat } from '../entities/Combat';
import { Player } from '../entities/Player';
import { Target } from '../entities/Target';
import { addFpsMeter } from '../ui/FpsMeter';
import { createGoldButton } from '../ui/GoldButton';
import { MatchHud } from '../ui/MatchHud';
import { backButton, goTo } from '../ui/MenuKit';
import { PlayerControls } from '../ui/PlayerControls';
import { showToast } from '../ui/Toast';
import { MapView } from './MapView';

/** Un posto dove sta un bersaglio: quando viene distrutto, dopo qualche secondo ne torna uno nuovo. */
interface TargetSlot {
  x: number;
  y: number;
  target: Target | null;
  /** secondi che mancano al ritorno del bersaglio */
  wait: number;
}

/**
 * Allenamento (sezione 2): mappa piccola con bersagli fermi, per provare i personaggi.
 * Niente bot, niente tempesta, niente coppe. In alto a destra si cambia dio e si carica la super al volo.
 */
export class TrainingScene extends Phaser.Scene {
  private player!: Player;
  private combat!: Combat;
  private view!: MapView;
  private controls!: PlayerControls;
  private slots: TargetSlot[] = [];
  private characterId = '';

  constructor() {
    super('Training');
  }

  init(data: { characterId?: string }): void {
    const forced = new URLSearchParams(location.search).get('eroe');
    const wanted = data?.characterId ?? (forced && isPlayable(forced) ? forced : SaveManager.getSelectedCharacter());
    this.characterId = isPlayable(wanted) ? wanted : SaveManager.getSelectedCharacter();
  }

  create(): void {
    stopMenuMusic();
    const map = MAPPA_ALLENAMENTO;
    this.combat = new Combat();
    this.view = new MapView(this, map, this.combat);
    this.cameras.main.fadeIn(250, 20, 33, 61);

    this.player = new Player(this, map.spawn.x, map.spawn.y, {
      characterId: this.characterId,
      level: SaveManager.getLevel(this.characterId),
      team: 0,
      combat: this.combat,
      isHuman: true,
    });
    this.physics.add.collider(this.player, this.view.walls);

    this.slots = map.targets.map((t) => ({ x: t.x, y: t.y, target: null, wait: 0 }));
    for (const s of this.slots) this.placeTarget(s);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.width, map.height);
    cam.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
    cam.setRoundPixels(true);

    this.controls = new PlayerControls(this, this.player);
    const hud = new MatchHud(this);
    hud.setTitle(`Allenamento — ${getCharacter(this.characterId).name}`);
    hud.setStorm('Colpisci i bersagli!', false);
    if (map.name) hud.showZone(map.name);
    this.drawButtons();
    addFpsMeter(this);
  }

  /** Mette un bersaglio nuovo nel suo posto (con il "pop" quando torna su). */
  private placeTarget(s: TargetSlot): void {
    const t = new Target(this, s.x, s.y, this.combat);
    this.physics.add.collider(this.player, t);
    s.target = t;
    s.wait = TRAINING.targetRespawnSeconds;
    t.setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 300 });
  }

  /** Indietro (in alto a sinistra), Cambia dio e Super carica (in alto a destra). */
  private drawButtons(): void {
    const back = backButton(this, () => goTo(this, 'Lobby'));
    back.setScrollFactor(0, 0, true).setDepth(DEPTH.ui + 10);

    const change = createGoldButton(this, 0, 50, 'Cambia dio', () => this.nextCharacter(), 220, 60, 28);
    change.setDepth(DEPTH.ui + 10);
    const charge = createGoldButton(this, 0, 126, 'Super carica', () => this.fillSuper(), 220, 60, 28);
    charge.setDepth(DEPTH.ui + 10);
    // se lo schermo cambia misura (telefono girato, schermo intero) restano attaccati al bordo destro
    const layout = () => {
      change.setX(this.scale.width - 130);
      charge.setX(this.scale.width - 130);
    };
    layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, layout);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, layout));
  }

  /** Passa al prossimo dio sbloccato e ricomincia l'allenamento con lui. */
  private nextCharacter(): void {
    const mine = ROSTER.map((c) => c.id).filter((id) => isPlayable(id) && SaveManager.isUnlocked(id));
    if (mine.length <= 1) {
      showToast(this, 'Trova altri dèi nei sarcofagi\nper provarli qui!');
      return;
    }
    const next = mine[(mine.indexOf(this.characterId) + 1) % mine.length];
    this.scene.restart({ characterId: next });
  }

  /** Riempie subito la super, così la si può provare quante volte si vuole. */
  private fillSuper(): void {
    if (!this.player.isAlive()) return;
    this.player.superCharge = 1;
    showToast(this, 'Super pronta!');
  }

  /** Il giocatore nei cespugli (si vede trasparente) e nell'acqua (va più piano). */
  private updateTerrain(dt: number): void {
    const me = this.player;
    const bush = this.view.bushAt(me.x, me.y);
    me.hideout = me.isInvisible() ? Player.INVISIBLE : bush && me.revealedUntil <= this.time.now ? bush : null;
    this.view.applyTerrain(me);
    this.view.setSeeThroughBush(bush);
    me.setHiddenLook(!!me.hideout);
    this.view.updateTallThings(me, dt);
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.view.update(dt, this.cameras.main);
    this.updateTerrain(dt);
    // i bersagli distrutti tornano su dopo qualche secondo
    for (const s of this.slots) {
      if (s.target && s.target.isAlive()) continue;
      s.wait -= dt;
      if (s.wait <= 0) this.placeTarget(s);
    }
    this.controls.update(dt);
  }
}
