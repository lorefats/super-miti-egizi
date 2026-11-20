// Il "motore" audio: un solo AudioContext del browser e due canali (effetti e musica).
// Tutti i suoni del gioco sono generati qui dal codice (oscillatori e rumore): niente file da scaricare,
// quindi funzionano anche offline. Quando arriveranno suoni veri in public/assets/ basterà cambiare
// src/audio/Sound.ts, il resto del gioco non se ne accorge.

import { AUDIO } from '../data/audio';

let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

/** Crea l'AudioContext la prima volta che serve. Restituisce null se il browser non ha l'audio. */
export function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  sfxBus = ctx.createGain();
  sfxBus.gain.value = AUDIO.sfxVolume;
  sfxBus.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = AUDIO.musicVolume;
  musicBus.connect(ctx.destination);
  // un secondo di rumore bianco, riusato per sabbia, colpi, fruscii
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

/** L'audio è pronto a suonare (il browser lo sblocca solo dopo il primo tocco). */
export function audioRunning(): boolean {
  return !!ctx && ctx.state === 'running';
}

/**
 * I browser dei telefoni fanno partire l'audio solo dopo un tocco dello schermo:
 * al primo tocco (o tasto) lo sblocchiamo. Quando il gioco va in secondo piano l'audio si ferma.
 */
export function unlockAudioOnFirstTouch(): void {
  const unlock = () => {
    const c = audioContext();
    if (!c) return;
    if (c.state !== 'running') void c.resume();
    // su iPhone serve far suonare qualcosa dentro il tocco: un suono vuoto e cortissimo
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, c.sampleRate);
    src.connect(c.destination);
    src.start();
  };
  for (const ev of ['pointerdown', 'touchend', 'keydown']) window.addEventListener(ev, unlock, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
}

export type Bus = 'sfx' | 'music';

function bus(which: Bus): GainNode {
  return (which === 'music' ? musicBus : sfxBus)!;
}

export interface ToneOptions {
  type?: OscillatorType;
  /** volume (0-1) */
  vol?: number;
  /** la nota scivola fino a questa frequenza */
  to?: number;
  /** secondi di ritardo dall'istante `at` */
  delay?: number;
  /** secondi per arrivare al volume pieno */
  attack?: number;
  /** istante assoluto (tempo dell'AudioContext); se manca, adesso */
  at?: number;
  bus?: Bus;
}

/** Una nota: sale in fretta e poi si spegne piano (come una corda pizzicata o un "bip"). */
export function tone(freq: number, dur: number, o: ToneOptions = {}): void {
  const c = ctx;
  if (!c) return;
  const t = (o.at ?? c.currentTime) + (o.delay ?? 0);
  const osc = c.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  const g = c.createGain();
  const vol = o.vol ?? 0.3;
  const attack = o.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.01));
  osc.connect(g).connect(bus(o.bus ?? 'sfx'));
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export interface NoiseOptions extends Omit<ToneOptions, 'type'> {
  /** frequenza del filtro */
  freq?: number;
  filter?: BiquadFilterType;
  /** quanto è "stretto" il filtro (bandpass) */
  q?: number;
}

/** Un soffio di rumore filtrato: fruscii, sabbia, colpi, tamburi. */
export function noise(dur: number, o: NoiseOptions = {}): void {
  const c = ctx;
  if (!c || !noiseBuffer) return;
  const t = (o.at ?? c.currentTime) + (o.delay ?? 0);
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = o.filter ?? 'bandpass';
  f.frequency.setValueAtTime(o.freq ?? 1000, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  f.Q.value = o.q ?? 1;
  const g = c.createGain();
  const vol = o.vol ?? 0.3;
  const attack = o.attack ?? 0.004;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.01));
  src.connect(f).connect(g).connect(bus(o.bus ?? 'sfx'));
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

/** Una nota lunga che resta finché non la si spegne (il "bordone" della musica). Restituisce la funzione per spegnerla. */
export function drone(freq: number, vol: number, which: Bus = 'music'): () => void {
  const c = ctx;
  if (!c) return () => {};
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const osc2 = c.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = freq * 2.003; // un'ottava sopra, appena stonata: suono più caldo
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 1.5);
  const g2 = c.createGain();
  g2.gain.value = 0.25;
  osc.connect(g);
  osc2.connect(g2).connect(g);
  g.connect(bus(which));
  osc.start(t);
  osc2.start(t);
  return () => {
    const now = c.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.stop(now + 0.7);
    osc2.stop(now + 0.7);
  };
}
