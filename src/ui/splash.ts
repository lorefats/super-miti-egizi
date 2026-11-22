/** Toglie la schermata di avvio (quella in index.html con il sarcofago) con una dissolvenza. */
export function hideSplash(): void {
  const el = document.getElementById('avvio');
  if (!el) return;
  el.classList.add('via');
  setTimeout(() => el.remove(), 400);
}
