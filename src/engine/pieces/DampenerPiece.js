import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';

export class DampenerPiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.DAMPENER, x, y);
  }

  onCollision(other, relVel) {
    const damage = relVel > 8 ? 1 : 0;
    return { damage, shockwave: false, knockbackReduction: 0.3 };
  }

  getKnockbackReduction() { return 0.3; }
}
