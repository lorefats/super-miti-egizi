// UNICA fonte dei numeri dei personaggi (vedi docs/GAME_DESIGN.md, sezione 10).

export type Rarity = 'sabbia' | 'bronzo' | 'turchese' | 'lapislazzuli' | 'oro' | 'sole';
export type SpeedClass = 'lento' | 'normale' | 'veloce' | 'moltoVeloce';

/** Velocità di camminata in pixel al secondo. */
export const SPEED_VALUES: Record<SpeedClass, number> = {
  lento: 230,
  normale: 270,
  veloce: 310,
  moltoVeloce: 350,
};

/** Come si chiama ogni velocità nella schermata Personaggi. */
export const SPEED_NAMES: Record<SpeedClass, string> = {
  lento: 'Lento',
  normale: 'Normale',
  veloce: 'Veloce',
  moltoVeloce: 'Molto veloce',
};

/** Arma (attacco base). Per ora esiste solo la forma "arco" (colpo a ventaglio davanti al personaggio). */
export interface WeaponData {
  name: string;
  /** Danno di un colpo. */
  damage: number;
  /** Portata in pixel. */
  range: number;
  /** Ampiezza del ventaglio in gradi. */
  arcDegrees: number;
  /** Colpi pronti al massimo. */
  maxAmmo: number;
  /** Secondi per ricaricare UN colpo. */
  reloadSeconds: number;
  /** Secondi minimi tra un colpo e l'altro. */
  attackDelay: number;
}

/**
 * Super (si carica colpendo i nemici). `params` contiene i numeri propri della super di ogni personaggio
 * (ognuno ha una super diversa), così restano tutti qui nei dati.
 */
export interface SuperData {
  name: string;
  /** Danno da fare con l'attacco base per caricare la super al 100%. */
  chargeDamage: number;
  /** Portata in pixel (per la mira e per i bot). */
  range: number;
  /** Forma dell'indicatore di mira. */
  aim: 'linea';
  /** Larghezza della linea di mira (pixel). */
  aimWidth: number;
  params: Record<string, number>;
}

export type Role = 'tank' | 'assalto' | 'tiratore' | 'assassino' | 'supporto' | 'controllo' | 'lanciatore';

/** Nomi e simboli dei ruoli (sezione 10). */
export const ROLES: Record<Role, { name: string; icon: string }> = {
  tank: { name: 'Tank', icon: '🛡️' },
  assalto: { name: 'Assalto', icon: '⚔️' },
  tiratore: { name: 'Tiratore', icon: '🎯' },
  assassino: { name: 'Assassino', icon: '🗡️' },
  supporto: { name: 'Supporto', icon: '💚' },
  controllo: { name: 'Controllo', icon: '🌀' },
  lanciatore: { name: 'Lanciatore', icon: '💣' },
};

/** Rarità in ordine, con nome e colore della cornice (sezione 9). */
export const RARITIES: Record<Rarity, { name: string; color: number; order: number }> = {
  sabbia: { name: 'Sabbia', color: 0xd4a373, order: 0 },
  bronzo: { name: 'Bronzo', color: 0xcd7f32, order: 1 },
  turchese: { name: 'Turchese', color: 0x2ec4b6, order: 2 },
  lapislazzuli: { name: 'Lapislazzuli', color: 0x3f63d9, order: 3 },
  oro: { name: 'Oro', color: 0xf2b632, order: 4 },
  sole: { name: 'Sole', color: 0xff7b1c, order: 5 },
};

/** Scheda base di un personaggio: vale per tutti i 24, anche quelli non ancora giocabili. */
export interface RosterEntry {
  id: string;
  name: string;
  rarity: Rarity;
  roles: Role[];
  maxHealth: number;
  speed: SpeedClass;
  /** colore principale (per riconoscerlo anche da piccolo) */
  color: number;
  /** titolo che si ottiene con il Prestigio 1 (es. "Anubi — Guardiano Eterno") */
  title: string;
}

