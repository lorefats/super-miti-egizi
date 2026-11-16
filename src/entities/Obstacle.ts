import Phaser from 'phaser';
import { TEX } from '../art';

export type ObstacleKind = 'blocco' | 'bloccoLungo' | 'piramide';

/** Per ogni tipo: disegno e "impronta" a terra (il rettangolo che blocca, misurato dalla base). */
const OBSTACLE_TYPES: Record<ObstacleKind, { texture: string; footW: number; footH: number; bottomPad: number }> = {
  blocco: { texture: TEX.blocco, footW: 92, footH: 50, bottomPad: 10 },
  bloccoLungo: { texture: TEX.bloccoLungo, footW: 192, footH: 50, bottomPad: 10 },
  piramide: { texture: TEX.piramide, footW: 360, footH: 70, bottomPad: 22 },
};

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
): Phaser.GameObjects.Image {
  const t = OBSTACLE_TYPES[kind];
  const image = scene.add.image(x, y, t.texture).setOrigin(0.5, 1);
  image.setDepth(y - t.bottomPad);

  const footY = y - t.bottomPad - t.footH / 2;
  const foot = scene.add.zone(x, footY, t.footW, t.footH);
  group.add(foot);
  return image;
}
