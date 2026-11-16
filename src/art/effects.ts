import Phaser from 'phaser';
import { TEX } from './index';

/** Stella di luce + scintille dove un colpo va a segno. */
export function hitSpark(scene: Phaser.Scene, x: number, y: number, depth: number): void {
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
