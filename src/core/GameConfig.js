import { BOARD_DEFAULTS } from '../config/BoardConfig.js';
import { PIECE_SPECS, PIECE_TYPES, PIECE_DEFAULTS } from '../config/PieceConfig.js';
import { PHYSICS_DEFAULTS } from '../config/PhysicsConfig.js';

export class GameConfig {
  constructor() {
    this.board = { ...BOARD_DEFAULTS };
    this.pieces = { ...PIECE_DEFAULTS, specs: { ...PIECE_SPECS } };
    this.physics = { ...PHYSICS_DEFAULTS };
    this.players = [
      { id: 1, name: 'Player 1', color: '#06b6d4' },
      { id: 2, name: 'Player 2', color: '#f43f5e' },
    ];
    this.layout = BOARD_DEFAULTS.defaultLayout;
    this.gridSize = BOARD_DEFAULTS.defaultGridSize;
    this.cellSize = BOARD_DEFAULTS.defaultCellSize;
    this.emptySpace = BOARD_DEFAULTS.defaultEmptySpace;
  }

  toJSON() {
    return {
      board: { ...this.board },
      pieces: { startCountPerZone: this.pieces.startCountPerZone, baseRadius: this.pieces.baseRadius || 20 },
      physics: { ...this.physics },
      players: [...this.players],
      layout: this.layout,
      gridSize: this.gridSize,
      cellSize: this.cellSize,
      emptySpace: this.emptySpace,
    };
  }
}
