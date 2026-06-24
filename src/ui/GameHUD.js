import { eventBus } from '../core/EventBus.js';
import { EVENTS, SCREENS } from '../core/Constants.js';

export class GameHUD {
  constructor(container, router) {
    this.container = container;
    this.router = router;
    this._unsubs = [];
    this._bindEvents();
  }

  render(currentPlayer, scores) {
    this.container.innerHTML = `
      <div style="padding: 30px 40px; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none;">
        <div class="glass-panel" style="padding: 12px 24px; font-weight: bold; color: var(--text-main); border: 1px solid rgba(255,255,255,0.05); background: rgba(20, 24, 30, 0.4); border-radius: 12px; display: flex; gap: 20px;">
          <span style="color: var(--accent-cyan);" id="turn-indicator">P1 Turn</span>
          <span style="color: rgba(255,255,255,0.3);">|</span>
          <span style="color: var(--accent-cyan);">P1 Score: <span id="p1-score">${scores[1] || 0}</span></span>
          <span style="color: rgba(255,255,255,0.3);">|</span>
          <span style="color: var(--accent-red);">P2 Score: <span id="p2-score">${scores[2] || 0}</span></span>
        </div>
        <button id="btn-pause" class="glass-panel" style="padding: 12px 24px; background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: var(--text-main); pointer-events: auto; border-radius: 12px; transition: all 0.3s ease;">
          BINDÚ (Pause)
        </button>
      </div>
    `;
    this._updateTurnIndicator(currentPlayer);
    document.getElementById('btn-pause').addEventListener('click', () => {
      this.router.navigate(SCREENS.BINDU_PAUSE);
    });
  }

  updateScores(scores) {
    const p1 = document.getElementById('p1-score');
    const p2 = document.getElementById('p2-score');
    if (p1) p1.textContent = scores[1] || 0;
    if (p2) p2.textContent = scores[2] || 0;
  }

  updateTurn(playerId) {
    this._updateTurnIndicator(playerId);
  }

  _updateTurnIndicator(playerId) {
    const el = document.getElementById('turn-indicator');
    if (!el) return;
    el.textContent = `P${playerId} Turn`;
    el.style.color = playerId === 1 ? 'var(--accent-cyan)' : 'var(--accent-red)';
  }

  _bindEvents() {
    this._unsubs.push(
      eventBus.on(EVENTS.SCORE_CHANGED, (data) => this.updateScores(data.total)),
      eventBus.on(EVENTS.TURN_CHANGED, (data) => this.updateTurn(data.playerId))
    );
  }

  destroy() {
    this._unsubs.forEach(fn => fn());
    this._unsubs = [];
    this.container.innerHTML = '';
  }
}
