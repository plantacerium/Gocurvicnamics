import { createReflectionObject } from '../schema/ReflectionSchema.js';

export class ReflectionRepository {
  constructor(db) {
    this.db = db;
  }

  async record(gameId, p1Text, p2Text) {
    const ref = createReflectionObject(gameId, p1Text, p2Text);
    await this.db.reflections.add(ref);
    return ref.id;
  }

  async getByGameId(gameId) {
    return this.db.reflections
      .where('gameId').equals(gameId)
      .toArray();
  }
}
