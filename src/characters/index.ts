import type { CharacterModule } from './types';
import { anubi } from './anubi';
import { horus } from './horus';
import { sobek } from './sobek';
import { bastet } from './bastet';
import { tefnut } from './tefnut';
import { shu } from './shu';

/** Elenco dei moduli personaggio: per aggiungerne uno basta importarlo e metterlo qui. */
const MODULES: Record<string, CharacterModule> = Object.fromEntries(
  [anubi, horus, sobek, bastet, tefnut, shu].map((m) => [m.id, m]),
);

export function getCharacterModule(id: string): CharacterModule {
  const m = MODULES[id];
  if (!m) throw new Error(`Modulo personaggio mancante: ${id}`);
  return m;
}
