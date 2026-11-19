import Phaser from 'phaser';
import { HIDEOUT_REVEAL_DISTANCE } from '../data/combat';

/** Come si resta storditi: chiusi nel sarcofago (Anubi) o con le stelline che girano sulla testa. */
export type StunStyle = 'sarcofago' | 'stelle';

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
  stun?(seconds: number, style?: StunStyle): void;
  /** Spinta improvvisa (pixel al secondo) che poi si smorza. Chi non si muove non lo implementa. */
  push?(vx: number, vy: number): void;
  /** Corrente che lo trascina solo per questo fotogramma (es. il risucchio di un tornado). */
  addFlow?(vx: number, vy: number): void;
  /** Scivola per qualche secondo (difficile fermarsi e girare). */
  slip?(seconds: number): void;
  /** Cura una frazione della vita massima. */
  heal?(fraction: number): void;
  /** Cambia la velocità per qualche secondo (0.7 = più lento, 1.3 = più veloce). `name` = da cosa viene. */
  changeSpeed?(name: string, seconds: number, factor: number): void;
  /** Confuso per qualche secondo: si muove a caso. */
  confuse?(seconds: number): void;
  /** Spaventato: scappa lontano dal punto (x, y) per qualche secondo. */
  scare?(x: number, y: number, seconds: number): void;
  /** Cambia la rapidità degli attacchi e della ricarica (0.4 = al rallentatore, 2 = il doppio). */
  changeAttackRate?(name: string, seconds: number, factor: number): void;
  /** Vede solo vicino a sé per qualche secondo (tempesta di sabbia). */
  blind?(seconds: number): void;
  /** Vita rimasta da 0 a 1. */
  healthFraction?(): number;
  /** Mette la vita a una frazione della vita massima (la Bilancia di Maat). */
  setHealthFraction?(f: number): void;
  /** Si ricorda chi l'ha colpito (Thoth copia la sua super). */
  noteAttacker?(from: Attacker): void;
}

/** Cupola che ferma i proiettili dei nemici (super di Iside). */
export interface Shield {
  x: number;
  y: number;
  radius: number;
  team: number;
}

/** Chi attacca: posizione, squadra, e (facoltativo) cosa succede quando fa danno a un nemico, non a un baule (per caricare la super). */
export interface Attacker {
  readonly x: number;
  readonly y: number;
  readonly team: number;
  onDealtDamage?(amount: number): void;
  /** Di quale personaggio è la super che si può copiare da lui (Libro di Thoth). */
  readonly superSource?: string;
}

const targetable = (d: Damageable) => d.isAlive() && (d.isTargetable ? d.isTargetable() : true);

/** Tiene la lista di tutto ciò che si può colpire e risponde alle domande "chi colpisco?". */
export class Combat {
  private readonly list: Damageable[] = [];
  /** Muri e ostacoli della mappa (i proiettili si fermano contro di loro). */
  walls: Phaser.Physics.Arcade.StaticGroup | null = null;
  /** Bordi della mappa (per non saltare o tuffarsi fuori). */
  bounds: Phaser.Geom.Rectangle | null = null;
  /** Cupole che fermano i proiettili. */
  readonly shields: Shield[] = [];

