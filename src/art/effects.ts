import Phaser from 'phaser';
import { TEX } from './index';

/**
 * Il punto (x, y) della mappa è sullo schermo (con un margine)?
 * Gli effetti lontani non si creano: nessuno li vedrebbe e il telefono fa meno fatica.
 */
export function isOnScreen(scene: Phaser.Scene, x: number, y: number, margin = 250): boolean {
  const v = scene.cameras.main.worldView;
  return x > v.x - margin && x < v.right + margin && y > v.y - margin && y < v.bottom + margin;
}

/** Stella di luce + scintille dove un colpo va a segno. */
export function hitSpark(scene: Phaser.Scene, x: number, y: number, depth: number): void {
  if (!isOnScreen(scene, x, y)) return;
  const star = scene.add
    .image(x, y, TEX.impatto)
    .setDepth(depth)
    .setScale(0.2)
    .setRotation(Math.random() * Math.PI);
  scene.tweens.add({ targets: star, scale: 0.9, duration: 90, ease: 'Quad.out' });
  scene.tweens.add({
    targets: star,
    alpha: 0,
    scale: 1.1,
    rotation: star.rotation + 0.6,
    delay: 90,
    duration: 140,
    onComplete: () => star.destroy(),
  });
  const sparks = scene.add.particles(x, y, TEX.scintilla, {
    speed: { min: 120, max: 300 },
    lifespan: { min: 200, max: 380 },
    scale: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
    emitting: false,
  });
  sparks.setDepth(depth + 1);
  sparks.explode(8);
  scene.time.delayedCall(500, () => sparks.destroy());
}

/** Sbuffo di sabbia ai piedi (quando un personaggio scatta o colpisce). */
export function dustPuff(scene: Phaser.Scene, x: number, y: number, direction: number, depth: number): void {
  if (!isOnScreen(scene, x, y)) return;
  const deg = Phaser.Math.RadToDeg(direction + Math.PI);
  const dust = scene.add.particles(x, y, TEX.granello, {
    speed: { min: 40, max: 120 },
    angle: { min: deg - 50, max: deg + 50 },
    lifespan: { min: 250, max: 450 },
    scale: { start: 0.9, end: 0.2 },
    alpha: { start: 0.8, end: 0 },
    emitting: false,
  });
  dust.setDepth(depth);
  dust.explode(7);
  scene.time.delayedCall(600, () => dust.destroy());
}

/**
 * Sconfitta "senza violenza": le immagini si sgretolano in sabbia, schizzano granelli
 * e resta un mucchietto che dopo qualche secondo svanisce.
 */
export function turnToSand(
  scene: Phaser.Scene,
  images: Phaser.GameObjects.Image[],
  x: number,
  y: number,
  onDone: () => void,
): void {
  for (const img of images) img.setTint(0xe9c46a);
  scene.tweens.add({
    targets: images,
    scaleY: 0.05,
    scaleX: 1.25,
    alpha: 0.3,
    duration: 450,
    ease: 'Quad.in',
    onComplete: onDone,
  });

  const grains = scene.add.particles(x, y - 50, TEX.granello, {
    speed: { min: 60, max: 220 },
    angle: { min: 200, max: 340 },
    gravityY: 500,
    lifespan: { min: 500, max: 900 },
    scale: { start: 1, end: 0.4 },
    alpha: { start: 1, end: 0 },
    emitting: false,
  });
  grains.setDepth(y + 1);
  grains.explode(36);
  scene.time.delayedCall(1200, () => grains.destroy());

  const pile = scene.add.image(x, y + 4, TEX.mucchietto).setOrigin(0.5, 1).setDepth(y - 1).setScale(0.3);
  scene.tweens.add({ targets: pile, scale: 1, duration: 350, delay: 200, ease: 'Back.out' });
  scene.tweens.add({ targets: pile, alpha: 0, delay: 4000, duration: 1000, onComplete: () => pile.destroy() });
}

/** Un solo emettitore di polvere per scena (crearne uno per ogni passo sarebbe lento sul telefono). */
const footDust = new WeakMap<Phaser.Scene, Phaser.GameObjects.Particles.ParticleEmitter>();

/** Piccola nuvoletta di sabbia sotto un piede che tocca terra. */
export function footstepDust(scene: Phaser.Scene, x: number, y: number): void {
  if (!isOnScreen(scene, x, y, 100)) return;
  let e = footDust.get(scene);
  if (!e || !e.scene) {
    e = scene.add.particles(0, 0, TEX.granello, {
      speed: { min: 15, max: 45 },
      angle: { min: 180, max: 360 },
      lifespan: { min: 250, max: 400 },
      scale: { start: 0.7, end: 0.15 },
      alpha: { start: 0.6, end: 0 },
      emitting: false,
    });
    e.setDepth(-900); // sulla sabbia, sotto i personaggi
    footDust.set(scene, e);
  }
  e.emitParticleAt(x, y, 2);
}
