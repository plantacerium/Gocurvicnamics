import { invoke } from '@tauri-apps/api/core';

export class PhysicsEngine {
  constructor(board) {
    this.board = board;
  }

  async syncFromBoard() {
    // Send all pieces to rust via 'init_board'
    const pieces = Array.from(this.board.pieces.values()).map(p => ({
      id: p.id,
      playerId: p.playerId,
      type: p.type,
      x: p.x,
      y: p.y,
      radius: p.radius,
      hp: p.hp
    }));
    try {
      await invoke('init_board', { 
        width: this.board.width,
        height: this.board.height,
        pieces 
      });
    } catch (e) {
      console.warn("[PhysicsEngine] Tauri backend unreachable.", e);
    }
  }

  async applyImpulse(pieceId, impulseVec, magnitude) {
    const fx = impulseVec.x * magnitude;
    const fy = impulseVec.y * magnitude;
    try {
      await invoke('apply_impulse', { pieceId, fx, fy });
    } catch (e) {
      console.warn("[PhysicsEngine] Tauri backend unreachable.", e);
    }
  }

  async teleportPiece(pieceId, x, y) {
    try {
      await invoke('teleport_piece', { pieceId, x, y });
    } catch (e) {
      console.warn("[PhysicsEngine] Tauri backend unreachable.", e);
    }
  }

  async step() {
    try {
      const updates = await invoke('physics_step');
      let movementDetected = false;
      
      for (const update of updates) {
        const piece = this.board.getPiece(update.id);
        if (piece) {
          const dx = Math.abs(piece.x - update.x);
          const dy = Math.abs(piece.y - update.y);
          if (dx > 0.05 || dy > 0.05) movementDetected = true;
          
          piece.x = update.x;
          piece.y = update.y;
          
          if (update.hp !== undefined && update.hp < piece.hp) {
             piece.takeDamage(piece.hp - update.hp);
          }
        }
      }
      return movementDetected;
    } catch (e) {
      return false;
    }
  }
}
