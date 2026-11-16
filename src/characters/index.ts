import type { CharacterModule } from './types';
import { anubi } from './anubi';

/** Elenco dei moduli personaggio: per aggiungerne uno basta importarlo e metterlo qui. */
const MODULES: Record<string, CharacterModule> = {
  [anubi.id]: anubi,
};

export function getCharacterModule(id: string): CharacterModule {
  const m = MODULES[id];
  if (!m) throw new Error(`Modulo personaggio mancante: ${id}`);
  return m;
}