/** I 24 personaggi, nell'ordine della tabella della sezione 10. */
export const ROSTER: RosterEntry[] = [
  { id: 'anubi', name: 'Anubi', rarity: 'sabbia', roles: ['tank', 'supporto'], maxHealth: 4200, speed: 'normale', color: 0x2b2d42, title: 'Guardiano Eterno' },
  { id: 'horus', name: 'Horus', rarity: 'bronzo', roles: ['tiratore'], maxHealth: 2800, speed: 'normale', color: 0x3a86ff, title: 'Occhio del Cielo' },
  { id: 'osiride', name: 'Osiride', rarity: 'turchese', roles: ['supporto'], maxHealth: 3600, speed: 'lento', color: 0x4caf50, title: "Re dell'Aldilà" },
  { id: 'iside', name: 'Iside', rarity: 'lapislazzuli', roles: ['supporto'], maxHealth: 3200, speed: 'normale', color: 0x9b5de5, title: 'Grande Maga' },
  { id: 'ra', name: 'Rà', rarity: 'sole', roles: ['lanciatore'], maxHealth: 3400, speed: 'normale', color: 0xff9f1c, title: 'Signore del Sole' },
  { id: 'ammit', name: 'Ammit', rarity: 'oro', roles: ['assassino'], maxHealth: 3600, speed: 'veloce', color: 0x8d6e3f, title: 'Divoratrice Implacabile' },
  { id: 'amon', name: 'Amon', rarity: 'oro', roles: ['assassino'], maxHealth: 3000, speed: 'veloce', color: 0x1f3a93, title: 'Re Nascosto' },
  { id: 'seth', name: 'Seth', rarity: 'lapislazzuli', roles: ['controllo'], maxHealth: 3600, speed: 'normale', color: 0xe63946, title: 'Signore delle Tempeste' },
  { id: 'sobek', name: 'Sobek', rarity: 'bronzo', roles: ['tank'], maxHealth: 5200, speed: 'lento', color: 0x2a9d8f, title: 'Re del Nilo' },
  { id: 'hathor', name: 'Hathor', rarity: 'turchese', roles: ['supporto'], maxHealth: 3200, speed: 'normale', color: 0xff8fab, title: 'Dama della Gioia' },
  { id: 'maat', name: 'Maat', rarity: 'oro', roles: ['tiratore', 'controllo'], maxHealth: 3000, speed: 'normale', color: 0xf1faee, title: 'Custode della Verità' },
  { id: 'geb', name: 'Geb', rarity: 'turchese', roles: ['tank', 'controllo'], maxHealth: 5000, speed: 'lento', color: 0x6b8f3a, title: 'Padre della Terra' },
  { id: 'bastet', name: 'Bastet', rarity: 'bronzo', roles: ['assassino'], maxHealth: 3200, speed: 'moltoVeloce', color: 0xf4a261, title: 'Regina dei Gatti' },
  { id: 'sekhmet', name: 'Sekhmet', rarity: 'lapislazzuli', roles: ['assalto'], maxHealth: 3800, speed: 'normale', color: 0xd62828, title: 'Leonessa Furiosa' },
  { id: 'kek', name: 'Kek', rarity: 'oro', roles: ['controllo'], maxHealth: 3000, speed: 'normale', color: 0x6a4c93, title: 'Signore del Buio' },
  { id: 'khonsu', name: 'Khonsu', rarity: 'lapislazzuli', roles: ['assalto', 'controllo'], maxHealth: 3200, speed: 'normale', color: 0xbfc8e8, title: 'Viaggiatore della Luna' },
  { id: 'thoth', name: 'Thoth', rarity: 'oro', roles: ['tiratore'], maxHealth: 2800, speed: 'normale', color: 0x48cae4, title: 'Maestro della Sapienza' },
  { id: 'tefnut', name: 'Tefnut', rarity: 'bronzo', roles: ['assalto', 'supporto'], maxHealth: 3400, speed: 'normale', color: 0x00b4d8, title: 'Signora della Pioggia' },
  { id: 'khepri', name: 'Khepri', rarity: 'turchese', roles: ['assassino'], maxHealth: 3400, speed: 'veloce', color: 0x2ec4b6, title: "Scarabeo dell'Alba" },
  { id: 'nut', name: 'Nut', rarity: 'lapislazzuli', roles: ['lanciatore'], maxHealth: 2800, speed: 'normale', color: 0x3c096c, title: 'Madre delle Stelle' },
  { id: 'shu', name: 'Shu', rarity: 'bronzo', roles: ['controllo'], maxHealth: 3000, speed: 'veloce', color: 0xa8dadc, title: 'Respiro del Vento' },
  { id: 'khnum', name: 'Khnum', rarity: 'turchese', roles: ['lanciatore'], maxHealth: 3600, speed: 'normale', color: 0xb5651d, title: 'Vasaio degli Dèi' },
  { id: 'ptah', name: 'Ptah', rarity: 'lapislazzuli', roles: ['tank', 'lanciatore'], maxHealth: 3800, speed: 'lento', color: 0x588157, title: 'Grande Costruttore' },
  { id: 'nefti', name: 'Nefti', rarity: 'oro', roles: ['assassino'], maxHealth: 3000, speed: 'veloce', color: 0x5a189a, title: 'Signora della Notte' },
];

export function getRosterEntry(id: string): RosterEntry {
  const r = ROSTER.find((c) => c.id === id);
  if (!r) throw new Error(`Personaggio sconosciuto: ${id}`);
  return r;
}

/** Dati completi di un personaggio giocabile: scheda base + arma + super. */
export interface CharacterData extends RosterEntry {
  weapon: WeaponData;
  super: SuperData;
}

export const CHARACTERS: Record<string, CharacterData> = {
  anubi: {
    ...getRosterEntry('anubi'),
    weapon: {
      name: 'Scettro Uas',
      damage: 1000,
      range: 190,
      arcDegrees: 110,
      maxAmmo: 3,
      reloadSeconds: 1.3,
      attackDelay: 0.4,
    },
    super: {
      name: 'Bende del Sarcofago',
      chargeDamage: 4000, // 4 colpi a segno
      range: 620,
      aim: 'linea',
      aimWidth: 56,
      params: {
        /** velocità del fascio di bende (pixel al secondo) */
        projectileSpeed: 950,
        /** raggio del fascio per colpire (pixel) */
        projectileRadius: 28,
        /** secondi chiuso nel sarcofago (non si muove né attacca) */
        stunSeconds: 2,
        /** vite extra al massimo (si resuscita dal sarcofago) */
        maxExtraLives: 1,
        /** vita alla resurrezione (frazione della vita massima) */
        reviveHealth: 0.5,
        /** cura al compagno colpito e ad Anubi (frazione della vita massima) */
        allyHeal: 0.4,
        selfHeal: 0.25,
      },
    },
  },
};

/** Il personaggio si può già usare in partita (ha arma e super)? Gli altri arrivano nella Fase 4. */
export function isPlayable(id: string): boolean {
  return id in CHARACTERS;
}

export function getCharacter(id: string): CharacterData {
  const data = CHARACTERS[id];
  if (!data) throw new Error(`Personaggio sconosciuto: ${id}`);
  return data;
}
