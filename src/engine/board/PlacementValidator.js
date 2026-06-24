import { GAMEPLAY_DEFAULTS } from '../../config/GameplayConfig.js';
import { PIECE_DEFAULTS } from '../../config/PieceConfig.js';

export class PlacementValidator {
  constructor(board) {
    this.board = board;
  }

  canPlace(playerId, type, x, y) {
    const zone = this.findZone(playerId, x, y);
    if (!zone) return { valid: false, reason: 'out_of_bounds' };

    const snapped = zone.snapToCell(x, y);
    if (this.isCellOccupied(snapped.x, snapped.y)) {
      return { valid: false, reason: 'cell_occupied' };
    }

    const zoneCount = this.getPieceCountInZone(zone.id, playerId);
    if (zoneCount >= GAMEPLAY_DEFAULTS.maxPiecesPerZone) {
      return { valid: false, reason: 'zone_full' };
    }

    return { valid: true, zone, snapped };
  }

  findZone(playerId, x, y) {
    return this.board.anchorZones.find(z =>
      z.player === playerId && z.contains(x, y)
    );
  }

  isCellOccupied(snappedX, snappedY, excludeId = null) {
    const threshold = PIECE_DEFAULTS.baseRadius * 2;
    for (const piece of this.board.getAllPieces()) {
      if (excludeId && piece.id === excludeId) continue;
      const dx = piece.x - snappedX;
      const dy = piece.y - snappedY;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) return true;
    }
    return false;
  }

  getPieceCountInZone(zoneId, playerId) {
    const zone = this.board.anchorZones.find(z => z.id === zoneId);
    if (!zone) return 0;
    return this.board.getAllPieces().filter(p =>
      p.playerId === playerId && zone.contains(p.x, p.y)
    ).length;
  }
}
