import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';

export class SpecterPiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.SPECTER, x, y);
  }

  takeDamage(amount, sourceMass = 1.0) {
    // Takes no damage from pieces with Mass > 1.5
    // Note: DamageResolver will need to be updated to pass sourceMass, 
    // or we can just assume standard amount. We'll handle sourceMass in DamageResolver.
    if (sourceMass > 1.5) {
      return; // Immune
    }
    super.takeDamage(amount);
  }

  onCollision(other, relVel) {
    return { damage: relVel > 5 ? 1 : 0, shockwave: false };
  }
}
