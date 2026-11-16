// Palette ufficiale (vedi docs/ART_STYLE.md). Usare sempre questi colori.
export const PALETTE = {
  oro: 0xf2b632,
  oroOmbra: 0xb97a12,
  turchese: 0x2ec4b6,
  lapislazzuli: 0x1f3a93,
  bluNotte: 0x14213d,
  sabbia: 0xe9c46a,
  sabbiaScura: 0xd4a373,
  verdeNilo: 0x4caf50,
  acquaNilo: 0x2a9d8f,
  rossoDeserto: 0xe63946,
  violaNotte: 0x6a4c93,
} as const;

/** Converte un colore numerico in stringa CSS "#RRGGBB" (serve per i testi). */
export function css(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}
