import { GAMEPLAY_DEFAULTS } from '../../config/GameplayConfig.js';
import { PIECE_DEFAULTS, PIECE_SPECS } from '../../config/PieceConfig.js';

export class PlacementValidator {
  constructor(board) {
    this.board = board;
  }

  canPlace(playerId, type, x, y) {
    const zone = this.findZone(playerId, x, y);
    if (!zone) return { valid: false, reason: 'out_of_bounds' };

    const snapped = zone.snapToCell(x, y);
    if (this.isCellOccupied(snapped.x, snapped.y, null, type)) {
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

  isCellOccupied(snappedX, snappedY, excludeId = null, incomingType = null) {
    // Use the actual radius of each piece (plus a 20% safety margin) to determine overlap
    const incomingSpecs = incomingType && PIECE_SPECS[incomingType];
    const incomingRadius = PIECE_DEFAULTS.baseRadius * (incomingSpecs?.radiusMultiplier || 1.0);

    for (const piece of this.board.getAllPieces()) {
      if (excludeId && piece.id === excludeId) continue;
      const dx = piece.x - snappedX;
      const dy = piece.y - snappedY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (piece.radius + incomingRadius) * 1.2; // 20% safety margin
      if (dist < minDist) return true;
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
