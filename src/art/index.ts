import Phaser from 'phaser';
import { loadSvgTextures, type SvgArt } from './svg';
import { COLOR_VARIANTS, type ColorVariant } from './palette';
import { anubiSvg, anubiScepterSvg, anubiLegSvg, ANUBI_HAND, ANUBI_HIPS } from './characters/anubi';
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
  standingSarcophagusSvg,
  bandageStripSvg,
  bandageRollSvg,
  ankhSvg,
  superButtonSvg,
  chestSvg,
  plankSvg,
  gemSvg,
  stormTileSvg,
  trophySvg,
} from './props';
import {
  bigPyramidRoofSvg,
  bigPyramidFloorSvg,
  bigPyramidFrontWallSvg,
  sarcophagusSvg,
  torchGlowSvg,
} from './bigPyramid';
import * as V from './valley';
import * as L from './lobby';
import { logoCaseSvg, logoLidSvg, logoWinkSvg, logoRaysSvg } from './logo';
import { prizeCaseSvg, prizeLidSvg, lightBeamSvg } from './sarcophagi';

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
  piramideGrandeTetto: 'piramide-grande-tetto',
  piramideGrandeSala: 'piramide-grande-sala',
  piramideGrandeMuro: 'piramide-grande-muro',
  sarcofago: 'sarcofago-decorativo',
  bagliore: 'bagliore-torcia',
  sarcofagoInPiedi: 'sarcofago-in-piedi',
  benda: 'benda',
  rotoloBende: 'rotolo-bende',
  ankh: 'ankh',
  pulsanteSuper: 'pulsante-super',
  baule: 'baule',
  asse: 'asse-legno',
  gioiello: 'gioiello',
  tempesta: 'tempesta',
  coppa: 'coppa',
  // logo
  logoCassa: 'logo-cassa',
  logoCoperchio: 'logo-coperchio',
  logoOcchiolino: 'logo-occhiolino',
  logoRaggi: 'logo-raggi',
  // sarcofagi premio
  sarcLegnoCassa: 'sarcofago-legno-cassa',
  sarcLegnoCoperchio: 'sarcofago-legno-coperchio',
  sarcBronzoCassa: 'sarcofago-bronzo-cassa',
  sarcBronzoCoperchio: 'sarcofago-bronzo-coperchio',
  sarcOroCassa: 'sarcofago-oro-cassa',
  sarcOroCoperchio: 'sarcofago-oro-coperchio',
  raggioLuce: 'raggio-luce',
  // lobby
  lobbyPiramidi: 'lobby-piramidi',
  lobbyMuro: 'lobby-muro',
  lobbyColonna: 'lobby-colonna',
  lobbyArchitrave: 'lobby-architrave',
  lobbySoleAlato: 'lobby-sole-alato',
  lobbyPavimento: 'lobby-pavimento',
  piedistallo: 'piedistallo',
  pulsanteGioca: 'pulsante-gioca',
  scarabeo: 'scarabeo',
  polvereStelle: 'polvere-stelle',
  sarcofagoIcona: 'sarcofago-icona',
  camminoIcona: 'cammino-icona',
  iconaPersonaggi: 'icona-personaggi',
  iconaSarcofagi: 'icona-sarcofagi',
  iconaCoppe: 'icona-coppe',
  iconaImpostazioni: 'icona-impostazioni',
  lucchetto: 'lucchetto',
  stellaCielo: 'stella-cielo',
  discoCielo: 'disco-cielo',
  // terreni delle zone
  terrenoRoccia: 'terreno-roccia',
  terrenoLastre: 'terreno-lastre',
  terrenoAsfalto: 'terreno-asfalto',
  terrenoBazar: 'terreno-bazar',
  terrenoErba: 'terreno-erba',
  terrenoOasi: 'terreno-oasi',
  acqua: 'acqua',
  // oggetti della Valle dei Due Egitti
  sfinge: 'sfinge',
  colonna: 'colonna',
  obelisco: 'obelisco',
  statua: 'statua',
  muroTempio: 'muro-tempio',
  bloccoTempio: 'blocco-tempio',
  rupeTomba: 'rupe-tomba',
  masso: 'masso',
  torciaPalo: 'torcia-palo',
  papiro: 'papiro',
  feluca: 'feluca',
  bancarella0: 'bancarella-0',
  bancarella1: 'bancarella-1',
  bancarella2: 'bancarella-2',
  tenda: 'tenda-bazar',
  lanterna: 'lanterna',
  tappeto0: 'tappeto-0',
  tappeto1: 'tappeto-1',
  tappeto2: 'tappeto-2',
  carretto: 'carretto',
  palazzo0: 'palazzo-0',
  palazzo1: 'palazzo-1',
  palazzo2: 'palazzo-2',
  taxi: 'taxi',
  lampione: 'lampione',
  torre: 'torre',
  palma: 'palma',
  pozzo: 'pozzo',
  duna: 'duna',
  cammello: 'cammello',
} as const;

