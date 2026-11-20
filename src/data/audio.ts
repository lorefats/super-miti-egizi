// Numeri dell'audio e della vibrazione (volumi, distanze, durate).

export const AUDIO = {
  /** volume degli effetti (0-1) */
  sfxVolume: 0.55,
  /** volume della musica (0-1) */
  musicVolume: 0.32,
  /** oltre questa distanza dal centro dello schermo (pixel) un suono della partita non si sente */
  hearDistance: 1100,
  /** lo stesso suono non si ripete più spesso di così (secondi): tanti colpi insieme non fanno un frastuono */
  minGapSeconds: 0.045,
  /** velocità della musica della lobby (battiti al minuto) */
  musicBpm: 96,
};

/** Vibrazioni del telefono (millisecondi: vibra, pausa, vibra...). Su iPhone il browser non le permette. */
export const VIBRATION = {
  /** il tuo personaggio viene colpito */
  hurt: [25],
  /** lanci la super */
  super: [40],
  /** la super è carica */
  superReady: [20, 60, 20],
  /** sei sconfitto */
  defeated: [90, 50, 160],
  /** vittoria */
  victory: [60, 40, 60, 40, 180],
  /** gol (Calcio del Nilo) */
  goal: [50, 40, 120],
  /** apri un sarcofago */
  sarcophagus: [30, 30, 30, 30, 80],
  /** colpi al tuo personaggio: al massimo una vibrazione ogni tanti secondi */
  hurtGapSeconds: 0.25,
};
