import { SCREENS } from './Constants.js';
import { eventBus } from './EventBus.js';

export class ScreenRouter {
  constructor(appContainer, canvas, uiContainer) {
    this.appContainer = appContainer;
    this.canvas = canvas;
    this.uiContainer = uiContainer;
    this.currentScreen = SCREENS.CONFIG;
    this.screens = new Map();
    this.currentInstance = null;
  }

  register(screenName, factory) {
    this.screens.set(screenName, factory);
  }

  async navigate(screenName, params) {
    if (!this.screens.has(screenName)) {
      console.error(`[ScreenRouter] Unknown screen: ${screenName}`);
      return;
    }
    if (this.currentInstance && this.currentInstance.destroy) {
      this.currentInstance.destroy();
    }
    this.currentScreen = screenName;
    this.uiContainer.innerHTML = '';
    const ctx = this.canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const factory = this.screens.get(screenName);
    this.currentInstance = await factory(this, params);
    eventBus.emit('screen:changed', { screen: screenName, params });
  }

  destroy() {
    if (this.currentInstance && this.currentInstance.destroy) {
      this.currentInstance.destroy();
    }
    this.screens.clear();
    this.currentInstance = null;
  }
}
