// Numeri della Lobby (docs/GAME_DESIGN.md, sezione 8).
import type { TimeOfDay } from '../art/lobby';

/** Da che ora (0-23) comincia ogni momento del giorno. */
export const LOBBY_HOURS: { from: number; time: TimeOfDay }[] = [
  { from: 5, time: 'alba' },
  { from: 8, time: 'giorno' },
  { from: 18, time: 'tramonto' },
  { from: 20, time: 'notte' },
];

/** Momento del giorno per un'ora (0-23). Prima delle 5 è ancora notte. */
export function timeOfDayAt(hour: number): TimeOfDay {
  let t: TimeOfDay = 'notte';
  for (const h of LOBBY_HOURS) if (hour >= h.from) t = h.time;
  return t;
}

/** Ogni quanti secondi il personaggio sul piedistallo fa la sua posa (alza lo scettro). */
export const LOBBY_POSE_EVERY = 6;
