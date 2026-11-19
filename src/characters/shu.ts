import Phaser from 'phaser';
import { TEX } from '../art';
import { hitSpark, isOnScreen } from '../art/effects';
import { FieldEffect } from '../entities/FieldEffect';
import type { CharacterModule } from './types';

/** Schiacciamento verticale degli effetti a terra (prospettiva 2.5D). */
const GROUND_SQUASH = 0.62;
/** Altezza da terra a cui passa il vento. */
const WIND_HEIGHT = 50;
/** Ogni quanto il tornado fa danno a chi è dentro (secondi). */
const TORNADO_TICK = 0.35;

/** Shu — Folata: soffio di vento a ventaglio che spinge indietro i nemici. */
export const shu: CharacterModule = {
  id: 'shu',
  swingSeconds: 0.09,

  attack(user, angle, combat) {
    const w = user.stats.weapon;
    const scene = user.scene;
    const hits = combat.hitArc(user, angle, w.range, w.arcDegrees, user.attackDamage());
    for (const h of hits) {
      const a = Phaser.Math.Angle.Between(user.x, user.y, h.x, h.y);
      h.push?.(Math.cos(a) * w.params.push, Math.sin(a) * w.params.push);
      hitSpark(scene, h.x, h.y - 60, h.y + 2);
    }
    if (!isOnScreen(scene, user.x, user.y)) return;

    // tre archi di vento che corrono in avanti, disegnati "sulla sabbia" in prospettiva
    const holder = scene.add.container(user.x, user.y - WIND_HEIGHT).setScale(1, GROUND_SQUASH).setDepth(user.y + 1);
    const localAngle = Math.atan2(Math.sin(angle) / GROUND_SQUASH, Math.cos(angle));
    const half = Phaser.Math.DegToRad(w.arcDegrees) / 2;
    for (let i = 0; i < 3; i++) {
      const g = scene.add.graphics();
      const r = 40 + i * 18;
      g.lineStyle(9, 0x14213d, 0.5);
      g.beginPath().arc(0, 0, r, localAngle - half * 0.8, localAngle + half * 0.8).strokePath();
      g.lineStyle(5, 0xffffff, 0.95);
      g.beginPath().arc(0, 0, r, localAngle - half * 0.8, localAngle + half * 0.8).strokePath();
      g.setAlpha(0);
      holder.add(g);
      scene.tweens.add({
        targets: g,
        scale: w.range / r,
        alpha: { from: 1, to: 0 },
        delay: i * 40,
        duration: 260,
        ease: 'Quad.out',
      });
    }
    scene.time.delayedCall(420, () => holder.destroy());

    // piumette portate dal vento
    const deg = Phaser.Math.RadToDeg(angle);
    const feathers = scene.add.particles(user.x + Math.cos(angle) * 30, user.y + Math.sin(angle) * 30 - WIND_HEIGHT, TEX.piumetta, {
      speed: { min: 380, max: 620 },
      angle: { min: deg - 18, max: deg + 18 },
      rotate: { start: 0, end: 360 },
      scale: { start: 0.9, end: 0.4 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 450 },
      emitting: false,
    });
    feathers.setDepth(user.y + 2);
    feathers.explode(5);
    scene.time.delayedCall(500, () => feathers.destroy());
  },

  /** Super — Tornado: un tornado che avanza lento e risucchia i nemici vicini facendoli girare. */
  useSuper(user, angle, combat) {
    const sup = user.stats.super;
    const p = sup.params;
    const scene = user.scene;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const pos = new Phaser.Math.Vector2(user.x + cos * 60, user.y + sin * 60);
    const seconds = sup.range / p.speed;
    const bounds = combat.bounds;

    const shadow = scene.add.image(pos.x, pos.y, TEX.ombra).setScale(2.2, 1.6).setAlpha(0.6);
    const funnel = scene.add.image(pos.x, pos.y + 6, TEX.tornado).setOrigin(0.5, 1).setScale(0.2);
    scene.tweens.add({ targets: funnel, scale: 1, duration: 300, ease: 'Back.out' });
    const dust = scene.add.particles(0, 0, TEX.granello, {
      speed: { min: 60, max: 140 },
      lifespan: { min: 300, max: 600 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 0.9, end: 0 },
      frequency: 30,
      emitZone: { type: 'random', source: new Phaser.Geom.Ellipse(0, 0, 120, 40), quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
    });

    let tick = 0;
    const fx = new FieldEffect(scene, pos.x, pos.y, seconds, (f, dt) => {
      // avanza (fermandosi al bordo della mappa) e ondeggia
      pos.x += cos * p.speed * dt;
      pos.y += sin * p.speed * dt;
      if (bounds) {
        pos.x = Phaser.Math.Clamp(pos.x, bounds.x + 40, bounds.right - 40);
        pos.y = Phaser.Math.Clamp(pos.y, bounds.y + 40, bounds.bottom - 40);
      }
      const wobble = Math.sin(f.age * 9) * 8;
      funnel.setPosition(pos.x + wobble, pos.y + 6).setDepth(pos.y + 2);
      funnel.setFlipX(Math.floor(f.age * 12) % 2 === 0);
      funnel.scaleX = (funnel.flipX ? 1 : 0.94) * Math.min(1, f.age * 4 + 0.2);
      shadow.setPosition(pos.x, pos.y).setDepth(pos.y - 2);
      dust.setPosition(pos.x, pos.y).setDepth(pos.y + 3);

      // risucchio: verso il centro e di lato (così girano attorno al tornado)
      const pulled = combat.inCircle(pos.x, pos.y, p.pullRadius, (t) => t.team !== user.team && t.kind === 'personaggio');
      for (const t of pulled) {
        const dx = pos.x - t.x;
        const dy = pos.y - t.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        t.addFlow?.((dx / len) * p.pull - (dy / len) * p.spin, (dy / len) * p.pull + (dx / len) * p.spin);
      }
      tick -= dt;
      if (tick <= 0) {
        tick = TORNADO_TICK;
        for (const t of combat.inCircle(pos.x, pos.y, p.hitRadius, (o) => o.team !== user.team)) {
          combat.damage(user, t, user.scaledDamage(p.damagePerSecond * TORNADO_TICK));
        }
      }
    });
    fx.own(funnel, shadow, dust);
  },
};
