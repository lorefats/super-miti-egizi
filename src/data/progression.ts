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
}

/**
 * Tipi di sarcofago, dal più comune al più raro. Le probabilità sommano a 100.
 * (Il "nuovo personaggio" dentro i sarcofagi arriva insieme alla schermata Personaggi, Passo 10.)
 */
export const SARCOPHAGI: SarcophagusData[] = [
  { tier: 'legno', name: 'Sarcofago di Legno', chance: 60, scarabs: [20, 40], stardust: [10, 20] },
  { tier: 'bronzo', name: 'Sarcofago di Bronzo', chance: 25, scarabs: [50, 90], stardust: [25, 45] },
  { tier: 'oro', name: "Sarcofago d'Oro", chance: 12, scarabs: [120, 200], stardust: [60, 100] },
  { tier: 'faraone', name: 'Sarcofago del Faraone', chance: 3, scarabs: [300, 450], stardust: [150, 220] },
];

/** Sarcofagi ricevuti vincendo una partita. */
export const SARCOPHAGI_PER_VICTORY = 1;

/** Cosa c'è dentro un sarcofago aperto. */
export interface SarcophagusLoot {
  tier: SarcophagusTier;
  scarabs: number;
  stardust: number;
}

export function getSarcophagus(tier: SarcophagusTier): SarcophagusData {
  return SARCOPHAGI.find((s) => s.tier === tier) ?? SARCOPHAGI[0];
}

/** Sceglie a caso il tipo di sarcofago (secondo le probabilità) e cosa contiene. */
export function rollSarcophagus(forcedTier?: SarcophagusTier, random: () => number = Math.random): SarcophagusLoot {
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
  return { tier: data.tier, scarabs: between(data.scarabs), stardust: between(data.stardust) };
}
