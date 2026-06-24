import { SCREENS } from '../core/Constants.js';
import { ReplayerDB } from '../db/ReplayerDB.js';
import { ReplayEngine } from '../db/ReplayEngine.js';
import { Renderer } from '../engine/render/Renderer.js';
import { Board } from '../engine/board/Board.js';
import { Logger } from '../utils/Logger.js';

const log = Logger('ReplayerScreen');

export class ReplayerScreen {
  constructor(router) {
    this.router = router;
    this.container = router.uiContainer;
    this.canvas = router.canvas;
    this.db = new ReplayerDB();
    this.replayer = null;
    this.renderer = null;
    this.board = null;
  }

  async render() {
    const games = await this.db.getAllGames();

    this.container.innerHTML = `
      <div class="fade-in" style="display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%; padding: 40px; pointer-events: none;">
        <h2 style="color: var(--accent-cyan); font-size: 2rem; margin-bottom: 20px;">Replayer</h2>
        <div id="game-list" class="glass-panel" style="width: 80%; max-width: 600px; max-height: 50vh; overflow-y: auto; pointer-events: auto;">
          ${games.length === 0 ? '<p style="color: var(--text-muted); text-align: center;">No saved games yet.</p>' :
            games.map(g => `
              <div class="game-entry" data-id="${g.id}" style="padding: 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s;">
                <strong>${g.id}</strong>
                <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 10px;">${new Date(g.createdAt).toLocaleString()}</span>
                <span style="float: right; color: ${g.status === 'active' ? 'var(--accent-cyan)' : 'var(--text-muted)'};">${g.status}</span>
              </div>
            `).join('')}
        </div>
        <div id="replay-controls" style="margin-top: 20px; display: flex; gap: 10px; pointer-events: auto;">
          <button id="btn-replay-back">Back</button>
        </div>
      </div>
    `;

    document.querySelectorAll('.game-entry').forEach(el => {
      el.addEventListener('click', () => this._startReplay(el.dataset.id));
    });
    document.getElementById('btn-replay-back').addEventListener('click', () => {
      this.router.navigate(SCREENS.CONFIG);
    });
  }

  async _startReplay(gameId) {
    const game = await this.db.getGame(gameId);
    if (!game) return;

    this.container.innerHTML = `
      <div class="fade-in" style="display: flex; flex-direction: column; align-items: center; width: 100%; padding: 20px; pointer-events: none;">
        <div style="display: flex; gap: 10px; pointer-events: auto;">
          <button id="btn-play">▶ Play</button>
          <button id="btn-pause">⏸ Pause</button>
          <button id="btn-stop">⏹ Stop</button>
          <button id="btn-replay-list">← List</button>
        </div>
        <p id="replay-status" style="color: var(--text-muted); margin-top: 10px;">Loaded ${gameId}</p>
      </div>
    `;

    this.board = new Board(game.config || {});
    this.board.pieces.clear();
    if (game.initialState?.pieces) {
      for (const p of game.initialState.pieces) {
        const { PieceFactory } = await import('../engine/pieces/PieceFactory.js');
        this.board.pieces.set(p.id, PieceFactory.createFromData(p));
      }
    }
    this.renderer = new Renderer(this.canvas, this.board, { state: 'IDLE' });
    this.replayer = new ReplayEngine(this.canvas, this.board);
    await this.replayer.loadMoves(gameId, this.db);

    document.getElementById('btn-play').addEventListener('click', () => this.replayer.start());
    document.getElementById('btn-pause').addEventListener('click', () => this.replayer.pause());
    document.getElementById('btn-stop').addEventListener('click', () => this.replayer.stop());
    document.getElementById('btn-replay-list').addEventListener('click', () => this.render());
  }

  destroy() {
    if (this.replayer) { this.replayer.destroy(); this.replayer = null; }
    this.container.innerHTML = '';
  }
}
