import { Bezier } from 'bezier-js';

export const TRACE_STATES = {
  IDLE: 'IDLE',
  PLACING_CP1: 'PLACING_CP1',
  PLACING_CP2: 'PLACING_CP2',
  PLACING_END: 'PLACING_END',
  CONFIRM: 'CONFIRM'
};

export class TraceInput {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = TRACE_STATES.IDLE;
    
    this.startPt = null; // Also the selected piece position
    this.cp1 = null;
    this.cp2 = null;
    this.endPt = null;
    this.selectedPieceId = null;
    
    this.completedCurves = [];
    this.activeCurve = null;
    this.mousePos = { x: 0, y: 0 };
    
    this.onTraceComplete = null; // Callback for TurnManager
    
    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      // Calculate scaling since CSS might scale the canvas
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      
      this.mousePos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
      this.updateActiveCurve();
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        // Right click cancels
        this.reset();
        return;
      }
      
      if (this.state === TRACE_STATES.IDLE) {
        // Handled by TurnManager
      } else if (this.state === TRACE_STATES.PLACING_CP1) {
        this.cp1 = { ...this.mousePos };
        this.state = TRACE_STATES.PLACING_CP2;
      } else if (this.state === TRACE_STATES.PLACING_CP2) {
        this.cp2 = { ...this.mousePos };
        this.state = TRACE_STATES.PLACING_END;
      } else if (this.state === TRACE_STATES.PLACING_END) {
        this.endPt = { ...this.mousePos };
        this.updateActiveCurve();
        // Chain the curve
        this.completedCurves.push(this.activeCurve);
        this.startPt = { ...this.endPt };
        this.cp1 = null;
        this.cp2 = null;
        this.endPt = null;
        this.activeCurve = null;
        this.state = TRACE_STATES.PLACING_CP1;
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.reset();
      }
      if (e.key === 'Enter') {
        if (this.completedCurves.length > 0) {
          this.commit();
        } else if (this.state === TRACE_STATES.CONFIRM) {
          this.commit();
        }
      }
    });
    
    // Prevent context menu
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  startTrace(piece) {
    this.selectedPieceId = piece.id;
    this.startPt = { x: piece.x, y: piece.y };
    this.state = TRACE_STATES.PLACING_CP1;
    this.completedCurves = [];
    this.activeCurve = null;
  }

  updateActiveCurve() {
    if (this.state === TRACE_STATES.PLACING_CP1) {
      // Just a line to mouse
    } else if (this.state === TRACE_STATES.PLACING_CP2) {
      // Quadratic Bezier approx
      this.activeCurve = new Bezier(
        this.startPt.x, this.startPt.y,
        this.cp1.x, this.cp1.y,
        this.mousePos.x, this.mousePos.y
      );
    } else if (this.state === TRACE_STATES.PLACING_END) {
      this.activeCurve = new Bezier(
        this.startPt.x, this.startPt.y,
        this.cp1.x, this.cp1.y,
        this.cp2.x, this.cp2.y,
        this.mousePos.x, this.mousePos.y
      );
    }
  }

  commit() {
    if (this.onTraceComplete && this.completedCurves.length > 0) {
      const totalLength = this.completedCurves.reduce((sum, c) => sum + c.length(), 0);
      this.onTraceComplete({
        pieceId: this.selectedPieceId,
        curves: this.completedCurves,
        length: totalLength
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
    this.completedCurves = [];
    this.activeCurve = null;
  }
}
