import { distance } from '../../utils/MathUtils.js';
import { eventBus } from '../../core/EventBus.js';
import { EVENTS } from '../../core/Constants.js';

export class ShockwaveGenerator {
  constructor() {
    this.activeShockwaves = [];
  }

  emit(x, y, radius, force) {
    eventBus.emit(EVENTS.SHOCKWAVE, { x, y, radius, force });
    this.activeShockwaves.push({
      x, y, radius, force,
      currentRadius: 0,
      maxRadius: radius,
      life: 1.0,
      decay: 0.05,
    });
  }

  update(board) {
    for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
      const sw = this.activeShockwaves[i];
      sw.currentRadius += sw.radius * 0.03;
      sw.life -= sw.decay;

      for (const piece of board.getAllPieces()) {
        const dist = distance(sw.x, sw.y, piece.x, piece.y);
        if (dist <= sw.currentRadius && dist > 0) {
          const push = sw.force / dist;
          piece.vx += (piece.x - sw.x) / dist * push * 0.01;
          piece.vy += (piece.y - sw.y) / dist * push * 0.01;
        }
      }

      if (sw.life <= 0 || sw.currentRadius >= sw.maxRadius) {
        this.activeShockwaves.splice(i, 1);
      }
    }
  }

  getActive() {
    return this.activeShockwaves;
  }

  clear() {
    this.activeShockwaves = [];
  }
}
