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

export interface CharacterData {
  id: string;
  name: string;
  rarity: Rarity;
  maxHealth: number;
  speed: SpeedClass;
  weapon: WeaponData;
  super: SuperData;
}

export const CHARACTERS: Record<string, CharacterData> = {
  anubi: {
    id: 'anubi',
    name: 'Anubi',
    rarity: 'sabbia',
    maxHealth: 4200,
    speed: 'normale',
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

export function getCharacter(id: string): CharacterData {
  const data = CHARACTERS[id];
  if (!data) throw new Error(`Personaggio sconosciuto: ${id}`);
  return data;
}
