export class CollisionDetector {
  static areAdversaries(pieceA, pieceB) {
    return pieceA.playerId !== pieceB.playerId &&
           pieceA.playerId !== 0 && pieceB.playerId !== 0;
  }

  static areAllies(pieceA, pieceB) {
    return pieceA.playerId === pieceB.playerId && pieceA.playerId !== 0;
  }

  static relativeVelocity(vx1, vy1, vx2, vy2) {
    const dx = vx1 - vx2;
    const dy = vy1 - vy2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static isSignificantImpact(relVel, threshold = 5) {
    return relVel > threshold;
  }

  static circlesOverlap(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < r1 + r2;
  }
}
