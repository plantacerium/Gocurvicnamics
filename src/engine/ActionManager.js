import { EVENTS } from '../core/Constants.js';
import { eventBus } from '../core/EventBus.js';
import { PhysicsSync } from './physics/PhysicsSync.js';
import { TraceInput } from './trace/TraceInput.js';
import { Renderer } from './render/Renderer.js';
import { AnimationController } from './animation/AnimationController.js';
import { CurveAnimator } from './animation/CurveAnimator.js';
import { GhostTrailRenderer } from './animation/GhostTrailRenderer.js';
import { ScoreManager } from './scoring/ScoreManager.js';
import { ShockwaveGenerator } from './collision/ShockwaveGenerator.js';
import { DamageResolver } from './collision/DamageResolver.js';
import { CosmicEventManager } from './CosmicEventManager.js';
import { GameLoop } from './GameLoop.js';
import { PHYSICS_TICK_INTERVAL, PHYSICS_DEFAULTS } from '../config/PhysicsConfig.js';
import { GAMEPLAY_DEFAULTS } from '../config/GameplayConfig.js';
import { Logger } from '../utils/Logger.js';
import { gameState } from '../core/GameState.js';
import { ReplayerDB } from '../db/ReplayerDB.js';
import { getCanvasCoords } from '../utils/DOMUtils.js';

const log = Logger('ActionManager');

export class ActionManager {
  constructor(canvas, board, config) {
    this.canvas = canvas;
    this.board = board;
    this.config = config;

    this.physics = null;
    this._physicsReady = false;
    this._pendingPhysicsPieces = null;
    
    this.traceInput = new TraceInput(canvas);
    this.renderer = new Renderer(canvas, board, this.traceInput);
    
    // We can have multiple animators for concurrent launches,
    // but for simplicity we'll create animators dynamically or use a pool.
    // Actually, in real-time we skip the slow "ANIMATING_TRACE" state and launch instantly
    // along the first vector to keep it fast, or we use a Map of Animators.
    this.animators = new Map(); // pieceId -> AnimationController
    
    this.ghostTrails = new GhostTrailRenderer();
    this.scoreManager = new ScoreManager();
    this.shockwaveGen = new ShockwaveGenerator();
    this.damageResolver = new DamageResolver();

    this.renderer.shockwaveGenerator = this.shockwaveGen;
    this.renderer.ghostTrailRenderer = this.ghostTrails;

    this._physicsTickAccum = 0;
    this.selectedHUDPieces = { 1: 'BASE', 2: 'BASE' };
    this.pointerTeams = new Map();
    this.gameStartedAt = Date.now();

    this.db = null;
    this.gameId = null;

    this._bindEvents();
    this._initPhysics();

    this.renderer.setGameState(1, 0, this.scoreManager.getScores()); // Default display

    this.gameLoop = new GameLoop((dt) => this._tick(dt));
    this.gameLoop.start();
    eventBus.emit(EVENTS.GAME_STARTED, { timestamp: this.gameStartedAt });
  }

  async _initPhysics() {
    this.physics = await PhysicsSync.create(this.board);
    this.physics.setCollisionResolver(this.damageResolver, this.shockwaveGen);
    this.cosmicEventManager = new CosmicEventManager(this.board, this.physics);
    this.renderer.cosmicEventManager = this.cosmicEventManager;
    this._physicsReady = true;
    if (this._pendingPhysicsPieces) {
      for (const piece of this._pendingPhysicsPieces) {
        if (this.physics.addPiece) {
          this.physics.addPiece(piece);
        }
      }
      this._pendingPhysicsPieces = null;
    }
    this._initDB();
  }

  async _initDB() {
    try {
      this.db = new ReplayerDB();
      this.gameId = await this.db.createGame(
        this.config ? this.config.toJSON() : {},
        this.board.toJSON()
      );
      gameState.setGameId(this.gameId);
      gameState.setConfig(this.config);
      log.info(`Game created: ${this.gameId}`);
    } catch (e) {
      log.warn('DB init failed:', e);
    }
  }

