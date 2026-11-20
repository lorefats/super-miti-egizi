import Phaser from 'phaser';
import { BRIDGE_TILE_WIDTH, TEX } from '../art';
import { DEPTH } from '../config';
import type { GroundKind, MapData, Rect, WaterRect } from '../data/maps';
import { WATER } from '../data/match';
import type { Combat } from '../entities/Combat';
import { createObstacle, type PlacedObstacle } from '../entities/Obstacle';
import { BushPatch } from '../entities/BushPatch';
import { Culler } from '../entities/Culler';
import type { Player } from '../entities/Player';

/** Terreno di ogni zona → disegno da ripetere. */
const GROUND_TEXTURE: Record<GroundKind, string> = {
  sabbia: TEX.sabbia,
  roccia: TEX.terrenoRoccia,
  lastre: TEX.terrenoLastre,
  asfalto: TEX.terrenoAsfalto,
  bazar: TEX.terrenoBazar,
  erba: TEX.terrenoErba,
  oasi: TEX.terrenoOasi,
};

/**
 * Disegna una mappa (terreno, acqua, isolotti, ponti, ostacoli, cespugli) e sa dov'è l'acqua.
 * La usano sia la battaglia sia il Calcio del Nilo.
 */
export class MapView {
  readonly walls: Phaser.Physics.Arcade.StaticGroup;
  readonly bushes: BushPatch[];
  readonly culler = new Culler();
  private readonly tallThings: (PlacedObstacle & { bounds: Phaser.Geom.Rectangle })[] = [];
  private readonly waterTiles: { tile: Phaser.GameObjects.TileSprite; flow: { x: number; y: number } }[];

  constructor(
    scene: Phaser.Scene,
    readonly map: MapData,
    combat: Combat,
  ) {
    scene.physics.world.setBounds(0, 0, map.width, map.height);
    // terreno: ogni zona ha il suo; senza zone, sabbia dappertutto (un solo strato: meno fatica per il telefono)
    const zones = map.zones ?? [];
    if (zones.length === 0) scene.add.tileSprite(0, 0, map.width, map.height, TEX.sabbia).setOrigin(0).setDepth(DEPTH.ground);
    for (const z of zones) {
      scene.add
        .tileSprite(Math.floor(z.x), Math.floor(z.y), Math.ceil(z.w) + 1, Math.ceil(z.h) + 1, GROUND_TEXTURE[z.ground])
        .setOrigin(0)
        .setDepth(DEPTH.ground);
    }
    this.waterTiles = (map.water ?? []).map((w) => {
      const edge = scene.add.graphics().setDepth(DEPTH.ground + 3);
      edge.lineStyle(10, 0xe9d3a0, 0.9).strokeRoundedRect(w.x, w.y, w.w, w.h, 30);
      edge.lineStyle(3, 0x14213d, 0.5).strokeRoundedRect(w.x, w.y, w.w, w.h, 30);
      const tile = scene.add.tileSprite(w.x, w.y, w.w, w.h, TEX.acqua).setOrigin(0).setDepth(DEPTH.ground + 2);
      // l'acqua ferma ondeggia piano; quella del fiume scorre con la corrente
      return { tile, flow: w.flow ? { x: w.flow.x * 0.8, y: w.flow.y * 0.8 } : { x: 22, y: 6 } };
    });
    // isolotti d'erba con la riva di sabbia
    for (const i of map.islands ?? []) {
      const edge = scene.add.graphics().setDepth(DEPTH.ground + 4);
      edge.fillStyle(0xe9d3a0, 1).fillRoundedRect(i.x - 10, i.y - 10, i.w + 20, i.h + 20, 50);
      edge.lineStyle(3, 0x14213d, 0.4).strokeRoundedRect(i.x - 10, i.y - 10, i.w + 20, i.h + 20, 50);
      const grass = scene.add.tileSprite(i.x, i.y, i.w, i.h, TEX.terrenoErba).setOrigin(0).setDepth(DEPTH.ground + 5);
      const shape = scene.make.graphics({}, false).fillRoundedRect(i.x, i.y, i.w, i.h, 42);
      grass.setMask(shape.createGeometryMask());
    }
    // ponti di legno sopra l'acqua (orizzontali se sono più larghi che alti)
    for (const b of map.bridges ?? []) {
      if (b.w > b.h) {
        scene.add
          .tileSprite(b.x + b.w / 2, b.y + b.h / 2, BRIDGE_TILE_WIDTH, b.w, TEX.ponte)
          .setScale(b.h / BRIDGE_TILE_WIDTH, 1)
          .setRotation(Math.PI / 2)
          .setDepth(DEPTH.ground + 6);
      } else {
        scene.add
          .tileSprite(b.x, b.y, BRIDGE_TILE_WIDTH, b.h, TEX.ponte)
          .setOrigin(0)
          .setScale(b.w / BRIDGE_TILE_WIDTH, 1)
          .setDepth(DEPTH.ground + 6);
      }
    }

    this.walls = scene.physics.add.staticGroup();
    combat.walls = this.walls;
    combat.bounds = new Phaser.Geom.Rectangle(0, 0, map.width, map.height);
    for (const o of map.obstacles) {
      const placed = createObstacle(scene, this.walls, o.kind, o.x, o.y);
      if (placed.tall) this.tallThings.push({ ...placed, bounds: placed.image.getBounds() });
      this.culler.add(placed.image);
      for (const e of placed.extras) this.culler.add(e);
    }
    this.bushes = (map.bushes ?? []).map((b) => new BushPatch(scene, b.kind, b.spots));
    for (const b of this.bushes) for (const img of b.images) this.culler.add(img);
  }

