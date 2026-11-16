// Costanti globali del gioco. I numeri di bilanciamento dei personaggi stanno in src/data/.

/** Dimensioni "di progetto" dello schermo (orizzontale). Phaser allarga l'area per riempire il telefono. */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Nome del font del gioco (incluso nel progetto, funziona offline). */
export const FONT_FAMILY = '"Lilita One", sans-serif';

/** Joystick di movimento. */
export const JOYSTICK = {
  radius: 80, // quanto si può spostare il pomello
  margin: 40, // distanza dal bordo quando è a riposo
  zoneWidth: 0.45, // parte sinistra dello schermo (in frazione) dove si può toccare
  deadZone: 0.2, // sotto questa frazione del raggio il personaggio sta fermo
  idleAlpha: 0.45,
};

/** Quanto morbidamente la telecamera segue il giocatore (0 = ferma, 1 = rigida). */
export const CAMERA_LERP = 0.12;

/** Stick di mira/attacco (a destra). */
export const AIM_STICK = {
  radius: 80,
  margin: 40,
  zoneWidth: 0.45, // parte destra dello schermo (in frazione) dove si può toccare
  deadZone: 0.25, // sotto questa frazione del raggio è un "tocco veloce" (colpo automatico)
  idleAlpha: 0.45,
};

/** Il colpo automatico cerca il nemico più vicino entro (portata dell'arma × questo numero). */
export const AUTO_AIM_RANGE_FACTOR = 2.2;

/** Profondità di disegno per gli elementi sopra o sotto tutto. */
export const DEPTH = {
  ground: -100000,
  groundMarks: -1000, // indicatore di mira sulla sabbia
  overhead: 50000, // barre vita, numeri di danno
  ui: 100000, // joystick e pulsanti
};

/** Pulsante della super (a sinistra dello stick di mira). */
export const SUPER_BUTTON = {
  radius: 58,
  /** distanza dal bordo destro e dal basso del centro del pulsante */
  right: 300,
  bottom: 96,
  /** quanto si può trascinare per mirare la super */
  dragRadius: 80,
  deadZone: 0.25,
};
