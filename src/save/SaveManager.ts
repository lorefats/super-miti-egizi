/**
 * UNICO punto che legge e scrive i progressi sul telefono (localStorage).
 * I dati hanno un numero di versione: se in futuro cambiano forma, `migrate` porta
 * i salvataggi vecchi alla forma nuova senza perdere niente.
 */

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
}

function emptySave(): SaveData {
  return { version: CURRENT_VERSION, characters: {}, stats: { matches: 0, victories: 0 } };
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
    if (place === 1) this.data.stats.victories++;
    this.save();
    return {
      characterId,
      place,
      trophiesDelta: c.trophies - before,
      trophiesBefore: before,
      trophiesAfter: c.trophies,
      totalTrophies: this.getTotalTrophies(),
    };
  }
}

export const SaveManager = new SaveManagerImpl();
