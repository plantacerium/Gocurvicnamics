import { Logger } from '../utils/Logger.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../core/Constants.js';

const log = Logger('ReplayEngine');

export class ReplayEngine {
  constructor(canvas, board) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.board = board;
    this.isPlaying = false;
    this.speed = 1.0;
    this.currentMoveIndex = 0;
    this.moves = [];
    this.onMoveChanged = null;
    this.onFinished = null;
    this._animFrameId = null;
    this._progress = 0;
  }

  async loadMoves(gameId, db) {
    const moves = await db.getGameMoves(gameId);
    this.moves = moves.sort((a, b) => a.turnNumber - b.turnNumber);
    log.info(`Loaded ${this.moves.length} moves for replay`);
    return this.moves;
  }

  start() {
    if (this.moves.length === 0) return;
    this.isPlaying = true;
    this.currentMoveIndex = 0;
    this._progress = 0;
    eventBus.emit(EVENTS.REPLAY_STARTED, { totalMoves: this.moves.length });
    this._tick();
  }

  pause() {
    this.isPlaying = false;
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
  }

  resume() {
    if (!this.isPlaying && this.moves.length > 0) {
      this.isPlaying = true;
      this._tick();
    }
  }

  stop() {
    this.pause();
    this.currentMoveIndex = 0;
    this._progress = 0;
  }

  _tick() {
    if (!this.isPlaying) return;
    const move = this.moves[this.currentMoveIndex];
    if (!move) {
      this.isPlaying = false;
      eventBus.emit(EVENTS.REPLAY_ENDED, { reason: 'no_moves' });
      if (this.onFinished) this.onFinished();
      return;
    }

    this._progress += 0.02 * this.speed;
    if (this._progress >= 1) {
      this._progress = 0;
      this.currentMoveIndex++;
      if (this.currentMoveIndex >= this.moves.length) {
        this.isPlaying = false;
        eventBus.emit(EVENTS.REPLAY_ENDED, { reason: 'completed' });
        if (this.onFinished) this.onFinished();
        return;
      }
    }

    if (this.onMoveChanged) {
      this.onMoveChanged(move, this._progress);
    }

    this._animFrameId = requestAnimationFrame(() => this._tick());
  }

  destroy() {
    this.stop();
    this.moves = [];
  }
}
