import Phaser from 'phaser';
import { loadSvgTextures, type SvgArt } from './svg';
import { anubiSvg } from './characters/anubi';
import {
  shadowSvg,
  sandTileSvg,
  stoneBlockSvg,
  pyramidSvg,
  joystickBaseSvg,
  joystickKnobSvg,
  aimKnobSvg,
  targetStatueSvg,
  crescentSvg,
  grainSvg,
  sandPileSvg,
} from './props';

/**
 * UNICO punto da cui passano tutte le immagini del gioco.
 * Quando arriveranno disegni veri in public/assets/, basterà caricarli qui con le stesse chiavi.
 */
export const TEX = {
  ombra: 'ombra',
  sabbia: 'terreno-sabbia',
  blocco: 'blocco-pietra',
  bloccoLungo: 'blocco-pietra-lungo',
  piramide: 'piramide',
  joyBase: 'joystick-base',
  joyPomello: 'joystick-pomello',
  miraPomello: 'mira-pomello',
  bersaglio: 'bersaglio-statuetta',
  mezzaluna: 'colpo-mezzaluna',
  granello: 'granello-sabbia',
  mucchietto: 'mucchietto-sabbia',
} as const;

/** Chiave della texture di un personaggio (es. "personaggio-anubi"). */
export function characterTexture(characterId: string): string {
  return `personaggio-${characterId}`;
}

/** Disegni dei personaggi: id del personaggio → funzione che crea il disegno. */
const CHARACTER_ART: Record<string, () => { width: number; height: number; body: string }> = {
  anubi: anubiSvg,
};

/** Crea tutte le texture del gioco. Da chiamare una volta nella scena Preload. */
export async function createAllTextures(scene: Phaser.Scene): Promise<void> {
  const arts: SvgArt[] = [
    { key: TEX.ombra, ...shadowSvg() },
    { key: TEX.sabbia, ...sandTileSvg() },
    { key: TEX.blocco, ...stoneBlockSvg(100) },
    { key: TEX.bloccoLungo, ...stoneBlockSvg(200) },
    { key: TEX.piramide, ...pyramidSvg() },
    { key: TEX.joyBase, ...joystickBaseSvg() },
    { key: TEX.joyPomello, ...joystickKnobSvg() },
    { key: TEX.miraPomello, ...aimKnobSvg() },
    { key: TEX.bersaglio, ...targetStatueSvg() },
    { key: TEX.mezzaluna, ...crescentSvg() },
    { key: TEX.granello, ...grainSvg() },
    { key: TEX.mucchietto, ...sandPileSvg() },
    ...Object.entries(CHARACTER_ART).map(([id, draw]) => ({ key: characterTexture(id), ...draw() })),
  ];
  await loadSvgTextures(scene, arts);
}
