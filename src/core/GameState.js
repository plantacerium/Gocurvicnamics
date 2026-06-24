class GameState {
  constructor() {
    this.gameId = null;
    this.stats = { scores: { 1: 0, 2: 0 }, kills: { 1: 0, 2: 0 }, damage: { 1: 0, 2: 0 } };
    this.moves = [];
    this.config = null;
  }

  setGameId(id) { this.gameId = id; }
  setConfig(config) { this.config = config; }
  setStats(stats) { this.stats = stats; }
  addMove(move) { this.moves.push(move); }
  reset() {
    this.gameId = null;
    this.stats = { scores: { 1: 0, 2: 0 }, kills: { 1: 0, 2: 0 }, damage: { 1: 0, 2: 0 } };
    this.moves = [];
    this.config = null;
  }
}

export const gameState = new GameState();
