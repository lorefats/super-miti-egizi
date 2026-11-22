// "Aggiungi a Home": il gioco si installa sul telefono come un'app vera.
// Su Android (Chrome) il browser ci dà un evento da usare quando il giocatore tocca il pulsante;
// su iPhone non c'è: si spiega come fare con il pulsante Condividi di Safari.

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;

/** Da chiamare subito all'avvio: tiene da parte la richiesta di installazione di Android. */
export function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // niente banner del browser: usiamo il nostro pulsante
    deferred = e as InstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
  });
}

/** Il gioco è già aperto come app installata (dall'icona sulla Home)? */
export function isInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || nav.standalone === true;
}

/** È un iPhone o iPad (dove si installa a mano da Safari)? */
export function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

/** Si può mostrare il pulsante "Metti sul telefono"? */
export function canOfferInstall(): boolean {
  if (isInstalled()) return false;
  return deferred !== null || isIos();
}

/**
 * Prova a installare. Restituisce 'fatto' / 'annullato' su Android,
 * 'ios' se bisogna spiegare i passaggi a mano, 'no' se adesso non si può.
 */
export async function askInstall(): Promise<'fatto' | 'annullato' | 'ios' | 'no'> {
  if (deferred) {
    const ev = deferred;
    deferred = null; // si può usare una volta sola
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    return outcome === 'accepted' ? 'fatto' : 'annullato';
  }
  return isIos() ? 'ios' : 'no';
}
