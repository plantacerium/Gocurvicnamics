import { Board } from './board/Board.js';
import { Renderer } from './render/Renderer.js';
import { PIECE_TYPES } from '../config/PieceConfig.js';

export class SetupManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.board = new Board({});
    this.renderer = new Renderer(canvas, this.board, { state: 'IDLE' });
    this.currentPlayer = 1;
    this.selectedPieceType = PIECE_TYPES.BASE;
    this.isRendering = true;
    this._clickHandler = (e) => this._onClick(e);
    this.canvas.addEventListener('mousedown', this._clickHandler);
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
    this.board.tryPlacePiece(this.currentPlayer, this.selectedPieceType, mx, my);
  }

  updateConfig(layout, size, cell, space) {
    this.board.updateTopology(layout, size, cell, space);
    this.renderer.resize();
  }

  destroy() {
    this.isRendering = false;
    this.canvas.removeEventListener('mousedown', this._clickHandler);
  }
}
