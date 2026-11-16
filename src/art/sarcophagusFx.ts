import Phaser from 'phaser';
import { TEX } from './index';
import { dustPuff } from './effects';

/** Bende che volano via girando (quando si esce dal sarcofago). */
function bandageBurst(scene: Phaser.Scene, x: number, y: number, depth: number, count: number): void {
  const e = scene.add.particles(x, y, TEX.benda, {
    speed: { min: 120, max: 300 },
    angle: { min: 200, max: 340 },
    gravityY: 350,
    rotate: { start: 0, end: 540 },
    scale: { start: 0.7, end: 0.3 },
    alpha: { start: 1, end: 0 },
    lifespan: { min: 600, max: 900 },
    emitting: false,
  });
  e.setDepth(depth);
  e.explode(count);
  scene.time.delayedCall(1000, () => e.destroy());
}

/**
 * Prigione nelle bende: le bende avvolgono il personaggio, poi un sarcofago si chiude su di lui.
 * `parts` sono i pezzi del personaggio da nascondere mentre è chiuso dentro.
 * Restituisce una funzione da chiamare per liberarlo.
 */
export function playImprison(
  scene: Phaser.Scene,
  holder: Phaser.GameObjects.Container,
  parts: Phaser.GameObjects.GameObject[],
  shake: boolean,
): () => void {
  // 1) bende che si stringono attorno al corpo
  const strips: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 6; i++) {
    const strip = scene.add
      .image(0, -18 - i * 22, TEX.benda)
      .setScale(0, 0.9)
      .setRotation(i % 2 === 0 ? 0.22 : -0.22);
    holder.add(strip);
    strips.push(strip);
    scene.tweens.add({ targets: strip, scaleX: 0.85, duration: 120, delay: i * 35, ease: 'Back.out' });
  }

  // 2) il sarcofago cade e si chiude
  const box = scene.add.image(0, 4, TEX.sarcofagoInPiedi).setOrigin(0.5, 1).setAlpha(0).setScale(1.3);
  holder.add(box);
  let wobble: Phaser.Tweens.Tween | null = null;
  scene.time.delayedCall(300, () => {
    if (!box.scene) return;
    for (const p of parts) (p as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);
    for (const s of strips) s.destroy();
    scene.tweens.add({
      targets: box,
      alpha: 1,
      scale: 1,
      duration: 140,
      ease: 'Quad.in',
      onComplete: () => {
        dustPuff(scene, holder.x, holder.y, -Math.PI / 2, holder.depth - 1);
        dustPuff(scene, holder.x, holder.y, Math.PI / 2, holder.depth - 1);
        if (shake) scene.cameras.main.shake(120, 0.005);
        wobble = scene.tweens.add({ targets: box, angle: { from: -2, to: 2 }, duration: 160, yoyo: true, repeat: -1 });
      },
    });
  });

  return () => {
    wobble?.stop();
    for (const s of strips) if (s.scene) s.destroy();
    for (const p of parts) (p as unknown as Phaser.GameObjects.Components.Visible).setVisible(true);
    bandageBurst(scene, holder.x, holder.y - 80, holder.depth + 1, 8);
    scene.tweens.add({ targets: box, alpha: 0, scale: 1.15, duration: 160, onComplete: () => box.destroy() });
  };
}

/**
 * Resurrezione: il personaggio sconfitto viene chiuso nel suo sarcofago che trema, poi il coperchio
 * si apre con una luce dorata, le bende volano via a spirale e il personaggio esce.
 */
export function playRevive(
  scene: Phaser.Scene,
  holder: Phaser.GameObjects.Container,
  parts: Phaser.GameObjects.GameObject[],
  seconds: number,
  onOut: () => void,
): void {
  for (const p of parts) (p as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);
  const glow = scene.add.image(0, -80, TEX.bagliore).setScale(1.6).setAlpha(0).setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD);
  const box = scene.add.image(0, 4, TEX.sarcofagoInPiedi).setOrigin(0.5, 1).setScale(1.3).setAlpha(0);
  holder.add([glow, box]);
  scene.tweens.add({ targets: box, alpha: 1, scale: 1, duration: 160, ease: 'Quad.in' });
  scene.tweens.add({ targets: glow, alpha: 0.9, duration: seconds * 1000 * 0.8 });
  // trema sempre di più
  scene.tweens.add({ targets: box, angle: { from: -1.5, to: 1.5 }, duration: 110, yoyo: true, repeat: Math.floor((seconds * 1000) / 220) - 2 });

  const total = seconds * 1000;
  scene.time.delayedCall(total - 260, () => {
    if (!box.scene) return;
    // il coperchio si apre come una porta e la luce esplode
    scene.tweens.add({ targets: box, scaleX: 0, x: -50, duration: 220, ease: 'Quad.in', onComplete: () => box.destroy() });
    const star = scene.add.image(holder.x, holder.y - 80, TEX.impatto).setScale(0.3).setDepth(holder.depth + 2);
    scene.tweens.add({ targets: star, scale: 2.2, alpha: 0, angle: 90, duration: 450, onComplete: () => star.destroy() });
    bandageBurst(scene, holder.x, holder.y - 90, holder.depth + 1, 14);
  });
  scene.time.delayedCall(total, () => {
    if (!holder.scene) return;
    for (const p of parts) (p as unknown as Phaser.GameObjects.Components.Visible).setVisible(true);
    scene.tweens.add({ targets: glow, alpha: 0, duration: 600, onComplete: () => glow.destroy() });
    onOut();
  });
}
