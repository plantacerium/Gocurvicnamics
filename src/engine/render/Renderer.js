import { BoardRenderer } from './BoardRenderer.js';
import { PieceRenderer } from './PieceRenderer.js';
import { TraceRenderer } from './TraceRenderer.js';
import { EffectsRenderer } from './EffectsRenderer.js';
import { HUDCanvasRenderer } from './HUDCanvasRenderer.js';
import { stoneLoader } from './StoneImageLoader.js';

export class Renderer {
  constructor(canvas, board, traceInput) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.board = board;
    this.traceInput = traceInput;

    this.boardRenderer = new BoardRenderer(this.ctx);
    this.pieceRenderer = new PieceRenderer(this.ctx, stoneLoader);
    this.traceRenderer = new TraceRenderer(this.ctx);
    this.effectsRenderer = new EffectsRenderer(this.ctx);
    this.hudRenderer = new HUDCanvasRenderer(this.ctx);

    this.shockwaveGenerator = null;
    this.ghostTrailRenderer = null;
    this.currentPlayer = 1;
    this.turnNumber = 0;
    this.scores = { 1: 0, 2: 0 };

    this._lastTime = 0;

    this.resize();
    this._resizeTimer = null;
    window.addEventListener('resize', () => {
      if (this._resizeTimer) cancelAnimationFrame(this._resizeTimer);
      this._resizeTimer = requestAnimationFrame(() => this.resize());
    });

    this._preloadAssets();
  }

  async _preloadAssets() {
    try {
      await stoneLoader.preload();
    } catch (e) {
      console.warn('[Renderer] Stone image preload partial failure — using fallbacks');
    }
  }

  resize() {
    this.canvas.width = this.board.width || 1400;
    this.canvas.height = this.board.height || 800;
  }

  render(dt = 16) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.boardRenderer.render(this.board);
    if (this.ghostTrailRenderer) {
      this.ghostTrailRenderer.render(this.ctx);
    }
    this.traceRenderer.render(this.traceInput);
    this.pieceRenderer.render(this.board.getAllPieces(), this.traceInput.selectedPieceId, dt, this.currentPlayer);
    if (this.shockwaveGenerator) {
      this.effectsRenderer.renderShockwaves(this.shockwaveGenerator.getActive());
    }
    this.effectsRenderer.renderActiveParticles();
    this.hudRenderer.render(this.turnNumber, this.currentPlayer, this.scores, this.board);
  }

  setGameState(currentPlayer, turnNumber, scores) {
    this.currentPlayer = currentPlayer;
    this.turnNumber = turnNumber;
    this.scores = scores;
  }
}
