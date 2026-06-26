import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';

export class GlassCannonPiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.GLASS_CANNON, x, y);
  }

  onCollision(other, relVel) {
    if (relVel > 1) {
      this.takeDamage(this.hp); // Shatters on any impact
    }
    return { damage: relVel > 2 ? 3 : 0, shockwave: false }; // Deals high damage if it hits
  }
}
