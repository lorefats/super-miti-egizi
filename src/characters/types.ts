import type { Combat } from '../entities/Combat';
import type { Player } from '../entities/Player';

/**
 * Ogni personaggio è un modulo che implementa questa interfaccia.
 * La partita non conosce i singoli personaggi: chiama solo questi metodi.
 */
export interface CharacterModule {
  id: string;
  /** Secondi di "carica" prima che parta il colpo (l'arma si alza all'indietro). */
  swingSeconds: number;
  /** Attacco base nella direzione `angle` (radianti). Munizioni e ricarica le gestisce già Player. */
  attack(user: Player, angle: number, combat: Combat): void;
  /** Super nella direzione `angle`. La carica la gestisce già Player. */
  useSuper(user: Player, angle: number, combat: Combat): void;
}
