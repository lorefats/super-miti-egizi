import Phaser from 'phaser';
import { TEX } from '../art';
import { groundRing, hitSpark, isOnScreen } from '../art/effects';
import { FieldEffect } from '../entities/FieldEffect';
import type { Player } from '../entities/Player';
import type { CharacterModule } from './types';

/** Altezza da terra da cui esce il fuoco (la bocca). */
const MOUTH_HEIGHT = 110;
const FIRE_COLORS = [0xd62828, 0xff7b1c, 0xffd166];

/** Una fiammata: colpisce a ventaglio stretto e sputa lingue di fuoco. */
function burst(user: Player, angle: number): void {
  const w = user.stats.weapon;
  const scene = user.scene;
  const hits = user.combat.hitArc(user, angle, w.range, w.arcDegrees, user.attackDamage());
  for (const h of hits) hitSpark(scene, h.x, h.y - 60, h.y + 2);
  if (!isOnScreen(scene, user.x, user.y)) return;
  const deg = Phaser.Math.RadToDeg(angle);
  const fire = scene.add.particles(user.x + Math.cos(angle) * 30, user.y - MOUTH_HEIGHT * 0.55 + Math.sin(angle) * 20, TEX.fiamma, {
    speed: { min: w.range * 2.2, max: w.range * 3 },
    angle: { min: deg - w.arcDegrees / 2, max: deg + w.arcDegrees / 2 },
    scale: { start: 0.6, end: 1.5 },
    alpha: { start: 1, end: 0 },
    rotate: { min: -30, max: 30 },
    tint: FIRE_COLORS,
    lifespan: { min: 250, max: 340 },
    emitting: false,
  });
  fire.setDepth(user.y + 2);
  fire.explode(8);
  scene.time.delayedCall(450, () => fire.destroy());
}

/** Sekhmet — Soffio Ardente: lanciafiamme a corto raggio (tre fiammate di fila). */
export const sekhmet: CharacterModule = {
  id: 'sekhmet',
  swingSeconds: 0.06,

  attack(user, angle) {
    const p = user.stats.weapon.params;
    burst(user, angle);
    for (let i = 1; i < p.bursts; i++) {
      user.scene.time.delayedCall(p.gapSeconds * 1000 * i, () => {
        if (user.canAct()) burst(user, angle);
      });
    }
  },

  /** Super — Furia della Leonessa: ruggito che fa scappare i nemici vicini, poi per qualche secondo attacca il doppio più veloce. */
  useSuper(user, _angle, combat) {
    const p = user.stats.super.params;
    const scene = user.scene;
    const scared = combat.inCircle(user.x, user.y, p.roarRadius, (t) => t.team !== user.team && t.kind === 'personaggio');
    for (const t of scared) t.scare?.(user.x, user.y, p.fearSeconds);
    user.changeAttackRate('furia', p.furySeconds, p.furyRate);

    // ruggito: anelli che si allargano e lo schermo che trema
    for (let i = 0; i < 3; i++) {
      scene.time.delayedCall(i * 120, () => groundRing(scene, user.x, user.y, p.roarRadius * (0.6 + i * 0.2), 0xff7b1c, 450));
    }
    if (user.isHuman || scared.some((t) => t.isHuman)) scene.cameras.main.shake(300, 0.008);

    // criniera di fuoco finché dura la furia
    const aura = scene.add.particles(0, 0, TEX.fiamma, {
      speed: { min: 40, max: 90 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.7, end: 0.1 },
      alpha: { start: 0.9, end: 0 },
      tint: FIRE_COLORS,
      lifespan: { min: 300, max: 500 },
      frequency: 45,
      emitZone: { type: 'random', source: new Phaser.Geom.Ellipse(0, 0, 50, 30), quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
    });
    new FieldEffect(
      scene,
      user.x,
      user.y,
      p.furySeconds,
      (f) => {
        aura.setPosition(user.x, user.y - 120).setDepth(user.y + 3);
        if (!user.isAlive()) f.finish();
      },
      () => {
        aura.stop();
        scene.time.delayedCall(600, () => aura.destroy());
      },
    );
  },
};
