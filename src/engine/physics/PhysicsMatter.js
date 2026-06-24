import Matter from 'matter-js';
import { PhysicsAdapter } from './PhysicsAdapter.js';
import { PHYSICS_DEFAULTS } from '../../config/PhysicsConfig.js';
import { Logger } from '../../utils/Logger.js';

const log = Logger('PhysicsMatter');

const { Engine, World, Bodies, Body, Events, Vector } = Matter;

export class PhysicsMatter extends PhysicsAdapter {
  async initialize() {
    this._engine = Engine.create({
      gravity: { x: 0, y: 0 },
    });
    this._walls = [];
    this._bodyMap = new Map();
    this._collisionQueue = [];
    this._ready = true;

    Events.on(this._engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        this._collisionQueue.push(pair);
      }
    });

    log.info('Matter.js engine initialized');
    return true;
  }

  async syncFromBoard() {
    if (!this._ready) return;
    this._clearWorld();
    this._createWalls();
    for (const piece of this.board.getAllPieces()) {
      this._addMatterBody(piece);
    }
    log.debug(`Synced ${this.board.getAllPieces().length} pieces to Matter.js`);
  }

  _clearWorld() {
    World.clear(this._engine.world, false);
    this._bodyMap.clear();
    this._walls = [];
    this._collisionQueue = [];
  }

  _createWalls() {
    const t = 50;
    const w = this.board.width;
    const h = this.board.height;
    const wallOpts = {
      isStatic: true,
      restitution: PHYSICS_DEFAULTS.restitution,
      friction: PHYSICS_DEFAULTS.friction,
    };
    this._walls = [
      Bodies.rectangle(w / 2, -t / 2, w + t * 2, t, wallOpts),
      Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, wallOpts),
      Bodies.rectangle(-t / 2, h / 2, t, h + t * 2, wallOpts),
      Bodies.rectangle(w + t / 2, h / 2, t, h + t * 2, wallOpts),
    ];
    World.add(this._engine.world, this._walls);
  }

  _addMatterBody(piece) {
    const body = Bodies.circle(piece.x, piece.y, piece.radius, {
      restitution: PHYSICS_DEFAULTS.restitution,
      friction: PHYSICS_DEFAULTS.friction,
      frictionAir: PHYSICS_DEFAULTS.frictionAir,
      density: piece.mass / (Math.PI * piece.radius * piece.radius),
      label: piece.id,
    });
    World.add(this._engine.world, body);
    this._bodyMap.set(piece.id, body);
  }

  async step() {
    if (!this._ready) return false;
    Engine.update(this._engine, 1000 / PHYSICS_DEFAULTS.tickRate);

    this._resolveCollisions();

    let movement = false;
    for (const piece of this.board.getAllPieces()) {
      const body = this._bodyMap.get(piece.id);
      if (!body) continue;

      const dx = Math.abs(piece.x - body.position.x);
      const dy = Math.abs(piece.y - body.position.y);
      if (dx > this._momentumThreshold || dy > this._momentumThreshold) {
        movement = true;
      }

      piece.x = body.position.x;
      piece.y = body.position.y;
      piece.vx = body.velocity.x;
      piece.vy = body.velocity.y;
    }

    this._movementDetected = movement;
    return movement;
  }

  _resolveCollisions() {
    while (this._collisionQueue.length > 0) {
      const pair = this._collisionQueue.shift();
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      if (bodyA.isStatic || bodyB.isStatic) continue;

      const pieceA = this.board.getPiece(bodyA.label);
      const pieceB = this.board.getPiece(bodyB.label);
      if (!pieceA || !pieceB) continue;
      if (pieceA.playerId === pieceB.playerId) continue;

      const relVel = Vector.magnitude(
        Vector.sub(bodyA.velocity, bodyB.velocity)
      );

      if (this._collisionResolver) {
        const result = this._collisionResolver.resolve(pieceA, pieceB, relVel);
        if (result.shockwave && this._shockwaveGen) {
          this._shockwaveGen.emit(
            result.shockwavePos.x,
            result.shockwavePos.y,
            result.shockwaveRadius,
            result.shockwaveForce
          );
        }
      } else {
        if (relVel > PHYSICS_DEFAULTS.minImpactForDamage) {
          pieceA.takeDamage(PHYSICS_DEFAULTS.damagePerCollision);
          pieceB.takeDamage(PHYSICS_DEFAULTS.damagePerCollision);
        }
      }
    }
  }

  async applyImpulse(pieceId, dx, dy, magnitude) {
    if (!this._ready) return;
    const body = this._bodyMap.get(pieceId);
    if (!body) return;
    const force = {
      x: dx * magnitude * PHYSICS_DEFAULTS.impulseScale,
      y: dy * magnitude * PHYSICS_DEFAULTS.impulseScale,
    };
    Body.applyForce(body, body.position, force);
  }

  async teleportPiece(pieceId, x, y) {
    if (!this._ready) return;
    const body = this._bodyMap.get(pieceId);
    if (!body) return;
    Body.setPosition(body, { x, y });
    Body.setVelocity(body, { x: 0, y: 0 });
  }

  async removePiece(pieceId) {
    if (!this._ready) return;
    const body = this._bodyMap.get(pieceId);
    if (!body) return;
    World.remove(this._engine.world, body);
    this._bodyMap.delete(pieceId);
  }

  destroy() {
    if (this._engine) {
      Events.off(this._engine, 'collisionStart', null);
      World.clear(this._engine.world, false);
      Engine.clear(this._engine);
    }
    this._bodyMap.clear();
    this._walls = [];
    this._collisionQueue = [];
    this._ready = false;
    super.destroy();
  }
}
