import { GameConfig } from '../core/GameConfig.js';
import { PIECE_TYPES, PIECE_TYPE_LIST } from '../config/PieceConfig.js';

export class ConfigScreen {
  constructor(router) {
    this.router = router;
    this.canvas = router.canvas;
    this.uiContainer = router.uiContainer;
    this.config = new GameConfig();
    this.setupManager = null;
  }

  async render() {
    this.uiContainer.innerHTML = '';
    this._buildUI();

    const { SetupManager } = await import('../engine/SetupManager.js');
    this.setupManager = new SetupManager(this.canvas);
    this.setupManager.board.config = this.config;

    this._bindSliders();
    this._bindPlayerToggle();
    this._bindPieceSelection();
    this._bindStart();
  }

  _buildUI() {
    this.uiContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; padding: 20px; pointer-events: none; flex: 1;">
        <div class="glass-panel" style="width: 300px; display: flex; flex-direction: column; gap: 15px; pointer-events: auto;">
          <h2 style="color: var(--accent-cyan); font-size: 1.5rem;">Board Setup</h2>
          <div><label style="color: var(--text-muted); font-size: 0.9rem;">Grid Layout (NxN): <span id="val-layout">2</span></label>
            <input type="range" id="cfg-layout" min="1" max="4" value="2" style="width: 100%;"></div>
          <div><label style="color: var(--text-muted); font-size: 0.9rem;">Grid Size (cells): <span id="val-size">5</span></label>
            <input type="range" id="cfg-size" min="3" max="10" value="5" style="width: 100%;"></div>
          <div><label style="color: var(--text-muted); font-size: 0.9rem;">Cell Size: <span id="val-cell">60</span>px</label>
            <input type="range" id="cfg-cell" min="40" max="100" value="60" step="5" style="width: 100%;"></div>
          <div><label style="color: var(--text-muted); font-size: 0.9rem;">Empty Space: <span id="val-space">15</span></label>
            <input type="range" id="cfg-space" min="5" max="30" value="15" style="width: 100%;"></div>
          <div style="margin-top: 10px;">
            <label style="color: var(--text-muted); font-size: 0.9rem;">Current Player: <span id="val-player" style="color: var(--accent-cyan); font-weight: bold;">Player 1</span></label>
            <button id="btn-toggle-player" style="width: 100%; margin-top: 5px;">Switch Player</button>
          </div>
          <button class="primary" id="btn-start" style="margin-top: auto;">Start Game</button>
        </div>
      </div>
      <div class="glass-panel" style="margin: 20px; pointer-events: auto; display: flex; justify-content: center; gap: 20px;">
        ${PIECE_TYPE_LIST.map(t => {
          const color = this.config.pieces.specs[t]?.color || '#e2e8f0';
          const label = this.config.pieces.specs[t]?.label || t;
          return `<button class="piece-btn ${t === 'BASE' ? 'selected' : ''}" data-type="${t}" style="border-color: ${color}; color: ${color};">${label}</button>`;
        }).join('')}
      </div>
    `;
  }

  _bindSliders() {
    const refs = {
      layout: document.getElementById('cfg-layout'),
      size: document.getElementById('cfg-size'),
      cell: document.getElementById('cfg-cell'),
      space: document.getElementById('cfg-space'),
      valLayout: document.getElementById('val-layout'),
      valSize: document.getElementById('val-size'),
      valCell: document.getElementById('val-cell'),
      valSpace: document.getElementById('val-space'),
    };

    const updateConfig = () => {
      refs.valLayout.textContent = refs.layout.value;
      refs.valSize.textContent = refs.size.value;
      refs.valCell.textContent = refs.cell.value;
      refs.valSpace.textContent = refs.space.value;

      this.setupManager.updateConfig(
        parseInt(refs.layout.value),
        parseInt(refs.size.value),
        parseInt(refs.cell.value),
        parseInt(refs.space.value)
      );
    };

    [refs.layout, refs.size, refs.cell, refs.space].forEach(el => {
      el.addEventListener('input', updateConfig);
    });
    updateConfig();
  }

  _bindPlayerToggle() {
    document.getElementById('btn-toggle-player').addEventListener('click', () => {
      this.setupManager.currentPlayer = this.setupManager.currentPlayer === 1 ? 2 : 1;
      const el = document.getElementById('val-player');
      el.textContent = `Player ${this.setupManager.currentPlayer}`;
      el.style.color = this.setupManager.currentPlayer === 1 ? 'var(--accent-cyan)' : 'var(--accent-red)';
    });
  }

  _bindPieceSelection() {
    document.querySelectorAll('.piece-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.piece-btn').forEach(b => {
          b.classList.remove('selected');
          b.style.background = 'rgba(255, 255, 255, 0.05)';
        });
        e.target.classList.add('selected');
        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
        this.setupManager.selectedPieceType = e.target.getAttribute('data-type');
      });
    });
  }

  _bindStart() {
    document.getElementById('btn-start').addEventListener('click', () => {
      this.setupManager.destroy();
      this.router.navigate('GAME', {
        board: this.setupManager.board,
        config: this.config,
      });
    });
  }

  destroy() {
    if (this.setupManager) {
      this.setupManager.destroy();
      this.setupManager = null;
    }
  }
}
