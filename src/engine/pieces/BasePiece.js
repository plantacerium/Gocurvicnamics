import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';

export class BasePiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.BASE, x, y);
  }

  onCollision(other, relVel) {
    return { damage: relVel > 5 ? 1 : 0, shockwave: false };
  }
}
