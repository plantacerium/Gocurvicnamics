import Matter from 'matter-js';
import { PhysicsAdapter } from './PhysicsAdapter.js';
import { PHYSICS_DEFAULTS } from '../../config/PhysicsConfig.js';
import { Logger } from '../../utils/Logger.js';

const log = Logger('PhysicsMatter');

const { Engine, World, Bodies, Body, Events, Vector } = Matter;

const WALL_CATEGORY = 0x0001;
const DEFAULT_CATEGORY = 0x0002;
const GHOST_CATEGORY = 0x0004;

export class PhysicsMatter extends PhysicsAdapter {
  async initialize() {
    this._engine = Engine.create({
      gravity: { x: 0, y: 0 },
      enableSleeping: false,
    });
    
    // Crucial for infinite movement: prevent engine from forcing objects to rest
    Matter.Resolver._restingThresh = 0.001;
    Matter.Resolver._restingThreshSquared = 0.000001;

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
      frictionStatic: 0,
      frictionAir: 0,
      collisionFilter: {
        category: WALL_CATEGORY,
        mask: 0xFFFFFFFF
      }
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
    const isGhost = piece.type === 'GHOST';
    const body = Bodies.circle(piece.x, piece.y, piece.radius, {
      restitution: PHYSICS_DEFAULTS.restitution,
      friction: PHYSICS_DEFAULTS.friction,
      frictionAir: PHYSICS_DEFAULTS.frictionAir,
      frictionStatic: 0,
      density: piece.mass / (Math.PI * piece.radius * piece.radius),
      label: piece.id,
      collisionFilter: {
        category: isGhost ? GHOST_CATEGORY : DEFAULT_CATEGORY,
        mask: isGhost ? (0xFFFFFFFF ^ WALL_CATEGORY) : 0xFFFFFFFF
      }
    });
    World.add(this._engine.world, body);
    this._bodyMap.set(piece.id, body);
  }

  async step() {
    if (!this._ready) return false;
    Engine.update(this._engine, 1000 / PHYSICS_DEFAULTS.tickRate);

    const collidedIds = this._resolveCollisions();

    let movement = false;
    for (const piece of this.board.getAllPieces()) {
      const body = this._bodyMap.get(piece.id);
      if (!body) continue;

      // Non-launched pieces stay pinned unless hit by a launched piece this frame
      if (!piece.launched && !collidedIds.has(piece.id)) {
        Body.setPosition(body, { x: piece.x, y: piece.y });
        Body.setVelocity(body, { x: 0, y: 0 });
        continue;
      }

      if (Math.abs(body.velocity.x) > this._momentumThreshold || Math.abs(body.velocity.y) > this._momentumThreshold) {
        movement = true;
      }

      // Ghost wrap
      if (piece.type === 'GHOST') {
        let wrapped = false;
        let nx = body.position.x;
        let ny = body.position.y;
        if (nx < 0) { nx = this.board.width; wrapped = true; }
        else if (nx > this.board.width) { nx = 0; wrapped = true; }
        if (ny < 0) { ny = this.board.height; wrapped = true; }
        else if (ny > this.board.height) { ny = 0; wrapped = true; }
        if (wrapped) Body.setPosition(body, { x: nx, y: ny });
      }

      // Preserve infinite movement: ensure launched pieces never stop
      if (piece.launched) {
        const speed = Vector.magnitude(body.velocity);
        if (speed < 1.5) {
          if (speed > 0.01) {
            const norm = Vector.normalise(body.velocity);
            Body.setVelocity(body, Vector.mult(norm, 2.0));
          } else {
            const angle = Math.random() * Math.PI * 2;
            Body.setVelocity(body, { x: Math.cos(angle) * 2.0, y: Math.sin(angle) * 2.0 });
          }
        }
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
    const collidedIds = new Set();
    while (this._collisionQueue.length > 0) {
      const pair = this._collisionQueue.shift();
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      collidedIds.add(bodyA.label);
      collidedIds.add(bodyB.label);

      const isWallA = bodyA.isStatic;
      const isWallB = bodyB.isStatic;

      if (isWallA || isWallB) {
        const movingBody = isWallA ? bodyB : bodyA;
        const piece = this.board.getPiece(movingBody.label);
        if (piece && piece.type === 'WISP') {
          Body.setVelocity(movingBody, { x: movingBody.velocity.x * 1.1, y: movingBody.velocity.y * 1.1 });
        }
        continue;
      }

      const pieceA = this.board.getPiece(bodyA.label);
      const pieceB = this.board.getPiece(bodyB.label);
      if (!pieceA || !pieceB) continue;

      const diff = Vector.sub(bodyA.position, bodyB.position);
      const dist = Math.max(Vector.magnitude(diff), 0.1);
      const normal = Vector.mult(diff, 1 / dist);
      const bump = 6.0;

      Body.setVelocity(bodyA, Vector.add(bodyA.velocity, Vector.mult(normal, bump)));
      Body.setVelocity(bodyB, Vector.add(bodyB.velocity, Vector.mult(normal, -bump)));

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
    return collidedIds;
  }

  async flushStep() {
    if (!this._ready) return;
    Engine.update(this._engine, 1000 / PHYSICS_DEFAULTS.tickRate);
    this._resolveCollisions();
    for (const piece of this.board.getAllPieces()) {
      const body = this._bodyMap.get(piece.id);
      if (!body) continue;
      if (!piece.launched) {
        Body.setPosition(body, { x: piece.x, y: piece.y });
        Body.setVelocity(body, { x: 0, y: 0 });
        continue;
      }
      piece.x = body.position.x;
      piece.y = body.position.y;
      piece.vx = body.velocity.x;
      piece.vy = body.velocity.y;
    }
  }

  async teleportPiece(pieceId, x, y) {
    if (!this._ready) return;
    const body = this._bodyMap.get(pieceId);
    if (!body) return;
    Body.setPosition(body, { x, y });
    Body.setVelocity(body, { x: 0, y: 0 });
  }

  async addPiece(piece) {
    if (!this._ready) return;
    this._addMatterBody(piece);
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
