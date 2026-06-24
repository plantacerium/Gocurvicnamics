export class ScoreBoard {
  constructor() {
    this.scores = { 1: 0, 2: 0 };
    this.totalKills = { 1: 0, 2: 0 };
    this.totalDamageDealt = { 1: 0, 2: 0 };
  }

  addScore(playerId, points) {
    this.scores[playerId] += points;
  }

  recordKill(playerId) {
    this.totalKills[playerId]++;
  }

  recordDamage(playerId, amount) {
    this.totalDamageDealt[playerId] += amount;
  }

  getScore(playerId) {
    return this.scores[playerId] || 0;
  }

  getLeader() {
    return this.scores[1] > this.scores[2] ? 1 : this.scores[2] > this.scores[1] ? 2 : 0;
  }

  reset() {
    this.scores = { 1: 0, 2: 0 };
    this.totalKills = { 1: 0, 2: 0 };
    this.totalDamageDealt = { 1: 0, 2: 0 };
  }

  toJSON() {
    return {
      scores: { ...this.scores },
      kills: { ...this.totalKills },
      damage: { ...this.totalDamageDealt },
    };
  }
}
