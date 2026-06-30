import { Board } from './board/Board.js';
import { Renderer } from './render/Renderer.js';
import { PIECE_TYPES } from '../config/PieceConfig.js';

export class SetupManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.board = new Board({});
    
    // Mock trace input for the renderer during setup phase
    const mockTraceInput = {
      getActiveTraces: () => [],
      pieceTraceMap: new Map()
    };
    
    this.renderer = new Renderer(canvas, this.board, mockTraceInput);
    this.currentPlayer = 1;
    this.selectedPieceType = PIECE_TYPES.BASE;
    this.isRendering = true;
    this.onBoardChanged = null;
    this._clickHandler = (e) => this._onClick(e);
    this._contextMenuHandler = (e) => e.preventDefault();
    this.canvas.addEventListener('mousedown', this._clickHandler);
    this.canvas.addEventListener('contextmenu', this._contextMenuHandler);
    this._loop = () => {
      if (!this.isRendering) return;
      this.renderer.render();
      requestAnimationFrame(this._loop);
    };
    requestAnimationFrame(this._loop);
  }

  _onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    
    if (e.button === 2) {
      if (this.board.removePieceAt(mx, my)) {
        if (this.onBoardChanged) this.onBoardChanged();
      }
    } else {
      const res = this.board.tryPlacePiece(this.currentPlayer, this.selectedPieceType, mx, my);
      if (res.valid && this.onBoardChanged) {
        this.onBoardChanged();
      }
    }
  }

  populateDefaultPieces() {
    const types = Object.values(PIECE_TYPES);
    for (let player = 1; player <= 2; player++) {
      for (const type of types) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 500) {
          const zone = this.board.anchorZones[Math.floor(Math.random() * this.board.anchorZones.length)];
          if (zone.player !== player) { attempts++; continue; }
          const cellX = zone.x + Math.floor(Math.random() * zone.cols) * zone.cellSize + zone.cellSize / 2;
          const cellY = zone.y + Math.floor(Math.random() * zone.rows) * zone.cellSize + zone.cellSize / 2;
          const res = this.board.tryPlacePiece(player, type, cellX, cellY);
          if (res.valid) placed = true;
          attempts++;
        }
      }
    }
  }

  updateConfig(layout, size, cell, space) {
    this.board.updateTopology(layout, size, cell, space);
    this.renderer.resize();
  }

  destroy() {
    this.isRendering = false;
    this.canvas.removeEventListener('mousedown', this._clickHandler);
    this.canvas.removeEventListener('contextmenu', this._contextMenuHandler);
  }
}
