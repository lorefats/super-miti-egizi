import Phaser from 'phaser';
import { TEX } from '../art';
import { hitSpark, isOnScreen } from '../art/effects';
import { FieldEffect } from '../entities/FieldEffect';
import { Projectile } from '../entities/Projectile';
import type { CharacterModule } from './types';

/** Altezza da terra a cui vola l'onda sonora. */
const WAVE_HEIGHT = 60;
/** Ogni quanto la musica fa effetto (secondi). */
const DANCE_TICK = 0.5;
/** Colori delle note musicali. */
const NOTE_COLORS = [0xff8fab, 0xffd166, 0x7cf29a, 0x8ecae6, 0xc77dff];

/** Una nota colorata che sale e svanisce. */
function floatingNote(scene: Phaser.Scene, x: number, y: number): void {
  if (!isOnScreen(scene, x, y)) return;
  const n = scene.add
    .image(x + Phaser.Math.Between(-20, 20), y, TEX.nota)
    .setTint(Phaser.Utils.Array.GetRandom(NOTE_COLORS))
    .setDepth(y + 200)
    .setScale(0.6);
  scene.tweens.add({
    targets: n,
    y: y - Phaser.Math.Between(50, 90),
    x: n.x + Phaser.Math.Between(-25, 25),
    scale: 1,
    angle: Phaser.Math.Between(-30, 30),
    alpha: { from: 1, to: 0 },
    duration: 800,
    onComplete: () => n.destroy(),
  });
}

/** Hathor — Sistro Sonoro: onde sonore che rimbalzano sui muri. */
export const hathor: CharacterModule = {
  id: 'hathor',
  swingSeconds: 0.08,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const p = w.params;
    const scene = user.scene;
    const base = user.attackDamage();
    new Projectile(scene, user.x + Math.cos(angle) * 30, user.y + Math.sin(angle) * 30, {
      owner: user,
      combat,
      angle,
      speed: p.speed,
      range: w.range,
      radius: p.radius,
      height: WAVE_HEIGHT,
      texture: TEX.ondaSonora,
      spin: 0,
      bounces: p.bounces,
      onHit: (target, x, y) => {
        if (target.team === user.team) return;
        combat.damage(user, target, base);
        hitSpark(scene, x, y - WAVE_HEIGHT, y + 2);
      },
    });
    floatingNote(scene, user.x + Math.cos(angle) * 40, user.y - 110);
  },

  /**
   * Super — Danza della Gioia: musica magica attorno a lei per qualche secondo.
   * I compagni vicini (lei compresa) corrono più veloci e si curano, i nemici vicini sono confusi.
   */
  useSuper(user, _angle, combat) {
    const p = user.stats.super.params;
    const scene = user.scene;
    const r = p.radius;
    // cerchio rosa di musica attorno a lei (sul terreno, in prospettiva)
    const ring = scene.add.graphics().setDepth(-950).setScale(1, 0.62);
    if (user.isHuman) scene.cameras.main.flash(200, 255, 200, 220);
    let tick = 0;
    new FieldEffect(
      scene,
      user.x,
      user.y,
      p.seconds,
      (f, dt) => {
        if (!user.isAlive()) {
          f.finish();
          return;
        }
        ring.setPosition(user.x, user.y);
        ring.clear();
        const pulse = 1 + Math.sin(f.age * 8) * 0.03;
        ring.fillStyle(0xff8fab, 0.15).fillCircle(0, 0, r * pulse);
        ring.lineStyle(5, 0xff8fab, 0.8).strokeCircle(0, 0, r * pulse);
        ring.lineStyle(3, 0xffffff, 0.6).strokeCircle(0, 0, r * 0.6 * pulse);
        // la dea balla: saltella a tempo
        if (Math.floor(f.age * 6) !== Math.floor((f.age - dt) * 6)) floatingNote(scene, user.x, user.y - 130);

        tick -= dt;
        if (tick > 0) return;
        tick = DANCE_TICK;
        for (const t of combat.inCircle(user.x, user.y, r, (o) => o.kind === 'personaggio')) {
          if (t.team === user.team) {
            t.changeSpeed?.('danza', DANCE_TICK + 0.15, p.speedFactor);
            t.heal?.(p.healPerSecond * DANCE_TICK);
          } else {
            t.confuse?.(DANCE_TICK + 0.15);
            floatingNote(scene, t.x, t.y - 150);
          }
        }
      },
      () => ring.destroy(),
    );
  },
};
