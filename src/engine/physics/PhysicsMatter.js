import Matter from 'matter-js';
import { PhysicsAdapter } from './PhysicsAdapter.js';
import { PHYSICS_DEFAULTS } from '../../config/PhysicsConfig.js';
import { PIECE_SPECS } from '../../config/PieceConfig.js';
import { Logger } from '../../utils/Logger.js';

const log = Logger('PhysicsMatter');

const { Engine, World, Bodies, Body, Events, Vector } = Matter;

const WALL_CATEGORY    = 0x0001;
const DEFAULT_CATEGORY = 0x0002;
const GHOST_CATEGORY   = 0x0004;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the PIECE_SPECS physics entry for a piece, with safe defaults. */
function pieceSpecs(piece) {
  return PIECE_SPECS[piece.type] || {
    restitution: 1.0, speed: 1.0, curvature: 0.0, curveDir: 0,
    massInteraction: 1.0, spinFactor: 0.0, blink: false,
  };
}

/** Rotate a 2-D vector by `angle` radians. */
function rotateVec(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

// ─────────────────────────────────────────────────────────────────────────────

export class PhysicsMatter extends PhysicsAdapter {
  async initialize() {
    this._engine = Engine.create({
      gravity: { x: 0, y: 0 },
      enableSleeping: false,
    });

    // Prevent Matter.js from forcing bodies to rest
    Matter.Resolver._restingThresh        = 0.001;
    Matter.Resolver._restingThreshSquared = 0.000001;

    this._walls          = [];
    this._bodyMap        = new Map();
    this._collisionQueue = [];
    // Per-piece curve-direction memory (chaos pieces: random dir, kept stable per launch)
    this._curveDirState  = new Map();
    this._ready          = true;

    Events.on(this._engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        this._collisionQueue.push(pair);
      }
    });

    log.info('Matter.js particle-collider engine initialized');
    return true;
  }

  async syncFromBoard() {
    if (!this._ready) return;
    this._clearWorld();
    this._createWalls();
    for (const piece of this.board.getAllPieces()) {
      this._addMatterBody(piece);
    }

    // After adding all bodies, Matter.js may have computed penetration forces for
    // overlapping pieces. Reset ALL velocities immediately so no piece moves
    // until explicitly launched by the player.
    for (const body of this._bodyMap.values()) {
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
    }
    // Also flush any queued collision events that may have fired during add
    this._collisionQueue = [];

    log.debug(`Synced ${this.board.getAllPieces().length} pieces to Matter.js`);
  }

  _clearWorld() {
    World.clear(this._engine.world, false);
    this._bodyMap.clear();
    this._walls          = [];
    this._collisionQueue = [];
    this._curveDirState.clear();
  }

  _createWalls() {
    const t = 50;
    const w = this.board.width;
    const h = this.board.height;
    const wallOpts = {
      isStatic: true,
      restitution: 1.0,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      collisionFilter: { category: WALL_CATEGORY, mask: 0xFFFFFFFF },
    };
    this._walls = [
      Bodies.rectangle(w / 2, -t / 2,    w + t * 2, t, wallOpts),
      Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, wallOpts),
      Bodies.rectangle(-t / 2, h / 2,    t, h + t * 2, wallOpts),
      Bodies.rectangle(w + t / 2, h / 2, t, h + t * 2, wallOpts),
    ];
    World.add(this._engine.world, this._walls);
  }

  _addMatterBody(piece) {
    const sp      = pieceSpecs(piece);
    const isGhost = piece.type === 'GHOST';
    const body = Bodies.circle(piece.x, piece.y, piece.radius, {
      restitution:    sp.restitution,
      friction:       0,
      frictionAir:    0,
      frictionStatic: 0,
      density: piece.mass / (Math.PI * piece.radius * piece.radius),
      label: piece.id,
      collisionFilter: {
        category: isGhost ? GHOST_CATEGORY   : DEFAULT_CATEGORY,
        mask:     isGhost ? (0xFFFFFFFF ^ WALL_CATEGORY) : 0xFFFFFFFF,
      },
    });
    World.add(this._engine.world, body);
    this._bodyMap.set(piece.id, body);

    // Initialise curve direction for chaos pieces
    if (sp.curveDir === 0 && sp.curvature > 0) {
      this._curveDirState.set(piece.id, Math.random() < 0.5 ? 1 : -1);
    }
  }

  async step() {
    if (!this._ready) return false;
    Engine.update(this._engine, 1000 / PHYSICS_DEFAULTS.tickRate);

    const collidedIds = this._resolveCollisions();

    let movement = false;
    for (const piece of this.board.getAllPieces()) {
      const body = this._bodyMap.get(piece.id);
      if (!body) continue;

      // Non-launched, un-hit pieces stay perfectly pinned
      if (!piece.launched && !collidedIds.has(piece.id)) {
        Body.setPosition(body, { x: piece.x, y: piece.y });
        Body.setVelocity(body, { x: 0, y: 0 });
        continue;
      }

      const sp = pieceSpecs(piece);

      // ── Curvature / Magnus effect ─────────────────────────────────────────
      if (sp.curvature > 0) {
        let dir = sp.curveDir;
        if (dir === 0) {
          dir = this._curveDirState.get(piece.id) || 1;
        }
        const rotated = rotateVec(body.velocity, sp.curvature * dir);
        Body.setVelocity(body, rotated);
      }

      // ── Ghost wrap ────────────────────────────────────────────────────────
      if (piece.type === 'GHOST') {
        let nx = body.position.x;
        let ny = body.position.y;
        let wrapped = false;
        if (nx < 0)                      { nx = this.board.width;  wrapped = true; }
        else if (nx > this.board.width)  { nx = 0;                 wrapped = true; }
        if (ny < 0)                      { ny = this.board.height; wrapped = true; }
        else if (ny > this.board.height) { ny = 0;                 wrapped = true; }
        if (wrapped) Body.setPosition(body, { x: nx, y: ny });
      }

      // ── Speed floor — infinite movement guarantee ─────────────────────────
      if (piece.launched) {
        const minSpeed = 1.5 * sp.speed;
        const curSpeed = Vector.magnitude(body.velocity);
        if (curSpeed < minSpeed) {
          if (curSpeed > 0.01) {
            Body.setVelocity(body, Vector.mult(Vector.normalise(body.velocity), minSpeed));
          } else {
            const a = Math.random() * Math.PI * 2;
            Body.setVelocity(body, { x: Math.cos(a) * minSpeed, y: Math.sin(a) * minSpeed });
          }
        }
      }

      if (Math.abs(body.velocity.x) > this._momentumThreshold ||
          Math.abs(body.velocity.y) > this._momentumThreshold) {
        movement = true;
      }

      piece.x  = body.position.x;
      piece.y  = body.position.y;
      piece.vx = body.velocity.x;
      piece.vy = body.velocity.y;
    }

    this._movementDetected = movement;
    return movement;
  }

  // ── Particle Collider ──────────────────────────────────────────────────────
  _resolveCollisions() {
    const collidedIds = new Set();

    while (this._collisionQueue.length > 0) {
      const pair  = this._collisionQueue.shift();
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      collidedIds.add(bodyA.label);
      collidedIds.add(bodyB.label);

      // ── Wall collision ─────────────────────────────────────────────────────
      if (bodyA.isStatic || bodyB.isStatic) {
        const movingBody = bodyA.isStatic ? bodyB : bodyA;
        const piece      = this.board.getPiece(movingBody.label);
        if (!piece) continue;
        const sp = pieceSpecs(piece);

        // Re-randomise curve direction on wall bounce for chaos pieces
        if (sp.curveDir === 0 && sp.curvature > 0) {
          this._curveDirState.set(piece.id, Math.random() < 0.5 ? 1 : -1);
        }
        // WISP accelerates on wall contact
        if (piece.type === 'WISP') {
          Body.setVelocity(movingBody, Vector.mult(movingBody.velocity, 1.1));
        }
        continue;
      }

      // ── Piece-vs-piece collision ───────────────────────────────────────────
      const pieceA = this.board.getPiece(bodyA.label);
      const pieceB = this.board.getPiece(bodyB.label);
      if (!pieceA || !pieceB) continue;

      // CRITICAL: If neither piece has been launched yet, this is a start-of-game
      // penetration artifact from Matter.js resolving overlapping bodies.
      // Ignore it completely — pieces must stay pinned until explicitly launched.
      if (!pieceA.launched && !pieceB.launched) continue;

      const spA = pieceSpecs(pieceA);
      const spB = pieceSpecs(pieceB);

      // --- Separation normal & tangent ---
      const diff    = Vector.sub(bodyA.position, bodyB.position);
      const dist    = Math.max(Vector.magnitude(diff), 0.1);
      const normal  = Vector.mult(diff, 1 / dist);
      const tangent = { x: -normal.y, y: normal.x };

      // --- Impact speed ---
      const relVelA    = Vector.dot(bodyA.velocity, normal);
      const relVelB    = Vector.dot(bodyB.velocity, normal);
      const impactSpeed = Math.abs(relVelA - relVelB);

      // --- Particle collider formula ---
      // Combined restitution (geometric mean keeps energy calculation stable)
      const combinedRestitution = Math.sqrt(spA.restitution * spB.restitution);

      // Impulse: each piece is pushed back proportional to the OTHER's massInteraction
      const impulseA = impactSpeed * spB.massInteraction * combinedRestitution;
      const impulseB = impactSpeed * spA.massInteraction * combinedRestitution;

      let velA = Vector.add(bodyA.velocity, Vector.mult(normal,  impulseA));
      let velB = Vector.add(bodyB.velocity, Vector.mult(normal, -impulseB));

      // --- Spin / lateral kick ---
      const combinedSpin = (spA.spinFactor + spB.spinFactor) * 0.5;
      if (combinedSpin > 0) {
        const spinSign  = Math.random() < 0.5 ? 1 : -1;
        const spinKickA = impactSpeed * combinedSpin * spA.spinFactor * spinSign;
        const spinKickB = impactSpeed * combinedSpin * spB.spinFactor * -spinSign;
        velA = Vector.add(velA, Vector.mult(tangent, spinKickA));
        velB = Vector.add(velB, Vector.mult(tangent, spinKickB));
      }

      // Re-randomise curve direction for chaos pieces on each piece collision
      if (spA.curveDir === 0 && spA.curvature > 0) {
        this._curveDirState.set(pieceA.id, Math.random() < 0.5 ? 1 : -1);
      }
      if (spB.curveDir === 0 && spB.curvature > 0) {
        this._curveDirState.set(pieceB.id, Math.random() < 0.5 ? 1 : -1);
      }

      // --- BLINK teleport (100 px forward, then continue) ---
      if (spA.blink && pieceA.launched) {
        const dir = Vector.magnitude(velA) > 0.01 ? Vector.normalise(velA) : normal;
        Body.setPosition(bodyA, {
          x: bodyA.position.x + dir.x * 100,
          y: bodyA.position.y + dir.y * 100,
        });
      }
      if (spB.blink && pieceB.launched) {
        const dir = Vector.magnitude(velB) > 0.01 ? Vector.normalise(velB) : Vector.mult(normal, -1);
        Body.setPosition(bodyB, {
          x: bodyB.position.x + dir.x * 100,
          y: bodyB.position.y + dir.y * 100,
        });
      }

      Body.setVelocity(bodyA, velA);
      Body.setVelocity(bodyB, velB);

      // Mark hit (stationary) pieces as launched so they keep moving
      pieceA.launched = true;
      pieceB.launched = true;

      // --- Damage (only cross-player) ---
      if (pieceA.playerId !== pieceB.playerId) {
        if (this._collisionResolver) {
          const result = this._collisionResolver.resolve(pieceA, pieceB, impactSpeed);
          if (result.shockwave && this._shockwaveGen) {
            this._shockwaveGen.emit(
              result.shockwavePos.x, result.shockwavePos.y,
              result.shockwaveRadius, result.shockwaveForce,
            );
          }
        } else if (impactSpeed > PHYSICS_DEFAULTS.minImpactForDamage) {
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
      piece.x  = body.position.x;
      piece.y  = body.position.y;
      piece.vx = body.velocity.x;
      piece.vy = body.velocity.y;
    }
  }

  async applyImpulse(pieceId, dx, dy, magnitude) {
    if (!this._ready) return;
    const body  = this._bodyMap.get(pieceId);
    const piece = this.board.getPiece(pieceId);
    if (!body || !piece) return;
    const sp = pieceSpecs(piece);
    const scaledMag = magnitude * sp.speed;
    Body.setVelocity(body, { x: dx * scaledMag, y: dy * scaledMag });
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
    this._walls          = [];
    this._collisionQueue = [];
    this._curveDirState.clear();
    this._ready = false;
    super.destroy();
  }
}
