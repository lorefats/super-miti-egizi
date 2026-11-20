import Phaser from 'phaser';
import { BotBrain, type BotWorld } from '../ai/BotBrain';
import type { BotLevel } from '../data/bots';
import { Player, type FighterOptions } from './Player';

/** Un "cervello": ogni fotogramma dice in che direzione camminare (e intanto attacca quando serve). */
export interface Brain {
  update(dt: number): Phaser.Math.Vector2;
}

/** Un personaggio guidato dal computer: è un Player con un "cervello" al posto del joystick. */
export class Bot extends Player {
  private readonly brain: Brain;

  /** `world` = cervello da battaglia; oppure una funzione che crea un cervello diverso (es. per il Calcio). */
  constructor(scene: Phaser.Scene, x: number, y: number, opt: FighterOptions, level: BotLevel, world: BotWorld | ((bot: Bot) => Brain)) {
    super(scene, x, y, { ...opt, isHuman: false });
    this.brain = typeof world === 'function' ? world(this) : new BotBrain(this, this.combat, level, world);
  }

  preUpdate(time: number, delta: number): void {
    if (this.isAlive()) this.move(this.brain.update(delta / 1000));
    super.preUpdate(time, delta);
  }
}
