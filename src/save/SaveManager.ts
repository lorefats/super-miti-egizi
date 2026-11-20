/**
 * UNICO punto che legge e scrive i progressi sul telefono (localStorage).
 * I dati hanno un numero di versione: se in futuro cambiano forma, `migrate` porta
 * i salvataggi vecchi alla forma nuova senza perdere niente.
 */

import { ROSTER, isPlayable } from '../data/characters';
import { SOCCER } from '../data/soccer';
import {
  MAX_LEVEL,
  PRESTIGE_TROPHIES,
  ROAD_CHARACTERS,
  SARCOPHAGI,
  SARCOPHAGI_PER_VICTORY,
  TROPHY_ROAD,
  UPGRADE_COST,
  type GameMode,
  type RoadReward,
  type SarcophagusLoot,
  type SarcophagusTier,
} from '../data/progression';

const STORAGE_KEY = 'super-miti-egizi:salvataggio';
const CURRENT_VERSION = 3;
/** Il personaggio che hanno tutti fin dall'inizio. */
const STARTER = 'anubi';
/**
 * "?prova" nell'indirizzo: tutti i personaggi giocabili si possono scegliere, per provarli
 * (non vengono sbloccati davvero e non si possono potenziare).
 */
const TRY_ALL = typeof location !== 'undefined' && new URLSearchParams(location.search).has('prova');

export interface CharacterProgress {
  /** coppe attuali di questo personaggio (mai sotto zero) */
  trophies: number;
  /** il massimo di coppe mai raggiunto */
  bestTrophies: number;
  /** livello di potenziamento (1-11) */
  level: number;
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
  /** modalità scelta nella Lobby (Solo o Duo) */
  mode: GameMode;
  /** personaggi sbloccati (Anubi c'è sempre) */
  unlocked: string[];
  /** tappe del Cammino delle Coppe già ritirate (coppe della tappa) */
  roadClaimed: number[];
  /** sarcofagi di tipo deciso (dal Cammino), da aprire prima di quelli a sorpresa */
  sarcophagusQueue: SarcophagusTier[];
  /** Impostazioni: suoni, musica e vibrazione accesi o spenti */
  settings: Settings;
}

export interface Settings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
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
  /** il personaggio ha appena raggiunto il Prestigio 1 */
  prestigeReached: boolean;
}

/** Risultato di un tentativo di potenziamento. */
export type UpgradeResult = 'ok' | 'max' | 'scarabei' | 'polvere' | 'bloccato';

function emptySave(): SaveData {
  return {
    version: CURRENT_VERSION,
    characters: {},
    stats: { matches: 0, victories: 0 },
    scarabs: 0,
    stardust: 0,
    pendingSarcophagi: 0,
    selectedCharacter: STARTER,
    mode: 'solo',
    unlocked: [STARTER],
    roadClaimed: [],
    sarcophagusQueue: [],
    settings: { sound: true, music: true, vibration: true },
  };
}

