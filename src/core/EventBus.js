export class EventBus {
  constructor() {
    this._listeners = new Map();
    this._onceListeners = new Map();
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  once(event, callback) {
    if (!this._onceListeners.has(event)) {
      this._onceListeners.set(event, new Set());
    }
    this._onceListeners.get(event).add(callback);
    return () => this._onceListeners.get(event)?.delete(callback);
  }

  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
    this._onceListeners.get(event)?.delete(callback);
  }

  emit(event, payload) {
    this._listeners.get(event)?.forEach(cb => {
      try { cb(payload); } catch (e) { console.error(`[EventBus:${event}]`, e); }
    });
    this._onceListeners.get(event)?.forEach(cb => {
      try { cb(payload); } catch (e) { console.error(`[EventBus:${event}]`, e); }
    });
    this._onceListeners.delete(event);
  }

  clear() {
    this._listeners.clear();
    this._onceListeners.clear();
  }

  listenerCount(event) {
    return (this._listeners.get(event)?.size || 0) + (this._onceListeners.get(event)?.size || 0);
  }
}

export const eventBus = new EventBus();