  /** Un proiettile della squadra `team` in (x, y) è fermato da una cupola dei nemici? */
  shieldedAt(x: number, y: number, team: number): Shield | null {
    for (const s of this.shields) {
      if (s.team !== team && Phaser.Math.Distance.Between(x, y, s.x, s.y) < s.radius) return s;
    }
    return null;
  }

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
    seeAll = false,
  ): Damageable | null {
    let best: Damageable | null = null;
    let bestDist = maxDist;
    for (const d of this.list) {
      if (d.team === team || !targetable(d)) continue;
      if (kinds && !kinds.includes(d.kind)) continue;
      const dist = Phaser.Math.Distance.Between(x, y, d.x, d.y) - d.hitRadius;
      if (!seeAll && d.hideout && d.hideout !== viewerHideout && dist > HIDEOUT_REVEAL_DISTANCE) continue;
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
      // i colpi non passano attraverso i muri
      if (this.lineBlocked(from.x, from.y, d.x, d.y)) continue;
      d.takeDamage(damage);
      d.noteAttacker?.(from);
      hit.push(d);
    }
    // la super si carica solo colpendo i nemici: i bauli non contano
    const chargers = hit.filter((d) => d.kind !== 'baule').length;
    if (chargers) from.onDealtDamage?.(damage * chargers);
    return hit;
  }

  /** Fa danno a un bersaglio. Se è un nemico vero (non un baule) carica la super di chi attacca. */
  damage(from: Attacker, target: Damageable, amount: number): void {
    // i compagni di squadra non si fanno male tra loro
    if (target.team === from.team) return;
    target.takeDamage(amount);
    target.noteAttacker?.(from);
    if (target.kind !== 'baule') from.onDealtDamage?.(amount);
  }

  /** Colpisce tutti i nemici dentro una linea dritta (lunga `length`, larga `width`). Restituisce chi è stato colpito. */
  hitLine(from: Attacker, angle: number, length: number, width: number, damage: number): Damageable[] {
    const hit = this.alongLine(from.x, from.y, angle, length, width, from.team).filter(
      (d) => !this.lineBlocked(from.x, from.y, d.x, d.y),
    );
    for (const d of hit) {
      d.takeDamage(damage);
      d.noteAttacker?.(from);
    }
    const chargers = hit.filter((d) => d.kind !== 'baule').length;
    if (chargers) from.onDealtDamage?.(damage * chargers);
    return hit;
  }

  /** Nemici di `team` dentro una linea dritta (senza colpirli). */
  alongLine(x: number, y: number, angle: number, length: number, width: number, team: number): Damageable[] {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const out: Damageable[] = [];
    for (const d of [...this.list]) {
      if (d.team === team || !targetable(d)) continue;
      const dx = d.x - x;
      const dy = d.y - y;
      const along = dx * cos + dy * sin;
      const side = Math.abs(-dx * sin + dy * cos);
      if (along < -d.hitRadius || along > length + d.hitRadius) continue;
      if (side > width / 2 + d.hitRadius) continue;
      out.push(d);
    }
    return out;
  }

  /** Tutto ciò che si può colpire dentro il cerchio (x, y, r) e che passa il filtro. */
  inCircle(x: number, y: number, r: number, filter: (d: Damageable) => boolean = () => true): Damageable[] {
    return this.list.filter(
      (d) => targetable(d) && filter(d) && Phaser.Math.Distance.Between(x, y, d.x, d.y) < r + d.hitRadius,
    );
  }

  /** Il nemico (personaggio) più vicino entro `range` e dentro un cono di `coneDeg` gradi attorno ad `angle`. */
  enemyInCone(x: number, y: number, team: number, angle: number, range: number, coneDeg: number): Damageable | null {
    const half = Phaser.Math.DegToRad(coneDeg) / 2;
    let best: Damageable | null = null;
    let bestDist = range;
    for (const d of this.list) {
      if (d.team === team || d.kind !== 'personaggio' || !targetable(d)) continue;
      const dist = Phaser.Math.Distance.Between(x, y, d.x, d.y);
      if (dist > bestDist) continue;
      const diff = Math.abs(Phaser.Math.Angle.Wrap(Phaser.Math.Angle.Between(x, y, d.x, d.y) - angle));
      if (diff > half + Math.atan2(d.hitRadius, Math.max(1, dist))) continue;
      bestDist = dist;
      best = d;
    }
    return best;
  }

  /** Tra (x1, y1) e (x2, y2) c'è un muro in mezzo? */
  lineBlocked(x1: number, y1: number, x2: number, y2: number): boolean {
    if (!this.walls) return false;
    const line = new Phaser.Geom.Line(x1, y1, x2, y2);
    const rect = new Phaser.Geom.Rectangle();
    for (const child of this.walls.getChildren()) {
      const body = (child as Phaser.GameObjects.Zone).body as Phaser.Physics.Arcade.StaticBody | null;
      if (!body) continue;
      rect.setTo(body.x, body.y, body.width, body.height);
      if (Phaser.Geom.Intersects.LineToRectangle(line, rect)) return true;
    }
    return false;
  }

  /** Il cerchio (x, y, r) tocca un muro o esce dalla mappa? */
  isBlocked(x: number, y: number, r: number): boolean {
    const b = this.bounds;
    if (b && (x - r < b.x || y - r < b.y || x + r > b.right || y + r > b.bottom)) return true;
    if (!this.walls) return false;
    const circle = new Phaser.Geom.Circle(x, y, r);
    for (const child of this.walls.getChildren()) {
      const body = (child as Phaser.GameObjects.Zone).body as Phaser.Physics.Arcade.StaticBody | null;
      if (!body) continue;
      if (Phaser.Geom.Intersects.CircleToRectangle(circle, new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Punto libero dove atterrare andando da (fx, fy) verso (tx, ty): se l'arrivo è dentro un muro,
   * torna indietro un po' alla volta finché trova spazio.
   */
  freeSpot(fx: number, fy: number, tx: number, ty: number, r = 26): { x: number; y: number } {
    const dist = Phaser.Math.Distance.Between(fx, fy, tx, ty);
    const steps = Math.ceil(dist / 20);
    for (let i = 0; i <= steps; i++) {
      const k = 1 - i / Math.max(1, steps);
      const x = fx + (tx - fx) * k;
      const y = fy + (ty - fy) * k;
      if (!this.isBlocked(x, y, r)) return { x, y };
    }
    return { x: fx, y: fy };
  }

  /** Quanto si può andare dritti da (x, y) prima di sbattere contro un muro (al massimo `max`). */
  rayLength(x: number, y: number, angle: number, max: number, r = 8): number {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let d = 20; d < max; d += 20) {
      if (this.isBlocked(x + cos * d, y + sin * d, r)) return Math.max(0, d - 20);
    }
    return max;
  }

  /** Tutti i bersagli (nemici o compagni, ma non `exclude`) che toccano il cerchio (x, y, radius). */
  touchingAll(x: number, y: number, radius: number, exclude: Damageable): Damageable[] {
    return this.list.filter(
      (d) => d !== exclude && targetable(d) && Phaser.Math.Distance.Between(x, y, d.x, d.y) < radius + d.hitRadius,
    );
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
