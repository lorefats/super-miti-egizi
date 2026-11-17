import Phaser from 'phaser';
import { TEX, characterTexture, getHeldWeapon, getLegs, legTexture, weaponTexture } from '../art';

/** Un personaggio intero (gambe, corpo, arma) da mostrare fermo in un menu, con i piedi in (0, 0). */
export interface CharacterPose {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image;
  weapon: Phaser.GameObjects.Image | null;
}

export function createCharacterPose(scene: Phaser.Scene, id: string, x: number, y: number, weaponRotation = 0.18): CharacterPose {
  const c = scene.add.container(x, y);
  c.add(scene.add.image(0, 0, TEX.ombra));
  const legs = getLegs(id);
  if (legs) {
    const key = legTexture(id);
    c.add(scene.add.image(legs.hips.back.x, legs.hips.back.y, key).setOrigin(legs.originX, legs.originY).setTint(0xb8b8c8).setRotation(-0.12));
    c.add(scene.add.image(legs.hips.front.x, legs.hips.front.y, key).setOrigin(legs.originX, legs.originY).setRotation(0.1));
  }
  const body = scene.add.image(0, 2, characterTexture(id)).setOrigin(0.5, 1);
  c.add(body);
  let weapon: Phaser.GameObjects.Image | null = null;
  const held = getHeldWeapon(id);
  if (held) {
    weapon = scene.add.image(held.hand.x, held.hand.y, weaponTexture(id)).setOrigin(held.originX, held.originY).setRotation(weaponRotation);
    c.add(weapon);
  }
  return { container: c, body, weapon };
}
