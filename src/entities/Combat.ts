import Phaser from 'phaser';

/** Qualunque cosa possa essere colpita: personaggi, bersagli, (in futuro) bauli e muri. */
export interface Damageable {
  readonly x: number;
  readonly y: number;
  /** Raggio "di corpo" in pixel, a livello dei piedi. */
  readonly hitRadius: number;
  /** Squadra: chi è della stessa squadra non si colpisce. */
  readonly team: number;
  /** È il giocatore vero? (serve per effetti come il tremolio dello schermo) */
  readonly isHuman?: boolean;
  isAlive(): boolean;
  takeDamage(amount: number): void;
}

/** Tiene la lista di tutto ciò che si può colpire e risponde alle domande "chi colpisco?". */
export class Combat {
  private readonly list: Damageable[] = [];

  add(d: Damageable): void {
    this.list.push(d);
  }

  remove(d: Damageable): void {
    const i = this.list.indexOf(d);
    if (i >= 0) this.list.splice(i, 1);
  }

  /** Nemico vivo più vicino entro maxDist, oppure null. */
  nearestEnemy(x: number, y: number, team: number, maxDist: number): Damageable | null {
    let best: Damageable | null = null;
    let bestDist = maxDist;
    for (const d of this.list) {
      if (d.team === team || !d.isAlive()) continue;
      const dist = Phaser.Math.Distance.Between(x, y, d.x, d.y) - d.hitRadius;
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  /** Colpisce tutti i nemici dentro un ventaglio. Restituisce chi è stato colpito. */
  hitArc(
    from: { x: number; y: number; team: number },
    angle: number,
    range: number,
    arcDegrees: number,
    damage: number,
  ): Damageable[] {
    const halfArc = Phaser.Math.DegToRad(arcDegrees) / 2;
    const hit: Damageable[] = [];
    for (const d of [...this.list]) {
      if (d.team === from.team || !d.isAlive()) continue;
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
    return hit;
  }
}
