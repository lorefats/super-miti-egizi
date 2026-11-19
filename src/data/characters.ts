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

/**
 * Forma dell'arma (serve per l'indicatore di mira):
 * - "ventaglio": colpo ravvicinato davanti al personaggio (usa `arcDegrees`)
 * - "linea": tiro dritto, come una freccia o un getto (usa `aimWidth`)
 * - "lancio": tiro a parabola sopra i muri, in un punto fino a `range` (`aimWidth` = diametro dello scoppio)
 */
export type WeaponKind = 'ventaglio' | 'linea' | 'lancio';

/** Arma (attacco base). */
export interface WeaponData {
  name: string;
  kind: WeaponKind;
  /** Danno di un colpo. */
  damage: number;
  /** Portata in pixel. */
  range: number;
  /** Ampiezza del ventaglio in gradi (solo "ventaglio"). */
  arcDegrees: number;
  /** Larghezza della linea di mira in pixel (solo "linea"). */
  aimWidth: number;
  /** Colpi pronti al massimo. */
  maxAmmo: number;
  /** Secondi per ricaricare UN colpo. */
  reloadSeconds: number;
  /** Secondi minimi tra un colpo e l'altro. */
  attackDelay: number;
  /** Numeri propri dell'arma di ogni personaggio (spinta, velocità della freccia...). */
  params: Record<string, number>;
}

/**
 * Come si mira la super:
 * - "linea": in linea dritta (larga `aimWidth`)
 * - "zona": un cerchio da mettere dove si vuole, fino a `range` (`aimWidth` = diametro del cerchio)
 * - "sestesso": non si mira, agisce sul personaggio
 */
export type SuperAim = 'linea' | 'zona' | 'sestesso';

/**
 * Super (si carica colpendo i nemici). `params` contiene i numeri propri della super di ogni personaggio
 * (ognuno ha una super diversa), così restano tutti qui nei dati.
 */
