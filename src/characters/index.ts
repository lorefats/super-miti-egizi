import type { CharacterModule } from './types';
import { anubi } from './anubi';
import { horus } from './horus';
import { sobek } from './sobek';
import { bastet } from './bastet';
import { tefnut } from './tefnut';
import { shu } from './shu';
import { osiride } from './osiride';
import { hathor } from './hathor';
import { geb } from './geb';
import { khepri } from './khepri';
import { khnum } from './khnum';
import { iside } from './iside';
import { seth } from './seth';
import { sekhmet } from './sekhmet';
import { khonsu } from './khonsu';
import { nut } from './nut';
import { ptah } from './ptah';
import { ammit } from './ammit';
import { amon } from './amon';
import { maat } from './maat';
import { kek } from './kek';
import { thoth } from './thoth';
import { nefti } from './nefti';

/** Elenco dei moduli personaggio: per aggiungerne uno basta importarlo e metterlo qui. */
const MODULES: Record<string, CharacterModule> = Object.fromEntries(
  [anubi, horus, sobek, bastet, tefnut, shu, osiride, hathor, geb, khepri, khnum, iside, seth, sekhmet, khonsu, nut, ptah, ammit, amon, maat, kek, thoth, nefti].map((m) => [m.id, m]),
);

export function getCharacterModule(id: string): CharacterModule {
  const m = MODULES[id];
  if (!m) throw new Error(`Modulo personaggio mancante: ${id}`);
  return m;
}
