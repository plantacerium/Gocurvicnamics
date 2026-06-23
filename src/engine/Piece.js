import { DEFAULT_CONFIG } from '../config/defaults.js';

export const PIECE_TYPES = {
  BASE: 'BASE',
  DAMPENER: 'DAMPENER',
  AMPLIFIER: 'AMPLIFIER',
  SLINGSHOT: 'SLINGSHOT'
};

export const PIECE_SPECS = {
  [PIECE_TYPES.BASE]: { mass: 1.0, hp: 3, radiusMultiplier: 1.0, color: '#e2e8f0' },
  [PIECE_TYPES.DAMPENER]: { mass: 1.5, hp: 8, radiusMultiplier: 1.2, color: '#94a3b8' },
  [PIECE_TYPES.AMPLIFIER]: { mass: 0.5, hp: 1, radiusMultiplier: 0.8, color: '#f43f5e' },
  [PIECE_TYPES.SLINGSHOT]: { mass: 0.8, hp: 2, radiusMultiplier: 0.9, color: '#8b5cf6' }
};

export class Piece {
  constructor(id, playerId, type, x, y) {
    this.id = id;
    this.playerId = playerId;
    this.type = type;
    this.x = x;
    this.y = y;
    
    const specs = PIECE_SPECS[type];
    this.mass = specs.mass;
    this.maxHp = specs.hp;
    this.hp = this.maxHp;
    this.radius = DEFAULT_CONFIG.pieces.baseRadius * specs.radiusMultiplier;
    this.color = specs.color;
    
    this.destroyed = false;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.destroyed = true;
    }
  }

  // Called by TurnManager / PhysicsEngine when resolving collisions
  onCollision(otherPiece, relativeVelocity) {
    const impactForce = relativeVelocity * this.mass;
    
    // Simple damage model based on impact
    if (impactForce > 5) {
      this.takeDamage(1);
    }
    
    // Type specific behavior
    if (this.type === PIECE_TYPES.DAMPENER) {
      // Absorbs kinetic energy, doesn't take extra damage
    } else if (this.type === PIECE_TYPES.AMPLIFIER) {
      // Disperses shockwave (handled in PhysicsEngine)
      this.takeDamage(this.hp); // Extremely fragile, destroyed on heavy impact
    }
  }
}
