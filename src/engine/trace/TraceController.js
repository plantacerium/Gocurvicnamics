import { TraceSegment } from './TraceSegment.js';

export class TraceController {
  constructor() {
    this.segments = [];
    this.pieceId = null;
    this.activeSegment = null;
  }

  start(pieceId, startX, startY) {
    this.pieceId = pieceId;
    this.segments = [];
    this.activeSegment = null;
    return { x: startX, y: startY };
  }

  addSegment(startPt, cp1, cp2, endPt) {
    const seg = new TraceSegment(startPt, cp1, cp2, endPt);
    this.segments.push(seg);
    return seg;
  }

  getTotalLength() {
    return this.segments.reduce((sum, seg) => sum + (seg._length || 0), 0);
  }

  getLastEndpoint() {
    if (this.segments.length === 0) return null;
    return this.segments[this.segments.length - 1].endPt;
  }

  toJSON() {
    return {
      pieceId: this.pieceId,
      segments: this.segments.map(s => s.toJSON()),
    };
  }

  reset() {
    this.segments = [];
    this.pieceId = null;
    this.activeSegment = null;
  }
}
