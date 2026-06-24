export class GameLoop {
  constructor(onTick) {
    this._onTick = onTick;
    this._running = false;
    this._lastTime = 0;
    this._frameId = null;
    this._boundTick = this._tick.bind(this);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._frameId = requestAnimationFrame(this._boundTick);
  }

  stop() {
    this._running = false;
    if (this._frameId) {
      cancelAnimationFrame(this._frameId);
      this._frameId = null;
    }
  }

  _tick(time) {
    if (!this._running) return;
    const rawDelta = time - this._lastTime;
    const deltaMs = Math.min(rawDelta, 100);
    this._lastTime = time;
    try {
      Promise.resolve(this._onTick(deltaMs, time)).catch(e => {
        console.error('[GameLoop] tick error:', e);
      });
    } catch (e) {
      console.error('[GameLoop] error:', e);
    }
    this._frameId = requestAnimationFrame(this._boundTick);
  }

  isRunning() { return this._running; }
}
