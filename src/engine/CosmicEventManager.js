import { eventBus } from '../core/EventBus.js';
import { GAMEPLAY_DEFAULTS } from '../config/GameplayConfig.js';
import { Logger } from '../utils/Logger.js';

const log = Logger('CosmicEventManager');

export class CosmicEventManager {
  constructor(board, physics) {
    this.board = board;
    this.physics = physics;
    this.events = [];
    this.enabled = GAMEPLAY_DEFAULTS.cosmicEventsEnabled !== false;
    
    this._timeSinceLastEvent = 0;
    this._nextEventTime = 15000 + Math.random() * 15000; // 15s to 30s
  }

  update(dt) {
    if (!this.enabled || !this.physics) return;

    // Update existing events (apply forces)
    for (let i = this.events.length - 1; i >= 0; i--) {
      const ev = this.events[i];
      ev.life -= dt;
      if (ev.life <= 0) {
        this.events.splice(i, 1);
        continue;
      }

      // Apply forces to all launched pieces
      for (const piece of this.board.getAllPieces()) {
        if (!piece.launched) continue;
        
        const dx = ev.x - piece.x;
        const dy = ev.y - piece.y;
        const distSq = dx * dx + dy * dy;
        
        // Only affect pieces within a certain range
        if (distSq > ev.radius * ev.radius) continue;
        
        const dist = Math.sqrt(distSq);
        if (dist < 10) continue; // Avoid singularity
        
        // Force magnitude decreases with distance square, capped at maxForce
        let force = (ev.strength * 1000) / distSq;
        if (force > ev.maxForce) force = ev.maxForce;
        
        // Normalize direction and apply
        const dirX = dx / dist;
        const dirY = dy / dist;
        
        // Apply impulse (small amount per tick since it's continuous)
        // Cosmic events don't depend on piece speed, it's a raw impulse
        this.physics.applyImpulse(piece.id, dirX, dirY, force * (dt / 16));
      }
    }

    // Spawn new events
    this._timeSinceLastEvent += dt;
    if (this._timeSinceLastEvent >= this._nextEventTime) {
      this._timeSinceLastEvent = 0;
      this._nextEventTime = 20000 + Math.random() * 20000;
      this._spawnEvent();
    }
  }

  _spawnEvent() {
    const isGravity = Math.random() > 0.5;
    
    // Pick a random spot not too close to the edges
    const margin = 200;
    const x = margin + Math.random() * (this.board.width - margin * 2);
    const y = margin + Math.random() * (this.board.height - margin * 2);
    
    const lifeTime = 10000 + Math.random() * 10000; // Lasts 10s to 20s
    
    const ev = {
      type: isGravity ? 'BLACK_HOLE' : 'WHITE_HOLE',
      x, y,
      radius: 400 + Math.random() * 200,
      strength: isGravity ? 5.0 : -5.0, // positive attracts, negative repels
      maxForce: 0.15,
      life: lifeTime,
      maxLife: lifeTime
    };
    
    this.events.push(ev);
    log.info(`Cosmic Event Spawns: ${ev.type} at (${Math.round(x)}, ${Math.round(y)})`);
    
    // We can use eventBus to notify renderer if we want to draw them
    eventBus.emit('COSMIC_EVENT_SPAWNED', ev);
  }

  getActiveEvents() {
    return this.events;
  }

  clear() {
    this.events = [];
  }
}
