import Phaser from 'phaser';

/** Una texture disegnata con SVG: chiave, dimensioni in pixel e contenuto (senza il tag <svg>). */
export interface SvgArt {
  key: string;
  width: number;
  height: number;
  body: string;
}

/** Trasforma un SVG in immagine e la registra come texture Phaser. */
function loadSvg(scene: Phaser.Scene, art: SvgArt): Promise<void> {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${art.width}" height="${art.height}" ` +
    `viewBox="0 0 ${art.width} ${art.height}">${art.body}</svg>`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (scene.textures.exists(art.key)) scene.textures.remove(art.key);
      scene.textures.addImage(art.key, img);
      resolve();
    };
    img.onerror = () => reject(new Error(`Disegno non riuscito: ${art.key}`));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export async function loadSvgTextures(scene: Phaser.Scene, arts: SvgArt[]): Promise<void> {
  await Promise.all(arts.map((a) => loadSvg(scene, a)));
}
