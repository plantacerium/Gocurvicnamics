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

      // Process Tauri physical updates
      for (const update of updates) {
        const piece = this.board.getPiece(update.id);
        if (!piece || piece.destroyed) continue;

        const dx = Math.abs(piece.x - update.x);
        const dy = Math.abs(piece.y - update.y);
        if (dx > this._momentumThreshold || dy > this._momentumThreshold) {
          movement = true;
        }

        // If piece was on a path but its physics deviated drastically (collision), derail it
        const pd = this._activePaths.get(piece.id);
        if (pd && (dx > 20 || dy > 20)) {
           this._activePaths.delete(piece.id);
        }

        // Only apply Tauri update if not strictly path following
        if (!this._activePaths.has(piece.id)) {
           piece.x = update.x;
           piece.y = update.y;
        }

        if (update.hp !== undefined && update.hp < piece.hp) {
          piece.takeDamage(piece.hp - update.hp);
        }
      }

      // Process JS-side Path Following overrides
      for (const [pieceId, pathData] of this._activePaths.entries()) {
        const piece = this.board.getPiece(pieceId);
        if (!piece || piece.destroyed) {
          this._activePaths.delete(pieceId);
          continue;
        }

        pathData.currentDist += pathData.speed;
        if (pathData.currentDist >= pathData.totalLen) {
           this._activePaths.delete(pieceId);
           
           // Inyectar spin (angularVelocity) basado en la curvatura de la trayectoria dibujada
           let injectedSpin = 0;
           if (pathData.curves && pathData.curves.length > 0) {
              const firstCurve = pathData.curves[0];
              const lastCurve = pathData.curves[pathData.curves.length - 1];
              const startDeriv = firstCurve.derivative(0);
              const endDeriv = lastCurve.derivative(1);
              const startAngle = Math.atan2(startDeriv.y, startDeriv.x);
              let endAngle = Math.atan2(endDeriv.y, endDeriv.x);
              
              let diff = endAngle - startAngle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              
              injectedSpin = diff * 0.15;
           }
           
           const sp = pieceSpecs(piece);
           if (Math.abs(injectedSpin) < 0.05 && sp && sp.curvature > 0) {
               let dir = sp.curveDir;
               if (dir === 0) dir = 1; // Default to clockwise if chaotic
               injectedSpin = dir * 0.2;
           }
           
           if (injectedSpin !== 0) {
               this.setSpin(pieceId, injectedSpin);
           }
        } else {
           let distAccum = 0;
           let targetPos = null;
           for (const curve of pathData.curves) {
             const clen = curve.length();
             if (pathData.currentDist <= distAccum + clen) {
               const localT = (pathData.currentDist - distAccum) / clen;
               targetPos = curve.get(localT);
               break;
             }
             distAccum += clen;
           }
           
           if (targetPos) {
              piece.x = targetPos.x;
              piece.y = targetPos.y;
              movement = true;
              // Override backend position so it doesn't fight us
              await this.teleportPiece(pieceId, targetPos.x, targetPos.y);
           }
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

  constructor(board) {
    super(board);
    this._activePaths = new Map();
  }

  async followPath(pieceId, curves, multiplier) {
    if (!curves || curves.length === 0) return;
    
    let totalLen = 0;
    for (const c of curves) totalLen += c.length();
    
    const piece = this.board.getPiece(pieceId);
    const speed = PHYSICS_DEFAULTS.impulseBaseMagnitude * multiplier * (piece?.hp ? 1.0 : 1.0) * 8.0; // aprox

    this._activePaths.set(pieceId, {
      curves,
      currentDist: 0,
      totalLen,
      speed
    });
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

  async setSpin(pieceId, spin) {
    if (!this._ready) return;
    try {
      await invoke('set_spin', { pieceId, spin });
    } catch (e) {
      log.warn('set_spin failed:', e);
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

  async addPiece(piece) {
    if (!this._ready) return;
    try {
      await invoke('add_piece', { 
        piece: {
          id: piece.id,
          playerId: piece.playerId,
          type: piece.type,
          x: piece.x,
          y: piece.y,
          radius: piece.radius,
          hp: piece.hp,
        }
      });
    } catch (e) {
      log.warn('add_piece failed:', e);
    }
  }

  async pinPiece(pieceId) {
    if (!this._ready) return;
    try {
      await invoke('pin_piece', { pieceId });
    } catch (e) {
      log.warn('pin_piece failed:', e);
    }
  }

  async unpinPiece(pieceId) {
    if (!this._ready) return;
    try {
      await invoke('unpin_piece', { pieceId });
    } catch (e) {
      log.warn('unpin_piece failed:', e);
    }
  }

  setCollisionResolver(resolver, shockwaveGen) {
    // No-op: collision handled in Rust backend with velocity threshold
    // TODO(F4.3): shockwave metadata not yet returned from Rust collision events;
    // AmplifierPiece shockwave only works in Matter.js path currently.
  }
}
