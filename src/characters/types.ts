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
  /**
   * Attacco base nella direzione `angle` (radianti). `distance` = fin dove è stato mirato (pixel, per le armi
   * "a lancio"; le altre lo ignorano). Munizioni e ricarica le gestisce già Player.
   */
  attack(user: Player, angle: number, combat: Combat, distance: number): void;
  /**
   * Super nella direzione `angle`. `distance` = fin dove è stata mirata (pixel, per le super "a zona").
   * La carica la gestisce già Player.
   */
  useSuper(user: Player, angle: number, combat: Combat, distance: number): void;
}
