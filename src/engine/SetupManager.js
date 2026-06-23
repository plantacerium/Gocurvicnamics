import { Board } from './Board.js';
import { Renderer } from './Renderer.js';
import { PIECE_TYPES } from './Piece.js';

export class SetupManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.board = new Board();
    // Don't initialize with random pieces
    
    // We pass a dummy traceInput since Renderer expects one
    this.renderer = new Renderer(canvas, this.board, { state: 'IDLE' });
    
    this.currentPlayer = 1;
    this.selectedPieceType = PIECE_TYPES.BASE;
    
    this.isRendering = true;
    this.bindEvents();
    
    // Setup loop
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  bindEvents() {
    this.clickHandler = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      this.board.tryPlacePiece(this.currentPlayer, this.selectedPieceType, mouseX, mouseY);
    };
    
    this.canvas.addEventListener('mousedown', this.clickHandler);
  }

  updateConfig(layout, size, cell, space) {
    this.board.updateTopology(layout, size, cell, space);
    this.renderer.resize();
  }

  loop() {
    if (!this.isRendering) return;
    this.renderer.render();
    requestAnimationFrame(this.loop);
  }

  destroy() {
    this.isRendering = false;
    this.canvas.removeEventListener('mousedown', this.clickHandler);
  }
}
