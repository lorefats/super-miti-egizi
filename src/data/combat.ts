// Regole di combattimento comuni a tutti i personaggi.

/** Rigenerazione: se non vieni colpito e non attacchi per un po', la vita risale piano piano. */
export const REGEN = {
  /** Secondi senza colpire né essere colpiti prima che parta. */
  delaySeconds: 3,
  /** Frazione della vita massima recuperata ogni secondo. */
  fractionPerSecond: 0.12,
};
