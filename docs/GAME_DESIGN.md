# Super Miti Egizi — Documento di Design

> Idea originale di mio cugino. Questo documento è la "bibbia" del gioco: se qualcosa cambia, si cambia qui.

## 1. Logo
Un **sarcofago cartoon che sogghigna**: sarcofago dorato e turchese, leggermente storto, con occhi
grandi tipo Occhio di Horus, sopracciglio alzato e un sorriso furbo con un dente d'oro.
Sotto, la scritta **SUPER MITI EGIZI** in lettere spesse color oro con contorno blu notte,
"SUPER" più piccolo sopra. Nella schermata iniziale il sarcofago socchiude il coperchio e fa l'occhiolino.

## 2. Modalità di gioco (offline, contro bot)
- **Solo:** 10 giocatori (tu + 9 bot). Vince l'ultimo rimasto.
- **Duo:** 5 squadre da 2. Il tuo compagno è un bot. Vince l'ultima squadra rimasta.
  (Serve per la super di Anubi sui compagni, di Iside, Hathor, ecc.)
- **Allenamento:** mappa piccola con bersagli fermi, per provare i personaggi.

Durata partita: 2-4 minuti. Bot con 3 livelli di bravura che crescono con le coppe del giocatore.

## 3. Mappa: "Valle dei Due Egitti"
Mappa quadrata vista dall'alto. Una **tempesta di sabbia** si restringe dai bordi verso il centro
e chi ci resta dentro perde vita.

Zone (ognuna con colori e ostacoli propri):
| Zona | Epoca | Cosa c'è |
|---|---|---|
| **Piana di Giza** | antica + oggi | le 3 Piramidi (enormi, non attraversabili), la Sfinge, blocchi di pietra |
| **Tempio di Karnak** | antica | colonne, obelischi, statue, cortili stretti |
| **Valle dei Re** | antica | tombe, **sarcofagi** decorativi, scale, torce |
| **Rive del Nilo** | antica + oggi | acqua (rallenta), canne di papiro (ci si nasconde dentro), feluche |
| **Bazar del Cairo** | oggi | bancarelle, tende colorate, lanterne, tappeti, carretti |
| **Cairo moderno** | oggi | palazzi, taxi, pali della luce, una torre alta al centro |
| **Oasi del deserto** | antica | palme, pozzo, dune, cammelli (ostacoli che si muovono piano) |

Oggetti nella mappa:
- **Canne di papiro / tende del bazar:** cespugli dove ci si nasconde.
- **Bauli del tesoro:** casse rompibili. Dentro ci sono **Gioielli = Cubi Energia** (vedi sotto).
- **Muri** di pietra, mattoni o cemento; alcuni si distruggono con le super.
- **Piramidi grandi in cui si entra** (idea del cugino): alcune piramidi sono cave e hanno una porta davanti.
  Da fuori sembrano normali e **non si vede chi c'è dentro** (né le barre della vita). Quando entri, la piramide
  diventa trasparente e si vede la sala: pavimento decorato, torce, un sarcofago. È un nascondiglio:
  i nemici fuori ti vedono solo se sono molto vicini. Chi passa **dietro** una piramide grande la vede semitrasparente.

## 4. Valute e ricompense
| Nome | Dove si trova | A cosa serve |
|---|---|---|
| **Gioielli (Cubi Energia)** | dentro i bauli del tesoro, durante la partita | solo per quella partita: ogni gioiello dà +10% vita e +10% danno. Chi viene sconfitto lascia cadere i suoi |
| **Coppe** | vincendo / piazzandosi bene | salire nel cammino delle coppe e nei prestigi |
| **Scarabei d'oro** | nei sarcofagi | potenziare i personaggi (livello 1 → 11) |
| **Polvere di Stelle** | nei sarcofagi | insieme agli scarabei, per potenziare |

**Niente acquisti con soldi veri. Mai.**

### Coppe per partita (Solo)
| Posizione | 1° | 2° | 3° | 4° | 5° | 6° | 7° | 8° | 9° | 10° |
|---|---|---|---|---|---|---|---|---|---|---|
| Coppe | +10 | +8 | +6 | +4 | +2 | 0 | −1 | −2 | −3 | −4 |

In Duo: 1ª squadra +10, 2ª +6, 3ª +2, 4ª −2, 5ª −4.
Le coppe si guadagnano **per personaggio**; il totale del giocatore è la somma.

