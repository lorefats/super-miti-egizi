# Super Miti Egizi — Istruzioni per Claude Code

Questo file viene letto da Claude Code all'inizio di ogni sessione. Contiene le regole del progetto.
Il design completo del gioco è in `docs/GAME_DESIGN.md`, lo stile grafico in `docs/ART_STYLE.md`,
la tabella di marcia in `docs/ROADMAP.md`. **Leggili prima di lavorare su una parte nuova.**

## Cos'è il gioco
Battle royale mobile con visuale dall'alto in stile 2.5D (2D con profondità finta: ordinamento per Y,
ombre, oggetti alti che coprono chi passa dietro). Il giocatore sceglie una divinità egizia e combatte
contro **bot controllati dal computer** su una mappa che mescola Egitto antico e moderno.
Il gioco è **offline**: niente server, niente account, niente pagamenti. I progressi si salvano sul telefono.

Lingua dell'interfaccia: **italiano**. Il gioco è pensato per un bambino: testi semplici, niente violenza
realistica (niente sangue: i personaggi sconfitti diventano sabbia / una nuvoletta e spariscono).

## Tecnologia (non cambiarla senza chiedere)
- **Phaser 3** + **TypeScript** + **Vite**
- **vite-plugin-pwa** per renderlo installabile e giocabile offline
- Salvataggio: `localStorage` tramite un unico modulo `src/save/SaveManager.ts` (con versione dei dati e migrazione)
- Nessun backend, nessuna libreria di rete, nessun tracciamento, nessuna pubblicità
- Grafica: generata dal codice (SVG → texture Phaser) finché non arrivano immagini vere in `public/assets/`.
  Ogni sprite deve passare da un unico punto (`src/art/`) così poi si sostituisce facilmente con immagini.

## Struttura delle cartelle
```
src/
  main.ts                 avvio Phaser
  config.ts               costanti globali (dimensioni, velocità, bilanciamento base)
  scenes/                 Boot, Preload, Lobby, Match, Results, Sarcophagus, TrophyRoad, Characters
  entities/               Player, Bot, Projectile, Chest, Gem, Obstacle
  characters/             una cartella/file per personaggio: arma + super + animazioni
  data/characters.ts      dati di tutti i personaggi (numeri, nomi, rarità) — UNICA fonte dei numeri
  data/progression.ts     cammino delle coppe, sarcofagi, prestigi, ricompense
  ai/                     comportamento dei bot
  ui/                     joystick, pulsanti, barre vita, HUD, menu
  art/                    disegno procedurale degli sprite, palette colori
  save/                   SaveManager
  audio/                  effetti sonori (generati o file)
public/assets/            immagini e suoni veri (quando ci saranno)
docs/                     documentazione di design
```

## Regole di lavoro
1. **Un passo alla volta.** Lavora solo sul passo richiesto della ROADMAP. Non anticipare passi futuri.
2. **Tutto deve funzionare su telefono.** Controlli touch prima di tutto (joystick a sinistra, mira/attacco
   a destra, pulsante super). Tastiera e mouse solo come extra per provare al computer.
   Orientamento orizzontale. Obiettivo: 60 fps su un telefono di fascia media.
3. **I numeri stanno nei dati.** Vita, danno, velocità, ricarica: sempre in `src/data/`, mai sparsi nel codice.
4. **Ogni personaggio è un modulo separato** che implementa la stessa interfaccia (`attack()`, `super()`,
   animazioni). Aggiungere un personaggio non deve richiedere di modificare la logica della partita.
5. **Prima di dire "fatto":** esegui `npm run build` e correggi gli errori TypeScript. Poi spiega in
   2-3 frasi semplici cosa provare sul telefono.
6. **Alla fine di ogni passo:** spunta la casella in `docs/ROADMAP.md` e fai un commit git con un messaggio in italiano.
7. **Originalità.** Il gioco si ispira a Brawl Stars e Fortnite ma NON li copia: niente nomi, loghi,
   immagini, suoni, icone o schermate copiati. Layout, colori e forme devono essere nostri (vedi ART_STYLE).
8. **Spiega in modo semplice.** Chi usa questo progetto non è un programmatore esperto: quando serve
   un comando da lanciare, scrivilo per intero.

## Comandi
- `npm install` — installa le dipendenze (solo la prima volta)
- `npm run dev -- --host` — avvia il gioco; dal telefono sulla stessa Wi-Fi apri l'indirizzo "Network" mostrato
- `npm run build` — controlla gli errori e prepara la versione da pubblicare
- `npm run preview -- --host` — prova la versione finale