/** Porta un salvataggio di qualsiasi versione alla versione attuale. */
function migrate(raw: unknown): SaveData {
  const data = emptySave();
  if (!raw || typeof raw !== 'object') return data;
  const r = raw as Partial<SaveData>;
  // copia solo i campi validi, così un dato rovinato non blocca il gioco.
  // Versione 1 → 2: arrivano livelli, personaggi sbloccati, Cammino delle Coppe e coda dei sarcofagi;
  // i campi che mancano prendono il valore di partenza (livello 1, solo Anubi, niente ritirato).
  const validIds = new Set(ROSTER.map((c) => c.id));
  if (r.characters && typeof r.characters === 'object') {
    for (const [id, c] of Object.entries(r.characters)) {
      const trophies = Math.max(0, Math.floor(Number(c?.trophies) || 0));
      const best = Math.max(trophies, Math.floor(Number(c?.bestTrophies) || 0));
      const level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(c?.level) || 1)));
      data.characters[id] = { trophies, bestTrophies: best, level };
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
  if (Array.isArray(r.unlocked)) {
    for (const id of r.unlocked) if (typeof id === 'string' && validIds.has(id) && !data.unlocked.includes(id)) data.unlocked.push(id);
  }
  if (Array.isArray(r.roadClaimed)) {
    const steps = new Set(TROPHY_ROAD.map((s) => s.trophies));
    data.roadClaimed = [...new Set(r.roadClaimed.map(Number).filter((t) => steps.has(t)))];
  }
  if (Array.isArray(r.sarcophagusQueue)) {
    const tiers = new Set<string>(SARCOPHAGI.map((s) => s.tier));
    data.sarcophagusQueue = r.sarcophagusQueue.filter((t): t is SarcophagusTier => tiers.has(t));
  }
  // Versione 2 → 3: arrivano le impostazioni (se mancano: tutto acceso)
  if (r.settings && typeof r.settings === 'object') {
    for (const k of ['sound', 'music', 'vibration'] as const) {
      if (typeof r.settings[k] === 'boolean') data.settings[k] = r.settings[k];
    }
  }
  if (r.mode === 'duo' || r.mode === 'calcio') data.mode = r.mode;
  const sel = r.selectedCharacter;
  if (typeof sel === 'string' && data.unlocked.includes(sel) && isPlayable(sel)) data.selectedCharacter = sel;
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
    return (this.data.characters[id] ??= { trophies: 0, bestTrophies: 0, level: 1 });
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

  /** Sarcofagi da aprire: quelli vinti più quelli presi nel Cammino. */
  getPendingSarcophagi(): number {
    return this.data.pendingSarcophagi + this.data.sarcophagusQueue.length;
  }

  /** Tipo del prossimo sarcofago da aprire, se è già deciso (viene dal Cammino). */
  nextSarcophagusTier(): SarcophagusTier | undefined {
    return this.data.sarcophagusQueue[0];
  }

  /** Modalità scelta nella Lobby. */
  getMode(): GameMode {
    // il Calcio si gioca solo con abbastanza coppe
    if (this.data.mode === 'calcio' && !this.isSoccerUnlocked()) return 'solo';
    return this.data.mode;
  }

  /** Il Calcio del Nilo è sbloccato (abbastanza coppe totali)? */
  isSoccerUnlocked(): boolean {
    return this.getTotalTrophies() >= SOCCER.unlockTrophies;
  }

  setMode(mode: GameMode): void {
    this.data.mode = mode;
    this.save();
  }

  getSelectedCharacter(): string {
    const id = this.data.selectedCharacter;
    return this.isUnlocked(id) && isPlayable(id) ? id : STARTER;
  }

  getSettings(): Readonly<Settings> {
    return this.data.settings;
  }

  setSetting(key: keyof Settings, on: boolean): void {
    this.data.settings[key] = on;
    this.save();
  }

  getStats(): Readonly<SaveData['stats']> {
    return this.data.stats;
  }

  // ------------------------------------------------------------ personaggi

  isUnlocked(id: string): boolean {
    return this.data.unlocked.includes(id) || (TRY_ALL && isPlayable(id));
  }

  /** Sceglie il personaggio per la Lobby e le partite (solo se sbloccato e giocabile). */
  selectCharacter(id: string): boolean {
    if (!this.isUnlocked(id) || !isPlayable(id)) return false;
    this.data.selectedCharacter = id;
    this.save();
    return true;
  }

  getLevel(id: string): number {
    return this.data.characters[id]?.level ?? 1;
  }

  getBestTrophies(id: string): number {
    return this.data.characters[id]?.bestTrophies ?? 0;
  }

  /** Prestigio 1: il personaggio è arrivato almeno una volta a 1000 coppe (e lo tiene per sempre). */
  hasPrestige(id: string): boolean {
    return this.getBestTrophies(id) >= PRESTIGE_TROPHIES;
  }

  /** Personaggi che si possono ancora trovare nei sarcofagi: giocabili, non sbloccati, non del Cammino. */
  getFindableCharacters(): string[] {
    return ROSTER.map((c) => c.id).filter((id) => isPlayable(id) && !this.isUnlocked(id) && !ROAD_CHARACTERS.includes(id));
  }

  /** Sale di un livello pagando scarabei e polvere di stelle. */
  upgrade(id: string): UpgradeResult {
    // con "?prova" si possono usare tutti, ma si potenziano solo quelli trovati davvero
    if (!this.data.unlocked.includes(id)) return 'bloccato';
    const level = this.getLevel(id);
    if (level >= MAX_LEVEL) return 'max';
    const cost = UPGRADE_COST[level + 1];
    if (this.data.scarabs < cost.scarabs) return 'scarabei';
    if (this.data.stardust < cost.stardust) return 'polvere';
    this.data.scarabs -= cost.scarabs;
    this.data.stardust -= cost.stardust;
    this.character(id).level = level + 1;
    this.save();
    return 'ok';
  }

  private unlock(id: string): void {
    if (!this.isUnlocked(id)) this.data.unlocked.push(id);
  }

  // ------------------------------------------------------------ cammino delle coppe

  isRoadClaimed(trophies: number): boolean {
    return this.data.roadClaimed.includes(trophies);
  }

  /** Quante tappe raggiunte aspettano di essere ritirate. */
  getClaimableRoadCount(): number {
    const total = this.getTotalTrophies();
    return TROPHY_ROAD.filter((s) => s.trophies <= total && !this.isRoadClaimed(s.trophies)).length;
  }

  /** Ritira il premio di una tappa (se raggiunta e non ancora presa). Restituisce il premio o null. */
  claimRoadReward(trophies: number): RoadReward | null {
    const step = TROPHY_ROAD.find((s) => s.trophies === trophies);
    if (!step || step.trophies > this.getTotalTrophies() || this.isRoadClaimed(trophies)) return null;
    const r = step.reward;
    if (r.kind === 'scarabei') this.data.scarabs += r.amount;
    else if (r.kind === 'polvere') this.data.stardust += r.amount;
    else if (r.kind === 'sarcofago') this.data.sarcophagusQueue.push(r.tier);
    else this.unlock(r.characterId);
    this.data.roadClaimed.push(trophies);
    this.save();
    return r;
  }

  /** Registra la fine di una partita: aggiunge le coppe al personaggio e salva subito. */
  recordMatch(characterId: string, place: number, trophies: number): MatchReward {
    const c = this.character(characterId);
    const before = c.trophies;
    const hadPrestige = this.hasPrestige(characterId);
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
      prestigeReached: !hadPrestige && this.hasPrestige(characterId),
    };
  }

  /**
   * Apre un sarcofago: ne toglie uno dalla pila (prima quelli del Cammino) e aggiunge subito i premi (e salva),
   * così se il gioco si chiude durante l'animazione i premi non vanno persi.
   * Restituisce false se non c'erano sarcofagi da aprire.
   */
  openSarcophagus(loot: SarcophagusLoot): boolean {
    if (this.data.sarcophagusQueue.length > 0) this.data.sarcophagusQueue.shift();
    else if (this.data.pendingSarcophagi > 0) this.data.pendingSarcophagi--;
    else return false;
    this.data.scarabs += loot.scarabs;
    this.data.stardust += loot.stardust;
    if (loot.characterId) this.unlock(loot.characterId);
    this.save();
    return true;
  }
}

export const SaveManager = new SaveManagerImpl();
