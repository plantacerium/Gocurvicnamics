import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';
import { PHYSICS_DEFAULTS } from '../../config/PhysicsConfig.js';

export class AmplifierPiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.AMPLIFIER, x, y);
  }

  onCollision(other, relVel) {
    const destroyed = relVel > 1;
    return {
      damage: destroyed ? this.hp : 0,
      shockwave: true,
      shockwaveRadius: PHYSICS_DEFAULTS.shockwaveRadius,
      shockwaveForce: PHYSICS_DEFAULTS.shockwaveForce,
    };
  }
}
