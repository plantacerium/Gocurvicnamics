import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';
import { eventBus } from '../../core/EventBus.js';

export class BlinkPiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.BLINK, x, y);
  }

  takeDamage(amount) {
    const wasHit = amount > 0;
    super.takeDamage(amount);
    if (wasHit && !this.destroyed) {
      eventBus.emit('BLINK_TELEPORT', { pieceId: this.id, playerId: this.playerId });
    }
  }

  onCollision(other, relVel) {
    return { damage: relVel > 5 ? 1 : 0, shockwave: false };
  }
}
