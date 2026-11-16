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
