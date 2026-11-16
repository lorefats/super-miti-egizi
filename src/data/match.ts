// Numeri della partita: bauli, gioielli e tempesta (vedi docs/GAME_DESIGN.md, sezioni 3 e 4).

/** Bauli del tesoro: si rompono colpendoli e dentro ci sono i Gioielli. */
export const CHEST = {
  maxHealth: 3000,
  gems: 1,
};

/** Gioielli (Cubi Energia): valgono solo per la partita in corso. */
export const GEM = {
  /** vita e danno in più per ogni gioiello (frazione del valore base) */
  healthBonus: 0.1,
  damageBonus: 0.1,
  /** distanza (pixel) a cui un personaggio raccoglie un gioiello */
  pickupRadius: 46,
  /** secondi prima di poter raccogliere un gioiello appena uscito (mentre vola) */
  pickupDelay: 0.45,
};

/** Tempesta di sabbia: un cerchio sicuro che si restringe; fuori si perde vita. */
export const STORM = {
  /** secondi di calma prima che inizi a stringersi */
  startDelaySeconds: 30,
  /** secondi per arrivare al cerchio finale */
  shrinkSeconds: 120,
  /** raggio iniziale (pixel): copre tutta la mappa */
  startRadius: 2100,
  /** raggio finale (pixel) */
  endRadius: 260,
  /** danno ogni secondo a chi è fuori dal cerchio */
  damagePerSecond: 500,
};
