# Tabella di marcia

Ogni passo ha un **prompt da incollare in Claude Code**. Fate un passo alla volta, provatelo sul telefono,
e passate al successivo solo quando funziona. Claude Code spunta le caselle da solo.
Scorciatoia: scrivete `/prossimo-passo` e Claude Code fa il primo passo non ancora fatto.

---

## Fase 1 — Il cuore del gioco

- [x] **Passo 0 — Progetto vuoto che si apre sul telefono**
  > Leggi CLAUDE.md. Crea il progetto con Phaser 3, TypeScript e Vite seguendo la struttura delle cartelle.
  > Per ora mostra solo uno sfondo color sabbia con la scritta "Super Miti Egizi" al centro, in orizzontale
  > e a schermo intero sul telefono. Inizializza git. Dimmi come aprirlo dal telefono.

- [x] **Passo 1 — Anubi si muove**
  > Disegna Anubi in stile cartoon 2.5D (vedi docs/ART_STYLE.md e la sua scheda in GAME_DESIGN.md) con il codice.
  > Aggiungi un joystick virtuale a sinistra per muoverlo su una piccola mappa di sabbia con qualche blocco
  > di pietra (collisioni) e una piramide. La telecamera segue Anubi. Ordinamento per Y e ombre.

- [x] **Passo 2 — Anubi attacca**
  > Aggiungi l'arma di Anubi (Scettro Uas): stick di mira a destra (trascina per mirare, rilascia per colpire,
  > tocco veloce = colpo automatico verso il nemico più vicino). 3 colpi con ricarica, mostrati sotto la barra vita.
  > Aggiungi 3 bersagli fermi con vita, numeri di danno e animazione di sconfitta (diventano sabbia).

- [x] **Passo 3 — I bot**
  > Crea i bot seguendo la sezione 11 di GAME_DESIGN.md. Per ora i bot sono altri Anubi di colore diverso.
  > Partita Solo: tu + 5 bot su una mappa media. Quando resti solo tu appare "VITTORIA!", se vieni
  > sconfitto "Sconfitto — 4° posto" con il posto giusto.

- [x] **Passo 4 — La super di Anubi**
  > Aggiungi la barra della super (si carica colpendo) e il pulsante super. Implementa "Bende del Sarcofago"
  > esattamente come in GAME_DESIGN.md, con la vita extra e la resurrezione dal sarcofago, e una bella animazione.

- [x] **Passo 5 — Bauli, gioielli e tempesta**
  > Aggiungi i bauli del tesoro rompibili con dentro i Gioielli (Cubi Energia) come descritto nella sezione 4,
  > il contatore gioielli sopra ogni personaggio, e la tempesta di sabbia che si restringe con un timer.

## Fase 2 — La mappa vera

- [x] **Passo 6 — Valle dei Due Egitti**
  > Costruisci la mappa grande con tutte le zone della sezione 3: Piana di Giza, Karnak, Valle dei Re, Nilo,
  > Bazar, Cairo moderno, Oasi. Canne di papiro e tende come cespugli dove nascondersi. Oggetti alti
  > semitrasparenti quando ci passi dietro. Partita Solo con 9 bot. Mostra una minimappa.

## Fase 3 — Lobby e progressi

- [x] **Passo 7 — Salvataggio e coppe**
  > Crea il SaveManager. Dopo ogni partita assegna le coppe secondo la tabella della sezione 4 e salvale per
  > personaggio. Schermata Risultati con posizione, coppe guadagnate (animate) e pulsante per tornare.

- [x] **Passo 8 — Logo e Lobby**
  > Disegna il logo (sezione 1) e una schermata iniziale animata. Poi la Lobby come descritta nella sezione 8,
  > con sfondo che cambia con l'ora e il personaggio scelto sul piedistallo.

- [x] **Passo 9 — Sarcofagi**
  > Quando vinci, al ritorno in lobby ricevi un sarcofago (sezione 5). Schermata di apertura con animazione
  > (trema, coperchio scivola, luce, premi che volano fuori). Gestisci scarabei d'oro e polvere di stelle.

- [x] **Passo 10 — Cammino delle Coppe e Prestigi**
  > Schermata Cammino delle Coppe (sezione 6) con i premi e Rà a 6000 coppe. Prestigio 1 a 1000 coppe per
  > personaggio (sezione 7). Schermata Personaggi con tutti e 24 (quelli bloccati in ombra) e potenziamento livelli.

## Fase 4 — Tutti gli dèi (3-4 alla volta)

Per ogni gruppo usate: `/nuovo-personaggio Nome`

- [x] Horus, Sobek, Bastet, Tefnut, Shu (Bronzo)
- [x] Osiride, Hathor, Geb, Khepri, Khnum (Turchese)
- [x] Iside, Seth, Sekhmet, Khonsu, Nut, Ptah (Lapislazzuli)
- [x] Ammit, Amon, Maat, Kek, Thoth, Nefti (Oro)
- [x] Rà (Sole)
- [x] Modalità Duo con compagno bot (necessaria per provare le super sui compagni)
- [x] I bot usano personaggi diversi a caso

