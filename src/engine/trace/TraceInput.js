import { Bezier } from 'bezier-js';
import { TRACE_STATES } from '../../core/Constants.js';
import { TraceController } from './TraceController.js';
import { TraceValidator } from './TraceValidator.js';
import { TraceSegment } from './TraceSegment.js';
import { getCanvasCoords } from '../../utils/DOMUtils.js';

export class TraceInput {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = TRACE_STATES.IDLE;

    this.startPt = null;
    this.cp1 = null;
    this.cp2 = null;
    this.endPt = null;
    this.selectedPieceId = null;

    this.controller = new TraceController();
    this.activeCurve = null;
    this.completedCurves = [];
    this.mousePos = { x: 0, y: 0 };

    this.onTraceComplete = null;

    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundMouseDown = this._onMouseDown.bind(this);
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundContextMenu = (e) => e.preventDefault();

    this._attachEvents();
  }

  _attachEvents() {
    this.canvas.addEventListener('mousemove', this._boundMouseMove);
    this.canvas.addEventListener('mousedown', this._boundMouseDown);
    window.addEventListener('keydown', this._boundKeyDown);
    this.canvas.addEventListener('contextmenu', this._boundContextMenu);
  }

  _detachEvents() {
    this.canvas.removeEventListener('mousemove', this._boundMouseMove);
    this.canvas.removeEventListener('mousedown', this._boundMouseDown);
    window.removeEventListener('keydown', this._boundKeyDown);
    this.canvas.removeEventListener('contextmenu', this._boundContextMenu);
  }

  _getMouse(e) {
    return getCanvasCoords(this.canvas, e.clientX, e.clientY);
  }

  _onMouseMove(e) {
    this.mousePos = this._getMouse(e);
    this._updateActiveCurve();
  }

  _onMouseDown(e) {
    if (e.button === 2) { this.reset(); return; }
    if (this.state === TRACE_STATES.IDLE) return;

    const pos = this._getMouse(e);

    switch (this.state) {
      case TRACE_STATES.PLACING_CP1:
        this.cp1 = { ...pos };
        this.state = TRACE_STATES.PLACING_CP2;
        break;
      case TRACE_STATES.PLACING_CP2:
        this.cp2 = { ...pos };
        this.state = TRACE_STATES.PLACING_END;
        break;
      case TRACE_STATES.PLACING_END: {
        this.endPt = { ...pos };
        const seg = this.controller.addSegment(this.startPt, this.cp1, this.cp2, this.endPt);
        this._computeLength(seg);
        try {
          this.completedCurves.push(new Bezier(...seg.toBezierPoints()));
        } catch { /* skip invalid curve */ }
        this.startPt = { ...this.endPt };
        this.cp1 = null;
        this.cp2 = null;
        this.endPt = null;
        this.state = TraceValidator.canAddMoreSegments(this.controller.segments.length)
          ? TRACE_STATES.PLACING_CP1
          : TRACE_STATES.CONFIRM;
        break;
      }
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Escape') this.reset();
    if (e.key === 'Enter') {
      if (this.activeCurve) {
        let end = this.mousePos;
        let c1 = this.cp1 || end;
        let c2 = this.cp2 || c1;
        this.controller.addSegment(this.startPt, c1, c2, end);
        this.commit();
      } else if (this.controller.segments.length > 0 || this.state === TRACE_STATES.CONFIRM) {
        this.commit();
      }
    }
  }

  _computeLength(segment) {
    try {
      const bez = new Bezier(...segment.toBezierPoints());
      segment._length = bez.length();
    } catch {
      segment._length = 0;
    }
  }

  _updateActiveCurve() {
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

  startTrace(piece) {
    this.selectedPieceId = piece.id;
    this.startPt = { x: piece.x, y: piece.y };
    this.state = TRACE_STATES.PLACING_CP1;
    this.controller.start(piece.id, piece.x, piece.y);
    this.cp1 = null;
    this.cp2 = null;
    this.endPt = null;
    this.activeCurve = null;
  }

  commit() {
    if (this.onTraceComplete && this.controller.segments.length > 0) {
      const curves = this.controller.segments.map(s => {
        try { return new Bezier(...s.toBezierPoints()); } catch { return null; }
      }).filter(Boolean);
      const totalLength = this.controller.getTotalLength();
      this.onTraceComplete({
        pieceId: this.selectedPieceId,
        curves,
        segments: this.controller.segments,
        length: totalLength,
      });
    }
    this.reset();
  }

  reset() {
    this.state = TRACE_STATES.IDLE;
    this.startPt = null;
    this.cp1 = null;
    this.cp2 = null;
    this.endPt = null;
    this.selectedPieceId = null;
    this.activeCurve = null;
    this.completedCurves = [];
    this.controller.reset();
  }

  destroy() {
    this._detachEvents();
    this.reset();
  }
}
