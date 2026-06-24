import { ZoneGenerator } from './ZoneGenerator.js';
import { PlacementValidator } from './PlacementValidator.js';
import { PieceFactory } from '../pieces/PieceFactory.js';
import { PIECE_TYPES, PIECE_DEFAULTS } from '../../config/PieceConfig.js';

export class Board {
  constructor(config) {
    this.config = config;
    this.width = config.board?.width || 1400;
    this.height = config.board?.height || 800;
    this.anchorZones = config.board?.anchorZones || [];
    this.pieces = new Map();
    this.nextPieceId = 1;
    this.validator = new PlacementValidator(this);
  }

  initialize(layout, size, cell, space) {
    this.pieces.clear();
    this.nextPieceId = 1;
    const result = ZoneGenerator.generate(layout, size, cell, space);
    this.anchorZones = result.zones;
    this.width = result.boardWidth;
    this.height = result.boardHeight;
  }

  updateTopology(layout, size, cell, space) {
    this.initialize(layout, size, cell, space);
  }

  generateStartingPieces(countPerZone = PIECE_DEFAULTS.startCountPerZone) {
    const types = [PIECE_TYPES.BASE, PIECE_TYPES.DAMPENER, PIECE_TYPES.AMPLIFIER, PIECE_TYPES.SLINGSHOT];
    for (const zone of this.anchorZones) {
      if (zone.player === 0) continue;
      for (let i = 0; i < countPerZone; i++) {
        const type = types[i % types.length];
        const cellX = zone.x + (i % zone.cols) * zone.cellSize + zone.cellSize / 2;
        const cellY = zone.y + Math.floor(i / zone.cols) * zone.cellSize + zone.cellSize / 2;
        if (cellY < zone.y + zone.height) {
          this.addPiece(zone.player, type, cellX, cellY);
        }
      }
    }
  }

  tryPlacePiece(playerId, type, x, y) {
    const result = this.validator.canPlace(playerId, type, x, y);
    if (result.valid) {
      this.addPiece(playerId, type, result.snapped.x, result.snapped.y);
    }
    return result;
  }

  addPiece(playerId, type, x, y) {
    const id = `piece_${this.nextPieceId++}`;
    const piece = PieceFactory.create(id, playerId, type, x, y);
    this.pieces.set(piece.id, piece);
    return piece;
  }

  getPiece(id) {
    return this.pieces.get(id);
  }

  getAllPieces() {
    return Array.from(this.pieces.values()).filter(p => p.isAlive());
  }

  removeDestroyedPieces() {
    const destroyed = [];
    for (const [id, piece] of this.pieces.entries()) {
      if (piece.destroyed) {
        this.pieces.delete(id);
        destroyed.push(piece);
      }
    }
    return destroyed;
  }

  getPlayerPieces(playerId) {
    return this.getAllPieces().filter(p => p.playerId === playerId);
  }

  toJSON() {
    return {
      width: this.width,
      height: this.height,
      anchorZones: this.anchorZones.map(z => z.toJSON()),
      pieces: Array.from(this.pieces.values()).map(p => p.toJSON()),
      nextPieceId: this.nextPieceId,
    };
  }
}
