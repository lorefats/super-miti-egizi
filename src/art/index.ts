import Phaser from 'phaser';
import { loadSvgTextures, type SvgArt } from './svg';
import { anubiSvg, anubiScepterSvg, ANUBI_HAND } from './characters/anubi';
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
  sparkSvg,
  impactSvg,
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
  scintilla: 'scintilla',
  impatto: 'stella-impatto',
} as const;

/** Chiave della texture di un personaggio (es. "personaggio-anubi"). */
export function characterTexture(characterId: string): string {
  return `personaggio-${characterId}`;
}

/** Chiave della texture dell'arma che il personaggio tiene in mano (se ne ha una separata). */
export function weaponTexture(characterId: string): string {
  return `arma-${characterId}`;
}

type Drawing = { width: number; height: number; body: string };

/** Arma tenuta in mano, disegnata a parte per poterla animare. */
export interface HeldWeaponArt {
  draw: () => Drawing & { gripX: number; gripY: number };
  /** Posizione della mano rispetto ai piedi del personaggio (girato a destra). */
  hand: { x: number; y: number };
}

/** Disegni dei personaggi: id del personaggio → corpo e (facoltativa) arma in mano. */
const CHARACTER_ART: Record<string, { body: () => Drawing; weapon?: HeldWeaponArt }> = {
  anubi: { body: anubiSvg, weapon: { draw: anubiScepterSvg, hand: ANUBI_HAND } },
};

/** Dati dell'arma in mano per l'animazione: dove sta la mano e il punto di presa (0..1). */
export function getHeldWeapon(characterId: string): { hand: { x: number; y: number }; originX: number; originY: number } | null {
  const w = CHARACTER_ART[characterId]?.weapon;
  if (!w) return null;
  const d = w.draw();
  return { hand: w.hand, originX: d.gripX / d.width, originY: d.gripY / d.height };
}

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
    ...Object.entries(CHARACTER_ART).flatMap(([id, art]) => {
      const list: SvgArt[] = [{ key: characterTexture(id), ...art.body() }];
      if (art.weapon) list.push({ key: weaponTexture(id), ...art.weapon.draw() });
      return list;
    }),
    { key: TEX.scintilla, ...sparkSvg() },
    { key: TEX.impatto, ...impactSvg() },
  ];
  await loadSvgTextures(scene, arts);
}
