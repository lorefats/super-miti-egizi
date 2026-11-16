import Phaser from 'phaser';

/**
 * Al primo tocco prova ad andare a schermo intero e a bloccare l'orizzontale (Android).
 * Su iPhone il browser non lo permette: si otterrà con "Aggiungi a Home" (passo PWA).
 */
export function fullscreenOnFirstTap(scene: Phaser.Scene): void {
  const tryFullscreen = () => {
    if (scene.scale.isFullscreen || !scene.scale.fullscreen.available) return;
    // mai sul computer: lì lo schermo intero darebbe fastidio
    if (!scene.sys.game.device.input.touch) return;
    scene.scale.startFullscreen();
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation.lock?.('landscape').catch(() => undefined);
  };
  scene.input.on(Phaser.Input.Events.POINTER_UP, tryFullscreen);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.off(Phaser.Input.Events.POINTER_UP, tryFullscreen));
}