## Fase 4½ — Calcio e Nilo (idee del cugino)

- [x] **Mappa "Il Grande Nilo"**
  > Costruisci la seconda mappa per Solo descritta in GAME_DESIGN.md (sezione 3, "Il Grande Nilo"): il Nilo
  > scorre in mezzo e la corrente trascina chi ci entra, ponti, feluche, isolotti di papiro. Ogni partita
  > sceglie a caso tra le due mappe. Minimappa e bot devono funzionare anche qui.

- [x] **Modalità Calcio del Nilo (si sblocca a 220 coppe)**
  > Aggiungi la modalità Calcio come in GAME_DESIGN.md (sezione 2): 3 contro 3 con compagni bot, palla,
  > porte, campo diviso dal Nilo che scorre, ricomparsa dopo la sconfitta, punteggio e coppe.
  > Nella Lobby un pulsante per sceglierla, con il lucchetto finché non si hanno 220 coppe totali.
  > I bot devono saper passare, tirare in porta e difendere.

- [x] **Ritocchi chiesti dopo le prove**
  > Thoth: nuova super "Salto del Geroglifico" (si teletrasporta in un geroglifico d'oro che esplode),
  > al posto della copia della super nemica. 5 secondi di preparazione a inizio partita con gli avversari
  > in vista. Cammino delle Coppe più lungo: dopo Rà continua fino a 15000 coppe.

- [x] **Calcio: tregua e controllo della palla**
  > Prima di ogni calcio d'inizio (anche dopo un gol) 5 secondi di tregua con conto alla rovescia.
  > Palla più facile da controllare: gira piano attorno ai piedi, "calamita" per prenderla, linea dorata
  > che mostra dove va il tiro mentre si mira.

## Fase 5 — Rifinitura e pubblicazione

- [x] Suoni ed effetti (generati o file gratuiti), musica in lobby, vibrazione del telefono
- [x] Modalità Allenamento
- [ ] Bilanciamento: far giocare il cugino e annotare chi è troppo forte o troppo debole
- [x] PWA: icona, schermata di avvio, funziona offline, "Aggiungi a Home"
- [x] Pubblicazione gratuita (GitHub Pages o Netlify) — online su https://lorefats.github.io/super-miti-egizi/

## Fase 6 — Multiplayer con gli amici (ognuno a casa sua)

Come funziona (dettagli in GAME_DESIGN.md, sezione 13): chi crea la stanza è il **capo stanza** e riceve un
codice di 4 cifre; gli amici lo scrivono per entrare (fino a 4 giocatori). I telefoni si parlano direttamente
(WebRTC, libreria PeerJS, con il suo servizio gratuito per trovarsi). Ogni telefono muove il proprio dio; il
capo stanza decide colpi, vita, bot, tempesta e palla e lo racconta agli altri. Solo amici con il codice:
niente sconosciuti, niente chat.

- [x] **M1 — Stanza e collegamento: ci si vede muovere**
  > Pulsante "Amici" nella Lobby (al posto di "Club"). Crea stanza (codice di 4 cifre) / Entra con il codice
  > (tastierino grande). Lista dei giocatori collegati, il capo stanza preme "Andiamo!" e tutti finiscono
  > nel campo di Allenamento: ognuno vede gli altri dèi camminare con il loro nome. Avvisi semplici se la
  > stanza non esiste, è piena, manca internet o qualcuno ha una versione vecchia del gioco; se qualcuno
  > esce, gli altri lo vedono sparire.
- [ ] **M2 — Combattere insieme**
  > Attacchi e super si vedono su tutti i telefoni; il capo stanza decide chi viene colpito, vita,
  > sconfitte e ricomparse. Allenamento "uno contro uno" tra amici per provarlo.
- [ ] **M3 — Battaglia con gli amici (Solo e Duo)**
  > Partita vera sulla mappa con amici + bot che riempiono i posti: tempesta, bauli, gioielli, bot gestiti
  > dal capo stanza. In Duo si sceglie con chi fare squadra. Risultati e coppe sul telefono di ognuno.
- [ ] **M4 — Calcio del Nilo con gli amici**
  > Palla, gol, tregua e punteggio uguali per tutti; amici nella stessa squadra o contro.
- [ ] **M5 — Rifinitura del multiplayer**
  > Riprovare il collegamento se cade per un attimo, nomi scelti dal giocatore, prove con reti diverse
  > (Wi-Fi e dati del telefono) ed eventuale "server di riserva" se qualche amico non riesce a collegarsi.

## Fase 7 — Un giorno, forse
- [ ] Nuove mappe e modalità
- [ ] Prestigi oltre il primo