  _bindEvents() {
    // Intercept pointer down to start trace
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return; // Right click reserved
      const pos = getCanvasCoords(this.canvas, e.clientX, e.clientY);

      // 1. Check if clicking on an existing piece to trace
      let clickedPiece = null;
      for (const piece of this.board.getAllPieces()) {
        const dx = piece.x - pos.x;
        const dy = piece.y - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) <= piece.radius * 1.5) { // generous hit area
          clickedPiece = piece;
          break;
        }
      }

      if (clickedPiece) {
        if ((clickedPiece.cooldown || 0) > 0) {
          // Cannot grab piece on cooldown
          return;
        }
        
        // Start trace
        this.traceInput.startTraceForPiece(e.pointerId, clickedPiece);
        
        // Pause physics for this piece while tracing
        if (this.physics) {
          this.physics.pinPiece(clickedPiece.id); // Custom method we need to add to PhysicsMatter
        }
        return;
      }

      // 2. Try placing a piece if empty space clicked
      const zoneP1 = this.board.validator.findZone(1, pos.x, pos.y);
      const zoneP2 = this.board.validator.findZone(2, pos.x, pos.y);
      const boardAreaPlayer = zoneP1 ? 1 : (zoneP2 ? 2 : null);
      
      if (boardAreaPlayer) {
        // Retrieve which team this specific mouse/pointer belongs to
        const myTeam = this.pointerTeams.get(e.pointerId);
        
        // If this pointer has clicked a HUD for a specific team, lock it to that team
        // Deny placing pieces if they click on the opponent's area
        if (myTeam && myTeam !== boardAreaPlayer) {
          return; // CROSS-SPAWNING DENIED for this pointer
        }
        
        // If the pointer doesn't have a team yet, deduce it from the board area they clicked
        if (!myTeam) {
          this.pointerTeams.set(e.pointerId, boardAreaPlayer);
        }

        const pieceType = this.selectedHUDPieces[boardAreaPlayer];
        if (pieceType) {
          const result = this.board.tryPlacePiece(boardAreaPlayer, pieceType, pos.x, pos.y);
          if (result.valid && result.piece) {
            if (this._physicsReady) {
              this.physics.addPiece(result.piece);
            } else {
              if (!this._pendingPhysicsPieces) this._pendingPhysicsPieces = [];
              this._pendingPhysicsPieces.push(result.piece);
            }
          }
        }
      }
    });

    this.traceInput.onTraceComplete = (data) => {
      this._launchPiece(data);
    };
    
    this.traceInput.onTraceCancel = (pieceId) => {
      if (this.physics) this.physics.unpinPiece(pieceId);
    };

    eventBus.on('BLINK_TELEPORT', (data) => {
      const { pieceId, playerId } = data;
      const zones = this.board.anchorZones.filter(z => z.player === playerId);
      if (zones.length === 0) return;
      const validZone = zones[Math.floor(Math.random() * zones.length)];
      const rx = validZone.x + Math.random() * (validZone.cols * validZone.cellSize);
      const ry = validZone.y + Math.random() * (validZone.rows * validZone.cellSize);
      if (this.physics) this.physics.teleportPiece(pieceId, rx, ry);
    });

    eventBus.on('SPAWN_MIRAGE', async (data) => {
      const { sourceId, x, y, playerId } = data;
      const piece = this.board.addPiece(playerId, 'MIRAGE', x, y);
      piece.hp = 1;
      piece.isFake = true;
      if (this.physics && this.physics.addPiece) {
        await this.physics.addPiece(piece);
        const angle = Math.random() * Math.PI * 2;
        this.physics.applyImpulse(piece.id, Math.cos(angle), Math.sin(angle), 1500);
      }
    });

    eventBus.on('HUD_PIECE_SELECTED', (data) => {
      if (data.player) {
        this.selectedHUDPieces[data.player] = data.type;
        if (data.pointerId !== undefined) {
          this.pointerTeams.set(data.pointerId, data.player);
        }
      } else {
        this.selectedHUDPieces[1] = data.type;
        this.selectedHUDPieces[2] = data.type;
      }
    });
  }

  _launchPiece(data) {
    const { pieceId, curves, length } = data;
    const piece = this.board.getPiece(pieceId);
    if (!piece || curves.length === 0) return;

    // Put piece on cooldown
    piece.cooldown = GAMEPLAY_DEFAULTS.cooldownTimeMs || 3000;

    // We skip the visual trace animation phase in real-time, it launches instantly.
    const lastCurve = curves[curves.length - 1];
    const vec = CurveAnimator.getEndVector(lastCurve);
    const lengthMult = CurveAnimator.computeLengthMultiplier(
      length,
      GAMEPLAY_DEFAULTS.curveLengthDivisor,
      GAMEPLAY_DEFAULTS.maxCurveLengthMultiplier
    );

    if (piece.type === 'SLINGSHOT') {
      piece.setCurveLengthMultiplier(length);
    }

    if (this.physics) {
      let isParry = false;
      if (piece.lastHitTime && (Date.now() - piece.lastHitTime) <= GAMEPLAY_DEFAULTS.parryWindowMs) {
        isParry = true;
        this._triggerParryEffect(piece);
      }

      this.physics.unpinPiece(piece.id);
      
      const multiplier = isParry ? (lengthMult * 2) : lengthMult;
      
      // Guided path execution instead of a simple billiards impulse
      this.physics.followPath(pieceId, curves, multiplier);
      piece.launched = true;
      
      if (isParry) {
        // Heal the piece slightly or negate the damage it just took (simplified to just effect for now)
        piece.hp = Math.min(piece.maxHp, piece.hp + 1);
      }
    }

    this.ghostTrails.addTrail(pieceId, curves, piece.playerId);
    this._recordMove(pieceId, curves, piece.playerId);
  }
  
  _triggerParryEffect(piece) {
    log.info(`Parry executed on ${piece.id}!`);
    if (this.shockwaveGen) {
      this.shockwaveGen.emit(piece.x, piece.y, 100, 500, true); // Visual shockwave for parry
    }
    // Visual text could be added via effectsRenderer
  }

  async _recordMove(pieceId, curves, playerId) {
    if (!this.db || !this.gameId) return;
    try {
      const curveData = curves.map(c => ({
        points: [c.points[0], c.points[1], c.points[2], c.points[3]],
        length: c.length(),
      }));
      // Using generic turnNumber 0 for real-time
      await this.db.recordMove(this.gameId, 0, playerId, pieceId, curveData);
    } catch (e) {
      log.warn('Failed to record move:', e);
    }
  }

  async _tick(deltaMs) {
    // 1. Update Cooldowns
    for (const piece of this.board.getAllPieces()) {
      if (piece.cooldown > 0) {
        piece.cooldown -= deltaMs;
        if (piece.cooldown < 0) piece.cooldown = 0;
      }
    }

    // Update cosmic events
    if (this.cosmicEventManager) {
      this.cosmicEventManager.update(deltaMs);
    }

    // 2. Time Dilation logic (Bullet Time)
    const activeTraces = this.traceInput.getActiveTraceCount();
    const timeScale = activeTraces > 0 ? (GAMEPLAY_DEFAULTS.timeDilationScale || 0.2) : 1.0;
    
    // Apply timeScale to deltaMs for physics
    const physicsDelta = deltaMs * timeScale;
    this._physicsTickAccum += physicsDelta;

    if (this._physicsTickAccum >= PHYSICS_TICK_INTERVAL && this.physics) {
      this._physicsTickAccum -= PHYSICS_TICK_INTERVAL;
      await this._physicsTick();
    }

    this.renderer.setGameState(1, 0, this.scoreManager.getScores());
    this.renderer.render(deltaMs);
  }

  async _physicsTick() {
    const movement = await this.physics.step();
    const destroyed = this.board.removeDestroyedPieces();

    for (const piece of destroyed) {
      await this.physics.removePiece(piece.id);
      const killer = piece.playerId === 1 ? 2 : 1;
      this.scoreManager.onPieceDestroyed(piece, killer);
      gameState.stats = this.scoreManager.getStats();
    }

    this.shockwaveGen.update(this.board);

    const p1pieces = this.board.getPlayerPieces(1).length;
    const p2pieces = this.board.getPlayerPieces(2).length;
    if (p1pieces === 0 || p2pieces === 0) {
      const winner = p1pieces > 0 ? 1 : 2;
      gameState.stats = this.scoreManager.getStats();
      eventBus.emit(EVENTS.GAME_ENDED, { winner, stats: gameState.stats });
    }
  }

  destroy() {
    if (this.gameLoop) this.gameLoop.stop();
    if (this.traceInput) this.traceInput.destroy();
    if (this.physics) this.physics.destroy();
    if (this.cosmicEventManager) this.cosmicEventManager.clear();
    this.ghostTrails.clear();
    this.shockwaveGen.clear();
  }
}
