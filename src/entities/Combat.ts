import Phaser from 'phaser';
import { HIDEOUT_REVEAL_DISTANCE } from '../data/combat';

/** Che cos'è: un personaggio, un baule del tesoro, un bersaglio d'allenamento. */
export type DamageableKind = 'personaggio' | 'baule' | 'bersaglio';

/** Qualunque cosa possa essere colpita: personaggi, bersagli, bauli. */
export interface Damageable {
  readonly kind: DamageableKind;
  readonly x: number;
  readonly y: number;
  /** Raggio "di corpo" in pixel, a livello dei piedi. */
  readonly hitRadius: number;
  /** Squadra: chi è della stessa squadra non si colpisce. */
  readonly team: number;
  /** È il giocatore vero? (serve per effetti come il tremolio dello schermo) */
  readonly isHuman?: boolean;
  /** Nascondiglio in cui si trova (es. una piramide grande), oppure null. */
  readonly hideout?: object | null;
  isAlive(): boolean;
  takeDamage(amount: number): void;
  /** Si può colpire adesso? (false per esempio mentre resuscita) */
  isTargetable?(): boolean;
  /** Ferma per qualche secondo (non si muove né attacca). Chi non può essere fermato non lo implementa. */
  stun?(seconds: number): void;
  /** Cura una frazione della vita massima. */
  heal?(fraction: number): void;
}

/** Chi attacca: posizione, squadra, e (facoltativo) cosa succede quando fa danno a un nemico, non a un baule (per caricare la super). */
export interface Attacker {
  readonly x: number;
  readonly y: number;
  readonly team: number;
  onDealtDamage?(amount: number): void;
}

const targetable = (d: Damageable) => d.isAlive() && (d.isTargetable ? d.isTargetable() : true);

/** Tiene la lista di tutto ciò che si può colpire e risponde alle domande "chi colpisco?". */
export class Combat {
  private readonly list: Damageable[] = [];
  /** Muri e ostacoli della mappa (i proiettili si fermano contro di loro). */
  walls: Phaser.Physics.Arcade.StaticGroup | null = null;

  add(d: Damageable): void {
    this.list.push(d);
  }

  remove(d: Damageable): void {
    const i = this.list.indexOf(d);
    if (i >= 0) this.list.splice(i, 1);
  }

  /**
   * Nemico vivo più vicino entro maxDist, oppure null.
   * Chi è in un nascondiglio diverso dal nostro si vede solo da molto vicino.
   */
  nearestEnemy(
    x: number,
    y: number,
    team: number,
    maxDist: number,
    viewerHideout: object | null = null,
    kinds?: DamageableKind[],
  ): Damageable | null {
    let best: Damageable | null = null;
    let bestDist = maxDist;
    for (const d of this.list) {
      if (d.team === team || !targetable(d)) continue;
      if (kinds && !kinds.includes(d.kind)) continue;
      const dist = Phaser.Math.Distance.Between(x, y, d.x, d.y) - d.hitRadius;
      if (d.hideout && d.hideout !== viewerHideout && dist > HIDEOUT_REVEAL_DISTANCE) continue;
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  /** Colpisce tutti i nemici dentro un ventaglio. Restituisce chi è stato colpito. */
  hitArc(
    from: Attacker,
    angle: number,
    range: number,
    arcDegrees: number,
    damage: number,
  ): Damageable[] {
    const halfArc = Phaser.Math.DegToRad(arcDegrees) / 2;
    const hit: Damageable[] = [];
    for (const d of [...this.list]) {
      if (d.team === from.team || !targetable(d)) continue;
      const dist = Phaser.Math.Distance.Between(from.x, from.y, d.x, d.y);
      if (dist - d.hitRadius > range) continue;
      // chi è attaccato al personaggio viene colpito comunque; altrimenti controlla l'angolo (con un po' di tolleranza per la sua grandezza)
      if (dist > d.hitRadius) {
        const diff = Math.abs(Phaser.Math.Angle.Wrap(Phaser.Math.Angle.Between(from.x, from.y, d.x, d.y) - angle));
        const tolerance = Math.atan2(d.hitRadius, dist);
        if (diff > halfArc + tolerance) continue;
      }
      d.takeDamage(damage);
      hit.push(d);
    }
    // la super si carica solo colpendo i nemici: i bauli non contano
    const chargers = hit.filter((d) => d.kind !== 'baule').length;
    if (chargers) from.onDealtDamage?.(damage * chargers);
    return hit;
  }

  /** Il primo bersaglio (nemico o compagno, ma non `exclude`) che tocca il cerchio (x, y, radius). */
  touching(x: number, y: number, radius: number, exclude: Damageable): Damageable | null {
    for (const d of this.list) {
      if (d === exclude || !targetable(d)) continue;
      if (Phaser.Math.Distance.Between(x, y, d.x, d.y) < radius + d.hitRadius) return d;
    }
    return null;
  }
}
