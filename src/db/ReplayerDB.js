import Dexie from 'dexie';

export class ReplayerDB extends Dexie {
  constructor() {
    super('GocurvicnamicsDB');
    
    // Schema definition
    this.version(1).stores({
      games: 'id, createdAt, status', 
      moves: 'id, gameId, turnNumber',
      reflections: 'id, gameId'
    });
  }

  async createGame(config, initialBoardState) {
    const gameId = 'game_' + Date.now();
    await this.games.add({
      id: gameId,
      createdAt: new Date(),
      status: 'active',
      config: config,
      initialState: initialBoardState
    });
    return gameId;
  }

  async recordMove(gameId, turnNumber, playerId, pieceId, curveData) {
    await this.moves.add({
      id: `move_${gameId}_${turnNumber}`,
      gameId,
      turnNumber,
      playerId,
      pieceId,
      curveData,
      timestamp: new Date()
    });
  }

  async recordReflection(gameId, p1Text, p2Text) {
    await this.reflections.add({
      id: `ref_${gameId}`,
      gameId,
      p1Text,
      p2Text,
      timestamp: new Date()
    });
  }
}
