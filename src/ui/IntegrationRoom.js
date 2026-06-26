import { SCREENS, EVENTS } from '../core/Constants.js';
import { SynthesisEngine } from '../ai/SynthesisEngine.js';
import { gameState } from '../core/GameState.js';
import { ReplayerDB } from '../db/ReplayerDB.js';
import { eventBus } from '../core/EventBus.js';

export class IntegrationRoom {
  constructor(router) {
    this.router = router;
    this.container = router.uiContainer;
    this.synthesis = null;
    this.db = null;
  }

  async render() {
    this.container.innerHTML = `
      <div class="glass-panel fade-in" style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; border-radius: 0; border: none; pointer-events: auto;">
        <h2 style="font-size: 2rem; margin-bottom: 20px; color: var(--accent-violet);">Integration Room</h2>
        <div style="display: flex; width: 80%; max-width: 1000px; gap: 20px; margin-bottom: 20px; flex: 1; max-height: 40vh;">
          <div class="glass-panel" style="flex: 1; display: flex; flex-direction: column;">
            <h3 style="margin-bottom: 10px; color: var(--team1-color);">P1 Reflection</h3>
            <textarea id="p1-text" style="flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-main); padding: 10px; border-radius: 8px; resize: none; font-family: var(--font-body);"></textarea>
          </div>
          <div class="glass-panel" style="flex: 1; display: flex; flex-direction: column;">
            <h3 style="margin-bottom: 10px; color: var(--team2-color);">P2 Reflection</h3>
            <textarea id="p2-text" style="flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-main); padding: 10px; border-radius: 8px; resize: none; font-family: var(--font-body);"></textarea>
          </div>
        </div>
        <div id="stats-panel" class="glass-panel" style="width: 80%; max-width: 1000px; padding: 15px 20px; margin-bottom: 20px;"></div>
        <div class="glass-panel" style="width: 80%; max-width: 1000px; padding: 20px; margin-bottom: 20px; min-height: 80px; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="color: var(--accent-violet);">Ollama / Gemma Synthesis</h3>
            <button id="btn-synthesize" style="padding: 5px 15px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.5); color: var(--text-main); border-radius: 6px; cursor: pointer; transition: all 0.2s;">Synthesize</button>
          </div>
          <p id="synthesis-result" style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">Awaiting inputs...</p>
        </div>
        <div style="display: flex; gap: 1rem;">
          <button id="btn-export">Export Game Log</button>
          <button class="primary" id="btn-home">Return to Source</button>
        </div>
      </div>
    `;

    await this._renderStats();
    this._bindSynthesize();
    this._bindExport();
    document.getElementById('btn-home').addEventListener('click', () => {
      this.router.navigate(SCREENS.CONFIG);
    });
  }

  async _renderStats() {
    const stats = gameState.stats || { scores: { 1: 0, 2: 0 }, kills: { 1: 0, 2: 0 }, damage: { 1: 0, 2: 0 } };
    document.getElementById('stats-panel').innerHTML = `
      <div style="display: flex; justify-content: space-around; text-align: center;">
        <div><strong style="color: var(--team1-color);">P1</strong><br>Score: ${stats.scores[1]}<br>Kills: ${stats.kills[1]}<br>Dmg: ${stats.damage[1]}</div>
        <div><strong style="color: var(--text-muted);">vs</strong></div>
        <div><strong style="color: var(--team2-color);">P2</strong><br>Score: ${stats.scores[2]}<br>Kills: ${stats.kills[2]}<br>Dmg: ${stats.damage[2]}</div>
      </div>
    `;
  }

  _bindSynthesize() {
    document.getElementById('btn-synthesize').addEventListener('click', async () => {
      const p1 = document.getElementById('p1-text').value;
      const p2 = document.getElementById('p2-text').value;
      const resultNode = document.getElementById('synthesis-result');
      resultNode.textContent = 'Analizando ecos de consciencia...';
      resultNode.style.color = 'var(--text-muted)';

      if (!this.synthesis) {
        this.synthesis = new SynthesisEngine();
        await this.synthesis.initialize();
      }
      const result = await this.synthesis.generate(p1, p2);
      resultNode.textContent = result;
      resultNode.style.color = 'var(--text-main)';

      if (!this.db) {
        try { this.db = new ReplayerDB(); } catch { /* DB unavailable */ }
      }
      if (this.db && gameState.gameId) {
        try {
          await this.db.recordReflection(gameState.gameId, p1, p2, result);
        } catch { /* reflection save failed silently */ }
      }
      eventBus.emit(EVENTS.AI_SYNTHESIS, { p1, p2, result });
    });
  }

  _bindExport() {
    document.getElementById('btn-export').addEventListener('click', () => {
      const gameId = gameState.gameId || 'unknown';
      const data = {
        exportedAt: new Date().toISOString(),
        gameId,
        stats: gameState.stats,
        moves: gameState.moves || [],
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gocurvicnamics_${gameId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
