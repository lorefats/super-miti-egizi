import { NET } from '../data/net';

interface Sample {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Le ultime posizioni arrivate di un amico. Lo si mostra con un piccolo ritardo (NET.interpDelayMs)
 * "a metà strada" tra due posizioni ricevute: così cammina morbido anche se i messaggi arrivano a scatti.
 * Se i messaggi tardano, per un attimo si indovina dove va usando la sua velocità.
 */
export class RemoteMotion {
  private readonly buf: Sample[] = [];
  private readonly out = { x: 0, y: 0, vx: 0, vy: 0 };

  push(x: number, y: number, vx: number, vy: number): void {
    this.buf.push({ t: performance.now(), x, y, vx, vy });
    if (this.buf.length > 30) this.buf.shift();
  }

  /** Dimentica le posizioni vecchie (per esempio quando riappare da un'altra parte). */
  clear(): void {
    this.buf.length = 0;
  }

  get hasData(): boolean {
    return this.buf.length > 0;
  }

  /** Dove mostrarlo adesso (null = non è ancora arrivato niente). */
  sample(now = performance.now()): { x: number; y: number; vx: number; vy: number } | null {
    const b = this.buf;
    if (!b.length) return null;
    const t = now - NET.interpDelayMs;
    const o = this.out;
    if (t <= b[0].t) return Object.assign(o, b[0]);
    for (let i = b.length - 1; i > 0; i--) {
      const a = b[i - 1];
      const c = b[i];
      if (t >= a.t && t <= c.t) {
        const k = c.t > a.t ? (t - a.t) / (c.t - a.t) : 1;
        o.x = a.x + (c.x - a.x) * k;
        o.y = a.y + (c.y - a.y) * k;
        o.vx = c.vx;
        o.vy = c.vy;
        return o;
      }
    }
    // più avanti dell'ultima posizione: si prosegue un pochino con la sua velocità, poi si aspetta fermi
    const last = b[b.length - 1];
    const ahead = Math.min(t - last.t, NET.maxExtrapolateMs) / 1000;
    const stale = t - last.t > NET.maxExtrapolateMs;
    o.x = last.x + last.vx * ahead;
    o.y = last.y + last.vy * ahead;
    o.vx = stale ? 0 : last.vx;
    o.vy = stale ? 0 : last.vy;
    return o;
  }
}
