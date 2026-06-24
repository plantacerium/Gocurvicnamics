export const MOVE_SCHEMA = 'id, gameId, turnNumber';

export const createMoveObject = (gameId, turnNumber, playerId, pieceId, curveData) => ({
  id: `move_${gameId}_${turnNumber}`,
  gameId,
  turnNumber,
  playerId,
  pieceId,
  curveData,
  timestamp: new Date(),
});
