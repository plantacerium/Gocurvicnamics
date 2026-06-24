import { createMoveObject } from '../schema/MoveSchema.js';

export class MoveRepository {
  constructor(db) {
    this.db = db;
  }

  async record(gameId, turnNumber, playerId, pieceId, curveData) {
    const move = createMoveObject(gameId, turnNumber, playerId, pieceId, curveData);
    await this.db.moves.add(move);
    return move.id;
  }

  async getByGameId(gameId) {
    return this.db.moves
      .where('gameId').equals(gameId)
      .sortBy('turnNumber');
  }

  async getLastMove(gameId) {
    const moves = await this.getByGameId(gameId);
    return moves.length > 0 ? moves[moves.length - 1] : null;
  }
}
