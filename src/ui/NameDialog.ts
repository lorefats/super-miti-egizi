import { PALETTE, css } from '../art/palette';
import { FONT_FAMILY } from '../config';
import { PROFILE } from '../data/progression';
import { cleanName } from '../save/SaveManager';

/**
 * Finestrella "Come ti chiami?" con una casella di testo vera (HTML), così sul telefono si apre la sua tastiera.
 * Restituisce il nome scritto (già pulito), oppure null se si annulla.
 */
export function askPlayerName(current: string): Promise<string | null> {
  return new Promise((resolve) => {
    const gold = css(PALETTE.oro);
    const night = css(PALETTE.bluNotte);
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;' +
      `background:rgba(20,33,61,0.75);font-family:${FONT_FAMILY};touch-action:auto;`;
    const box = document.createElement('div');
    box.style.cssText =
      `background:${css(PALETTE.lapislazzuli)};border:5px solid ${gold};border-radius:22px;padding:22px 26px;` +
      'display:flex;flex-direction:column;align-items:center;gap:16px;width:min(460px,86vw);box-sizing:border-box;';
    const title = document.createElement('div');
    title.textContent = 'Come ti chiami?';
    title.style.cssText = `color:${gold};font-size:34px;text-shadow:0 3px 0 ${night};`;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = current;
    input.maxLength = PROFILE.nameMaxLength;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = PROFILE.defaultName;
    input.style.cssText =
      `width:100%;box-sizing:border-box;font-family:${FONT_FAMILY};font-size:30px;padding:10px 14px;` +
      `border-radius:14px;border:4px solid ${night};background:#FFF8E1;color:${night};text-align:center;outline:none;` +
      '-webkit-user-select:text;user-select:text;';
    const hint = document.createElement('div');
    hint.textContent = `Al massimo ${PROFILE.nameMaxLength} lettere. Lo vedono gli amici.`;
    hint.style.cssText = 'color:#FFFFFF;font-size:18px;opacity:0.85;text-align:center;';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:14px;';
    const button = (label: string, main: boolean) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText =
        `font-family:${FONT_FAMILY};font-size:26px;padding:10px 22px;border-radius:16px;border:4px solid ${night};` +
        `background:${main ? gold : css(PALETTE.sabbiaScura)};color:${night};cursor:pointer;`;
      return b;
    };
    const ok = button('Fatto', true);
    const cancel = button('Annulla', false);
    row.append(cancel, ok);
    box.append(title, input, hint, row);
    overlay.append(box);
    document.body.append(overlay);
    setTimeout(() => input.focus(), 50);

    const close = (value: string | null) => {
      overlay.remove();
      resolve(value);
    };
    ok.addEventListener('click', () => {
      const name = cleanName(input.value);
      close(name || null);
    });
    cancel.addEventListener('click', () => close(null));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') ok.click();
      else if (e.key === 'Escape') cancel.click();
      e.stopPropagation(); // le lettere non arrivano ai comandi del gioco
    });
  });
}
