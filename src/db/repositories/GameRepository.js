import { createGameObject } from '../schema/GameSchema.js';

export class GameRepository {
  constructor(db) {
    this.db = db;
  }

  async create(config, initialState) {
    const game = createGameObject(config, initialState);
    await this.db.games.add(game);
    return game.id;
  }

  async getById(id) {
    return this.db.games.get(id);
  }

  async getAll() {
    return this.db.games.orderBy('createdAt').reverse().toArray();
  }

  async updateStatus(id, status) {
    return this.db.games.update(id, { status });
  }

  async delete(id) {
    return this.db.games.delete(id);
  }
}
