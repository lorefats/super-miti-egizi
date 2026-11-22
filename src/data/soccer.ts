// Numeri e campo del Calcio del Nilo (GAME_DESIGN.md, sezione 2).
import type { MapData, Rect } from './maps';

export const SOCCER = {
  /** coppe totali per sbloccare la modalità */
  unlockTrophies: 220,
  /** giocatori per squadra (tu + 2 compagni bot contro 3 bot) */
  teamSize: 3,
  /** chi arriva a questi gol vince subito */
  goalsToWin: 2,
  /** durata della partita (secondi): allo scadere vince chi ha più gol, se no è pareggio */
  seconds: 150,
  /** dopo quanti secondi riappare chi è stato sconfitto */
  respawnSeconds: 4,
  /** pausa dopo un gol prima di ricominciare dal centro (secondi) */
  goalPause: 2.2,
  /** tregua prima di ogni calcio d'inizio (anche dopo un gol): tutti fermi, conto alla rovescia (secondi) */
  kickoffTruce: 5,
  /** chi porta la palla va appena un po' più piano */
  carrierSpeedFactor: 0.95,
  ball: {
    radius: 24,
    /** quanto rallenta da sola sull'erba e nell'acqua (più alto = si ferma prima) */
    drag: 1.5,
    waterDrag: 2.4,
    /** quanto rimbalza su muri e bordi (1 = senza perdere velocità) */
    bounce: 0.7,
    /** distanza davanti ai piedi di chi la porta (pixel) */
    carryOffset: 38,
    /** entro questa distanza dai piedi la si prende (pixel) */
    pickupRadius: 64,
    /** "calamita": una palla lenta più vicina di così scivola verso i piedi di chi è lì (pixel) */
    magnetRadius: 130,
    /** sotto questa velocità la calamita funziona (pixel al secondo) */
    magnetMaxSpeed: 520,
    /** forza della calamita (pixel al secondo verso i piedi) */
    magnetPull: 420,
    /** quanto in fretta la palla gira attorno ai piedi quando si cambia direzione (più alto = più svelta) */
    carryTurnRate: 14,
    /** velocità di un tiro (pixel al secondo) con la mira al massimo; con la mira corta parte più piano */
    shotSpeed: 1100,
    /** velocità di un passaggio a un compagno */
    passSpeed: 820,
    /** tocco veloce: tira in porta se è più vicina di così, altrimenti passa o calcia avanti */
    autoShotRange: 950,
    /** chi ha appena calciato non la riprende subito (secondi) */
    kickerWait: 0.45,
    /** chi viene colpito perde la palla: rotola via a questa velocità */
    dropSpeed: 320,
    /** la corrente del fiume la trascina con questa parte della sua forza */
    flowFactor: 0.9,
  },
  /** i bot tirano in porta da questa distanza (pixel) */
  botShootRange: 720,
  /** un nemico più vicino di così al bot con la palla: meglio passarla */
  botPassPressure: 260,
};

const W = 2600;
const H = 1500;

/** Il Nilo scende in mezzo al campo (corrente verso il basso, piano). */
export const SOCCER_RIVER: Rect & { flow: { x: number; y: number } } = { x: 1170, y: 0, w: 260, h: H, flow: { x: 0, y: 70 } };

/** Tre ponti: in alto, in mezzo (dove parte la palla) e in basso. */
const BRIDGES: Rect[] = [
  { x: 1140, y: 230, w: 320, h: 170 },
  { x: 1140, y: 640, w: 320, h: 220 },
  { x: 1140, y: 1100, w: 320, h: 170 },
];

/** Porte: rettangolo in cui la palla fa gol (a sinistra quella della squadra 0, a destra quella della squadra 1). */
export const GOAL_DEPTH = 90;
export const GOAL_MOUTH = 340;
export const GOALS: Rect[] = [
  { x: 0, y: H / 2 - GOAL_MOUTH / 2, w: GOAL_DEPTH, h: GOAL_MOUTH },
  { x: W - GOAL_DEPTH, y: H / 2 - GOAL_MOUTH / 2, w: GOAL_DEPTH, h: GOAL_MOUTH },
];

/** Posizioni del calcio d'inizio della squadra 0 (a sinistra); quelle della squadra 1 sono a specchio. */
export const KICKOFF = [
  { x: 900, y: 750 },
  { x: 700, y: 430 },
  { x: 700, y: 1070 },
];

/** Dove riappare chi è stato sconfitto (squadra 0; l'altra a specchio). */
export const RESPAWN = [
  { x: 260, y: 520 },
  { x: 260, y: 980 },
];

/** Specchia un punto nell'altra metà campo. */
export function mirror(p: { x: number; y: number }): { x: number; y: number } {
  return { x: W - p.x, y: p.y };
}

/** Il campo: erba, il Nilo in mezzo, ripari e cespugli uguali nelle due metà. */
function buildField(): MapData {
  const half: MapData['obstacles'] = [
    { kind: 'blocco', x: 560, y: 360 },
    { kind: 'blocco', x: 560, y: 1180 },
    { kind: 'colonna', x: 900, y: 270 },
    { kind: 'colonna', x: 900, y: 1290 },
    { kind: 'palma', x: 120, y: 160 },
    { kind: 'palma', x: 120, y: 1420 },
  ];
  const bushes: MapData['bushes'] = [
    { kind: 'papiro', spots: [{ x: 420, y: 160 }, { x: 510, y: 180 }] },
    { kind: 'papiro', spots: [{ x: 420, y: 1350 }, { x: 510, y: 1330 }] },
    { kind: 'papiro', spots: [{ x: 1040, y: 520 }] },
    { kind: 'papiro', spots: [{ x: 1040, y: 1000 }] },
  ];
  const mirrorBushes = bushes.map((b) => ({ kind: b.kind, spots: b.spots.map(mirror) }));
  return {
    name: 'Calcio del Nilo',
    width: W,
    height: H,
    spawn: KICKOFF[0],
    obstacles: [...half, ...half.map((o) => ({ kind: o.kind, ...mirror(o) }))],
    zones: [{ name: 'Campo del Nilo', x: 0, y: 0, w: W, h: H, ground: 'erba', color: 0x8dbb5a }],
    water: [SOCCER_RIVER],
    bridges: BRIDGES,
    bushes: [...bushes, ...mirrorBushes],
    targets: [],
  };
}

export const CAMPO_CALCIO: MapData = buildField();
