import { SCREENS } from '../core/Constants.js';

export class BinduPauseScreen {
  constructor(router) {
    this.router = router;
    this.container = router.uiContainer;
  }

  render() {
    this.container.innerHTML = `
      <div class="glass-panel fade-in" style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; border-radius: 0; border: none; background: rgba(0,0,0,0.8); pointer-events: auto;">
        <h2 style="font-size: 2rem; margin-bottom: 2rem; color: var(--accent-red);">Bindú State (Paused)</h2>
        <div style="display: flex; gap: 1rem;">
          <button id="btn-resume">Resume Flow</button>
          <button class="primary" id="btn-end">Enter Integration Room</button>
        </div>
      </div>
    `;

    document.getElementById('btn-resume').addEventListener('click', () => {
      this.router.navigate(SCREENS.GAME);
    });
    document.getElementById('btn-end').addEventListener('click', () => {
      this.router.navigate(SCREENS.INTEGRATION);
    });
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
