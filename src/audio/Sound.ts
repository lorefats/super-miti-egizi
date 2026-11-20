// Effetti sonori e vibrazione: il resto del gioco chiama solo `playSfx`, `playSfxAt` e `vibrate`.
// Ogni suono è "disegnato" qui con note e rumore (vedi engine.ts): tutti originali, fatti per questo gioco.

import Phaser from 'phaser';
import { AUDIO, VIBRATION } from '../data/audio';
import { SaveManager } from '../save/SaveManager';
import { audioContext, audioRunning, noise, tone } from './engine';

export type SfxName =
  | 'click'
  | 'swing'
  | 'shoot'
  | 'throw'
  | 'super'
  | 'superReady'
  | 'hit'
  | 'hurt'
  | 'defeated'
  | 'gem'
  | 'chest'
  | 'beep'
  | 'go'
  | 'victory'
  | 'lose'
  | 'goal'
  | 'kick'
  | 'sarcophagus'
  | 'reward'
  | 'denied';

/** Note della scala "egizia" usata da musica e motivetti (Re con il secondo grado abbassato). */
export const NOTE = {
  D3: 146.83,
  D4: 293.66,
  Eb4: 311.13,
  Fs4: 369.99,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  C5: 523.25,
  D5: 587.33,
  Eb5: 622.25,
  Fs5: 739.99,
  A5: 880.0,
  D6: 1174.66,
};

/** Come suona ogni effetto. `v` = volume (0-1), già ridotto se il suono viene da lontano. */
const SOUNDS: Record<SfxName, (v: number) => void> = {
  // tocco di un pulsante: un "tic" leggero
  click: (v) => tone(900, 0.06, { type: 'triangle', vol: 0.22 * v, to: 1300 }),
  // colpo ravvicinato (artigli, bastoni): fruscio che si alza
  swing: (v) => noise(0.14, { freq: 700, to: 2600, q: 1.4, vol: 0.4 * v }),
  // tiro dritto (frecce, getti, geroglifici)
  shoot: (v) => {
    tone(820, 0.1, { type: 'square', vol: 0.09 * v, to: 380 });
    noise(0.06, { filter: 'highpass', freq: 3000, vol: 0.15 * v });
  },
  // lancio a parabola: "fiuuu" che sale
  throw: (v) => tone(280, 0.2, { type: 'triangle', vol: 0.25 * v, to: 720 }),
  // super: arpeggio magico che sale + soffio
  super: (v) => {
    [NOTE.D5, NOTE.Fs5, NOTE.A5, NOTE.D6].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.18 * v, delay: i * 0.05 }));
    noise(0.35, { freq: 500, to: 4000, q: 0.8, vol: 0.18 * v, attack: 0.1 });
  },
  // la super è carica: due campanelli
  superReady: (v) => {
    tone(NOTE.D6, 0.25, { vol: 0.18 * v });
    tone(NOTE.A5 * 2, 0.35, { vol: 0.16 * v, delay: 0.09 });
  },
  // un colpo va a segno
  hit: (v) => {
    noise(0.07, { filter: 'lowpass', freq: 1400, vol: 0.35 * v });
    tone(190, 0.08, { vol: 0.3 * v, to: 90 });
  },
  // il TUO personaggio viene colpito: più basso e "pieno"
  hurt: (v) => {
    tone(230, 0.13, { type: 'square', vol: 0.12 * v, to: 110 });
    noise(0.1, { filter: 'lowpass', freq: 900, vol: 0.35 * v });
  },
  // sconfitto: diventa sabbia (fruscio che scende)
  defeated: (v) => {
    noise(0.7, { filter: 'lowpass', freq: 4000, to: 250, vol: 0.4 * v });
    tone(420, 0.45, { type: 'triangle', vol: 0.15 * v, to: 120 });
  },
  // gioiello raccolto
  gem: (v) => {
    tone(1318.5, 0.09, { vol: 0.2 * v });
    tone(1760, 0.16, { vol: 0.2 * v, delay: 0.07 });
  },
  // baule che si rompe
  chest: (v) => {
    noise(0.25, { freq: 650, q: 0.9, vol: 0.5 * v });
    tone(150, 0.25, { vol: 0.35 * v, to: 55 });
  },
  // conto alla rovescia
  beep: (v) => tone(660, 0.13, { type: 'square', vol: 0.12 * v }),
  go: (v) => {
    tone(990, 0.4, { type: 'square', vol: 0.11 * v });
    tone(1320, 0.4, { type: 'triangle', vol: 0.12 * v });
  },
  // vittoria: la scala sale e finisce con un accordo lungo
  victory: (v) => {
    [NOTE.D4, NOTE.Fs4, NOTE.A4, NOTE.D5].forEach((f, i) => tone(f, 0.2, { type: 'triangle', vol: 0.22 * v, delay: i * 0.12 }));
    for (const f of [NOTE.D5, NOTE.Fs5, NOTE.A5]) tone(f, 1.2, { type: 'triangle', vol: 0.15 * v, delay: 0.5, attack: 0.02 });
  },
  // sconfitta: la scala scende piano (triste ma gentile)
  lose: (v) =>
    [NOTE.A4, NOTE.G4, NOTE.Fs4, NOTE.Eb4, NOTE.D4].forEach((f, i) =>
      tone(f, i === 4 ? 0.8 : 0.3, { type: 'triangle', vol: 0.2 * v, delay: i * 0.22 }),
    ),
  // gol: accordo + "folla" che esulta
  goal: (v) => {
    for (const f of [NOTE.D5, NOTE.Fs5, NOTE.A5]) tone(f, 0.6, { type: 'square', vol: 0.06 * v });
    noise(1.1, { freq: 1300, q: 0.6, vol: 0.25 * v, attack: 0.15 });
  },
  // calcio al pallone
  kick: (v) => {
    tone(170, 0.1, { vol: 0.45 * v, to: 60 });
    noise(0.04, { filter: 'lowpass', freq: 2000, vol: 0.2 * v });
  },
  // sarcofago che si apre: la pietra trema, poi scintille
  sarcophagus: (v) => {
    noise(0.6, { filter: 'lowpass', freq: 220, vol: 0.6 * v, attack: 0.05 });
    [NOTE.A5, NOTE.D6, NOTE.A5 * 2].forEach((f, i) => tone(f, 0.3, { vol: 0.14 * v, delay: 0.45 + i * 0.07 }));
  },
  // premio: monetine
  reward: (v) => {
    tone(1568, 0.07, { type: 'square', vol: 0.07 * v });
    tone(2093, 0.18, { type: 'square', vol: 0.07 * v, delay: 0.06 });
  },
  // non si può (es. non hai abbastanza scarabei)
  denied: (v) => {
    tone(200, 0.1, { type: 'square', vol: 0.1 * v });
    tone(160, 0.14, { type: 'square', vol: 0.1 * v, delay: 0.12 });
  },
};