export interface SuperData {
  name: string;
  /** Danno da fare con l'attacco base per caricare la super al 100%. */
  chargeDamage: number;
  /** Portata in pixel (per la mira e per i bot: la usano quando un nemico è più vicino di così). */
  range: number;
  /** Forma dell'indicatore di mira. */
  aim: SuperAim;
  /** Larghezza della linea di mira, o diametro della zona (pixel). */
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
      kind: 'ventaglio',
      damage: 1000,
      range: 190,
      arcDegrees: 110,
      aimWidth: 0,
      maxAmmo: 3,
      reloadSeconds: 1.3,
      attackDelay: 0.4,
      params: {},
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
  horus: {
    ...getRosterEntry('horus'),
    weapon: {
      name: 'Arco del Falco',
      kind: 'linea',
      damage: 560, // da vicino; più vola lontano, più fa danno
      range: 900,
      arcDegrees: 0,
      aimWidth: 26,
      maxAmmo: 3,
      reloadSeconds: 1.6,
      attackDelay: 0.45,
      params: {
        /** velocità della freccia (pixel al secondo) */
        arrowSpeed: 1500,
        /** raggio della freccia per colpire (pixel) */
        arrowRadius: 16,
        /** danno in più a fine portata (0.8 = +80%) */
        farBonus: 0.8,
      },
    },
    super: {
      name: 'Occhio di Horus',
      chargeDamage: 3200,
      range: 900,
      aim: 'sestesso',
      aimWidth: 0,
      params: {
        /** secondi in cui vede tutti i nemici (anche nei cespugli) e le frecce li attraversano */
        seconds: 5,
      },
    },
  },
  sobek: {
    ...getRosterEntry('sobek'),
    weapon: {
      name: 'Fauci del Fiume',
      kind: 'ventaglio',
      damage: 1400,
      range: 160,
      arcDegrees: 70,
      aimWidth: 0,
      maxAmmo: 3,
      reloadSeconds: 1.5,
      attackDelay: 0.55,
      params: {},
    },
    super: {
      name: 'Ondata del Nilo',
      chargeDamage: 4200, // 3 morsi a segno
      range: 650,
      aim: 'zona',
      aimWidth: 400,
      params: {
        /** distanza minima del tuffo (pixel) */
        minDistance: 120,
        /** velocità sotto terra (pixel al secondo) */
        diveSpeed: 1100,
        /** raggio dell'onda quando riemerge (pixel) */
        waveRadius: 200,
        /** danno dell'onda */
        damage: 1200,
        /** quanto forte spinge via i nemici (pixel al secondo) */
        push: 900,
      },
    },
  },
  bastet: {
    ...getRosterEntry('bastet'),
    weapon: {
      name: 'Artigli Gemelli',
      kind: 'ventaglio',
      damage: 420, // per ogni graffio
      range: 135,
      arcDegrees: 90,
      aimWidth: 0,
      maxAmmo: 3,
      reloadSeconds: 0.85,
      attackDelay: 0.28,
      params: {
        /** graffi per ogni attacco */
        scratches: 2,
        /** secondi tra un graffio e l'altro */
        gapSeconds: 0.1,
      },
    },
    super: {
      name: 'Balzo Felino',
      chargeDamage: 3400,
      range: 600,
      aim: 'linea',
      aimWidth: 70,
      params: {
        /** durata del salto (secondi) */
        leapSeconds: 0.4,
        /** quanto sale in aria (pixel) */
        leapHeight: 70,
        /** cerca un nemico entro questo angolo dalla mira (gradi) */
        aimCone: 25,
        /** chi è vicino quando atterra resta stordito (secondi) */
        stunSeconds: 1,
        landRadius: 130,
        /** graffi veloci dopo l'atterraggio */
        scratches: 3,
        scratchDamage: 380,
        scratchGap: 0.12,
      },
    },
  },
  tefnut: {
    ...getRosterEntry('tefnut'),
    weapon: {
      name: "Getto d'Acqua",
      kind: 'linea',
      damage: 640,
      range: 360,
      arcDegrees: 0,
      aimWidth: 54,
      maxAmmo: 3,
      reloadSeconds: 1.1,
      attackDelay: 0.35,
      params: {
        /** quanto spinge indietro i nemici (pixel al secondo) */
        push: 520,
      },
    },
    super: {
      name: 'Pioggia Sacra',
      chargeDamage: 3800,
      range: 620,
      aim: 'zona',
      aimWidth: 460,
      params: {
        /** quanto dura la pioggia (secondi) */
        seconds: 5,
        radius: 230,
        /** cura ai compagni dentro (frazione della vita massima al secondo) */
        healPerSecond: 0.08,
        /** i nemici dentro scivolano (secondi, si rinnova finché restano sotto la pioggia) */
        slipSeconds: 0.6,
      },
    },
  },
  shu: {
    ...getRosterEntry('shu'),
    weapon: {
      name: 'Folata',
      kind: 'ventaglio',
      damage: 620,
      range: 300,
      arcDegrees: 50,
      aimWidth: 0,
      maxAmmo: 3,
      reloadSeconds: 1.2,
      attackDelay: 0.4,
      params: {
        /** quanto spinge indietro i nemici (pixel al secondo) */
        push: 700,
      },
    },
    super: {
      name: 'Tornado',
      chargeDamage: 3600,
      range: 700,
      aim: 'linea',
      aimWidth: 110,
      params: {
        /** velocità del tornado (pixel al secondo) */
        speed: 170,
        /** da quanto lontano risucchia i nemici (pixel) */
        pullRadius: 240,
        /** forza del risucchio e del giro (pixel al secondo) */
        pull: 230,
        spin: 200,
        /** chi è dentro il tornado prende danno */
        hitRadius: 90,
        damagePerSecond: 700,
      },
    },
  },
  osiride: {
    ...getRosterEntry('osiride'),
    weapon: {
      name: 'Flagello e Pastorale',
      kind: 'ventaglio',
      damage: 780,
      range: 230,
      arcDegrees: 80,
      aimWidth: 0,
      maxAmmo: 3,
      reloadSeconds: 1.3,
      attackDelay: 0.45,
      params: {
        /** chi viene colpito va più piano per qualche secondo */
        slowSeconds: 1.2,
        /** velocità dei nemici rallentati (0.7 = 70%) */
        slowFactor: 0.7,
      },
    },
    super: {
      name: 'Rinascita del Nilo',
      chargeDamage: 3600,
      range: 600,
      aim: 'zona',
      aimWidth: 480,
      params: {
        /** quanto dura il campo di grano (secondi) */
        seconds: 6,
        radius: 240,
        /** cura ai compagni dentro (frazione della vita massima al secondo) */
        healPerSecond: 0.07,
        /** velocità dei nemici dentro il campo */
        slowFactor: 0.55,
      },
    },
  },
  hathor: {
    ...getRosterEntry('hathor'),
    weapon: {
      name: 'Sistro Sonoro',
      kind: 'linea',
      damage: 620,
      range: 760, // strada totale, anche dopo i rimbalzi
      arcDegrees: 0,
      aimWidth: 40,
      maxAmmo: 3,
      reloadSeconds: 1.3,
      attackDelay: 0.4,
      params: {
        /** velocità dell'onda sonora (pixel al secondo) */
        speed: 900,
        radius: 24,
        /** quante volte rimbalza sui muri */
        bounces: 2,
      },
    },
    super: {
      name: 'Danza della Gioia',
      chargeDamage: 3400,
      range: 320, // i bot la usano quando un nemico è più vicino di così
      aim: 'sestesso',
      aimWidth: 0,
      params: {
        /** quanto dura la musica (secondi) */
        seconds: 5,
        /** fin dove arriva la musica attorno a lei */
        radius: 320,
        /** velocità dei compagni (1.3 = +30%) */
        speedFactor: 1.3,
        /** cura ai compagni (frazione della vita massima al secondo) */
        healPerSecond: 0.06,
      },
    },
  },
  geb: {
    ...getRosterEntry('geb'),
    weapon: {
      name: 'Pugno di Roccia',
      kind: 'linea',
      damage: 900,
      range: 420,
      arcDegrees: 0,
      aimWidth: 70,
      maxAmmo: 3,
      reloadSeconds: 1.5,
      attackDelay: 0.5,
      params: {
        /** velocità dell'onda d'urto nel terreno (pixel al secondo) */
        waveSpeed: 1100,
      },
    },
    super: {
      name: 'Prigione di Pietra',
      chargeDamage: 4200,
      range: 600,
      aim: 'zona',
      aimWidth: 340,
      params: {
        /** raggio dell'anello di rocce */
        radius: 170,
        /** quanto restano le rocce (secondi) */
        seconds: 3,
        /** danno a chi è dentro quando spuntano le rocce */
        damage: 600,
      },
    },
  },
  khepri: {
    ...getRosterEntry('khepri'),
    weapon: {
      name: 'Palla di Sabbia',
      kind: 'linea',
      damage: 480, // all'inizio; la palla cresce e fa più danno mentre rotola
      range: 560,
      arcDegrees: 0,
      aimWidth: 50,
      maxAmmo: 3,
      reloadSeconds: 1.2,
      attackDelay: 0.4,
      params: {
        /** velocità della palla (pixel al secondo) */
        speed: 650,
        radius: 18,
        /** quanto cresce a fine strada (1.2 = +120% di grandezza) */
        grow: 1.2,
        /** danno in più a fine strada (1 = +100%) */
        farBonus: 1,
      },
    },
    super: {
      name: "Rinascita dell'Alba",
      chargeDamage: 3400,
      range: 500, // i bot la usano quando un nemico è più vicino di così
      aim: 'sestesso',
      aimWidth: 0,
      params: {
        /** secondi sotto terra (non si può colpire) */
        seconds: 3,
        /** velocità sotto terra (1.6 = +60%) */
        speedFactor: 1.6,
        /** esplosione di sabbia quando riemerge */
        radius: 180,
        damage: 1400,
        push: 600,
      },
    },
  },
  khnum: {
    ...getRosterEntry('khnum'),
    weapon: {
      name: "Vasi d'Argilla",
      kind: 'linea',
      damage: 700,
      range: 520,
      arcDegrees: 0,
      aimWidth: 34,
      maxAmmo: 3,
      reloadSeconds: 1.4,
      attackDelay: 0.45,
      params: {
        /** velocità del vaso (pixel al secondo) */
        speed: 800,
        radius: 20,
        /** schegge quando si rompe, e il loro danno e la loro portata */
        shards: 6,
        shardDamage: 220,
        shardRange: 150,
        shardSpeed: 600,
      },
    },
    super: {
      name: "Golem d'Argilla",
      chargeDamage: 3800,
      range: 400,
      aim: 'zona',
      aimWidth: 120,
      params: {
        /** quanto resta il golem (secondi) */
        seconds: 10,
        health: 3000,
        speed: 230,
        /** pugno del golem */
        damage: 650,
        punchRange: 110,
        punchDelay: 0.9,
        /** da quanto lontano vede i nemici */
        sight: 650,
      },
    },
  },
  iside: {
    ...getRosterEntry('iside'),
    weapon: {
      name: 'Ankh Luminoso',
      kind: 'linea',
      damage: 640,
      range: 620,
      arcDegrees: 0,
      aimWidth: 34,
      maxAmmo: 3,
      reloadSeconds: 1.3,
      attackDelay: 0.4,
      params: {
        /** velocità dell'ankh (pixel al secondo) */
        speed: 1000,
        radius: 20,
        /** dopo aver colpito rimbalza su un altro nemico entro questa distanza */
        chainRange: 300,
        /** danno del rimbalzo (0.7 = 70%) */
        chainDamage: 0.7,
      },
    },
    super: {
      name: 'Ali Protettrici',
      chargeDamage: 3400,
      range: 400, // i bot la usano quando un nemico è più vicino di così
      aim: 'sestesso',
      aimWidth: 0,
      params: {
        /** quanto dura la cupola che blocca i proiettili (secondi) */
        seconds: 3,
        radius: 210,
      },
    },
  },
  seth: {
    ...getRosterEntry('seth'),
    weapon: {
      name: 'Lancia del Caos',
      kind: 'linea',
      damage: 720,
      range: 560,
      arcDegrees: 0,
      aimWidth: 30,
      maxAmmo: 3,
      reloadSeconds: 1.4,
      attackDelay: 0.45,
      params: {
        /** velocità della lancia (pixel al secondo) */
        speed: 1100,
        radius: 18,
        /** alla fine si divide in pezzi */
        pieces: 3,
        pieceDamage: 300,
        pieceRange: 220,
        /** apertura dei pezzi (gradi) */
        spreadDegrees: 50,
      },
    },
    super: {
      name: 'Tempesta di Sabbia',
      chargeDamage: 3800,
      range: 620,
      aim: 'zona',
      aimWidth: 520,
      params: {
        /** quanto dura la tempesta (secondi) */
        seconds: 5,
        radius: 260,
        /** danno al secondo a chi è dentro */
        damagePerSecond: 380,
      },
    },
  },
  sekhmet: {
    ...getRosterEntry('sekhmet'),
    weapon: {
      name: 'Soffio Ardente',
      kind: 'ventaglio',
      damage: 300, // per ogni fiammata
      range: 230,
      arcDegrees: 36,
      aimWidth: 0,
      maxAmmo: 3,
      reloadSeconds: 1.2,
      attackDelay: 0.4,
      params: {
        /** fiammate per ogni attacco e secondi tra una e l'altra */
        bursts: 3,
        gapSeconds: 0.09,
      },
    },
    super: {
      name: 'Furia della Leonessa',
      chargeDamage: 3600,
      range: 300, // i bot la usano quando un nemico è più vicino di così
      aim: 'sestesso',
      aimWidth: 0,
      params: {
        /** i nemici entro questo raggio scappano per un po' */
        roarRadius: 320,
        fearSeconds: 1.5,
        /** poi per qualche secondo attacca più veloce (2 = il doppio) */
        furySeconds: 5,
        furyRate: 2,
      },
    },
  },
  khonsu: {
    ...getRosterEntry('khonsu'),
    weapon: {
      name: 'Falce Lunare',
      kind: 'linea',
      damage: 520, // all'andata e di nuovo al ritorno
      range: 460,
      arcDegrees: 0,
      aimWidth: 48,
      maxAmmo: 3,
      reloadSeconds: 1.4,
      attackDelay: 0.45,
      params: {
        /** velocità della falce (pixel al secondo) */
        speed: 820,
        radius: 26,
      },
    },
    super: {
      name: 'Eclissi',
      chargeDamage: 3600,
      range: 600,
      aim: 'zona',
      aimWidth: 500,
      params: {
        /** quanto dura il rallentatore (secondi) */
        seconds: 3,
        radius: 250,
        /** velocità e rapidità di attacco dei nemici dentro (0.4 = al 40%) */
        slowFactor: 0.4,
      },
    },
  },
  nut: {
    ...getRosterEntry('nut'),
    weapon: {
      name: 'Stelle Cadenti',
      kind: 'lancio',
      damage: 820,
      range: 560,
      arcDegrees: 0,
      aimWidth: 140, // diametro dello scoppio
      maxAmmo: 3,
      reloadSeconds: 1.5,
      attackDelay: 0.5,
      params: {
        /** secondi di volo della stella */
        flightSeconds: 0.6,
        /** quanto sale in alto la parabola (pixel) */
        arcHeight: 170,
      },
    },
    super: {
      name: 'Volta Celeste',
      chargeDamage: 3800,
      range: 650,
      aim: 'zona',
      aimWidth: 560,
      params: {
        /** secondi di avviso prima che cadano le meteore */
        warnSeconds: 1,
        radius: 280,
        meteors: 10,
        /** secondi in cui cadono tutte le meteore */
        rainSeconds: 1.2,
        meteorRadius: 90,
        meteorDamage: 520,
      },
    },
  },
  ptah: {
    ...getRosterEntry('ptah'),
    weapon: {
      name: 'Martello del Creatore',
      kind: 'linea',
      damage: 950,
      range: 540,
      arcDegrees: 0,
      aimWidth: 36,
      maxAmmo: 3,
      reloadSeconds: 1.5,
      attackDelay: 0.5,
      params: {
        /** velocità del martello (pixel al secondo) */
        speed: 850,
        radius: 22,
        /** rimbalzi sui muri */
        bounces: 1,
      },
    },
    super: {
      name: 'Obelisco Guardiano',
      chargeDamage: 4000,
      range: 350,
      aim: 'zona',
      aimWidth: 120,
      params: {
        /** quanto resta l'obelisco (secondi) */
        seconds: 12,
        health: 2600,
        /** raggi: danno, distanza e ogni quanto spara */
        damage: 360,
        shootRange: 480,
        shootDelay: 0.8,
      },
    },
  },
  ammit: {
    ...getRosterEntry('ammit'),
    weapon: {
      name: 'Morsi Rapidi',
      kind: 'ventaglio',
      damage: 340, // per ogni morso
      range: 145,
      arcDegrees: 70,
      aimWidth: 0,
      maxAmmo: 3,
      reloadSeconds: 1,
      attackDelay: 0.32,
      params: {
        /** morsi per ogni attacco e secondi tra uno e l'altro */
        bites: 3,
        gapSeconds: 0.08,
      },
    },
    super: {
      name: 'Divora-Cuori',
      chargeDamage: 3600,
      range: 460,
      aim: 'linea',
      aimWidth: 90,
      params: {
        /** durata dello scatto (secondi) */
        dashSeconds: 0.35,
        /** morso alla fine dello scatto */
        damage: 1700,
        biteRadius: 120,
        /** se sconfigge qualcuno: si cura tutta e diventa più grande per un po' */
        growSeconds: 5,
        growScale: 1.35,
      },
    },
  },
  amon: {
    ...getRosterEntry('amon'),
    weapon: {
      name: 'Piume del Vento',
      kind: 'linea',
      damage: 420, // per ogni piuma
      range: 600,
      arcDegrees: 0,
      aimWidth: 40,
      maxAmmo: 3,
      reloadSeconds: 1.2,
      attackDelay: 0.4,
      params: {
        /** piume per ogni attacco e quanto si aprono (gradi) */
        feathers: 2,
        spreadDegrees: 22,
        speed: 900,
        radius: 18,
        /** quanto curvano verso il nemico (radianti al secondo) e da quanto lontano lo sentono */
        turnRate: 4,
        homingRange: 380,
      },
    },
    super: {
      name: 'Il Nascosto',
      chargeDamage: 3200,
      range: 500, // i bot la usano quando un nemico è più vicino di così
      aim: 'sestesso',
      aimWidth: 0,
      params: {
        /** secondi da invisibile */
        seconds: 4,
        /** il primo colpo dopo fa più danno (2 = doppio), se arriva entro qualche secondo */
        nextHitFactor: 2,
        nextHitSeconds: 7,
      },
    },
  },
  maat: {
    ...getRosterEntry('maat'),
    weapon: {
      name: 'Piuma della Verità',
      kind: 'linea',
      damage: 620,
      range: 860,
      arcDegrees: 0,
      aimWidth: 24,
      maxAmmo: 3,
      reloadSeconds: 1.6,
      attackDelay: 0.45,
      params: {
        speed: 1500,
        radius: 16,
        /** danno in più contro chi ha più vita di lei, in percentuale (0.6 = +60%) */
        justiceBonus: 0.6,
      },
    },
    super: {
      name: 'La Bilancia',
      chargeDamage: 3400,
      range: 650,
      aim: 'linea',
      aimWidth: 80,
      params: {
        /** cerca un nemico entro questo angolo dalla mira (gradi) */
        aimCone: 30,
        /** al massimo quanta vita si scambia (0.5 = 50%) */
        maxSwap: 0.5,
      },
    },
  },
  kek: {
    ...getRosterEntry('kek'),
    weapon: {
      name: "Bolle d'Ombra",
      kind: 'linea',
      damage: 640,
      range: 540,
      arcDegrees: 0,
      aimWidth: 52,
      maxAmmo: 3,
      reloadSeconds: 1.3,
      attackDelay: 0.45,
      params: {
        /** le bolle sono lente */
        speed: 460,
        radius: 26,
        /** chi viene colpito va più piano */
        slowSeconds: 1.5,
        slowFactor: 0.6,
      },
    },
    super: {
      name: 'Notte Primordiale',
      chargeDamage: 3800,
      range: 700, // i bot la usano quando un nemico è più vicino di così
      aim: 'sestesso',
      aimWidth: 0,
      params: {
        /** secondi di buio per i nemici (Kek vede tutto) */
        seconds: 5,
      },
    },
  },
  thoth: {
    ...getRosterEntry('thoth'),
    weapon: {
      name: 'Raffica di Geroglifici',
      kind: 'linea',
      damage: 330, // per ogni geroglifico
      range: 680,
      arcDegrees: 0,
      aimWidth: 30,
      maxAmmo: 3,
      reloadSeconds: 1.4,
      attackDelay: 0.5,
      params: {
        glyphs: 3,
        gapSeconds: 0.12,
        speed: 1100,
        radius: 18,
      },
    },
    super: {
      name: 'Libro di Thoth',
      chargeDamage: 3400,
      range: 600,
      aim: 'linea',
      aimWidth: 60,
      params: {
        /** se nessun nemico l'ha ancora colpito: cerchio di geroglifici tutto attorno */
        ringGlyphs: 12,
        ringDamage: 420,
      },
    },
  },
  nefti: {
    ...getRosterEntry('nefti'),
    weapon: {
      name: 'Lame del Crepuscolo',
      kind: 'linea',
      damage: 360, // per ogni lama
      range: 400,
      arcDegrees: 0,
      aimWidth: 90,
      maxAmmo: 3,
      reloadSeconds: 1.1,
      attackDelay: 0.4,
      params: {
        blades: 3,
        spreadDegrees: 28,
        speed: 1000,
        radius: 18,
      },
    },
    super: {
      name: "Passo nell'Ombra",
      chargeDamage: 3200,
      range: 650,
      aim: 'sestesso',
      aimWidth: 0,
      params: {
        /** atterra dietro al nemico, a questa distanza */
        behindGap: 75,
        /** il colpo successivo fa più danno (1.6 = +60%), se arriva entro qualche secondo */
        nextHitFactor: 1.6,
        nextHitSeconds: 4,
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
