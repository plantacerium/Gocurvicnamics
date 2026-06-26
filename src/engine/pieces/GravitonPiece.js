import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';

export class GravitonPiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.GRAVITON, x, y);
  }

  onCollision(other, relVel) {
    return { damage: 1, shockwave: false, knockbackReduction: 0.8 };
  }

  getKnockbackReduction() { return 0.8; }
}
