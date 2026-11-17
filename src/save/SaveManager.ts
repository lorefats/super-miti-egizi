/**
 * UNICO punto che legge e scrive i progressi sul telefono (localStorage).
 * I dati hanno un numero di versione: se in futuro cambiano forma, `migrate` porta
 * i salvataggi vecchi alla forma nuova senza perdere niente.
 */

import { SARCOPHAGI_PER_VICTORY, type SarcophagusLoot } from '../data/progression';

const STORAGE_KEY = 'super-miti-egizi:salvataggio';
const CURRENT_VERSION = 1;

export interface CharacterProgress {
  /** coppe attuali di questo personaggio (mai sotto zero) */
  trophies: number;
  /** il massimo di coppe mai raggiunto */
  bestTrophies: number;
}

export interface SaveData {
  version: number;
  characters: Record<string, CharacterProgress>;
  stats: { matches: number; victories: number };
  /** valute (si trovano nei sarcofagi) */
  scarabs: number;
  stardust: number;
  /** sarcofagi vinti e non ancora aperti */
  pendingSarcophagi: number;
  /** personaggio scelto nella Lobby */
  selectedCharacter: string;
}

/** Risultato di una partita, per la schermata Risultati. */
export interface MatchReward {
  characterId: string;
  place: number;
  /** coppe guadagnate (o perse) davvero, dopo il limite dello zero */
  trophiesDelta: number;
  trophiesBefore: number;
  trophiesAfter: number;
  totalTrophies: number;
  /** sarcofagi vinti in questa partita */
  sarcophagiWon: number;
}

function emptySave(): SaveData {
  return {
    version: CURRENT_VERSION,
    characters: {},
    stats: { matches: 0, victories: 0 },
    scarabs: 0,
    stardust: 0,
    pendingSarcophagi: 0,
    selectedCharacter: 'anubi',
  };
}

/** Porta un salvataggio di qualsiasi versione alla versione attuale. */
function migrate(raw: unknown): SaveData {
  const data = emptySave();
  if (!raw || typeof raw !== 'object') return data;
  const r = raw as Partial<SaveData>;
  // versione 1 (la prima): copia solo i campi validi, così un dato rovinato non blocca il gioco
  if (r.characters && typeof r.characters === 'object') {
    for (const [id, c] of Object.entries(r.characters)) {
      const trophies = Math.max(0, Math.floor(Number(c?.trophies) || 0));
      const best = Math.max(trophies, Math.floor(Number(c?.bestTrophies) || 0));
      data.characters[id] = { trophies, bestTrophies: best };
    }
  }
  if (r.stats) {
    data.stats.matches = Math.max(0, Math.floor(Number(r.stats.matches) || 0));
    data.stats.victories = Math.max(0, Math.floor(Number(r.stats.victories) || 0));
  }
  const count = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0));
  data.scarabs = count(r.scarabs);
  data.stardust = count(r.stardust);
  data.pendingSarcophagi = count(r.pendingSarcophagi);
  if (typeof r.selectedCharacter === 'string' && r.selectedCharacter) data.selectedCharacter = r.selectedCharacter;
  // quando ci sarà la versione 2: if (r.version === 1) { ...trasforma... }
  return data;
}

class SaveManagerImpl {
  private data: SaveData = emptySave();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      this.data = migrate(text ? JSON.parse(text) : null);
    } catch {
      // niente salvataggio leggibile (navigazione privata, dati rovinati): si riparte da zero
      this.data = emptySave();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // memoria piena o bloccata: il gioco continua, solo non ricorda
    }
  }

  private character(id: string): CharacterProgress {
    return (this.data.characters[id] ??= { trophies: 0, bestTrophies: 0 });
  }

  getTrophies(characterId: string): number {
    return this.data.characters[characterId]?.trophies ?? 0;
  }

  /** Coppe totali del giocatore = somma di tutti i personaggi. */
  getTotalTrophies(): number {
    return Object.values(this.data.characters).reduce((sum, c) => sum + c.trophies, 0);
  }

  getCurrencies(): { scarabs: number; stardust: number } {
    return { scarabs: this.data.scarabs, stardust: this.data.stardust };
  }

  getPendingSarcophagi(): number {
    return this.data.pendingSarcophagi;
  }

  getSelectedCharacter(): string {
    return this.data.selectedCharacter;
  }

  getStats(): Readonly<SaveData['stats']> {
    return this.data.stats;
  }

  /** Registra la fine di una partita: aggiunge le coppe al personaggio e salva subito. */
  recordMatch(characterId: string, place: number, trophies: number): MatchReward {
    const c = this.character(characterId);
    const before = c.trophies;
    c.trophies = Math.max(0, before + trophies);
    c.bestTrophies = Math.max(c.bestTrophies, c.trophies);
    this.data.stats.matches++;
    const sarcophagiWon = place === 1 ? SARCOPHAGI_PER_VICTORY : 0;
    if (place === 1) this.data.stats.victories++;
    this.data.pendingSarcophagi += sarcophagiWon;
    this.save();
    return {
      characterId,
      place,
      trophiesDelta: c.trophies - before,
      trophiesBefore: before,
      trophiesAfter: c.trophies,
      totalTrophies: this.getTotalTrophies(),
      sarcophagiWon,
    };
  }

  /**
   * Apre un sarcofago: ne toglie uno dalla pila e aggiunge subito i premi (e salva),
   * così se il gioco si chiude durante l'animazione i premi non vanno persi.
   * Restituisce false se non c'erano sarcofagi da aprire.
   */
  openSarcophagus(loot: SarcophagusLoot): boolean {
    if (this.data.pendingSarcophagi <= 0) return false;
    this.data.pendingSarcophagi--;
    this.data.scarabs += loot.scarabs;
    this.data.stardust += loot.stardust;
    this.save();
    return true;
  }
}

export const SaveManager = new SaveManagerImpl();
