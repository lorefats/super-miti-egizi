import Phaser from 'phaser';
import { TEX, characterTexture, getHeldWeapon, getLegs, hasCharacterArt, legTexture, weaponTexture } from '../art';
import { getRosterEntry } from '../data/characters';

/** Colore delle sagome dei personaggi bloccati ("in ombra"). */
export const SHADOW_TINT = 0x0b1026;

/** Un personaggio intero (gambe, corpo, arma) da mostrare fermo in un menu, con i piedi in (0, 0). */
export interface CharacterPose {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image;
  weapon: Phaser.GameObjects.Image | null;
}

/**
 * Personaggio fermo per i menu. Se non ha ancora un disegno vero si usa la sagoma nel suo colore;
 * con `locked` tutto diventa un'ombra scura (personaggio da scoprire).
 */
export function createCharacterPose(
  scene: Phaser.Scene,
  id: string,
  x: number,
  y: number,
  weaponRotation = 0.18,
  locked = false,
): CharacterPose {
  const c = scene.add.container(x, y);
  c.add(scene.add.image(0, 0, TEX.ombra));
  if (!hasCharacterArt(id)) {
    const body = scene.add.image(0, 2, TEX.sagomaDio).setOrigin(0.5, 1).setTint(locked ? SHADOW_TINT : getRosterEntry(id).color);
    c.add(body);
    return { container: c, body, weapon: null };
  }
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
  if (locked) {
    for (const o of c.list.slice(1)) (o as Phaser.GameObjects.Image).setTintFill(SHADOW_TINT);
  }
  return { container: c, body, weapon };
}
