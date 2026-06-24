export class TraceSegment {
  constructor(startPt, cp1, cp2, endPt) {
    this.startPt = { ...startPt };
    this.cp1 = { ...cp1 };
    this.cp2 = { ...cp2 };
    this.endPt = { ...endPt };
    this._length = null;
  }

  toBezierPoints() {
    return [
      this.startPt.x, this.startPt.y,
      this.cp1.x, this.cp1.y,
      this.cp2.x, this.cp2.y,
      this.endPt.x, this.endPt.y,
    ];
  }

  toJSON() {
    return { startPt: this.startPt, cp1: this.cp1, cp2: this.cp2, endPt: this.endPt };
  }

  static fromJSON(json) {
    return new TraceSegment(json.startPt, json.cp1, json.cp2, json.endPt);
  }
}
