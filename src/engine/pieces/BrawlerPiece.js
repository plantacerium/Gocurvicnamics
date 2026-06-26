import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../config/PieceConfig.js';

export class BrawlerPiece extends Piece {
  constructor(id, playerId, x, y) {
    super(id, playerId, PIECE_TYPES.BRAWLER, x, y);
  }

  onCollision(other, relVel) {
    // +1 extra damage if hitting at low/medium speeds (between 1 and 6)
    const baseDamage = relVel > 5 ? 1 : 0;
    const bonus = (relVel > 1 && relVel < 6) ? 1 : 0;
    return { damage: baseDamage + bonus, shockwave: false };
  }
}
