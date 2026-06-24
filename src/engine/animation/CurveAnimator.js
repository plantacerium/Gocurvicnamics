export class CurveAnimator {
  static getEndVector(curve, t1 = 0.95, t2 = 1.0) {
    const pt1 = curve.get(t1);
    const pt2 = curve.get(t2);
    return { dx: pt2.x - pt1.x, dy: pt2.y - pt1.y };
  }

  static getTotalLength(curves) {
    return curves.reduce((acc, c) => acc + c.length(), 0);
  }

  static computeLengthMultiplier(totalLength, divisor = 200.0, maxMult = 5.0) {
    return Math.min(totalLength / divisor, maxMult);
  }
}
