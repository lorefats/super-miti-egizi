// Musica dei menu (Lobby, Personaggi, Cammino, Sarcofagi): un motivetto originale "da tempio egizio"
// suonato da uno strumento a corde pizzicate, un bordone basso e un tamburo a calice.
// È generata dal codice nota per nota e gira in tondo (8 battute).

import { AUDIO } from '../data/audio';
import { SaveManager } from '../save/SaveManager';
import { audioContext, audioRunning, drone, noise, tone } from './engine';
import { NOTE } from './Sound';

/** Scala di Re "egizia" (gradi 0-9) per la melodia. */
const SCALE = [NOTE.D4, NOTE.Eb4, NOTE.Fs4, NOTE.G4, NOTE.A4, NOTE.Bb4, NOTE.C5, NOTE.D5, NOTE.Eb5, NOTE.Fs5];

/** Melodia: per ogni battuta, [sedicesimo di partenza, grado della scala, durata in sedicesimi]. */
const MELODY: [number, number, number][][] = [
  [[0, 4, 2], [2, 5, 2], [4, 4, 2], [6, 3, 2], [8, 2, 4], [12, 1, 2], [14, 2, 2]],
  [[0, 0, 6], [8, 2, 2], [10, 3, 2], [12, 4, 4]],
  [[0, 7, 2], [2, 6, 2], [4, 5, 2], [6, 4, 2], [8, 5, 2], [10, 4, 2], [12, 3, 4]],
  [[0, 2, 4], [4, 1, 2], [6, 2, 2], [8, 0, 8]],
  [[0, 4, 4], [4, 7, 4], [8, 6, 2], [10, 5, 2], [12, 4, 4]],
  [[0, 5, 2], [2, 4, 2], [4, 3, 2], [6, 2, 2], [8, 3, 4], [12, 2, 4]],
  [[0, 9, 2], [2, 8, 2], [4, 7, 4], [8, 6, 2], [10, 5, 2], [12, 4, 4]],
  [[0, 3, 2], [2, 2, 2], [4, 1, 2], [6, 2, 2], [8, 0, 8]],
];

/** Note del basso per battuta (sul primo e sul nono sedicesimo). */
const D2 = 73.42;
const A2 = 110.0;
const C2 = 65.41;
const G2 = 98.0;
const BASS: [number, number][] = [
  [D2, A2],
  [D2, A2],
  [C2, G2],
  [D2, A2],
];

/** Tamburo: D = colpo basso (centro), T = colpo secco (bordo), t = colpetto leggero. 16 sedicesimi. */
const DRUM = 'D.t.T.t.D.t.T.tt';

let timer: number | null = null;
let stopDrone: (() => void) | null = null;
let nextTime = 0;
let step = 0;

function pluck(freq: number, at: number, dur: number): void {
  // corda pizzicata: attacco secco, si spegne in fretta, con un'ottava sopra leggerissima
  tone(freq, dur, { type: 'triangle', vol: 0.22, at, bus: 'music' });
  tone(freq * 2, dur * 0.5, { type: 'sine', vol: 0.06, at, bus: 'music' });
}

function drum(kind: string, at: number): void {
  if (kind === 'D') {
    tone(130, 0.22, { vol: 0.5, to: 60, at, bus: 'music' });
  } else if (kind === 'T') {
    noise(0.06, { freq: 3200, q: 1.2, vol: 0.28, at, bus: 'music' });
    tone(420, 0.05, { vol: 0.12, at, bus: 'music' });
  } else if (kind === 't') {
    noise(0.04, { freq: 4200, q: 1.5, vol: 0.12, at, bus: 'music' });
  }
}

/** Mette in calendario le note dei prossimi istanti (così la musica non "inciampa"). */
function schedule(): void {
  const c = audioContext();
  if (!c) return;
  if (!audioRunning()) {
    nextTime = c.currentTime + 0.1;
    return;
  }
  if (!stopDrone) stopDrone = drone(NOTE.D3, 0.06);
  const sixteenth = 60 / AUDIO.musicBpm / 4;
  if (nextTime < c.currentTime) nextTime = c.currentTime + 0.05;
  while (nextTime < c.currentTime + 0.25) {
    const bar = Math.floor(step / 16) % MELODY.length;
    const s = step % 16;
    for (const [at, deg, len] of MELODY[bar]) if (at === s) pluck(SCALE[deg], nextTime, len * sixteenth + 0.15);
    const bass = BASS[bar % BASS.length];
    if (s === 0) tone(bass[0], sixteenth * 7, { type: 'triangle', vol: 0.22, at: nextTime, bus: 'music' });
    if (s === 8) tone(bass[1], sixteenth * 7, { type: 'triangle', vol: 0.16, at: nextTime, bus: 'music' });
    drum(DRUM[s], nextTime);
    nextTime += sixteenth;
    step++;
  }
}

/** Fa partire la musica dei menu (se è già partita non fa niente). */
export function startMenuMusic(): void {
  if (timer !== null || !SaveManager.getSettings().music) return;
  step = 0;
  nextTime = 0;
  timer = window.setInterval(schedule, 60);
  schedule();
}

/** Ferma la musica (si entra in partita o la si spegne nelle impostazioni). */
export function stopMenuMusic(): void {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  stopDrone?.();
  stopDrone = null;
}
