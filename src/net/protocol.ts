// I messaggi che si scambiano i telefoni nel multiplayer (tutti piccoli oggetti JSON con il campo `t`).

/** Un giocatore della stanza. `seat` = posto (0 = capo stanza). */
export interface Member {
  seat: number;
  name: string;
  characterId: string;
  level: number;
}

/**
 * Posizione di un giocatore: posto, x, y, velocità x, velocità y (numeri interi per mandare meno dati).
 * Quando la manda il capo stanza ci sono anche la vita e la carica della super (in centesimi).
 */
export type MotionTuple = [seat: number, x: number, y: number, vx: number, vy: number, health?: number, superPct?: number];

/** Un effetto deciso dal capo stanza su un personaggio (stessi nomi dei metodi di Player). */
export type NetEffect =
  | [kind: 'stordito', seconds: number, style: 'sarcofago' | 'stelle']
  | [kind: 'spinta', vx: number, vy: number]
  | [kind: 'corrente', vx: number, vy: number, seconds: number]
  | [kind: 'scivola', seconds: number]
  | [kind: 'velocita', name: string, seconds: number, factor: number]
  | [kind: 'confuso', seconds: number]
  | [kind: 'paura', x: number, y: number, seconds: number]
  | [kind: 'ritmo', name: string, seconds: number, factor: number]
  | [kind: 'cieco', seconds: number]
  | [kind: 'risorge'];

/** Chi entra → capo stanza: "ciao, sono io". */
export interface HelloMsg {
  t: 'ciao';
  protocol: number;
  name: string;
  characterId: string;
  level: number;
}

/** Capo stanza → chi entra: "sei dentro, il tuo posto è questo". */
export interface WelcomeMsg {
  t: 'benvenuto';
  seat: number;
  members: Member[];
}

/** Capo stanza → chi entra: "non puoi entrare". */
export interface RefuseMsg {
  t: 'no';
  reason: 'piena' | 'versione' | 'iniziata';
}

/** Capo stanza → tutti: la lista dei giocatori è cambiata. */
export interface MembersMsg {
  t: 'giocatori';
  members: Member[];
}

/** Cosa si gioca con gli amici. */
export type FriendsMode = 'allenamento' | 'solo' | 'duo';

/** Capo stanza → tutti: cosa ha scelto di giocare (e, nel Duo, chi sta in squadra con chi: liste di posti). */
export interface ChoiceMsg {
  t: 'scelta';
  mode: FriendsMode;
  teams: number[][];
}

/** Chi entra → capo stanza: sono nella stanza e pronto a partire (non sto più guardando i risultati). */
export interface ReadyMsg {
  t: 'pronto';
  ready: boolean;
}

/** Capo stanza → tutti: si parte! */
export interface StartMsg {
  t: 'via';
  mode: FriendsMode;
  teams: number[][];
  members: Member[];
}

/** Un personaggio della battaglia, uguale per tutti. `id`: 0-3 = posto di un amico, da 10 in su = bot. */
export interface FighterSetup {
  id: number;
  characterId: string;
  level: number;
  team: number;
  x: number;
  y: number;
  name: string;
}

/** Capo stanza → tutti: com'è fatta la battaglia (mappa e personaggi). */
export interface SetupMsg {
  t: 'partita';
  mode: 'solo' | 'duo';
  map: string;
  fighters: FighterSetup[];
}

/** Capo stanza → tutti: tempesta (secondi passati) e bauli colpiti ([numero del baule, vita]). */
export interface WorldMsg {
  t: 'mondo';
  storm: number;
  chests?: [index: number, health: number][];
}

/** Capo stanza → tutti: gioielli nuovi ([id, da x, da y, a x, a y]) e gioielli presi ([id, chi]). */
export interface GemsMsg {
  t: 'gioielli';
  add?: [id: number, fromX: number, fromY: number, x: number, y: number][];
  taken?: [id: number, fighter: number][];
}

/** Capo stanza → tutti: un amico ha finito la sua battaglia con questo posto in classifica. */
export interface PlaceMsg {
  t: 'piazzamento';
  seat: number;
  place: number;
}

/** Un giocatore → capo stanza: dove sono io adesso. */
export interface MotionMsg {
  t: 'mossa';
  m: MotionTuple;
}

/** Capo stanza → tutti: dove sono tutti adesso. */
export interface MotionsMsg {
  t: 'mosse';
  all: MotionTuple[];
}

/** Chi comanda un personaggio → tutti (passando dal capo stanza): ha iniziato un colpo (s = super). */
export interface SwingMsg {
  t: 'colpo';
  seat: number;
  a: number;
  d: number;
  s: boolean;
}

/** Capo stanza → tutti: effetti decisi nell'ultimo attimo ([posto, effetto]). */
export interface EffectsMsg {
  t: 'effetti';
  list: [seat: number, effect: NetEffect][];
}

/** Capo stanza → tutti: un giocatore sconfitto riappare in (x, y). */
export interface RespawnMsg {
  t: 'riappare';
  seat: number;
  x: number;
  y: number;
}

/** Capo stanza → tutti: si torna nella stanza (per esempio quando esce dall'Allenamento). */
export interface RoomMsg {
  t: 'stanza';
}

/** Chiunque, ogni tanto: "ci sono ancora" (quando non si mandano altri messaggi, per esempio nella stanza d'attesa). */
export interface PingMsg {
  t: 'eco';
}

/** Chiunque: "esco" (così gli altri lo sanno subito, senza aspettare). */
export interface ByeMsg {
  t: 'esco';
}

export type NetMessage =
  | HelloMsg
  | WelcomeMsg
  | RefuseMsg
  | MembersMsg
  | ChoiceMsg
  | ReadyMsg
  | StartMsg
  | SetupMsg
  | MotionMsg
  | MotionsMsg
  | SwingMsg
  | EffectsMsg
  | RespawnMsg
  | WorldMsg
  | GemsMsg
  | PlaceMsg
  | RoomMsg
  | PingMsg
  | ByeMsg;

/** Controlla (alla buona) che un dato arrivato dalla rete sia un nostro messaggio. */
export function isNetMessage(data: unknown): data is NetMessage {
  return typeof data === 'object' && data !== null && typeof (data as { t?: unknown }).t === 'string';
}
