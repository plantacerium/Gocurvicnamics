import { TRACE_STATES } from '../../core/Constants.js';
import { UI_DEFAULTS } from '../../config/UIConfig.js';

export class TraceRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(traceInput) {
    if (traceInput.state === TRACE_STATES.IDLE) return;

    this._renderControlLines(traceInput);
    this._renderCompletedCurves(traceInput);
    this._renderActiveCurve(traceInput);
  }

  _renderControlLines(traceInput) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (traceInput.cp1) {
      ctx.beginPath();
      ctx.moveTo(traceInput.startPt.x, traceInput.startPt.y);
      ctx.lineTo(traceInput.cp1.x, traceInput.cp1.y);
      ctx.stroke();
      this._drawNode(traceInput.cp1, UI_DEFAULTS.controlPointColor);
    }
    if (traceInput.cp2) {
      ctx.beginPath();
      ctx.moveTo(traceInput.cp1.x, traceInput.cp1.y);
      ctx.lineTo(traceInput.cp2.x, traceInput.cp2.y);
      ctx.stroke();
      this._drawNode(traceInput.cp2, UI_DEFAULTS.controlPointColor);

      if (traceInput.endPt) {
        ctx.beginPath();
        ctx.moveTo(traceInput.cp2.x, traceInput.cp2.y);
        ctx.lineTo(traceInput.endPt.x, traceInput.endPt.y);
        ctx.stroke();
        this._drawNode(traceInput.endPt, UI_DEFAULTS.endPointColor);
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  _renderCompletedCurves(traceInput) {
    const ctx = this.ctx;
    if (!traceInput.completedCurves?.length) return;

    ctx.save();
    ctx.beginPath();
    for (const curve of traceInput.completedCurves) {
      const lut = curve.getLUT(50);
      ctx.moveTo(lut[0].x, lut[0].y);
      for (let i = 1; i < lut.length; i++) {
        ctx.lineTo(lut[i].x, lut[i].y);
      }
    }
    ctx.strokeStyle = UI_DEFAULTS.traceColor;
    ctx.lineWidth = UI_DEFAULTS.traceLineWidth;
    ctx.stroke();
    ctx.restore();
  }

  _renderActiveCurve(traceInput) {
    const ctx = this.ctx;
    ctx.save();
    if (traceInput.activeCurve) {
      const lut = traceInput.activeCurve.getLUT(50);
      ctx.beginPath();
      ctx.moveTo(lut[0].x, lut[0].y);
      for (let i = 1; i < lut.length; i++) {
        ctx.lineTo(lut[i].x, lut[i].y);
      }
      ctx.strokeStyle = UI_DEFAULTS.traceColor;
      ctx.lineWidth = UI_DEFAULTS.traceLineWidth;
      ctx.stroke();
    } else if (traceInput.state === TRACE_STATES.PLACING_CP1) {
      ctx.beginPath();
      ctx.moveTo(traceInput.startPt.x, traceInput.startPt.y);
      ctx.lineTo(traceInput.mousePos.x, traceInput.mousePos.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawNode(pt, color) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, UI_DEFAULTS.controlPointSize, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}
