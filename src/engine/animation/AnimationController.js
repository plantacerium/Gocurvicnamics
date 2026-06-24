import { PHYSICS_DEFAULTS } from '../../config/PhysicsConfig.js';

export class AnimationController {
  constructor() {
    this.speed = PHYSICS_DEFAULTS.animationSpeed;
    this.isActive = false;
    this.pieceId = null;
    this.curves = [];
    this.currentCurveIndex = 0;
    this.progress = 0;
    this.onFinished = null;
    this.onPiecePosition = null;
  }

  startAnimation(pieceId, curves) {
    this.isActive = true;
    this.pieceId = pieceId;
    this.curves = curves;
    this.currentCurveIndex = 0;
    this.progress = 0;
  }

  update(deltaMs) {
    if (!this.isActive) return null;

    const currentCurve = this.curves[this.currentCurveIndex];
    if (!currentCurve) {
      this.finish();
      return null;
    }

    const curveLength = currentCurve.length();
    const durationMs = curveLength > 0 ? (curveLength / this.speed) * 1000 : 100;
    this.progress += deltaMs / durationMs;

    if (this.progress >= 1) {
      this.currentCurveIndex++;
      this.progress = 0;
      if (this.currentCurveIndex >= this.curves.length) {
        this.finish();
        return { finished: true, lastCurve: currentCurve };
      }
    }

    const activeCurve = this.curves[this.currentCurveIndex];
    if (activeCurve && this.onPiecePosition) {
      const pt = activeCurve.get(Math.min(1, this.progress));
      this.onPiecePosition(this.pieceId, pt.x, pt.y);
    }
    return { finished: false, progress: this.progress };
  }

  finish() {
    this.isActive = false;
    if (this.onFinished) {
      const lastCurve = this.curves[this.curves.length - 1] || null;
      this.onFinished(this.pieceId, lastCurve);
    }
    this.curves = [];
    this.currentCurveIndex = 0;
    this.progress = 0;
  }

  getCurrentPoint() {
    const curve = this.curves[this.currentCurveIndex];
    if (!curve) return null;
    return curve.get(Math.min(1, this.progress));
  }

  cancel() {
    this.isActive = false;
    this.curves = [];
    this.currentCurveIndex = 0;
    this.progress = 0;
  }
}
