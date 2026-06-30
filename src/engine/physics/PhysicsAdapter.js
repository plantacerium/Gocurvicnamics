import { Logger } from '../../utils/Logger.js';

const log = Logger('PhysicsAdapter');

export class PhysicsAdapter {
  constructor(board) {
    this.board = board;
    this._ready = false;
    this._movementDetected = false;
    this._momentumThreshold = 0.1;
  }

  async initialize() {
    throw new Error('PhysicsAdapter#initialize() must be overridden');
  }

  async syncFromBoard() {
    throw new Error('PhysicsAdapter#syncFromBoard() must be overridden');
  }

  async step() {
    throw new Error('PhysicsAdapter#step() must be overridden');
  }

  async applyImpulse(pieceId, dx, dy, magnitude) {
    throw new Error('PhysicsAdapter#applyImpulse() must be overridden');
  }

  async followPath(pieceId, curves, multiplier) {
    throw new Error('PhysicsAdapter#followPath() must be overridden');
  }

  async flushStep() {
    throw new Error('PhysicsAdapter#flushStep() must be overridden');
  }

  async teleportPiece(pieceId, x, y) {
    throw new Error('PhysicsAdapter#teleportPiece() must be overridden');
  }

  async removePiece(pieceId) {
    throw new Error('PhysicsAdapter#removePiece() must be overridden');
  }

  setCollisionResolver(resolver, shockwaveGen) {
    this._collisionResolver = resolver;
    this._shockwaveGen = shockwaveGen;
  }

  isReady() { return this._ready; }
  hasMovement() { return this._movementDetected; }
  resetMovement() { this._movementDetected = false; }

  destroy() {
    this._ready = false;
    this.board = null;
  }
}
