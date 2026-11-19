import Phaser from 'phaser';
import { TEX } from '../art';
import type { Combat, Damageable } from './Combat';

export interface ProjectileOptions {
  owner: Damageable;
  combat: Combat;
  angle: number;
  speed: number;
  range: number;
  /** raggio per colpire (pixel) */
  radius: number;
  /** altezza da terra a cui vola (pixel) */
  height: number;
  texture: string;
  /** Chiamato quando tocca qualcuno (nemico o compagno). `travelled` = pixel percorsi fin lì. */
  onHit: (target: Damageable, x: number, y: number, travelled: number) => void;
  /** Attraversa i bersagli invece di fermarsi al primo (ognuno viene colpito una volta sola). */
  pierce?: boolean;
  /** Quanto gira su sé stesso (radianti al secondo). 0 = vola dritto con la punta in avanti. */
  spin?: number;
  /** Quante volte rimbalza sui muri invece di fermarsi. */
  bounces?: number;
  /** Quanto cresce fino a fine portata (1.2 = +120% di grandezza, anche per colpire). */
  grow?: number;
  /** Bersagli da non toccare (es. chi è già stato colpito dal vaso intero, per le schegge). */
  ignore?: Damageable[];
  /** Chiamato quando finisce (colpito, muro o portata finita). */
  onEnd?: (x: number, y: number) => void;
  /** Disegna la scia ogni fotogramma (da dove è partito fino a dove è ora). */
  drawTrail?: (g: Phaser.GameObjects.Graphics, sx: number, sy: number, x: number, y: number, t: number) => void;
}

/**
 * Qualcosa che vola in linea retta (frecce, bende, palle di fuoco…).
 * Si ferma contro i muri, colpisce il primo personaggio che tocca, o sparisce a fine portata.
 * La posizione (x, y) è a terra: il disegno sta più in alto di `height`.
 */
export class Projectile extends Phaser.GameObjects.Container {
  private readonly head: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly trail: Phaser.GameObjects.Graphics | null;
  private readonly startX: number;
  private readonly startY: number;
  private travelled = 0;
  private time = 0;
  private done = false;
  private readonly alreadyHit = new Set<Damageable>();
  private heading: number;
  private bouncesLeft: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly opt: ProjectileOptions,
  ) {
    super(scene, x, y);
    this.startX = x;
    this.startY = y;
    this.heading = opt.angle;
    this.bouncesLeft = opt.bounces ?? 0;
    for (const t of opt.ignore ?? []) this.alreadyHit.add(t);
    this.shadow = scene.add.image(0, 0, TEX.ombra).setScale(0.45);
    this.head = scene.add.image(0, -opt.height, opt.texture);
    if (opt.spin === 0) this.head.setRotation(opt.angle);
    this.add([this.shadow, this.head]);
    this.trail = opt.drawTrail ? scene.add.graphics() : null;
    scene.add.existing(this);
  }

  preUpdate(_t: number, delta: number): void {
    if (this.done) return;
    const dt = delta / 1000;
    this.time += dt;
    const step = this.opt.speed * dt;
    const dx = Math.cos(this.heading) * step;
    const dy = Math.sin(this.heading) * step;
    this.x += dx;
    this.y += dy;
    this.travelled += step;
    if (this.bouncesLeft > 0 && this.hitsWall(this.x, this.y)) this.bounce(dx, dy);
    this.head.rotation += dt * (this.opt.spin ?? 14);
    const size = 1 + (this.opt.grow ?? 0) * Math.min(1, this.travelled / this.opt.range);
    if (this.opt.grow) {
      this.head.setScale(size);
      this.head.y = -this.opt.height * size; // una palla che rotola resta appoggiata a terra
      this.shadow.setScale(0.45 * size);
    }
    const radius = this.opt.radius * size;
    this.setDepth(this.y + 1);

    if (this.trail && this.opt.drawTrail) {
      this.trail.clear();
      this.trail.setDepth(Math.max(this.y, this.startY) + 1);
      this.opt.drawTrail(this.trail, this.startX, this.startY - this.opt.height, this.x, this.y - this.opt.height, this.time);
    }

    if (this.opt.pierce) {
      for (const t of this.opt.combat.touchingAll(this.x, this.y, radius, this.opt.owner)) {
        if (this.alreadyHit.has(t)) continue;
        this.alreadyHit.add(t);
        this.opt.onHit(t, this.x, this.y, this.travelled);
      }
    } else {
      const target = this.opt.combat
        .touchingAll(this.x, this.y, radius, this.opt.owner)
        .find((t) => !this.alreadyHit.has(t));
      if (target) {
        this.opt.onHit(target, this.x, this.y, this.travelled);
        this.finish();
        return;
      }
    }
    if (this.travelled >= this.opt.range || this.hitsWall(this.x, this.y)) this.finish();
  }

  /** Torna indietro di un passo e rimbalza: gira la direzione dal lato del muro che ha toccato. */
  private bounce(dx: number, dy: number): void {
    this.bouncesLeft -= 1;
    this.x -= dx;
    this.y -= dy;
    const hitX = this.hitsWall(this.x + dx, this.y);
    const hitY = this.hitsWall(this.x, this.y + dy);
    if (hitX) this.heading = Math.PI - this.heading;
    if (hitY) this.heading = -this.heading;
    if (!hitX && !hitY) this.heading += Math.PI;
    if (this.opt.spin === 0) this.head.setRotation(this.heading);
  }

  private hitsWall(x: number, y: number): boolean {
    const walls = this.opt.combat.walls;
    if (!walls) return false;
    const circle = new Phaser.Geom.Circle(x, y, this.opt.radius * 0.5);
    for (const child of walls.getChildren()) {
      const body = (child as Phaser.GameObjects.Zone).body as Phaser.Physics.Arcade.StaticBody | null;
      if (!body) continue;
      if (Phaser.Geom.Intersects.CircleToRectangle(circle, new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height))) {
        return true;
      }
    }
    return false;
  }

  private finish(): void {
    this.done = true;
    this.opt.onEnd?.(this.x, this.y);
    // la scia si ritira e tutto svanisce
    this.scene.tweens.add({
      targets: [this, ...(this.trail ? [this.trail] : [])],
      alpha: 0,
      duration: 220,
      onComplete: () => {
        this.trail?.destroy();
        this.destroy();
      },
    });
  }
}