## 5. Sarcofagi (premio vittoria)
Quando **vinci una partita e torni nella lobby** ricevi un sarcofago. Nella lobby si apre con
un'animazione: il sarcofago trema, il coperchio scivola via, esce luce dorata e i premi volano fuori uno alla volta.

| Sarcofago | Probabilità | Contiene |
|---|---|---|
| **Di legno** | 60% | scarabei d'oro, polvere di stelle |
| **Di bronzo** | 25% | di più + piccola possibilità di nuovo personaggio |
| **D'oro** | 12% | molto di più + buona possibilità di nuovo personaggio |
| **Del Faraone** | 3% | tantissimo + personaggio garantito (se ne mancano) |

Se un sarcofago è "Del Faraone", prima di aprirsi **sogghigna** come il logo.

## 6. Cammino delle Coppe
Una strada di sabbia illuminata da torce, con premi lungo il percorso (scarabei, polvere, sarcofagi).
Contiene **un solo personaggio**: **Rà, a 6000 coppe**, il premio più grande del gioco,
con un'animazione speciale del sole che sorge quando si sblocca.

## 7. Prestigi
Ogni personaggio, arrivato a **1000 coppe**, raggiunge il **Prestigio 1** (il massimo per ora):
cornice dorata attorno all'icona, effetto luminoso sul personaggio in lobby e un titolo
(es. "Anubi — Guardiano Eterno"). Si possono aggiungere prestigi più alti in futuro.
> Da confermare con il cugino: "i prestigi fino al numero 1" — interpretato come "esiste solo il Prestigio 1".

## 8. Lobby (diversa da Brawl Stars)
- **Sfondo:** sala del trono di un tempio, colonne ai lati, e dietro un'apertura con le Piramidi al tramonto.
  Lo sfondo cambia con l'ora reale: alba, giorno, tramonto, notte stellata.
- **Centro:** il personaggio scelto su un piedistallo di pietra, con la sua animazione di attesa.
- **In alto:** coppe totali, scarabei d'oro, polvere di stelle.
- **A destra:** grande pulsante **GIOCA** a forma di cartiglio dorato; sopra, la scelta Solo / Duo.
- **A sinistra:** pila dei sarcofagi da aprire (con numerino), Cammino delle Coppe.
- **In basso:** barra con Personaggi, Sarcofagi, Coppe, Impostazioni (icone a geroglifico).

## 9. Rarità dei personaggi
Sabbia (comune) → Bronzo → Turchese → Lapislazzuli → Oro → **Sole** (leggendario).

## 10. Personaggi
Ogni personaggio ha: **arma** (attacco base, 3 colpi che si ricaricano), **super** (si carica colpendo i nemici),
**animazione speciale** (quando vince o viene scelto). Valori base a livello 1; il bilanciamento si fa nei dati.
**Rigenerazione:** se per 3 secondi non colpisci e non vieni colpito, la vita risale piano piano
(serve ai bot che scappano sotto il 30% di vita). Numeri in `src/data/combat.ts`.

Legenda ruoli: 🛡️ Tank · ⚔️ Assalto · 🎯 Tiratore · 🗡️ Assassino · 💚 Supporto · 🌀 Controllo · 💣 Lanciatore

