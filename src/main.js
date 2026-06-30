import { ScreenRouter } from './core/ScreenRouter.js';
import { ConfigScreen } from './ui/ConfigScreen.js';
import { GameHUD } from './ui/GameHUD.js';
import { BinduPauseScreen } from './ui/BinduPauseScreen.js';
import { IntegrationRoom } from './ui/IntegrationRoom.js';
import { ReplayerScreen } from './ui/ReplayerScreen.js';
import { ActionManager } from './engine/ActionManager.js';
import { SCREENS } from './core/Constants.js';
import { gameState } from './core/GameState.js';
import { Logger } from './utils/Logger.js';

const log = Logger('main');

class GameApp {
  constructor() {
    this.appContainer = document.getElementById('app');
    this.canvas = document.createElement('canvas');
    this.appContainer.appendChild(this.canvas);
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'ui-layer';
    this.appContainer.appendChild(this.uiContainer);

    this.router = new ScreenRouter(this.appContainer, this.canvas, this.uiContainer);
    this.actionManager = null;
    this.hud = null;

    this._registerScreens();
    this.router.navigate(SCREENS.CONFIG);
  }

  _registerScreens() {
    this.router.register(SCREENS.CONFIG, async () => {
      const screen = new ConfigScreen(this.router);
      await screen.render();
      return screen;
    });

    this.router.register(SCREENS.GAME, async (router, params) => {
      if (this.actionManager) {
        return { destroy: () => {} };
      }

      const board = params.board;
      const config = params.config;

      this._gameBoard = board;
      this._gameConfig = config;

      board.generateStartingPieces();

      this.actionManager = new ActionManager(this.canvas, board, config);

      this.hud = new GameHUD(this.uiContainer, this.router);
      this.hud.render(1, { 1: 0, 2: 0 });

      return {
        destroy: () => {
          const stats = this.actionManager?.scoreManager?.getStats();
          if (stats) gameState.setStats(stats);
          if (this.actionManager) { this.actionManager.destroy(); this.actionManager = null; }
          if (this.hud) { this.hud.destroy(); this.hud = null; }
        }
      };
    });

    this.router.register(SCREENS.BINDU_PAUSE, async () => {
      if (this.actionManager) this.actionManager.gameLoop.stop();
      const screen = new BinduPauseScreen(this.router);
      screen.render();
      return {
        ...screen,
        destroy: () => {
          screen.destroy();
          if (this.actionManager) this.actionManager.gameLoop.start();
        }
      };
    });

    this.router.register(SCREENS.INTEGRATION, async () => {
      if (this.actionManager) {
        gameState.setStats(this.actionManager.scoreManager.getStats());
        this.actionManager.destroy();
        this.actionManager = null;
      }
      if (this.hud) { this.hud.destroy(); this.hud = null; }
      const screen = new IntegrationRoom(this.router);
      await screen.render();
      return screen;
    });

    this.router.register(SCREENS.REPLAYER, async () => {
      if (this.actionManager) { this.actionManager.destroy(); this.actionManager = null; }
      const screen = new ReplayerScreen(this.router);
      await screen.render();
      return screen;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new GameApp();
});
