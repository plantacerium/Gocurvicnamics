import { PIECE_DEFAULTS } from '../../config/PieceConfig.js';
import { PieceTypeRegistry } from './PieceTypeRegistry.js';
import { eventBus } from '../../core/EventBus.js';
import { EVENTS } from '../../core/Constants.js';

export class Piece {
  constructor(id, playerId, type, x, y) {
    this.id = id;
    this.playerId = playerId;
    this.type = type;

    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    const specs = PieceTypeRegistry.getSpecs(type);
    this.mass = specs.mass;
    this.maxHp = specs.hp;
    this.hp = this.maxHp;
    this.radius = PIECE_DEFAULTS.baseRadius * specs.radiusMultiplier;
    this.color = specs.color;

    this.destroyed = false;
    this.lastCollisionTick = 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.destroyed = true;
    }
    eventBus.emit(EVENTS.PIECE_DAMAGED, { pieceId: this.id, amount, hp: this.hp, destroyed: this.destroyed });
  }

  isAlive() {
    return !this.destroyed && this.hp > 0;
  }

  toJSON() {
    return {
      id: this.id,
      playerId: this.playerId,
      type: this.type,
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      mass: this.mass,
      radius: this.radius,
      destroyed: this.destroyed,
    };
  }
}
