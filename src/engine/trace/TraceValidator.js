import { distance } from '../../utils/MathUtils.js';

export class TraceValidator {
  static MIN_SEGMENT_LENGTH = 20;
  static MAX_SEGMENTS = 10;

  static validateSegment(startPt, endPt) {
    const len = distance(startPt.x, startPt.y, endPt.x, endPt.y);
    if (len < TraceValidator.MIN_SEGMENT_LENGTH) {
      return { valid: false, reason: 'segment_too_short', length: len };
    }
    return { valid: true, length: len };
  }

  static canAddMoreSegments(currentCount) {
    return currentCount < TraceValidator.MAX_SEGMENTS;
  }

  static isCompleteTrace(segments) {
    return segments.length > 0;
  }
}
