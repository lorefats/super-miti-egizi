import { TEX } from '../art';
import { groundRing, hitSpark, isOnScreen, waterSplash } from '../art/effects';
import { DEPTH } from '../config';
import { FieldEffect } from '../entities/FieldEffect';
import type { CharacterModule } from './types';

/** Altezza della mano da cui parte il getto, e altezza a cui arriva. */
const JET_START_HEIGHT = 66;
const JET_END_HEIGHT = 34;
/** Altezza della nuvola sopra il terreno. */
const CLOUD_HEIGHT = 230;
/** Tick della pioggia (secondi): ogni volta cura i compagni e fa scivolare i nemici. */
const RAIN_TICK = 0.5;

/** Tefnut — Getto d'Acqua: getto che colpisce in linea e spinge indietro i nemici. */
export const tefnut: CharacterModule = {
  id: 'tefnut',
  swingSeconds: 0.08,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const scene = user.scene;
    const length = combat.rayLength(user.x, user.y, angle, w.range);
    const hits = combat.hitLine(user, angle, length, w.aimWidth, user.attackDamage());
    for (const h of hits) {
      h.push?.(Math.cos(angle) * w.params.push, Math.sin(angle) * w.params.push);
      hitSpark(scene, h.x, h.y - 50, h.y + 2);
    }
    if (!isOnScreen(scene, user.x, user.y)) return;

    // il getto si allunga in un attimo e poi si ritira
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const sx = user.x + cos * 30;
    const sy = user.y + sin * 30 - JET_START_HEIGHT;
    const ex = user.x + cos * length;
    const ey = user.y + sin * length - JET_END_HEIGHT;
    const g = scene.add.graphics().setDepth(Math.max(user.y, user.y + sin * length) + 1);
    const state = { head: 0, tail: 0 };
    const draw = () => {
      g.clear();
      const ax = sx + (ex - sx) * state.tail;
      const ay = sy + (ey - sy) * state.tail;
      const bx = sx + (ex - sx) * state.head;
      const by = sy + (ey - sy) * state.head;
      g.lineStyle(20, 0x14213d, 0.85).lineBetween(ax, ay, bx, by);
      g.lineStyle(14, 0x00a6cc, 1).lineBetween(ax, ay, bx, by);
      g.lineStyle(5, 0xd8faff, 1).lineBetween(ax, ay - 3, bx, by - 3);
    };
    scene.tweens.add({ targets: state, head: 1, duration: 110, ease: 'Quad.out', onUpdate: draw });
    scene.tweens.add({
      targets: state,
      tail: 1,
      delay: 120,
      duration: 140,
      ease: 'Quad.in',
      onUpdate: draw,
      onComplete: () => g.destroy(),
    });
    scene.time.delayedCall(110, () => waterSplash(scene, ex, ey + JET_END_HEIGHT, 8, user.y + sin * length + 2));
  },

  /**
   * Super — Pioggia Sacra: una nuvola fa piovere dove ha mirato. I compagni sotto la pioggia (lei compresa)
   * si curano, i nemici scivolano (difficile fermarsi e girare).
   */
  useSuper(user, angle, combat, distance) {
    const sup = user.stats.super;
    const p = sup.params;
    const scene = user.scene;
    const cx = user.x + Math.cos(angle) * distance;
    const cy = user.y + Math.sin(angle) * distance;
    const r = p.radius;

    // pozzanghera sul terreno, nuvola in alto, gocce che cadono
    const puddle = scene.add.graphics({ x: cx, y: cy }).setDepth(-960).setScale(1, 0.62).setAlpha(0);
    puddle.fillStyle(0x2a9dcc, 0.28).fillCircle(0, 0, r);
    puddle.lineStyle(5, 0x8eebff, 0.8).strokeCircle(0, 0, r);
    const cloud = scene.add.image(cx, cy - 300, TEX.nuvola).setDepth(DEPTH.overhead - 20).setScale(0.3).setAlpha(0);
    const rain = scene.add.graphics().setDepth(DEPTH.overhead - 21);
    scene.tweens.add({ targets: puddle, alpha: 1, duration: 400 });
    scene.tweens.add({ targets: cloud, scale: (r * 1.5) / 280, alpha: 1, y: cy - CLOUD_HEIGHT, duration: 450, ease: 'Back.out' });
    groundRing(scene, cx, cy, r, 0x8eebff, 500);

    const drops = Array.from({ length: 26 }, () => ({ x: 0, y: 0, h: Math.random() }));
    const placeDrop = (d: { x: number; y: number; h: number }) => {
      const a = Math.random() * Math.PI * 2;
      const k = Math.sqrt(Math.random()) * r * 0.9;
      d.x = cx + Math.cos(a) * k;
      d.y = cy + Math.sin(a) * k * 0.62;
    };
    drops.forEach(placeDrop);
    let tick = 0;
    const fx = new FieldEffect(scene, cx, cy, p.seconds, (f, dt) => {
      // pioggia: righe azzurre che cadono dalla nuvola al terreno
      rain.clear().lineStyle(3, 0x8eebff, 0.85);
      for (const d of drops) {
        d.h -= dt * 2.6;
        if (d.h <= 0) {
          d.h += 1;
          placeDrop(d);
        }
        const top = d.y - (CLOUD_HEIGHT - 30) * d.h;
        rain.lineBetween(d.x, top, d.x - 3, top + 22);
      }
      cloud.y = cy - CLOUD_HEIGHT + Math.sin(f.age * 2) * 5;

      tick -= dt;
      if (tick > 0) return;
      tick = RAIN_TICK;
      for (const t of combat.inCircle(cx, cy, r, (o) => o.kind === 'personaggio')) {
        if (t.team === user.team) t.heal?.(p.healPerSecond * RAIN_TICK);
        else t.slip?.(p.slipSeconds);
      }
    });
    fx.own(puddle, cloud, rain);
  },
};
