// Numeri del multiplayer con gli amici (GAME_DESIGN.md, sezione 13).

export const NET = {
  /**
   * Versione dei messaggi tra telefoni: si aumenta quando cambia il modo di parlarsi.
   * Se due telefoni hanno versioni diverse, chi entra viene avvisato di aggiornare il gioco.
   */
  protocol: 3,
  /** giocatori al massimo in una stanza (capo stanza compreso) */
  maxPlayers: 4,
  /** cifre del codice stanza */
  codeDigits: 4,
  /** inizio del nome con cui la stanza si registra sul servizio di PeerJS (così non si confonde con altre app) */
  peerPrefix: 'super-miti-egizi-stanza-',
  /** quante volte al secondo ogni telefono manda la sua posizione (e il capo stanza quella di tutti) */
  sendRate: 15,
  /** ritardo con cui si mostrano gli altri (millisecondi): così si muovono morbidi anche se un messaggio arriva tardi */
  interpDelayMs: 120,
  /** per quanto si "indovina" dove va un amico se i suoi messaggi tardano (millisecondi) */
  maxExtrapolateMs: 150,
  /** dopo quanti secondi senza notizie un amico si considera uscito */
  silenceSeconds: 8,
  /** secondi massimi di attesa per collegarsi a una stanza */
  connectTimeoutSeconds: 12,
  /** quanti codici prova il capo stanza se quello pescato è già usato */
  codeAttempts: 5,
  /** dopo quanti secondi riappare chi viene sconfitto nell'Allenamento con gli amici */
  trainingRespawnSeconds: 3,
};

/**
 * Colori con cui si vedono gli amici (per posto: 0 = capo stanza): così due amici con lo stesso dio si
 * distinguono. Il proprio dio si vede sempre con i colori normali; il rosso resta per i nemici.
 */
export const SEAT_VARIANTS = ['verde', 'viola', 'sabbia', 'grigio'] as const;
