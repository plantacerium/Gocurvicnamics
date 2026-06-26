import { invoke } from '@tauri-apps/api/core';
import { PhysicsAdapter } from './PhysicsAdapter.js';
import { PHYSICS_DEFAULTS } from '../../config/PhysicsConfig.js';
import { Logger } from '../../utils/Logger.js';

const log = Logger('PhysicsTauri');

export class PhysicsTauri extends PhysicsAdapter {
  async initialize() {
    try {
      await invoke('ping');
      this._ready = true;
      log.info('Tauri backend reachable');
      return true;
    } catch (e) {
      log.warn('Tauri backend not available:', e);
      this._ready = false;
      return false;
    }
  }

  async syncFromBoard() {
    if (!this._ready) return;
    const pieces = Array.from(this.board.pieces.values()).map(p => ({
      id: p.id,
      playerId: p.playerId,
      type: p.type,
      x: p.x,
      y: p.y,
      radius: p.radius,
      hp: p.hp,
    }));
    try {
      await invoke('init_board', {
        width: this.board.width,
        height: this.board.height,
        pieces,
      });
      log.debug(`Synced ${pieces.length} pieces to Rust backend`);
    } catch (e) {
      log.warn('init_board failed:', e);
    }
  }

  async step() {
    if (!this._ready) return false;
    try {
      const updates = await invoke('physics_step');
      let movement = false;

      for (const update of updates) {
        const piece = this.board.getPiece(update.id);
        if (!piece || piece.destroyed) continue;

        const dx = Math.abs(piece.x - update.x);
        const dy = Math.abs(piece.y - update.y);
        if (dx > this._momentumThreshold || dy > this._momentumThreshold) {
          movement = true;
        }

        piece.x = update.x;
        piece.y = update.y;

        if (update.hp !== undefined && update.hp < piece.hp) {
          piece.takeDamage(piece.hp - update.hp);
        }
      }

      this._movementDetected = movement;
      return movement;
    } catch (e) {
      log.warn('physics_step failed:', e);
      return false;
    }
  }

  async applyImpulse(pieceId, dx, dy, magnitude) {
    if (!this._ready) return;
    const fx = dx * magnitude * PHYSICS_DEFAULTS.impulseScale;
    const fy = dy * magnitude * PHYSICS_DEFAULTS.impulseScale;
    try {
      await invoke('apply_impulse', { pieceId, fx, fy });
      this._movementDetected = true;
    } catch (e) {
      log.warn('apply_impulse failed:', e);
    }
  }

  async flushStep() {
    if (!this._ready) return;
    try {
      const updates = await invoke('physics_step');
      for (const update of updates) {
        const piece = this.board.getPiece(update.id);
        if (!piece || piece.destroyed) continue;
        piece.x = update.x;
        piece.y = update.y;
        if (update.hp !== undefined && update.hp < piece.hp) {
          piece.takeDamage(piece.hp - update.hp);
        }
      }
    } catch (e) {
      log.warn('flush_step failed:', e);
    }
  }

  async teleportPiece(pieceId, x, y) {
    if (!this._ready) return;
    try {
      await invoke('teleport_piece', { pieceId, x, y });
    } catch (e) {
      log.warn('teleport_piece failed:', e);
    }
  }

  async removePiece(pieceId) {
    if (!this._ready) return;
    try {
      await invoke('remove_piece', { pieceId });
    } catch (e) {
      log.warn('remove_piece failed:', e);
    }
  }

  setCollisionResolver(resolver, shockwaveGen) {
    // No-op: collision handled in Rust backend with velocity threshold
    // TODO(F4.3): shockwave metadata not yet returned from Rust collision events;
    // AmplifierPiece shockwave only works in Matter.js path currently.
  }
}
