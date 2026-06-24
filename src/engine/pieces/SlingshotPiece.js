import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';

export class SlingshotPiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.SLINGSHOT, x, y);
    this.curveLengthMultiplier = 1.0;
  }

  setCurveLengthMultiplier(curveLength) {
    const raw = curveLength / 200.0;
    this.curveLengthMultiplier = Math.min(Math.max(raw, 0.5), 5.0);
  }

  onCollision(other, relVel) {
    const baseDamage = relVel > 3 ? 1 : 0;
    const amplified = Math.round(baseDamage * this.curveLengthMultiplier);
    return { damage: amplified, shockwave: false };
  }
}
