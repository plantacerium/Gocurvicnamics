import { TRACE_STATES } from '../../core/Constants.js';
import { UI_DEFAULTS } from '../../config/UIConfig.js';

export class TraceRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(traceInput) {
    const traces = traceInput.getActiveTraces();
    for (const trace of traces) {
      if (trace.state === TRACE_STATES.IDLE) continue;
      this._renderControlLines(trace);
      this._renderCompletedCurves(trace);
      this._renderActiveCurve(trace);
    }
  }

  _renderControlLines(trace) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (trace.cp1) {
      ctx.beginPath();
      ctx.moveTo(trace.startPt.x, trace.startPt.y);
      ctx.lineTo(trace.cp1.x, trace.cp1.y);
      ctx.stroke();
      this._drawNode(trace.cp1, UI_DEFAULTS.controlPointColor);
    }
    if (trace.cp2) {
      ctx.beginPath();
      ctx.moveTo(trace.cp1.x, trace.cp1.y);
      ctx.lineTo(trace.cp2.x, trace.cp2.y);
      ctx.stroke();
      this._drawNode(trace.cp2, UI_DEFAULTS.controlPointColor);

      if (trace.endPt) {
        ctx.beginPath();
        ctx.moveTo(trace.cp2.x, trace.cp2.y);
        ctx.lineTo(trace.endPt.x, trace.endPt.y);
        ctx.stroke();
        this._drawNode(trace.endPt, UI_DEFAULTS.endPointColor);
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  _renderCompletedCurves(trace) {
    const ctx = this.ctx;
    if (!trace.completedCurves?.length) return;

    ctx.save();
    ctx.beginPath();
    for (const curve of trace.completedCurves) {
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

  _renderActiveCurve(trace) {
    const ctx = this.ctx;
    ctx.save();
    if (trace.activeCurve) {
      const lut = trace.activeCurve.getLUT(50);
      ctx.beginPath();
      ctx.moveTo(lut[0].x, lut[0].y);
      for (let i = 1; i < lut.length; i++) {
        ctx.lineTo(lut[i].x, lut[i].y);
      }
      ctx.strokeStyle = UI_DEFAULTS.traceColor;
      ctx.lineWidth = UI_DEFAULTS.traceLineWidth;
      ctx.stroke();
    } else if (trace.state === TRACE_STATES.PLACING_CP1) {
      ctx.beginPath();
      ctx.moveTo(trace.startPt.x, trace.startPt.y);
      ctx.lineTo(trace.mousePos.x, trace.mousePos.y);
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
