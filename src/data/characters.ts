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

export interface CharacterData {
  id: string;
  name: string;
  rarity: Rarity;
  maxHealth: number;
  speed: SpeedClass;
}

export const CHARACTERS: Record<string, CharacterData> = {
  anubi: {
    id: 'anubi',
    name: 'Anubi',
    rarity: 'sabbia',
    maxHealth: 4200,
    speed: 'normale',
  },
};

export function getCharacter(id: string): CharacterData {
  const data = CHARACTERS[id];
  if (!data) throw new Error(`Personaggio sconosciuto: ${id}`);
  return data;
}
