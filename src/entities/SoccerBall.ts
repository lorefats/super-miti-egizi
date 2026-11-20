import Phaser from 'phaser';
import { playSfxAt } from '../audio/Sound';
import { TEX } from '../art';
import { dustPuff } from '../art/effects';
import { SOCCER } from '../data/soccer';
import type { Player } from './Player';

const B = SOCCER.ball;

/**
 * La palla del Calcio del Nilo. Chi la tocca la prende e la porta davanti ai piedi; con il colpo la calcia.
 * Se chi la porta viene colpito, la perde. Da sola rotola, rimbalza sui muri e nel fiume va più piano
 * e si fa trascinare dalla corrente.
 */
export class SoccerBall extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  /** Chi la porta adesso (null = è libera). */
  holder: Player | null = null;
  /** Ferma (dopo un gol, aspettando il calcio d'inizio): nessuno la può prendere. */
  frozen = false;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  /** La velocità vera della palla (senza la corrente). */
  private readonly vel = new Phaser.Math.Vector2();
  private readonly drift = new Phaser.Math.Vector2();
  private holderHealth = 0;
  /** Chi l'ha appena calciata e fino a quando (secondi) non la può riprendere. */
  private kicker: Player | null = null;
  private kickerWait = 0;
  private spin = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    /** Corrente dell'acqua in (x, y), oppure null se lì è asciutto. */
    private readonly flowAt: (x: number, y: number) => { x: number; y: number } | null,
  ) {
    super(scene, x, y);
    this.shadow = scene.add.image(0, 4, TEX.ombra).setScale(0.55);
    this.sprite = scene.add.image(0, -B.radius + 4, TEX.palla);
    this.add([this.shadow, this.sprite]);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCircle(B.radius, -B.radius, -B.radius);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(B.bounce, B.bounce);
  }

  /** Rimette la palla ferma in (x, y), libera. */
  placeAt(x: number, y: number): void {
    this.release();
    this.vel.set(0, 0);
    this.body.reset(x, y);
    this.setPosition(x, y);
  }

  /** Calcia la palla nella direzione `angle` (chi la porta). */
  kick(angle: number, speed: number): void {
    const from = this.holder;
    if (!from) return;
    this.release();
    this.kicker = from;
    this.kickerWait = B.kickerWait;
    // parte da davanti ai piedi, così non resta incastrata in chi la calcia
    const x = from.x + Math.cos(angle) * B.carryOffset;
    const y = from.y + Math.sin(angle) * B.carryOffset * 0.7;
    this.body.reset(x, y);
    this.setPosition(x, y);
    this.vel.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.body.setVelocity(this.vel.x, this.vel.y);
    dustPuff(this.scene, x, y, angle + Math.PI, y - 1);
    playSfxAt(this.scene, x, y, 'kick');
  }

  /** Chi la porta la perde: rotola via un po' a caso. */
  drop(): void {
    const from = this.holder;
    if (!from) return;
    this.release();
    this.kicker = from;
    this.kickerWait = B.kickerWait;
    const a = Math.random() * Math.PI * 2;
    this.body.reset(this.x, this.y);
    this.vel.set(Math.cos(a) * B.dropSpeed, Math.sin(a) * B.dropSpeed);
    this.body.setVelocity(this.vel.x, this.vel.y);
  }

  private release(): void {
    this.holder = null;
    this.body.enable = true;
    this.drift.set(0, 0);
  }

  /** Può essere presa da `p` adesso? */
  canBeTakenBy(p: Player): boolean {
    if (this.holder || this.frozen) return false;
    if (p === this.kicker && this.kickerWait > 0) return false;
    return p.canAct() && !p.isUnderground() && !p.isInvisible();
  }

  /** `p` prende la palla. */
  take(p: Player): void {
    this.holder = p;
    this.holderHealth = p.health;
    this.vel.set(0, 0);
    this.body.stop();
    this.body.enable = false;
  }

  preUpdate(_t: number, delta: number): void {
    const dt = delta / 1000;
    this.kickerWait -= dt;
    const h = this.holder;
    if (h) {
      // chi la porta la perde se viene colpito, sconfitto, stordito o va sotto terra
      if (!h.isAlive() || !h.canAct() || h.isUnderground() || h.isInvisible() || h.health < this.holderHealth) {
        this.drop();
      } else {
        this.holderHealth = h.health;
        h.changeSpeed('palla', 0.2, SOCCER.carrierSpeedFactor);
        // davanti ai piedi, dalla parte dove guarda; rotola mentre cammina
        const moving = h.body.velocity.lengthSq() > 400;
        const a = moving ? Math.atan2(h.body.velocity.y, h.body.velocity.x) : h.facingSign > 0 ? 0 : Math.PI;
        this.setPosition(h.x + Math.cos(a) * B.carryOffset, h.y + Math.sin(a) * B.carryOffset * 0.6 + 4);
        if (moving) this.spin += dt * 12 * Math.sign(Math.cos(a) || 1);
        this.sprite.setRotation(this.spin);
        this.setDepth(this.y + 1);
        return;
      }
    }

    // libera: la velocità vera è quella dopo gli urti, meno la corrente aggiunta prima
    this.vel.set(this.body.velocity.x - this.drift.x, this.body.velocity.y - this.drift.y);
    const flow = this.flowAt(this.x, this.y);
    const k = Math.exp(-(flow ? B.waterDrag : B.drag) * dt);
    this.vel.scale(k);
    if (this.vel.lengthSq() < 100) this.vel.set(0, 0);
    if (flow) this.drift.set(flow.x * B.flowFactor, flow.y * B.flowFactor);
    else this.drift.set(0, 0);
    this.body.setVelocity(this.vel.x + this.drift.x, this.vel.y + this.drift.y);
    this.spin += (this.vel.x / B.radius) * dt;
    this.sprite.setRotation(this.spin);
    // nell'acqua galleggia: si abbassa un po' e dondola
    this.sprite.y = -B.radius + 4 + (flow ? 10 + Math.sin(this.scene.time.now / 200) * 3 : 0);
    this.shadow.setVisible(!flow);
    this.setDepth(this.y);
  }
}
