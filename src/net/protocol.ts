// I messaggi che si scambiano i telefoni nel multiplayer (tutti piccoli oggetti JSON con il campo `t`).

/** Un giocatore della stanza. `seat` = posto (0 = capo stanza). */
export interface Member {
  seat: number;
  name: string;
  characterId: string;
  level: number;
}

/** Posizione di un giocatore: posto, x, y, velocità x, velocità y (numeri interi per mandare meno dati). */
export type MotionTuple = [seat: number, x: number, y: number, vx: number, vy: number];

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

/** Capo stanza → tutti: si parte! */
export interface StartMsg {
  t: 'via';
  mode: 'allenamento';
  members: Member[];
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

/** Chiunque, ogni tanto: "ci sono ancora" (quando non si mandano altri messaggi, per esempio nella stanza d'attesa). */
export interface PingMsg {
  t: 'eco';
}

/** Chiunque: "esco" (così gli altri lo sanno subito, senza aspettare). */
export interface ByeMsg {
  t: 'esco';
}

export type NetMessage = HelloMsg | WelcomeMsg | RefuseMsg | MembersMsg | StartMsg | MotionMsg | MotionsMsg | PingMsg | ByeMsg;

/** Controlla (alla buona) che un dato arrivato dalla rete sia un nostro messaggio. */
export function isNetMessage(data: unknown): data is NetMessage {
  return typeof data === 'object' && data !== null && typeof (data as { t?: unknown }).t === 'string';
}
