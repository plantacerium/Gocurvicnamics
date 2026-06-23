import { DEFAULT_CONFIG } from '../config/defaults.js';
import { Piece, PIECE_TYPES } from './Piece.js';

export class Board {
  constructor(config = DEFAULT_CONFIG) {
    this.config = config;
    this.width = config.board.width;
    this.height = config.board.height;
    this.anchorZones = config.board.anchorZones;
    
    this.pieces = new Map(); // pieceId -> Piece object
    this.nextPieceId = 1;
  }

  initialize() {
    this.pieces.clear();
    // No random pieces by default anymore
  }

  updateTopology(layout, size, cell, space) {
    // Reconfigure board dimensions and zones based on UI input
    // layout is N, meaning a single N x N matrix of grids total.
    // size is the number of cells per grid.
    // cell is the cell size in pixels.
    // space acts as the "void" padding between and around zones in units.
    
    const padding = space * 20; // 1 space unit = 20px
    const gridW = size * cell;
    const gridH = size * cell;
    
    this.anchorZones = [];
    
    const isOdd = layout % 2 !== 0;
    const centerCol = Math.floor(layout / 2);
    
    for (let r = 0; r < layout; r++) {
      for (let c = 0; c < layout; c++) {
        let player = 0; // Neutral by default
        
        if (c < centerCol) {
          player = 1;
        } else if (c > centerCol || (!isOdd && c === centerCol)) {
          player = 2;
        }
        
        // If player === 0, it's neutral, we still generate a visual zone but it's not owned by either.
        // Actually, maybe we only want to generate owned anchor zones to place pieces in,
        // but generating neutral ones gives visual structure to the void.
        
        this.anchorZones.push({
          id: `z_r${r}_c${c}`,
          player: player,
          x: padding + c * (gridW + padding),
          y: padding + r * (gridH + padding),
          cols: size,
          rows: size,
          cellSize: cell
        });
      }
    }
    
    this.width = layout * gridW + (layout + 1) * padding;
    this.height = layout * gridH + (layout + 1) * padding;
    
    this.config.board.anchorZones = this.anchorZones;
    this.config.board.width = this.width;
    this.config.board.height = this.height;
    
    // Purge out-of-bounds pieces
    for (const [id, piece] of this.pieces.entries()) {
      if (piece.x > this.width || piece.y > this.height) {
         this.pieces.delete(id);
      }
    }
  }

  tryPlacePiece(playerId, type, x, y) {
    // Check if within any anchor zone of this player
    const validZone = this.anchorZones.find(z => 
      z.player === playerId &&
      x >= z.x && x <= z.x + z.cols * z.cellSize &&
      y >= z.y && y <= z.y + z.rows * z.cellSize
    );
    
    if (!validZone) return;
    
    // Snap to cell center
    const col = Math.floor((x - validZone.x) / validZone.cellSize);
    const row = Math.floor((y - validZone.y) / validZone.cellSize);
    
    const snappedX = validZone.x + col * validZone.cellSize + validZone.cellSize / 2;
    const snappedY = validZone.y + row * validZone.cellSize + validZone.cellSize / 2;
    
    // Check if cell is occupied
    const isOccupied = Array.from(this.pieces.values()).some(p => {
      const dx = p.x - snappedX;
      const dy = p.y - snappedY;
      return Math.sqrt(dx*dx + dy*dy) < this.config.pieces.baseRadius * 2; // Roughly same cell
    });

    if (!isOccupied) {
      const piece = new Piece(`piece_${this.nextPieceId++}`, playerId, type, snappedX, snappedY);
      this.pieces.set(piece.id, piece);
    }
  }

  getPiece(id) {
    return this.pieces.get(id);
  }

  getAllPieces() {
    return Array.from(this.pieces.values()).filter(p => !p.destroyed);
  }
  
  removeDestroyedPieces() {
    for (const [id, piece] of this.pieces.entries()) {
      if (piece.destroyed) {
        this.pieces.delete(id);
      }
    }
  }
}