| # | Personaggio | Rarità | Ruolo | Vita | Velocità |
|---|---|---|---|---|---|
| 1 | Anubi | Sabbia (iniziale) | 🛡️💚 | 4200 | normale |
| 2 | Horus | Bronzo | 🎯 | 2800 | normale |
| 3 | Osiride | Turchese | 💚 | 3600 | lento |
| 4 | Iside | Lapislazzuli | 💚 | 3200 | normale |
| 5 | Rà | **Sole** (6000 coppe) | 💣 | 3400 | normale |
| 6 | Ammit | Oro | 🗡️ | 3600 | veloce |
| 7 | Amon | Oro | 🗡️ | 3000 | veloce |
| 8 | Seth | Lapislazzuli | 🌀 | 3600 | normale |
| 9 | Sobek | Bronzo | 🛡️ | 5200 | lento |
| 10 | Hathor | Turchese | 💚 | 3200 | normale |
| 11 | Maat | Oro | 🎯🌀 | 3000 | normale |
| 12 | Geb | Turchese | 🛡️🌀 | 5000 | lento |
| 13 | Bastet | Bronzo | 🗡️ | 3200 | molto veloce |
| 14 | Sekhmet | Lapislazzuli | ⚔️ | 3800 | normale |
| 15 | Kek | Oro | 🌀 | 3000 | normale |
| 16 | Khonsu | Lapislazzuli | ⚔️🌀 | 3200 | normale |
| 17 | Thoth | Oro | 🎯 | 2800 | normale |
| 18 | Tefnut | Bronzo | ⚔️💚 | 3400 | normale |
| 19 | Khepri | Turchese | 🗡️ | 3400 | veloce |
| 20 | Nut (Nout) | Lapislazzuli | 💣 | 2800 | normale |
| 21 | Shu | Bronzo | 🌀 | 3000 | veloce |
| 22 | Khnum | Turchese | 💣 | 3600 | normale |
| 23 | Ptah (Eptah) | Lapislazzuli | 🛡️💣 | 3800 | lento |
| 24 | Nefti | Oro | 🗡️ | 3000 | veloce |

### Schede personaggio

**1. Anubi** — dio dei morti, testa di sciacallo nero, gioielli d'oro.
- **Arma — Scettro Uas:** colpo a mezzaluna a corto raggio che colpisce tutti davanti a lui.
- **Super — Bende del Sarcofago:** lancia un fascio di bende.
  - Se colpisce un **nemico**: lo avvolge nelle bende e lo chiude in un sarcofago per 2 secondi (non può
    muoversi né attaccare) e **Anubi riceve +1 vita**: la prossima volta che viene sconfitto **resuscita**
    dal suo sarcofago con metà vita. (Massimo 1 vita extra alla volta.)
  - Se colpisce un **compagno**: il compagno si cura del 40% e **anche Anubi si cura** del 25%.
- **Animazione speciale:** un sarcofago si apre lentamente, escono bende che volano via a spirale e Anubi
  esce con gli occhi che brillano d'oro, poi fa roteare lo scettro.

**2. Horus** — dio del cielo, testa di falco, armatura bianca e blu.
- **Arma — Arco del Falco:** una freccia lunghissima e veloce. Più vola lontano, più fa danno.
- **Super — Occhio di Horus:** un enorme occhio appare nel cielo: per 5 secondi tutti i nemici sono visibili
  (anche nei cespugli) e le sue frecce attraversano più nemici.
- **Animazione speciale:** ali dorate gigantesche si aprono dietro di lui, piume che cadono, grido di falco.

**3. Osiride** — re dell'aldilà, pelle verde, corona bianca alta.
- **Arma — Flagello e Pastorale:** frustata a ventaglio che rallenta un po' i nemici.
- **Super — Rinascita del Nilo:** fa crescere un campo di grano dorato: per 6 secondi cura i compagni
  dentro e rallenta i nemici.
- **Animazione speciale:** spuntano spighe e fiori di loto tutto attorno a lui mentre alza le braccia incrociate.

**4. Iside** — grande maga, ali colorate sulle braccia, trono sulla testa.
- **Arma — Ankh Luminoso:** proiettile magico che, dopo aver colpito, rimbalza su un secondo bersaglio vicino.
- **Super — Ali Protettrici:** apre le ali e crea una cupola che blocca tutti i proiettili per 3 secondi
  (protegge anche i compagni dentro).
- **Animazione speciale:** le ali si aprono a ventaglio con un arcobaleno di piume, simboli ankh che girano attorno.

**5. Rà** — re degli dèi, testa di falco con il disco solare. **Premio a 6000 coppe.**
- **Arma — Disco Solare:** sfera di fuoco che esplode all'impatto con danno ad area.
- **Super — Barca del Sole:** un raggio di sole gigante attraversa tutta la mappa in linea retta,
  **passando attraverso i muri**.
- **Animazione speciale:** il sole sorge dietro di lui, il cielo passa da notte a giorno, Rà fluttua sulla sua barca dorata.

**6. Ammit** — divoratrice dei cuori: testa di coccodrillo, criniera di leone, corpo di ippopotamo. Buffa e paurosa.
- **Arma — Morsi Rapidi:** tre morsi velocissimi a distanza ravvicinata.
- **Super — Divora-Cuori:** scatta in avanti a bocca aperta. Se sconfigge un nemico con la super si cura
  completamente e diventa più grande per 5 secondi.
