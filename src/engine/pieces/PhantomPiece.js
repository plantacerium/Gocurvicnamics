import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';

export class PhantomPiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.PHANTOM, x, y);
  }

  onCollision(other, relVel) {
    const damage = relVel > 10.0 ? 0 : 1;
    return { damage, shockwave: false };
  }
}
