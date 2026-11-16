import Phaser from 'phaser';
import { TEX } from '../art';
import { DEPTH } from '../config';

/** Come si comporta un tipo di oggetto della mappa. */
interface ObstacleType {
  texture: string;
  /** "impronta" a terra che blocca il passaggio (larghezza, altezza), misurata dalla base */
  footW: number;
  footH: number;
  /** distanza tra il fondo del disegno e la base vera (ombra sotto) */
  bottomPad: number;
  /** oggetto alto: diventa semitrasparente quando il giocatore ci passa dietro */
  tall?: boolean;
  /** decorazione piatta sul terreno (tappeti, dune): non blocca e sta sotto a tutti */
  flat?: boolean;
  /** ingrandimento del disegno */
  scale?: number;
  /** torcia: aggiunge una luce che tremola */
  flame?: { x: number; y: number };
}

const OBSTACLE_TYPES = {
  blocco: { texture: TEX.blocco, footW: 92, footH: 50, bottomPad: 10 },
  bloccoLungo: { texture: TEX.bloccoLungo, footW: 192, footH: 50, bottomPad: 10 },
  piramide: { texture: TEX.piramide, footW: 360, footH: 70, bottomPad: 22, tall: true },
  piramideAlta: { texture: TEX.piramide, footW: 486, footH: 95, bottomPad: 30, tall: true, scale: 1.35 },
  sfinge: { texture: TEX.sfinge, footW: 330, footH: 70, bottomPad: 8, tall: true },
  colonna: { texture: TEX.colonna, footW: 60, footH: 32, bottomPad: 8, tall: true },
  obelisco: { texture: TEX.obelisco, footW: 58, footH: 30, bottomPad: 8, tall: true },
  statua: { texture: TEX.statua, footW: 112, footH: 50, bottomPad: 8, tall: true },
  muroTempio: { texture: TEX.muroTempio, footW: 252, footH: 44, bottomPad: 6, tall: true },
  bloccoTempio: { texture: TEX.bloccoTempio, footW: 56, footH: 40, bottomPad: 4 },
  rupeTomba: { texture: TEX.rupeTomba, footW: 306, footH: 80, bottomPad: 10, tall: true },
  masso: { texture: TEX.masso, footW: 100, footH: 40, bottomPad: 8 },
  torciaPalo: { texture: TEX.torciaPalo, footW: 18, footH: 12, bottomPad: 6, flame: { x: 0, y: -100 } },
  sarcofago: { texture: TEX.sarcofago, footW: 150, footH: 44, bottomPad: 12 },
  feluca: { texture: TEX.feluca, footW: 200, footH: 50, bottomPad: 20, tall: true },
  bancarella0: { texture: TEX.bancarella0, footW: 190, footH: 48, bottomPad: 8, tall: true },
  bancarella1: { texture: TEX.bancarella1, footW: 190, footH: 48, bottomPad: 8, tall: true },
  bancarella2: { texture: TEX.bancarella2, footW: 190, footH: 48, bottomPad: 8, tall: true },
  lanterna: { texture: TEX.lanterna, footW: 18, footH: 12, bottomPad: 6, flame: { x: 14, y: -110 } },
  tappeto0: { texture: TEX.tappeto0, footW: 0, footH: 0, bottomPad: 0, flat: true },
  tappeto1: { texture: TEX.tappeto1, footW: 0, footH: 0, bottomPad: 0, flat: true },
  tappeto2: { texture: TEX.tappeto2, footW: 0, footH: 0, bottomPad: 0, flat: true },
  carretto: { texture: TEX.carretto, footW: 130, footH: 40, bottomPad: 6 },
  palazzo0: { texture: TEX.palazzo0, footW: 244, footH: 110, bottomPad: 10, tall: true },
  palazzo1: { texture: TEX.palazzo1, footW: 244, footH: 110, bottomPad: 10, tall: true },
  palazzo2: { texture: TEX.palazzo2, footW: 244, footH: 110, bottomPad: 10, tall: true },
  taxi: { texture: TEX.taxi, footW: 132, footH: 40, bottomPad: 8 },
  lampione: { texture: TEX.lampione, footW: 16, footH: 12, bottomPad: 6, tall: true },
  torre: { texture: TEX.torre, footW: 120, footH: 60, bottomPad: 10, tall: true },
  palma: { texture: TEX.palma, footW: 30, footH: 22, bottomPad: 8, tall: true },
  pozzo: { texture: TEX.pozzo, footW: 100, footH: 46, bottomPad: 8 },
  duna: { texture: TEX.duna, footW: 0, footH: 0, bottomPad: 0, flat: true },
} satisfies Record<string, ObstacleType>;

export type ObstacleKind = keyof typeof OBSTACLE_TYPES;

/** Un oggetto creato sulla mappa: il disegno, se è alto, e la sua base. */
export interface PlacedObstacle {
  image: Phaser.GameObjects.Image;
  /** altri disegni legati all'oggetto (es. la luce di una torcia) */
  extras: Phaser.GameObjects.Image[];
  tall: boolean;
  baseY: number;
}

/**
 * Un ostacolo fisso. L'immagine è ordinata per Y in base alla sua base,
 * così chi passa dietro viene coperto. La collisione è solo l'impronta a terra.
 */
export function createObstacle(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.StaticGroup,
  kind: ObstacleKind,
  x: number,
  y: number,
): PlacedObstacle {
  const t: ObstacleType = OBSTACLE_TYPES[kind];
  const scale = t.scale ?? 1;

  if (t.flat) {
    const image = scene.add.image(x, y, t.texture).setDepth(DEPTH.ground + 20);
    return { image, extras: [], tall: false, baseY: y };
  }

  const image = scene.add.image(x, y, t.texture).setOrigin(0.5, 1).setScale(scale);
  const baseY = y - t.bottomPad * scale;
  image.setDepth(baseY);

  const foot = scene.add.zone(x, baseY - t.footH / 2, t.footW, t.footH);
  group.add(foot);

  const extras: Phaser.GameObjects.Image[] = [];
  if (t.flame) {
    const glow = scene.add
      .image(x + t.flame.x, y + t.flame.y, TEX.bagliore)
      .setScale(0.7)
      .setDepth(baseY + 1)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.55, to: 0.95 },
      scale: { from: 0.6, to: 0.75 },
      duration: Phaser.Math.Between(140, 220),
      yoyo: true,
      repeat: -1,
    });
    extras.push(glow);
  }
  return { image, extras, tall: !!t.tall, baseY };
}
