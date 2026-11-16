import Phaser from 'phaser';
import { TEX, characterTexture } from '../art';
import { getCharacter, SPEED_VALUES, type CharacterData } from '../data/characters';

/** Dimensioni della "impronta" dei piedi usata per le collisioni. */
const FEET_W = 40;
const FEET_H = 22;

/**
 * Un personaggio sulla mappa. La posizione (x, y) è il punto dei piedi:
 * serve per l'ordinamento per Y (chi è più in basso viene disegnato sopra).
 */
export class Player extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  readonly data_: CharacterData;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly sprite: Phaser.GameObjects.Image;
  private animTime = 0;
  private moving = false;

  constructor(scene: Phaser.Scene, x: number, y: number, characterId: string) {
    super(scene, x, y);
    this.data_ = getCharacter(characterId);

    this.shadow = scene.add.image(0, 0, TEX.ombra);
    this.sprite = scene.add.image(0, 2, characterTexture(characterId)).setOrigin(0.5, 1);
    this.add([this.shadow, this.sprite]);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(FEET_W, FEET_H);
    this.body.setOffset(-FEET_W / 2, -FEET_H / 2);
    this.body.setCollideWorldBounds(true);
  }

  /** Muove il personaggio. dir ha lunghezza 0 (fermo) oppure 1. */
  move(dir: Phaser.Math.Vector2): void {
    const speed = SPEED_VALUES[this.data_.speed];
    this.body.setVelocity(dir.x * speed, dir.y * speed);
    this.moving = dir.lengthSq() > 0;
    if (dir.x < -0.1) this.sprite.setFlipX(true);
    else if (dir.x > 0.1) this.sprite.setFlipX(false);
  }

  preUpdate(_time: number, delta: number): void {
    this.animTime += delta / 1000;
    this.setDepth(this.y);

    if (this.moving) {
      // corsa: piccoli saltelli e leggero dondolio
      const hop = Math.abs(Math.sin(this.animTime * 12));
      this.sprite.y = 2 - hop * 8;
      this.sprite.rotation = Math.sin(this.animTime * 12) * 0.07;
      this.sprite.setScale(1, 1);
      this.shadow.setScale(1 - hop * 0.15);
    } else {
      // attesa: respiro
      const breath = Math.sin(this.animTime * 3);
      this.sprite.y = 2;
      this.sprite.rotation = 0;
      this.sprite.setScale(1 - breath * 0.015, 1 + breath * 0.025);
      this.shadow.setScale(1);
    }
  }
}
