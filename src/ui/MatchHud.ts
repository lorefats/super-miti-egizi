import Phaser from 'phaser';
import { DEPTH, FONT_FAMILY } from '../config';
import { PALETTE, css } from '../art/palette';

/** In alto al centro: quanti personaggi sono ancora in gioco. */
export class MatchHud {
  private readonly box: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;
  private readonly stormText: Phaser.GameObjects.Text;
  private stormMsg = '';
  private readonly zoneText: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    this.box = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.ui);
    this.text = scene.add
      .text(0, 0, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '30px',
        color: css(PALETTE.oro),
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.ui + 1);
    this.stormText = scene.add
      .text(0, 0, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: '#FFE0A8',
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.ui + 1);
    this.zoneText = scene.add
      .text(0, 0, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '40px',
        color: css(PALETTE.oro),
        stroke: css(PALETTE.bluNotte),
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.ui + 1)
      .setAlpha(0);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this));
  }

  /** `label` = cosa si conta ("Rimasti" in Solo, "Squadre" in Duo). */
  setRemaining(n: number, label = 'Rimasti'): void {
    this.setTitle(`${label}: ${n}`);
  }

  /** Scritta grande in alto (es. il punteggio nel Calcio). */
  setTitle(text: string): void {
    this.text.setText(text);
    this.layout();
    this.scene.tweens.add({ targets: this.text, scale: { from: 1.3, to: 1 }, duration: 250, ease: 'Back.out' });
  }

  /** Messaggio sulla tempesta sotto il contatore. `danger` = il giocatore è dentro la tempesta. */
  setStorm(msg: string, danger: boolean): void {
    if (msg !== this.stormMsg) {
      this.stormMsg = msg;
      this.stormText.setText(msg);
    }
    this.stormText.setColor(danger ? '#FF8A8A' : '#FFE0A8');
    this.stormText.setScale(danger ? 1 + 0.08 * Math.sin(this.scene.time.now / 90) : 1);
  }

  /** Mostra per un paio di secondi il nome della zona in cui si entra. */
  showZone(name: string): void {
    this.zoneText.setText(name);
    this.scene.tweens.killTweensOf(this.zoneText);
    this.zoneText.setAlpha(0).setScale(0.8);
    this.scene.tweens.add({ targets: this.zoneText, alpha: 1, scale: 1, duration: 250, ease: 'Back.out' });
    this.scene.tweens.add({ targets: this.zoneText, alpha: 0, delay: 1800, duration: 500 });
  }

  private layout(): void {
    const x = this.scene.scale.width / 2;
    const y = 36;
    this.text.setPosition(x, y);
    this.stormText.setPosition(x, y + 44);
    // in basso al centro, tra i due stick, così non copre il personaggio
    this.zoneText.setPosition(x, this.scene.scale.height - 70);
    const w = this.text.width + 40;
    this.box.clear();
    this.box.fillStyle(PALETTE.bluNotte, 0.55).fillRoundedRect(x - w / 2, y - 26, w, 52, 14);
  }
}
