import { ScoreBoard } from './ScoreBoard.js';
import { GAMEPLAY_DEFAULTS } from '../../config/GameplayConfig.js';
import { eventBus } from '../../core/EventBus.js';
import { EVENTS } from '../../core/Constants.js';

export class ScoreManager {
  constructor() {
    this.board = new ScoreBoard();
  }

  onPieceDestroyed(destroyedPiece, killerPlayerId) {
    this.board.addScore(killerPlayerId, GAMEPLAY_DEFAULTS.scorePerKill);
    this.board.recordKill(killerPlayerId);
    eventBus.emit(EVENTS.SCORE_CHANGED, {
      playerId: killerPlayerId,
      score: this.board.getScore(killerPlayerId),
      total: this.board.scores,
    });
    eventBus.emit(EVENTS.PIECE_DESTROYED, {
      piece: destroyedPiece,
      killerPlayerId,
    });
  }

  onDamageDealt(attackerId, amount) {
    this.board.recordDamage(attackerId, amount);
  }

  getScores() {
    return this.board.scores;
  }

  getStats() {
    return this.board.toJSON();
  }

  reset() {
    this.board.reset();
  }
}