const suffix = (v: ColorVariant) => (v === 'base' ? '' : `-${v}`);

/** Chiave della texture di un personaggio (es. "personaggio-anubi" o "personaggio-anubi-rosso"). */
export function characterTexture(characterId: string, variant: ColorVariant = 'base'): string {
  return `personaggio-${characterId}${suffix(variant)}`;
}

/** Chiave della texture della gamba di un personaggio (se le gambe sono disegnate a parte). */
export function legTexture(characterId: string, variant: ColorVariant = 'base'): string {
  return `gamba-${characterId}${suffix(variant)}`;
}

/** Chiave della texture dell'arma che il personaggio tiene in mano (se ne ha una separata). */
export function weaponTexture(characterId: string, variant: ColorVariant = 'base'): string {
  return `arma-${characterId}${suffix(variant)}`;
}

type Drawing = { width: number; height: number; body: string };

/** Arma tenuta in mano, disegnata a parte per poterla animare. */
export interface HeldWeaponArt {
  draw: (variant?: ColorVariant) => Drawing & { gripX: number; gripY: number };
  /** Posizione della mano rispetto ai piedi del personaggio (girato a destra). */
  hand: { x: number; y: number };
}

/** Gambe disegnate a parte, per animare i passi. */
export interface LegsArt {
  draw: (variant?: ColorVariant) => Drawing & { hipX: number; hipY: number };
  /** Anche rispetto ai piedi del personaggio (girato a destra). */
  hips: { back: { x: number; y: number }; front: { x: number; y: number } };
}

/** Disegni dei personaggi: id del personaggio → corpo, (facoltativa) arma in mano e (facoltative) gambe. */
const CHARACTER_ART: Record<
  string,
  { body: (variant?: ColorVariant) => Drawing; weapon?: HeldWeaponArt; legs?: LegsArt }
> = {
  anubi: {
    body: anubiSvg,
    weapon: { draw: anubiScepterSvg, hand: ANUBI_HAND },
    legs: { draw: anubiLegSvg, hips: ANUBI_HIPS },
  },
};

