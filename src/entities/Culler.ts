import Phaser from 'phaser';

/** Margine (pixel) attorno allo schermo entro cui gli oggetti restano disegnati. */
const MARGIN = 350;
/** Ogni quanti fotogrammi si ricontrolla. */
const EVERY = 6;

/**
 * Non disegna gli oggetti fermi della mappa che sono lontani dallo schermo.
 * Sulla mappa grande sono centinaia e se ne vedono solo poche decine alla volta:
 * così il telefono fa molta meno fatica.
 */
export class Culler {
  private readonly items: { show: (on: boolean) => void; bounds: Phaser.Geom.Rectangle }[] = [];
  private frame = 0;
  private readonly view = new Phaser.Geom.Rectangle();

  add(obj: Phaser.GameObjects.Image): void {
    this.items.push({ show: (on) => obj.setVisible(on), bounds: obj.getBounds() });
  }

  /** Per oggetti speciali (es. bauli con la barra): si decide da soli cosa nascondere. */
  addCustom(bounds: Phaser.Geom.Rectangle, show: (on: boolean) => void): void {
    this.items.push({ show, bounds });
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, force = false): void {
    if (!force && this.frame++ % EVERY !== 0) return;
    const v = camera.worldView;
    this.view.setTo(v.x - MARGIN, v.y - MARGIN, v.width + MARGIN * 2, v.height + MARGIN * 2);
    for (const it of this.items) {
      it.show(Phaser.Geom.Intersects.RectangleToRectangle(this.view, it.bounds));
    }
  }
}
