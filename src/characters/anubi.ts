import Phaser from 'phaser';
import { TEX } from '../art';
import { hitSpark } from '../art/effects';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Schiacciamento verticale degli effetti a terra (prospettiva 2.5D). */
const GROUND_SQUASH = 0.62;
/** Altezza da terra a cui passa il fendente. */
const SWING_HEIGHT = 34;

/** Anubi — Scettro Uas: colpo a mezzaluna a corto raggio che colpisce tutti davanti a lui. */
export const anubi: CharacterModule = {
  id: 'anubi',
  swingSeconds: 0.07,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const scene = user.scene;
    const side = Math.cos(angle) >= 0 ? 1 : -1; // il fendente va dall'alto verso il basso nel verso in cui guarda

    // Il fendente vive in un contenitore schiacciato: così sembra disegnato sulla sabbia in prospettiva.
    const holder = scene.add.container(user.x, user.y - SWING_HEIGHT).setScale(1, GROUND_SQUASH).setDepth(user.y + 1);
    const localAngle = Math.atan2(Math.sin(angle) / GROUND_SQUASH, Math.cos(angle));
    const baseScale = w.range / 120; // la mezzaluna è disegnata con raggio 120
    const sweep = Phaser.Math.DegToRad(w.arcDegrees) * 0.45;

    // scia (più tenue, parte un attimo dopo) e lama principale
    const trail = scene.add.image(0, 0, TEX.mezzaluna).setAlpha(0.45).setScale(baseScale * 0.85);
    const blade = scene.add.image(0, 0, TEX.mezzaluna).setScale(baseScale * 0.7);
    holder.add([trail, blade]);
    blade.setRotation(localAngle - sweep * side);
    trail.setRotation(localAngle - sweep * side * 1.3);

    scene.tweens.add({ targets: blade, rotation: localAngle + sweep * 0.5 * side, scale: baseScale, duration: 150, ease: 'Cubic.out' });
    scene.tweens.add({ targets: trail, rotation: localAngle + sweep * 0.2 * side, scale: baseScale * 0.95, duration: 190, ease: 'Cubic.out' });
    scene.tweens.add({
      targets: [blade, trail],
      alpha: 0,
      delay: 140,
      duration: 160,
      onComplete: () => holder.destroy(),
    });

    // scintille dorate lungo il bordo del ventaglio
    const sparks = scene.add.particles(0, 0, TEX.scintilla, {
      speed: { min: 60, max: 160 },
      lifespan: { min: 220, max: 420 },
      scale: { start: 0.9, end: 0 },
      rotate: { min: 0, max: 360 },
      emitting: false,
    });
    sparks.setDepth(user.y + 2);
    const half = Phaser.Math.DegToRad(w.arcDegrees) / 2;
    for (let i = 0; i < 9; i++) {
      const a = angle - half + (2 * half * i) / 8;
      const r = w.range * Phaser.Math.FloatBetween(0.75, 0.95);
      sparks.emitParticleAt(user.x + Math.cos(a) * r, user.y - SWING_HEIGHT + Math.sin(a) * r * GROUND_SQUASH, 1);
    }
    scene.time.delayedCall(500, () => sparks.destroy());

    // danno e impatto
    const hits = combat.hitArc(user, angle, w.range, w.arcDegrees, user.attackDamage());
    for (const h of hits) hitSpark(scene, h.x, h.y - 60, h.y + 2);
    // tremolio solo se c'entra il giocatore vero (non per i bot che si picchiano lontano)
    if (hits.length > 0 && (user.isHuman || hits.some((h) => h.isHuman))) scene.cameras.main.shake(70, 0.003);
  },

  /**
   * Super — Bende del Sarcofago: lancia un fascio di bende.
   * Nemico colpito → chiuso in un sarcofago (non si muove né attacca) e Anubi riceve +1 vita.
   * Compagno colpito → il compagno si cura e anche Anubi si cura.
   */
  useSuper(user, angle, combat) {
    const sup = user.stats.super;
    const p = sup.params;
    const scene = user.scene;
    new Projectile(scene, user.x + Math.cos(angle) * 30, user.y + Math.sin(angle) * 30, {
      owner: user,
      combat,
      angle,
      speed: p.projectileSpeed,
      range: sup.range,
      radius: p.projectileRadius,
      height: 70,
      texture: TEX.rotoloBende,
      drawTrail: drawBandageRibbon,
      onHit: (target, x, y) => {
        hitSpark(scene, x, y - 70, y + 2);
        if (target.kind === 'baule') return; // un baule non è un nemico: le bende si fermano e basta
        if (target.team !== user.team) {
          target.stun?.(p.stunSeconds);
          user.grantExtraLife(p.maxExtraLives, p.reviveHealth);
        } else {
          target.heal?.(p.allyHeal);
          user.heal(p.selfHeal);
        }
      },
    });
  },
};

/** Il fascio di bende: un nastro bianco ondulato con il bordo scuro, dalla mano di Anubi fino al rotolo. */
function drawBandageRibbon(g: Phaser.GameObjects.Graphics, sx: number, sy: number, x: number, y: number, t: number): void {
  const len = Phaser.Math.Distance.Between(sx, sy, x, y);
  if (len < 4) return;
  const nx = -(y - sy) / len;
  const ny = (x - sx) / len;
  const pts: Phaser.Math.Vector2[] = [];
  const n = Math.max(2, Math.floor(len / 16));
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    // l'onda è più ampia in mezzo e ferma alle due estremità
    const wave = Math.sin(k * 10 - t * 30) * 7 * Math.sin(k * Math.PI);
    pts.push(new Phaser.Math.Vector2(sx + (x - sx) * k + nx * wave, sy + (y - sy) * k + ny * wave));
  }
  g.lineStyle(14, 0x14213d, 1).strokePoints(pts);
  g.lineStyle(9, 0xfbf6ea, 1).strokePoints(pts);
  g.lineStyle(2, 0xd9cbb0, 1);
  for (let i = 1; i < pts.length; i += 2) {
    g.lineBetween(pts[i].x - nx * 3, pts[i].y - ny * 3, pts[i].x + nx * 3, pts[i].y + ny * 3);
  }
}