const lastPlayed = new Map<SfxName, number>();

/** Suona un effetto (a volume pieno: pulsanti, cose del tuo personaggio, musichette). */
export function playSfx(name: SfxName, volume = 1): void {
  if (!SaveManager.getSettings().sound) return;
  const c = audioContext();
  if (!c || !audioRunning()) return;
  // lo stesso suono tante volte insieme diventerebbe un frastuono
  const last = lastPlayed.get(name) ?? -1;
  if (c.currentTime - last < AUDIO.minGapSeconds) return;
  lastPlayed.set(name, c.currentTime);
  SOUNDS[name](Phaser.Math.Clamp(volume, 0, 1));
}

/** Suona un effetto che succede nella mappa in (x, y): più è lontano dal centro dello schermo, più è piano. */
export function playSfxAt(scene: Phaser.Scene, x: number, y: number, name: SfxName, volume = 1): void {
  const v = scene.cameras.main.worldView;
  const d = Phaser.Math.Distance.Between(x, y, v.centerX, v.centerY);
  const k = 1 - d / AUDIO.hearDistance;
  if (k <= 0) return;
  playSfx(name, volume * k);
}

const lastVibration = { hurt: 0 };

/** Fa vibrare il telefono (se l'impostazione è accesa e il telefono lo permette). */
export function vibrate(kind: Exclude<keyof typeof VIBRATION, 'hurtGapSeconds'>): void {
  if (!SaveManager.getSettings().vibration) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (kind === 'hurt') {
    const now = performance.now();
    if (now - lastVibration.hurt < VIBRATION.hurtGapSeconds * 1000) return;
    lastVibration.hurt = now;
  }
  try {
    navigator.vibrate(VIBRATION[kind]);
  } catch {
    // alcuni browser la bloccano: pazienza
  }
}
