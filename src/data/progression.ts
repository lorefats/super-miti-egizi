// Numeri dei progressi (vedi docs/GAME_DESIGN.md, sezioni 4, 6, 7).

/** Coppe guadagnate in una partita Solo, dal 1° al 10° posto. */
export const TROPHIES_SOLO = [10, 8, 6, 4, 2, 0, -1, -2, -3, -4];

/** Coppe per un posto in classifica (1 = vittoria). Oltre il 10° vale come il 10°. */
export function trophiesForPlace(place: number): number {
  const i = clamp(place - 1, 0, TROPHIES_SOLO.length - 1);
  return TROPHIES_SOLO[i];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Livello dei bot in base alle coppe totali del giocatore (sezione 2: "crescono con le coppe").
 * Si usa l'ultimo livello la cui soglia è raggiunta: 0 principiante, 1 esperto, 2 campione.
 */
export const BOT_LEVEL_BY_TROPHIES = [0, 150, 500];
