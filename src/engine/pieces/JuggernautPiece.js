import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';

export class JuggernautPiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.JUGGERNAUT, x, y);
    this._damageTakenThisTurn = 0;
  }

  onTurnStart() {
    super.onTurnStart();
    this._damageTakenThisTurn = 0;
  }

  takeDamage(amount) {
    // Cap damage to 1 per turn
    const actualDamage = Math.min(amount, 1 - this._damageTakenThisTurn);
    if (actualDamage > 0) {
      super.takeDamage(actualDamage);
      this._damageTakenThisTurn += actualDamage;
    }
  }

  onCollision(other, relVel) {
    return { damage: relVel > 5 ? 1 : 0, shockwave: false };
  }
}
