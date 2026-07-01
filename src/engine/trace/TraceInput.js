import { Bezier } from 'bezier-js';
import { TRACE_STATES } from '../../core/Constants.js';
import { TraceController } from './TraceController.js';
import { TraceValidator } from './TraceValidator.js';
import { getCanvasCoords } from '../../utils/DOMUtils.js';

class PointerTrace {
  constructor(pointerId, piece) {
    this.pointerId = pointerId;
    this.pieceId = piece.id;
    this.state = TRACE_STATES.PLACING_CP1; // kept for compatibility
    this.points = [{ x: piece.x, y: piece.y }];
    this.controller = new TraceController();
    this.controller.start(piece.id, piece.x, piece.y);
    this.activeCurve = null;
    this.completedCurves = [];
    this.mousePos = { x: piece.x, y: piece.y };
  }

  addPoint(pos) {
    // If click is very close to the last point, treat it as a COMMIT
    const lastPt = this.points[this.points.length - 1];
    const dist = Math.hypot(pos.x - lastPt.x, pos.y - lastPt.y);
    
    if (dist < 15 && this.points.length > 1) {
      this.commitCurrentSegments();
      return true; // Return true to indicate trace should commit
    }

    this.points.push({ ...pos });

    // If we have 4 points (Start, CP1, CP2, End), we complete a cubic segment
    if (this.points.length === 4) {
      this.commitCurrentSegments();
      // Start a new segment from the end point
      this.points = [{ ...pos }];
    }

    return false;
  }

  updateMouse(pos) {
    this.mousePos = { ...pos };
    const pts = [...this.points, this.mousePos];
    this.activeCurve = this._createCurveFromPoints(pts);
  }

  _createCurveFromPoints(pts) {
    try {
      if (pts.length === 2) {
        // Linear -> Cubic
        const p0 = pts[0], p3 = pts[1];
        const p1 = { x: p0.x + (p3.x - p0.x) / 3, y: p0.y + (p3.y - p0.y) / 3 };
        const p2 = { x: p0.x + 2 * (p3.x - p0.x) / 3, y: p0.y + 2 * (p3.y - p0.y) / 3 };
        return new Bezier(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      } else if (pts.length === 3) {
        // Quadratic -> Cubic
        const p0 = pts[0], p1 = pts[1], p2 = pts[2];
        const cp1 = { x: p0.x + 2/3 * (p1.x - p0.x), y: p0.y + 2/3 * (p1.y - p0.y) };
        const cp2 = { x: p2.x + 2/3 * (p1.x - p2.x), y: p2.y + 2/3 * (p1.y - p2.y) };
        return new Bezier(p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
      } else if (pts.length === 4) {
        // Cubic
        const [p0, p1, p2, p3] = pts;
        return new Bezier(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      }
    } catch {
      return null;
    }
    return null;
  }

  commitCurrentSegments() {
    // Force the current points to form a segment
    if (this.points.length < 2) return;
    
    // Add the current mouse position as the final point if we are committing early
    if (this.points.length < 4) {
       this.activeCurve = this._createCurveFromPoints(this.points);
    }
    
    if (this.activeCurve) {
       const pts = this.activeCurve.points;
       const seg = this.controller.addSegment(pts[0], pts[1], pts[2], pts[3]);
       seg._length = this.activeCurve.length();
       this.completedCurves.push(this.activeCurve);
    }
    this.activeCurve = null;
  }
}

export class TraceInput {
  constructor(canvas) {
    this.canvas = canvas;
    this.traces = new Map(); // pointerId -> PointerTrace
    this.pieceTraceMap = new Map(); // pieceId -> pointerId
    this.onTraceComplete = null;
    this.onTraceStart = null; 
    this.onTraceCancel = null;

    this._boundPointerMove = this._onPointerMove.bind(this);
    this._boundPointerDown = this._onPointerDown.bind(this);
    this._boundContextMenu = (e) => e.preventDefault();
    this._boundKeyDown = this._onKeyDown.bind(this);

    this._attachEvents();
  }

  _attachEvents() {
    this.canvas.addEventListener('pointermove', this._boundPointerMove);
    this.canvas.addEventListener('pointerdown', this._boundPointerDown);
    this.canvas.addEventListener('contextmenu', this._boundContextMenu);
    window.addEventListener('keydown', this._boundKeyDown);
  }

  _detachEvents() {
    this.canvas.removeEventListener('pointermove', this._boundPointerMove);
    this.canvas.removeEventListener('pointerdown', this._boundPointerDown);
    this.canvas.removeEventListener('contextmenu', this._boundContextMenu);
    window.removeEventListener('keydown', this._boundKeyDown);
  }

  _getMouse(e) {
    return getCanvasCoords(this.canvas, e.clientX, e.clientY);
  }

  _onPointerMove(e) {
    const trace = this.traces.get(e.pointerId);
    if (trace) {
      trace.updateMouse(this._getMouse(e));
    }
  }

  _onPointerDown(e) {
    if (e.button === 2) {
      if (this.traces.has(e.pointerId)) {
        this.cancelTrace(e.pointerId);
      }
      return;
    }

    const pos = this._getMouse(e);
    const trace = this.traces.get(e.pointerId);

    if (trace) {
      const shouldCommit = trace.addPoint(pos);
      if (shouldCommit) {
        this.commitTrace(e.pointerId);
      }
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      if (this.traces.size > 0) {
        const firstPointer = this.traces.keys().next().value;
        const trace = this.traces.get(firstPointer);
        // Force add the current mouse position as the final point
        trace.points.push(trace.mousePos);
        trace.commitCurrentSegments();
        this.commitTrace(firstPointer);
      }
    } else if (e.key === 'Escape') {
      if (this.traces.size > 0) {
        const firstPointer = this.traces.keys().next().value;
        this.cancelTrace(firstPointer);
      }
    }
  }

  startTraceForPiece(pointerId, piece) {
    if (this.pieceTraceMap.has(piece.id)) return;

    const trace = new PointerTrace(pointerId, piece);
    this.traces.set(pointerId, trace);
    this.pieceTraceMap.set(piece.id, pointerId);
    
    if (this.onTraceStart) this.onTraceStart(piece.id);
  }

  commitTrace(pointerId) {
    const trace = this.traces.get(pointerId);
    if (!trace) return;

    if (this.onTraceComplete && trace.controller.segments.length > 0) {
      const curves = trace.completedCurves;
      
      this.onTraceComplete({
        pieceId: trace.pieceId,
        curves,
        segments: trace.controller.segments,
        length: trace.controller.getTotalLength(),
      });
    } else if (this.onTraceCancel) {
      this.onTraceCancel(trace.pieceId);
    }
    
    this._cleanupTrace(pointerId, trace.pieceId);
  }

  cancelTrace(pointerId) {
    const trace = this.traces.get(pointerId);
    if (trace) {
      if (this.onTraceCancel) this.onTraceCancel(trace.pieceId);
      this._cleanupTrace(pointerId, trace.pieceId);
    }
  }

  _cleanupTrace(pointerId, pieceId) {
    this.traces.delete(pointerId);
    this.pieceTraceMap.delete(pieceId);
  }

  getActiveTraceCount() {
    return this.traces.size;
  }

  getActiveTraces() {
    return Array.from(this.traces.values());
  }

  destroy() {
    this._detachEvents();
    this.traces.clear();
    this.pieceTraceMap.clear();
  }
}
