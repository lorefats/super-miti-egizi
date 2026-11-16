# Come iniziare (leggi prima questo)

## 1. Cosa installare sul computer (una volta sola)
1. **Node.js** versione LTS da https://nodejs.org (serve per far girare il gioco mentre lo costruite).
2. **Git** da https://git-scm.com (serve per salvare le versioni e tornare indietro se qualcosa si rompe).
3. **Claude Code**: seguite le istruzioni ufficiali su https://docs.claude.com/en/docs/claude-code

## 2. Preparare la cartella
1. Create una cartella, per esempio `super-miti-egizi`.
2. Copiateci dentro tutti questi file mantenendo le sottocartelle:
   ```
   super-miti-egizi/
     CLAUDE.md
     COME_INIZIARE.md
     docs/GAME_DESIGN.md
     docs/ART_STYLE.md
     docs/ROADMAP.md
     .claude/commands/prossimo-passo.md
     .claude/commands/nuovo-personaggio.md
     .claude/commands/bilancia.md
   ```
   (La cartella `.claude` inizia con un punto: su Mac/Windows potrebbe essere nascosta, è normale.)
3. Aprite un terminale in quella cartella e scrivete `claude`.

## 3. Il primo messaggio
Scrivete:
```
/prossimo-passo
```
Claude Code farà il Passo 0 e vi dirà come aprire il gioco.

## 4. Provare sul telefono
- Nel terminale: `npm run dev -- --host`
- Compare un indirizzo "Network", tipo `http://192.168.1.23:5173`
- Telefono e computer sulla **stessa Wi-Fi** → aprite quell'indirizzo nel browser del telefono.

## 5. Consigli d'oro
- **Un passo alla volta.** Provate sempre prima di andare avanti.
- **Se qualcosa non va, descrivetelo preciso:** "quando Anubi tocca la piramide si blocca e non riparte"
  è molto meglio di "non funziona".
- **Le idee nuove del cugino** → prima nel file `docs/GAME_DESIGN.md`, poi chiedete a Claude Code di realizzarle.
- **Se si rompe tutto:** chiedete "torna all'ultimo commit che funzionava".
- **Per cambiare i numeri** (troppo forte/debole): `/bilancia Sobek fa troppo danno, abbassa del 20%`
- **Per aggiungere un dio:** `/nuovo-personaggio Horus`
- Sessioni lunghe → ogni tanto scrivete `/clear` per ripartire puliti: Claude Code rilegge CLAUDE.md e ROADMAP da solo.
