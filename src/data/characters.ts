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

export interface CharacterData {
  id: string;
  name: string;
  rarity: Rarity;
  maxHealth: number;
  speed: SpeedClass;
  weapon: WeaponData;
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
  },
};

export function getCharacter(id: string): CharacterData {
  const data = CHARACTERS[id];
  if (!data) throw new Error(`Personaggio sconosciuto: ${id}`);
  return data;
}
