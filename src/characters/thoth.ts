import Phaser from 'phaser';
import { TEX } from '../art';
import { groundRing, hitSpark, isOnScreen } from '../art/effects';
import { DEPTH } from '../config';
import { Projectile } from '../entities/Projectile';
import type { Player } from '../entities/Player';
import type { CharacterModule } from './types';

/** Altezza da terra a cui volano i geroglifici. */
const GLYPH_HEIGHT = 66;
const GLYPHS = [TEX.geroglifico0, TEX.geroglifico1, TEX.geroglifico2];

/** Un geroglifico che vola dritto. */
function shootGlyph(user: Player, angle: number, index: number, damage: number, range: number): void {
  const p = user.stats.weapon.params;
  const scene = user.scene;
  const combat = user.combat;
  new Projectile(scene, user.x + Math.cos(angle) * 34, user.y + Math.sin(angle) * 34, {
    owner: user,
    combat,
    angle,
    speed: p.speed,
    range,
    radius: p.radius,
    height: GLYPH_HEIGHT,
    texture: GLYPHS[index % GLYPHS.length],
    spin: 0,
    onHit: (target, x, y) => {
      if (target.team === user.team) return;
      combat.damage(user, target, damage);
      hitSpark(scene, x, y - GLYPH_HEIGHT, y + 2);
    },
  });
}

/**
 * Un geroglifico gigante d'oro disegnato per terra in (x, y): compare, brilla e poi si spegne.
 * Resta `seconds` secondi (il tempo che Thoth ci "salti dentro").
 */
function groundGlyph(scene: Phaser.Scene, x: number, y: number, seconds: number): void {
  if (!isOnScreen(scene, x, y)) return;
  const glow = scene.add.image(x, y, TEX.bagliore).setDepth(DEPTH.groundMarks + 1).setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD);
  glow.setScale(0.2, 0.12).setAlpha(0.9);
  const glyph = scene.add.image(x, y, TEX.geroglifico0).setDepth(DEPTH.groundMarks + 2).setScale(0.5, 0.3);
  scene.tweens.add({ targets: glow, scaleX: 2, scaleY: 1.2, duration: seconds * 1000, ease: 'Quad.out' });
  scene.tweens.add({ targets: glyph, scaleX: 3.4, scaleY: 2.1, duration: seconds * 1000 * 0.6, ease: 'Back.out' });
  scene.tweens.add({
    targets: [glow, glyph],
    alpha: 0,
    delay: seconds * 1000 + 150,
    duration: 350,
    onComplete: () => {
      glow.destroy();
      glyph.destroy();
    },
  });
}

/** Thoth si dissolve (o ricompare) in una pioggia di piccoli geroglifici dorati. */
function glyphPuff(scene: Phaser.Scene, x: number, y: number): void {
  if (!isOnScreen(scene, x, y)) return;
  const puff = scene.add.particles(x, y - 60, TEX.geroglifico1, {
    speed: { min: 80, max: 220 },
    lifespan: { min: 300, max: 520 },
    scale: { start: 0.7, end: 0 },
    rotate: { min: -40, max: 40 },
    alpha: { start: 1, end: 0 },
    emitting: false,
  });
  puff.setDepth(y + 5);
  puff.explode(10);
  scene.time.delayedCall(650, () => puff.destroy());
}

/** Thoth — Raffica di Geroglifici: scrive in aria 3 geroglifici che partono uno dopo l'altro. */
export const thoth: CharacterModule = {
  id: 'thoth',
  swingSeconds: 0.08,

  attack(user, angle) {
    const w = user.stats.weapon;
    const damage = user.attackDamage();
    shootGlyph(user, angle, 0, damage, w.range);
    for (let i = 1; i < w.params.glyphs; i++) {
      user.scene.time.delayedCall(w.params.gapSeconds * 1000 * i, () => {
        if (user.canAct()) shootGlyph(user, angle, i, damage, w.range);
      });
    }
  },

  /**
   * Super — Salto del Geroglifico: scrive un grande geroglifico d'oro per terra dove mira,
   * sparisce e ricompare dentro. Il geroglifico esplode: danno e stordimento a chi è vicino,
   * poi altri geroglifici volano via tutto attorno.
   */
  useSuper(user, angle, combat, distance) {
    const sup = user.stats.super;
    const p = sup.params;
    const scene = user.scene;
    const d = Math.min(distance, sup.range);
    const spot = combat.freeSpot(user.x, user.y, user.x + Math.cos(angle) * d, user.y + Math.sin(angle) * d);
    groundGlyph(scene, spot.x, spot.y, p.writeSeconds);
    scene.time.delayedCall(p.writeSeconds * 1000, () => {
      if (!user.canAct()) return;
      glyphPuff(scene, user.x, user.y);
      user.teleportTo(spot.x, spot.y);
      glyphPuff(scene, spot.x, spot.y);
      groundRing(scene, spot.x, spot.y, p.burstRadius, 0xffd27a);
      const near = combat.inCircle(spot.x, spot.y, p.burstRadius, (t) => t.team !== user.team);
      const burst = user.scaledDamage(p.burstDamage);
      for (const t of near) {
        combat.damage(user, t, burst);
        if (t.kind !== 'baule') t.stun?.(p.stunSeconds, 'stelle');
        hitSpark(scene, t.x, t.y - 60, t.y + 2);
      }
      const ring = user.scaledDamage(p.ringDamage);
      for (let i = 0; i < p.ringGlyphs; i++) {
        shootGlyph(user, (i / p.ringGlyphs) * Math.PI * 2, i, ring, p.ringRange);
      }
      if (user.isHuman || near.some((h) => h.isHuman)) scene.cameras.main.shake(120, 0.005);
    });
  },
};
