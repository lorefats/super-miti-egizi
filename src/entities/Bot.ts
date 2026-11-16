import Phaser from 'phaser';
import { BotBrain, type BotWorld } from '../ai/BotBrain';
import type { BotLevel } from '../data/bots';
import { Player, type FighterOptions } from './Player';

/** Un personaggio guidato dal computer: è un Player con un "cervello" al posto del joystick. */
export class Bot extends Player {
  private readonly brain: BotBrain;

  constructor(scene: Phaser.Scene, x: number, y: number, opt: FighterOptions, level: BotLevel, world: BotWorld) {
    super(scene, x, y, { ...opt, isHuman: false });
    this.brain = new BotBrain(this, this.combat, level, world);
  }

  preUpdate(time: number, delta: number): void {
    if (this.isAlive()) this.move(this.brain.update(delta / 1000));
    super.preUpdate(time, delta);
  }
}