- **Animazione speciale:** fa un rutto enorme dopo aver mangiato un cuore di cartone, poi si batte la pancia.

**7. Amon** — il dio nascosto, pelle blu, corona con due piume alte.
- **Arma — Piume del Vento:** lancia 2 piume che curvano verso il nemico più vicino.
- **Super — Il Nascosto:** diventa invisibile per 4 secondi; il primo colpo dopo fa doppio danno.
- **Animazione speciale:** svanisce in un luccichio blu e riappare all'improvviso facendo "bu!".

**8. Seth** — dio del caos e del deserto, testa di animale misterioso con orecchie squadrate, rosso.
- **Arma — Lancia del Caos:** lancia che vola dritta e alla fine si divide in 3 pezzi.
- **Super — Tempesta di Sabbia:** crea una tempesta in un'area per 5 secondi: chi è dentro prende danno
  e vede solo vicino a sé.
- **Animazione speciale:** un vortice di sabbia rossa lo avvolge, i suoi occhi brillano tra la sabbia, risata.

**9. Sobek** — dio coccodrillo del Nilo, muscoloso, armatura verde.
- **Arma — Fauci del Fiume:** morso a cono ravvicinato, danno alto.
- **Super — Ondata del Nilo:** si tuffa sotto terra come nell'acqua e riemerge dove vuole con un'onda che
  spinge via i nemici.
- **Animazione speciale:** emerge da una pozza d'acqua schizzando ovunque, con occhiali da sole sulla testa.

**10. Hathor** — dea della musica e della gioia, corna di mucca con disco del sole.
- **Arma — Sistro Sonoro:** onde sonore che rimbalzano sui muri.
- **Super — Danza della Gioia:** musica magica per 5 secondi: i compagni corrono più veloci e si curano,
  i nemici vicini sono confusi (si muovono a caso).
- **Animazione speciale:** balla con note musicali colorate che volano, i petali le cadono attorno.

**11. Maat** — dea della giustizia, piuma di struzzo sulla testa, bilancia d'oro.
- **Arma — Piuma della Verità:** colpo preciso a lunga distanza; fa più danno ai nemici che hanno più vita di lei.
- **Super — La Bilancia:** la bilancia appare sopra un nemico: se lui ha più vita (in percentuale) di Maat,
  le percentuali si scambiano (massimo 50% di differenza).
- **Animazione speciale:** la bilancia d'oro oscilla, una piuma scende lenta e si posa perfettamente in equilibrio.

**12. Geb** — dio della terra, pelle verde-marrone, un'oca sulla testa.
- **Arma — Pugno di Roccia:** colpisce il terreno e un'onda d'urto avanza in linea.
- **Super — Prigione di Pietra:** fa spuntare un anello di rocce che intrappola i nemici dentro per 3 secondi.
- **Animazione speciale:** la terra si spacca, Geb esce da sotto, l'oca starnazza sulla sua testa.

**13. Bastet** — dea gatta, elegante, orecchini d'oro.
- **Arma — Artigli Gemelli:** doppio graffio rapidissimo a corto raggio.
- **Super — Balzo Felino:** salta su un nemico da lontano, lo stordisce 1 secondo e fa 3 graffi veloci.
- **Animazione speciale:** si stiracchia, fa le fusa, si lecca la zampa e fa l'occhiolino.

**14. Sekhmet** — dea leonessa guerriera, rossa e oro.
- **Arma — Soffio Ardente:** lanciafiamme a corto raggio.
- **Super — Furia della Leonessa:** ruggito che fa scappare i nemici vicini per 1,5 secondi, poi per
  5 secondi attacca il doppio più veloce.
- **Animazione speciale:** ruggito gigante che fa tremare lo schermo, criniera di fuoco.

**15. Kek** — dio dell'oscurità primordiale, testa di rana, pelle nera e viola.
- **Arma — Bolle d'Ombra:** bolle lente che rallentano chi colpiscono.
- **Super — Notte Primordiale:** per 5 secondi tutta la mappa diventa buia per i nemici (vedono solo un
  piccolo cerchio attorno a sé), Kek vede tutto.
- **Animazione speciale:** gracida, le luci si spengono, si vedono solo i suoi occhi gialli che sbattono.