/** Dati delle gambe per l'animazione: posizione delle anche e punto di rotazione (0..1). */
export function getLegs(
  characterId: string,
): { hips: LegsArt['hips']; originX: number; originY: number } | null {
  const l = CHARACTER_ART[characterId]?.legs;
  if (!l) return null;
  const d = l.draw();
  return { hips: l.hips, originX: d.hipX / d.width, originY: d.hipY / d.height };
}

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
    ...Object.entries(CHARACTER_ART).flatMap(([id, art]) =>
      COLOR_VARIANTS.flatMap((v) => {
        const list: SvgArt[] = [{ key: characterTexture(id, v), ...art.body(v) }];
        if (art.weapon) list.push({ key: weaponTexture(id, v), ...art.weapon.draw(v) });
        if (art.legs) list.push({ key: legTexture(id, v), ...art.legs.draw(v) });
        return list;
      }),
    ),
    { key: TEX.scintilla, ...sparkSvg() },
    { key: TEX.impatto, ...impactSvg() },
    { key: TEX.piramideGrandeTetto, ...bigPyramidRoofSvg() },
    { key: TEX.piramideGrandeSala, ...bigPyramidFloorSvg() },
    { key: TEX.piramideGrandeMuro, ...bigPyramidFrontWallSvg() },
    { key: TEX.sarcofago, ...sarcophagusSvg() },
    { key: TEX.bagliore, ...torchGlowSvg() },
    { key: TEX.sarcofagoInPiedi, ...standingSarcophagusSvg() },
    { key: TEX.benda, ...bandageStripSvg() },
    { key: TEX.rotoloBende, ...bandageRollSvg() },
    { key: TEX.ankh, ...ankhSvg() },
    { key: TEX.pulsanteSuper, ...superButtonSvg() },
    { key: TEX.baule, ...chestSvg() },
    { key: TEX.asse, ...plankSvg() },
    { key: TEX.gioiello, ...gemSvg() },
    { key: TEX.tempesta, ...stormTileSvg() },
    { key: TEX.coppa, ...trophySvg() },
    { key: TEX.logoCassa, ...logoCaseSvg() },
    { key: TEX.sarcLegnoCassa, ...prizeCaseSvg('legno') },
    { key: TEX.sarcLegnoCoperchio, ...prizeLidSvg('legno') },
    { key: TEX.sarcBronzoCassa, ...prizeCaseSvg('bronzo') },
    { key: TEX.sarcBronzoCoperchio, ...prizeLidSvg('bronzo') },
    { key: TEX.sarcOroCassa, ...prizeCaseSvg('oro') },
    { key: TEX.sarcOroCoperchio, ...prizeLidSvg('oro') },
    { key: TEX.raggioLuce, ...lightBeamSvg() },
    { key: TEX.logoCoperchio, ...logoLidSvg() },
    { key: TEX.logoOcchiolino, ...logoWinkSvg() },
    { key: TEX.logoRaggi, ...logoRaysSvg() },
    { key: TEX.lobbyPiramidi, ...L.lobbyPyramidsSvg() },
    { key: TEX.lobbyMuro, ...L.lobbyWallSvg() },
    { key: TEX.lobbyColonna, ...L.lobbyColumnSvg() },
    { key: TEX.lobbyArchitrave, ...L.lobbyLintelSvg() },
    { key: TEX.lobbySoleAlato, ...L.wingedSunSvg() },
    { key: TEX.lobbyPavimento, ...L.lobbyFloorSvg() },
    { key: TEX.piedistallo, ...L.pedestalSvg() },
    { key: TEX.pulsanteGioca, ...L.playCartoucheSvg() },
    { key: TEX.scarabeo, ...L.scarabSvg() },
    { key: TEX.polvereStelle, ...L.stardustSvg() },
    { key: TEX.sarcofagoIcona, ...L.sarcophagusIconSvg() },
    { key: TEX.camminoIcona, ...L.trophyRoadIconSvg() },
    { key: TEX.iconaPersonaggi, ...L.navIconSvg('personaggi') },
    { key: TEX.iconaSarcofagi, ...L.navIconSvg('sarcofagi') },
    { key: TEX.iconaCoppe, ...L.navIconSvg('coppe') },
    { key: TEX.iconaImpostazioni, ...L.navIconSvg('impostazioni') },
    { key: TEX.lucchetto, ...L.lockSvg() },
    { key: TEX.stellaCielo, ...L.skyStarSvg() },
    { key: TEX.discoCielo, ...L.skyDiscSvg() },
    { key: TEX.terrenoRoccia, ...V.rockGroundSvg() },
    { key: TEX.terrenoLastre, ...V.pavedGroundSvg() },
    { key: TEX.terrenoAsfalto, ...V.asphaltGroundSvg() },
    { key: TEX.terrenoBazar, ...V.bazaarGroundSvg() },
    { key: TEX.terrenoErba, ...V.grassGroundSvg() },
    { key: TEX.terrenoOasi, ...V.oasisGroundSvg() },
    { key: TEX.acqua, ...V.waterSvg() },
    { key: TEX.sfinge, ...V.sphinxSvg() },
    { key: TEX.colonna, ...V.columnSvg() },
    { key: TEX.obelisco, ...V.obeliskSvg() },
    { key: TEX.statua, ...V.statueSvg() },
    { key: TEX.muroTempio, ...V.templeWallSvg() },
    { key: TEX.bloccoTempio, ...V.templeBlockSvg() },
    { key: TEX.rupeTomba, ...V.cliffTombSvg() },
    { key: TEX.masso, ...V.boulderSvg() },
    { key: TEX.torciaPalo, ...V.torchStandSvg() },
    { key: TEX.papiro, ...V.papyrusSvg() },
    { key: TEX.feluca, ...V.feluccaSvg() },
    { key: TEX.bancarella0, ...V.stallSvg(0) },
    { key: TEX.bancarella1, ...V.stallSvg(1) },
    { key: TEX.bancarella2, ...V.stallSvg(2) },
    { key: TEX.tenda, ...V.tentSvg() },
    { key: TEX.lanterna, ...V.lanternPostSvg() },
    { key: TEX.tappeto0, ...V.carpetSvg(0) },
    { key: TEX.tappeto1, ...V.carpetSvg(1) },
    { key: TEX.tappeto2, ...V.carpetSvg(2) },
    { key: TEX.carretto, ...V.cartSvg() },
    { key: TEX.palazzo0, ...V.buildingSvg(0) },
    { key: TEX.palazzo1, ...V.buildingSvg(1) },
    { key: TEX.palazzo2, ...V.buildingSvg(2) },
    { key: TEX.taxi, ...V.taxiSvg() },
    { key: TEX.lampione, ...V.streetLampSvg() },
    { key: TEX.torre, ...V.towerSvg() },
    { key: TEX.palma, ...V.palmSvg() },
    { key: TEX.pozzo, ...V.wellSvg() },
    { key: TEX.duna, ...V.duneSvg() },
    { key: TEX.cammello, ...V.camelSvg() },
  ];
  await loadSvgTextures(scene, arts);
}