  /** Fa scorrere l'acqua e nasconde quello che è fuori dallo schermo. */
  update(dt: number, cam: Phaser.Cameras.Scene2D.Camera): void {
    for (const w of this.waterTiles) {
      w.tile.tilePositionX -= dt * w.flow.x;
      w.tile.tilePositionY -= dt * w.flow.y;
    }
    this.culler.update(cam);
  }

  /** L'acqua in questo punto (null se è asciutto: terra, ponte o isolotto). */
  waterAt(x: number, y: number): WaterRect | null {
    const inside = (r: Rect) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
    const water = (this.map.water ?? []).find(inside);
    if (!water) return null;
    if ((this.map.bridges ?? []).some(inside) || (this.map.islands ?? []).some(inside)) return null;
    return water;
  }

  /** Nell'acqua si va più piano e il fiume trascina (sui ponti e sugli isolotti si è all'asciutto). */
  applyTerrain(f: Player): void {
    const water = this.waterAt(f.x, f.y);
    f.terrainSpeed = water ? WATER.speedFactor : 1;
    if (water?.flow && !f.isUnderground()) f.terrainFlow.set(water.flow.x, water.flow.y);
    else f.terrainFlow.set(0, 0);
  }

  /** Il cespuglio in cui si trova (x, y), oppure null. */
  bushAt(x: number, y: number): BushPatch | null {
    return this.bushes.find((b) => b.contains(x, y)) ?? null;
  }

  /** Il cespuglio di chi guarda diventa trasparente. */
  setSeeThroughBush(b: BushPatch | null): void {
    for (const bush of this.bushes) bush.setSeeThrough(bush === b);
  }

  /** Il cespuglio più vicino entro maxDist (per i bot), oppure null. */
  nearestBush(x: number, y: number, maxDist: number): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestD = maxDist;
    for (const b of this.bushes) {
      const sp = b.nearestSpot(x, y);
      const d = Phaser.Math.Distance.Between(x, y, sp.x, sp.y);
      if (d < bestD) {
        bestD = d;
        best = sp;
      }
    }
    return best;
  }

  /** Gli oggetti alti diventano semitrasparenti quando il giocatore ci passa dietro. */
  updateTallThings(me: { x: number; y: number }, dt: number): void {
    const k = Math.min(1, dt * 10);
    for (const t of this.tallThings) {
      const behind = me.y < t.baseY - 4 && t.bounds.contains(me.x, me.y - 50);
      const target = behind ? 0.45 : 1;
      if (t.image.alpha !== target) {
        t.image.alpha = Math.abs(t.image.alpha - target) < 0.02 ? target : Phaser.Math.Linear(t.image.alpha, target, k);
      }
    }
  }
}