**16. Khonsu** — dio della luna, giovane, con disco e falce di luna sulla testa.
- **Arma — Falce Lunare:** boomerang a mezzaluna che va e torna, colpendo all'andata e al ritorno.
- **Super — Eclissi:** in un'area, il tempo rallenta per i nemici per 3 secondi (si muovono e sparano al rallentatore).
- **Animazione speciale:** la luna passa dietro di lui da falce a piena, stelle che brillano.

**17. Thoth** — dio della scrittura e della sapienza, testa di ibis, rotolo di papiro.
- **Arma — Raffica di Geroglifici:** scrive in aria 3 geroglifici che partono uno dopo l'altro.
- **Super — Libro di Thoth:** copia la super dell'ultimo nemico che lo ha colpito e la usa una volta.
- **Animazione speciale:** apre un libro magico, le pagine sfogliano da sole e i geroglifici volano attorno a lui.

**18. Tefnut** — dea dell'acqua e della pioggia, testa di leonessa, colori azzurri.
- **Arma — Getto d'Acqua:** getto continuo che spinge indietro i nemici.
- **Super — Pioggia Sacra:** una nuvola fa piovere in un'area: i compagni si curano, i nemici scivolano
  (difficile fermarsi e girare).
- **Animazione speciale:** una nuvoletta piove solo su di lei, lei sorride e appare un arcobaleno.

**19. Khepri** — dio del sole del mattino, testa di scarabeo, corazza lucida.
- **Arma — Palla di Sabbia:** fa rotolare una palla che diventa più grande e fa più danno mentre avanza.
- **Super — Rinascita dell'Alba:** scava sotto terra (non può essere colpito, va veloce) per 3 secondi e
  riemerge con un'esplosione di sabbia dorata.
- **Animazione speciale:** rotola una palla enorme come un sole, ci sale sopra e fa una posa.

**20. Nut (Nout)** — dea del cielo, corpo blu pieno di stelle.
- **Arma — Stelle Cadenti:** lancia stelle a parabola che passano sopra i muri.
- **Super — Volta Celeste:** dopo 1 secondo di avviso, una pioggia di meteore cade su una grande area.
- **Animazione speciale:** si allunga ad arco formando il cielo, costellazioni che si accendono una a una.

**21. Shu** — dio dell'aria, una piuma sulla testa, vestiti bianchi svolazzanti.
- **Arma — Folata:** soffio di vento che spinge indietro i nemici.
- **Super — Tornado:** un tornado che si muove lento e risucchia i nemici vicini facendoli girare.
- **Animazione speciale:** fluttua in aria mentre foglie e piume gli girano attorno.

**22. Khnum** — dio vasaio, testa di ariete con corna ondulate.
- **Arma — Vasi d'Argilla:** lancia un vaso che si frantuma in schegge all'impatto.
- **Super — Golem d'Argilla:** modella un golem che combatte al suo fianco per 10 secondi.
- **Animazione speciale:** fa girare il tornio, crea un piccolo vaso perfetto... che poi gli cade. Ride.

**23. Ptah (Eptah)** — dio costruttore e artigiano, pelle verde, berretto blu, scettro.
- **Arma — Martello del Creatore:** martello lanciato che rimbalza una volta sui muri.
- **Super — Obelisco Guardiano:** costruisce un obelisco che spara raggi ai nemici vicini per 12 secondi.
- **Animazione speciale:** martella velocissimo e costruisce una piccola statua di se stesso.

**24. Nefti** — dea della notte e della protezione, ali scure, simbolo di casa sulla testa. (Non Nefertiti!)
- **Arma — Lame del Crepuscolo:** 3 lame d'ombra a ventaglio.
- **Super — Passo nell'Ombra:** si teletrasporta dietro il nemico più debole vicino e il colpo successivo fa più danno.
- **Animazione speciale:** si dissolve in fumo viola e riappare con le ali aperte, petali scuri che cadono.

## 11. Bot (intelligenza artificiale)
Comportamento base, in ordine di priorità:
1. Se nella tempesta → vai verso il centro.
2. Se la vita è sotto il 30% → scappa e nasconditi nei cespugli.
3. Se un nemico è a tiro → attacca (mira con un piccolo errore casuale, minore per i bot più bravi).
4. Se la super è carica e c'è un buon bersaglio → usala.
5. Altrimenti → vai verso il baule o i gioielli più vicini, poi esplora.
