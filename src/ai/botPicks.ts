import Phaser from 'phaser';
import { BOT_LEVELS, SOLO_SETUP, type BotLevel } from '../data/bots';
import { CHARACTERS } from '../data/characters';
import { BOT_LEVEL_BY_TROPHIES } from '../data/progression';
import { SaveManager } from '../save/SaveManager';

/** Sceglie a caso gli dèi dei bot: tutti diversi tra loro e dal tuo (se non bastano, si ripetono). */
export function pickBotGods(count: number, mine: string): string[] {
  const all = Object.keys(CHARACTERS);
  const others = all.filter((id) => id !== mine);
  const out: string[] = [];
  while (out.length < count) {
    const bag = Phaser.Utils.Array.Shuffle([...(others.length ? others : all)]);
    out.push(...bag.slice(0, count - out.length));
  }
  return out;
}

/** Più coppe hai, più i bot sono bravi (principiante → esperto → campione). */
export function currentBotLevel(): BotLevel {
  const total = SaveManager.getTotalTrophies();
  let level = SOLO_SETUP.botLevel;
  BOT_LEVEL_BY_TROPHIES.forEach((min, i) => {
    if (total >= min) level = Math.max(level, i);
  });
  return BOT_LEVELS[Math.min(level, BOT_LEVELS.length - 1)];
}
