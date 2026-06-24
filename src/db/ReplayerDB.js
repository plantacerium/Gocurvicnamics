import Dexie from 'dexie';
import { GAME_SCHEMA } from './schema/GameSchema.js';
import { MOVE_SCHEMA } from './schema/MoveSchema.js';
import { REFLECTION_SCHEMA } from './schema/ReflectionSchema.js';
import { GameRepository } from './repositories/GameRepository.js';
import { MoveRepository } from './repositories/MoveRepository.js';
import { ReflectionRepository } from './repositories/ReflectionRepository.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../core/Constants.js';

export class ReplayerDB extends Dexie {
  constructor() {
    super('GocurvicnamicsDB');
    this.version(2).stores({
      games: GAME_SCHEMA,
      moves: MOVE_SCHEMA,
      reflections: REFLECTION_SCHEMA,
    });
    this.gamesRepo = new GameRepository(this);
    this.movesRepo = new MoveRepository(this);
    this.reflectionsRepo = new ReflectionRepository(this);
  }

  async createGame(config, initialState) {
    const id = await this.gamesRepo.create(config, initialState);
    eventBus.emit(EVENTS.DB_SAVED, { type: 'game', id });
    return id;
  }

  async recordMove(gameId, turnNumber, playerId, pieceId, curveData) {
    const result = await this.movesRepo.record(gameId, turnNumber, playerId, pieceId, curveData);
    eventBus.emit(EVENTS.DB_SAVED, { type: 'move', gameId, turnNumber });
    return result;
  }

  async recordReflection(gameId, p1Text, p2Text) {
    const result = await this.reflectionsRepo.record(gameId, p1Text, p2Text);
    eventBus.emit(EVENTS.DB_SAVED, { type: 'reflection', gameId });
    return result;
  }

  async getGame(id) {
    return this.gamesRepo.getById(id);
  }

  async getAllGames() {
    return this.gamesRepo.getAll();
  }

  async getGameMoves(gameId) {
    return this.movesRepo.getByGameId(gameId);
  }

  async getGameReflections(gameId) {
    return this.reflectionsRepo.getByGameId(gameId);
  }

  async updateGameStatus(id, status) {
    return this.gamesRepo.updateStatus(id, status);
  }
}
