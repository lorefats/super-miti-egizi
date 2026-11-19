// Numeri dei progressi (vedi docs/GAME_DESIGN.md, sezioni 4, 6, 7).

/** Coppe guadagnate in una partita Solo, dal 1° al 10° posto. */
export const TROPHIES_SOLO = [10, 8, 6, 4, 2, 0, -1, -2, -3, -4];

/** Coppe per un posto in classifica (1 = vittoria). Oltre il 10° vale come il 10°. */
/** Coppe per la posizione della squadra in Duo (5 squadre da 2). */
export const TROPHIES_DUO = [10, 6, 2, -2, -4];

/** Modalità di gioco: Solo (tutti contro tutti) o Duo (squadre da 2, con un compagno bot). */
export type GameMode = 'solo' | 'duo';

/** Tabella delle coppe della modalità. */
export function trophyTable(mode: GameMode): number[] {
  return mode === 'duo' ? TROPHIES_DUO : TROPHIES_SOLO;
}

export function trophiesForPlace(place: number, mode: GameMode = 'solo'): number {
  const table = trophyTable(mode);
  const i = clamp(place - 1, 0, table.length - 1);
  return table[i];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Livello dei bot in base alle coppe totali del giocatore (sezione 2: "crescono con le coppe").
 * Si usa l'ultimo livello la cui soglia è raggiunta: 0 principiante, 1 esperto, 2 campione.
 */
export const BOT_LEVEL_BY_TROPHIES = [0, 150, 500];

// ---------------------------------------------------------------- sarcofagi (sezione 5)

export type SarcophagusTier = 'legno' | 'bronzo' | 'oro' | 'faraone';

export interface SarcophagusData {
  tier: SarcophagusTier;
  /** nome mostrato nella schermata di apertura */
  name: string;
  /** probabilità su 100 */
  chance: number;
  /** scarabei d'oro: minimo e massimo */
  scarabs: [number, number];
  /** polvere di stelle: minimo e massimo */
  stardust: [number, number];
  /** probabilità su 100 che dentro ci sia un personaggio nuovo (se ne mancano) */
  characterChance: number;
}

/**
 * Tipi di sarcofago, dal più comune al più raro. Le probabilità sommano a 100.
 * Il nuovo personaggio esce solo tra quelli giocabili e non ancora sbloccati (Rà no: è nel Cammino delle Coppe).
 */
export const SARCOPHAGI: SarcophagusData[] = [
  { tier: 'legno', name: 'Sarcofago di Legno', chance: 60, scarabs: [20, 40], stardust: [10, 20], characterChance: 0 },
  { tier: 'bronzo', name: 'Sarcofago di Bronzo', chance: 25, scarabs: [50, 90], stardust: [25, 45], characterChance: 8 },
  { tier: 'oro', name: "Sarcofago d'Oro", chance: 12, scarabs: [120, 200], stardust: [60, 100], characterChance: 30 },
  { tier: 'faraone', name: 'Sarcofago del Faraone', chance: 3, scarabs: [300, 450], stardust: [150, 220], characterChance: 100 },
];

/** Sarcofagi ricevuti vincendo una partita. */
export const SARCOPHAGI_PER_VICTORY = 1;

/** Cosa c'è dentro un sarcofago aperto. */
export interface SarcophagusLoot {
  tier: SarcophagusTier;
  scarabs: number;
  stardust: number;
  /** personaggio nuovo trovato dentro (se c'è) */
  characterId?: string;
}

export function getSarcophagus(tier: SarcophagusTier): SarcophagusData {
  return SARCOPHAGI.find((s) => s.tier === tier) ?? SARCOPHAGI[0];
}

/**
 * Sceglie a caso il tipo di sarcofago (secondo le probabilità) e cosa contiene.
 * `newCharacters` = personaggi che si possono ancora trovare (giocabili e non sbloccati).
 */
export function rollSarcophagus(
  forcedTier?: SarcophagusTier,
  newCharacters: string[] = [],
  random: () => number = Math.random,
): SarcophagusLoot {
  let data = SARCOPHAGI[0];
  if (forcedTier) {
    data = getSarcophagus(forcedTier);
  } else {
    let r = random() * 100;
    for (const s of SARCOPHAGI) {
      if (r < s.chance) {
        data = s;
        break;
      }
      r -= s.chance;
    }
  }
  const between = ([min, max]: [number, number]) => min + Math.floor(random() * (max - min + 1));
  const loot: SarcophagusLoot = { tier: data.tier, scarabs: between(data.scarabs), stardust: between(data.stardust) };
  if (newCharacters.length > 0 && random() * 100 < data.characterChance) {
    loot.characterId = newCharacters[Math.floor(random() * newCharacters.length)];
  }
  return loot;
}

// ---------------------------------------------------------------- livelli (sezione 4)

/** Livello massimo di un personaggio (si parte dal livello 1). */
export const MAX_LEVEL = 11;

/** Ogni livello sopra l'1 dà questa frazione in più di vita e di danno (livello 11 = +50%). */
export const LEVEL_BONUS = 0.05;

/** Costo per salire AL livello indicato (indice = livello di arrivo; 0 e 1 non si usano). */
export const UPGRADE_COST: { scarabs: number; stardust: number }[] = [
  { scarabs: 0, stardust: 0 },
  { scarabs: 0, stardust: 0 },
  { scarabs: 20, stardust: 10 }, // → 2
  { scarabs: 35, stardust: 20 }, // → 3
  { scarabs: 55, stardust: 30 }, // → 4
  { scarabs: 80, stardust: 45 }, // → 5
  { scarabs: 120, stardust: 65 }, // → 6
  { scarabs: 170, stardust: 90 }, // → 7
  { scarabs: 230, stardust: 120 }, // → 8
  { scarabs: 310, stardust: 160 }, // → 9
  { scarabs: 400, stardust: 210 }, // → 10
  { scarabs: 520, stardust: 270 }, // → 11
];

/** Quanto vale vita e danno a un certo livello (1 = valori base). */
export function levelMultiplier(level: number): number {
  return 1 + LEVEL_BONUS * (clamp(Math.floor(level), 1, MAX_LEVEL) - 1);
}

// ---------------------------------------------------------------- prestigi (sezione 7)

/** Coppe di un personaggio per arrivare al Prestigio 1 (il massimo, per ora). */
export const PRESTIGE_TROPHIES = 1000;

// ---------------------------------------------------------------- cammino delle coppe (sezione 6)

export type RoadReward =
  | { kind: 'scarabei'; amount: number }
  | { kind: 'polvere'; amount: number }
  | { kind: 'sarcofago'; tier: SarcophagusTier }
  | { kind: 'personaggio'; characterId: string };

export interface RoadStep {
  /** coppe totali per arrivarci */
  trophies: number;
  reward: RoadReward;
}

/** Personaggi che si trovano solo nel Cammino delle Coppe (mai nei sarcofagi). */
export const ROAD_CHARACTERS = ['ra'];

/** Le tappe del Cammino, in ordine. L'ultima è Rà, il premio più grande del gioco. */
export const TROPHY_ROAD: RoadStep[] = [
  { trophies: 10, reward: { kind: 'scarabei', amount: 30 } },
  { trophies: 25, reward: { kind: 'polvere', amount: 20 } },
  { trophies: 50, reward: { kind: 'sarcofago', tier: 'legno' } },
  { trophies: 80, reward: { kind: 'scarabei', amount: 50 } },
  { trophies: 120, reward: { kind: 'polvere', amount: 40 } },
  { trophies: 160, reward: { kind: 'sarcofago', tier: 'bronzo' } },
  { trophies: 220, reward: { kind: 'scarabei', amount: 80 } },
  { trophies: 300, reward: { kind: 'polvere', amount: 60 } },
  { trophies: 400, reward: { kind: 'sarcofago', tier: 'bronzo' } },
  { trophies: 500, reward: { kind: 'scarabei', amount: 120 } },
  { trophies: 650, reward: { kind: 'polvere', amount: 90 } },
  { trophies: 800, reward: { kind: 'sarcofago', tier: 'oro' } },
  { trophies: 1000, reward: { kind: 'scarabei', amount: 180 } },
  { trophies: 1250, reward: { kind: 'polvere', amount: 120 } },
  { trophies: 1500, reward: { kind: 'sarcofago', tier: 'oro' } },
  { trophies: 1800, reward: { kind: 'scarabei', amount: 250 } },
  { trophies: 2200, reward: { kind: 'polvere', amount: 160 } },
  { trophies: 2600, reward: { kind: 'sarcofago', tier: 'faraone' } },
  { trophies: 3000, reward: { kind: 'scarabei', amount: 320 } },
  { trophies: 3500, reward: { kind: 'polvere', amount: 200 } },
  { trophies: 4000, reward: { kind: 'sarcofago', tier: 'oro' } },
  { trophies: 4500, reward: { kind: 'scarabei', amount: 400 } },
  { trophies: 5000, reward: { kind: 'polvere', amount: 260 } },
  { trophies: 5500, reward: { kind: 'sarcofago', tier: 'faraone' } },
  { trophies: 6000, reward: { kind: 'personaggio', characterId: 'ra' } },
];
