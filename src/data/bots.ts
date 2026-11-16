// Numeri dei bot (vedi docs/GAME_DESIGN.md, sezione 11).

export interface BotLevel {
  name: string;
  /** Errore massimo di mira, in gradi (più basso = più preciso). */
  aimErrorDeg: number;
  /** Ogni quanti secondi il bot "ripensa" a cosa fare. */
  thinkSeconds: number;
  /** Pausa casuale (min, max) in secondi prima di ogni attacco: simula il tempo di reazione. */
  attackPause: [number, number];
  /** Fino a che distanza (pixel) il bot si accorge dei nemici. */
  sightRange: number;
}

/** Tre livelli di bravura. In futuro cresceranno con le coppe del giocatore. */
export const BOT_LEVELS: BotLevel[] = [
  { name: 'principiante', aimErrorDeg: 30, thinkSeconds: 0.4, attackPause: [0.9, 1.6], sightRange: 520 },
  { name: 'esperto', aimErrorDeg: 16, thinkSeconds: 0.25, attackPause: [0.5, 1.0], sightRange: 700 },
  { name: 'campione', aimErrorDeg: 7, thinkSeconds: 0.15, attackPause: [0.2, 0.5], sightRange: 850 },
];

/** Sotto questa frazione di vita il bot scappa; torna a combattere sopra RECOVER. */
export const BOT_FLEE_HEALTH = 0.3;
export const BOT_RECOVER_HEALTH = 0.6;

/** Nomi dei bot (mostrati sopra la testa). */
export const BOT_NAMES = ['Kha', 'Neb', 'Seti', 'Tiye', 'Meri', 'Huy', 'Ahmose', 'Nofret', 'Ipi'];

/** Partita Solo del Passo 3: quanti bot e di che livello. */
export const SOLO_SETUP = {
  botCount: 5,
  botLevel: 0,
};
