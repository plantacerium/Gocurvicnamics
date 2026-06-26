import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';
import { eventBus } from '../../core/EventBus.js';

export class MiragePiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.MIRAGE, x, y);
    this.hasSpawnedMirage = false;
  }

  onTurnStart() {
    super.onTurnStart();
    this.hasSpawnedMirage = false;
  }

  onCollision(other, relVel) {
    if (relVel > 5 && !this.hasSpawnedMirage) {
      this.hasSpawnedMirage = true;
      eventBus.emit('SPAWN_MIRAGE', { sourceId: this.id, x: this.x, y: this.y, playerId: this.playerId });
    }
    return { damage: relVel > 5 ? 1 : 0, shockwave: false };
  }
}
