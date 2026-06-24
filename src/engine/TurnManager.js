import { TURN_STATES, EVENTS } from '../core/Constants.js';
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
import { GameLoop } from './GameLoop.js';
import { PHYSICS_TICK_INTERVAL, PHYSICS_DEFAULTS } from '../config/PhysicsConfig.js';
import { GAMEPLAY_DEFAULTS } from '../config/GameplayConfig.js';
import { Logger } from '../utils/Logger.js';
import { gameState } from '../core/GameState.js';
import { ReplayerDB } from '../db/ReplayerDB.js';

const log = Logger('TurnManager');

export class TurnManager {
  constructor(canvas, board, config) {
    this.canvas = canvas;
    this.board = board;
    this.config = config;

    this.physics = null;
    this.traceInput = new TraceInput(canvas);
    this.renderer = new Renderer(canvas, board, this.traceInput);
    this.animator = new AnimationController();
    this.ghostTrails = new GhostTrailRenderer();
    this.scoreManager = new ScoreManager();
    this.shockwaveGen = new ShockwaveGenerator();
    this.damageResolver = new DamageResolver();

    this.renderer.shockwaveGenerator = this.shockwaveGen;
    this.renderer.ghostTrailRenderer = this.ghostTrails;

    this.currentPlayer = 1;
    this.state = TURN_STATES.SELECT_PIECE;
    this.turnNumber = 1;
    this._physicsTickAccum = 0;

    this.db = null;
    this.gameId = null;

    this._bindEvents();
    this._initPhysics();

    this.renderer.setGameState(this.currentPlayer, this.turnNumber, this.scoreManager.getScores());

    this.gameLoop = new GameLoop((dt) => this._tick(dt));
    this.gameLoop.start();
    eventBus.emit(EVENTS.GAME_STARTED, { playerId: this.currentPlayer, turnNumber: this.turnNumber });
  }

  async _initPhysics() {
    this.physics = await PhysicsSync.create(this.board);
    this.physics.setCollisionResolver(this.damageResolver, this.shockwaveGen);
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
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state !== TURN_STATES.SELECT_PIECE) return;
      if (e.button === 2) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      for (const piece of this.board.getAllPieces()) {
        if (piece.playerId !== this.currentPlayer) continue;
        const dx = piece.x - mx;
        const dy = piece.y - my;
        if (Math.sqrt(dx * dx + dy * dy) <= piece.radius) {
          this.state = TURN_STATES.DRAW_TRACE;
          this.traceInput.startTrace(piece);
          break;
        }
      }
    });

    this.traceInput.onTraceComplete = (data) => {
      this._onTraceComplete(data);
    };

    const origReset = this.traceInput.reset.bind(this.traceInput);
    this.traceInput.reset = () => {
      origReset();
      if (this.state === TURN_STATES.DRAW_TRACE) {
        this.state = TURN_STATES.SELECT_PIECE;
      }
    };
  }

  _onTraceComplete(data) {
    this.animator.onPiecePosition = (pieceId, x, y) => {
      const p = this.board.getPiece(pieceId);
      if (p) { p.x = x; p.y = y; }
    };
    this.animator.onFinished = (pieceId, lastCurve) => {
      this._onAnimationFinished(lastCurve);
    };
    this.animator.startAnimation(data.pieceId, data.curves);
    this.state = TURN_STATES.ANIMATING_TRACE;
  }

  _onAnimationFinished(lastCurve) {
    if (!lastCurve) {
      this.state = TURN_STATES.PHYSICS_RESOLVE;
      return;
    }
    const vec = CurveAnimator.getEndVector(lastCurve);
    const totalLength = CurveAnimator.getTotalLength(this.animator.curves);
    const lengthMult = CurveAnimator.computeLengthMultiplier(
      totalLength,
      GAMEPLAY_DEFAULTS.curveLengthDivisor,
      GAMEPLAY_DEFAULTS.maxCurveLengthMultiplier
    );

    const piece = this.board.getPiece(this.animator.pieceId);
    if (piece) {
      const endPt = lastCurve.get(1.0);
      piece.x = endPt.x;
      piece.y = endPt.y;

      if (piece.type === 'SLINGSHOT') {
        piece.setCurveLengthMultiplier(totalLength);
      }
    }

    const pId = this.animator.pieceId;
    const endP = lastCurve.get(1.0);
    this.physics.teleportPiece(pId, endP.x, endP.y);
    this.physics.applyImpulse(pId, vec.dx, vec.dy, PHYSICS_DEFAULTS.impulseBaseMagnitude * lengthMult);

    this.ghostTrails.addTrail(pId, this.animator.curves, this.currentPlayer);
    this._recordMove();

    this.state = TURN_STATES.PHYSICS_RESOLVE;
    this._endTurn();
  }

  async _recordMove() {
    if (!this.db || !this.gameId) return;
    try {
      const curveData = this.animator.curves.map(c => ({
        points: [c.points[0], c.points[1], c.points[2], c.points[3]],
        length: c.length(),
      }));
      await this.db.recordMove(this.gameId, this.turnNumber, this.currentPlayer, this.animator.pieceId, curveData);
      gameState.addMove({ turnNumber: this.turnNumber, playerId: this.currentPlayer, pieceId: this.animator.pieceId, curves: curveData });
    } catch (e) {
      log.warn('Failed to record move:', e);
    }
  }

  async _tick(deltaMs) {
    if (this.state === TURN_STATES.ANIMATING_TRACE) {
      this.animator.update(deltaMs);
    }

    this._physicsTickAccum += deltaMs;
    if (this._physicsTickAccum >= PHYSICS_TICK_INTERVAL && this.physics) {
      this._physicsTickAccum = 0;
      await this._physicsTick();
    }

    this.renderer.setGameState(this.currentPlayer, this.turnNumber, this.scoreManager.getScores());
    this.renderer.render();
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

  _endTurn() {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.turnNumber++;
    this.state = TURN_STATES.SELECT_PIECE;
    eventBus.emit(EVENTS.TURN_CHANGED, { playerId: this.currentPlayer });
    this.renderer.setGameState(this.currentPlayer, this.turnNumber, this.scoreManager.getScores());
  }

  destroy() {
    if (this.gameLoop) this.gameLoop.stop();
    if (this.traceInput) this.traceInput.destroy();
    if (this.physics) this.physics.destroy();
    this.ghostTrails.clear();
    this.shockwaveGen.clear();
  }
}
