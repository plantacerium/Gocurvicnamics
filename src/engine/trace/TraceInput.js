import { Bezier } from 'bezier-js';
import { TRACE_STATES } from '../../core/Constants.js';
import { TraceController } from './TraceController.js';
import { TraceValidator } from './TraceValidator.js';
import { getCanvasCoords } from '../../utils/DOMUtils.js';

class PointerTrace {
  constructor(pointerId, piece) {
    this.pointerId = pointerId;
    this.pieceId = piece.id;
    this.state = TRACE_STATES.PLACING_CP1;
    this.startPt = { x: piece.x, y: piece.y };
    this.cp1 = null;
    this.cp2 = null;
    this.endPt = null;
    this.controller = new TraceController();
    this.controller.start(piece.id, piece.x, piece.y);
    this.activeCurve = null;
    this.completedCurves = [];
    this.mousePos = { x: piece.x, y: piece.y };
  }

  addPoint(pos) {
    switch (this.state) {
      case TRACE_STATES.PLACING_CP1:
        this.cp1 = { ...pos };
        this.state = TRACE_STATES.PLACING_CP2;
        break;
      case TRACE_STATES.PLACING_CP2:
        this.cp2 = { ...pos };
        this.state = TRACE_STATES.PLACING_END;
        break;
      case TRACE_STATES.PLACING_END:
        this.endPt = { ...pos };
        const seg = this.controller.addSegment(this.startPt, this.cp1, this.cp2, this.endPt);
        try {
          const bez = new Bezier(...seg.toBezierPoints());
          seg._length = bez.length();
          this.completedCurves.push(bez);
        } catch { seg._length = 0; }

        this.startPt = { ...this.endPt };
        this.cp1 = null;
        this.cp2 = null;
        this.endPt = null;
        
        if (TraceValidator.canAddMoreSegments(this.controller.segments.length)) {
          this.state = TRACE_STATES.PLACING_CP1;
        } else {
          this.state = TRACE_STATES.CONFIRM;
        }
        break;
    }
  }

  updateMouse(pos) {
    this.mousePos = { ...pos };
    if (this.state === TRACE_STATES.PLACING_CP1) {
      this.activeCurve = null;
    } else if (this.state === TRACE_STATES.PLACING_CP2 && this.cp1) {
      try {
        this.activeCurve = new Bezier(
          this.startPt.x, this.startPt.y,
          this.cp1.x, this.cp1.y,
          this.mousePos.x, this.mousePos.y
        );
      } catch { this.activeCurve = null; }
    } else if (this.state === TRACE_STATES.PLACING_END && this.cp1 && this.cp2) {
      try {
        this.activeCurve = new Bezier(
          this.startPt.x, this.startPt.y,
          this.cp1.x, this.cp1.y,
          this.cp2.x, this.cp2.y,
          this.mousePos.x, this.mousePos.y
        );
      } catch { this.activeCurve = null; }
    }
  }
}

export class TraceInput {
  constructor(canvas) {
    this.canvas = canvas;
    this.traces = new Map(); // pointerId -> PointerTrace
    this.pieceTraceMap = new Map(); // pieceId -> pointerId (to prevent multiple pointers tracing same piece)
    this.onTraceComplete = null;
    this.onTraceStart = null; // Called when a piece starts being traced (useful for Bullet Time)
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
      trace.addPoint(pos);
      // Auto-commit if it reached CONFIRM state after adding point
      if (trace.state === TRACE_STATES.CONFIRM) {
        this.commitTrace(e.pointerId);
      }
    }
  }

  _onKeyDown(e) {
    // If Enter/Space is pressed, commit the first active trace
    if (e.key === 'Enter' || e.key === ' ') {
      if (this.traces.size > 0) {
        const firstPointer = this.traces.keys().next().value;
        const trace = this.traces.get(firstPointer);
        // Add final segment to cursor pos if mid-trace
        if (trace.activeCurve) {
          let end = trace.mousePos;
          let c1 = trace.cp1 || end;
          let c2 = trace.cp2 || c1;
          trace.controller.addSegment(trace.startPt, c1, c2, end);
        }
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
    if (this.pieceTraceMap.has(piece.id)) return; // Already being traced

    const trace = new PointerTrace(pointerId, piece);
    this.traces.set(pointerId, trace);
    this.pieceTraceMap.set(piece.id, pointerId);
    
    if (this.onTraceStart) this.onTraceStart(piece.id);
  }

  commitTrace(pointerId) {
    const trace = this.traces.get(pointerId);
    if (!trace) return;

    if (this.onTraceComplete && trace.controller.segments.length > 0) {
      const curves = trace.controller.segments.map(s => {
        try { return new Bezier(...s.toBezierPoints()); } catch { return null; }
      }).filter(Boolean);
      
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

  // To maintain compatibility with Renderer which reads properties directly
  // It should now read active traces from getActiveTraces()
  getActiveTraces() {
    return Array.from(this.traces.values());
  }

  destroy() {
    this._detachEvents();
    this.traces.clear();
    this.pieceTraceMap.clear();
  }
}
