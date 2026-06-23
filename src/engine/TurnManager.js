import { Board } from './Board.js';
import { PhysicsEngine } from './Physics.js';
import { TraceInput, TRACE_STATES } from './TraceInput.js';
import { Renderer } from './Renderer.js';

export const TURN_STATES = {
  SELECT_PIECE: 'SELECT_PIECE',
  DRAW_TRACE: 'DRAW_TRACE',
  ANIMATING_TRACE: 'ANIMATING_TRACE', // Moving along Bezier
  PHYSICS_RESOLVE: 'PHYSICS_RESOLVE'  // Letting Matter.js settle
};

export class TurnManager {
  constructor(canvas, board) {
    this.canvas = canvas;
    this.board = board;
    
    this.physics = new PhysicsEngine(this.board);
    this.physics.syncFromBoard();
    
    this.traceInput = new TraceInput(canvas);
    this.renderer = new Renderer(canvas, this.board, this.traceInput);
    
    this.currentPlayer = 1;
    this.state = TURN_STATES.SELECT_PIECE;
    
    this.animatingPieceId = null;
    this.activeCurves = null;
    this.currentCurveIndex = 0;
    this.curveProgress = 0; // 0 to 1 per curve
    
    this.p1Score = 0;
    this.p2Score = 0;
    
    this.bindEvents();
    
    // Start game loop
    this.lastTime = performance.now();
    this.isPhysicsTicking = false;
    this.restFrames = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state !== TURN_STATES.SELECT_PIECE) return;
      if (e.button === 2) return; // Ignore right click for selection
      
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      // Find clicked piece
      const pieces = this.board.getAllPieces();
      for (const piece of pieces) {
        if (piece.playerId !== this.currentPlayer) continue;
        
        const dx = piece.x - mouseX;
        const dy = piece.y - mouseY;
        if (Math.sqrt(dx*dx + dy*dy) <= piece.radius) {
          // Select piece
          this.state = TURN_STATES.DRAW_TRACE;
          this.traceInput.startTrace(piece);
          break;
        }
      }
    });

    this.traceInput.onTraceComplete = (data) => {
      this.activeCurves = data.curves;
      this.animatingPieceId = data.pieceId;
      this.currentCurveIndex = 0;
      this.curveProgress = 0;
      this.state = TURN_STATES.ANIMATING_TRACE;
    };
    
    // Detect cancellation
    const origReset = this.traceInput.reset.bind(this.traceInput);
    this.traceInput.reset = () => {
      origReset();
      if (this.state === TURN_STATES.DRAW_TRACE) {
        this.state = TURN_STATES.SELECT_PIECE;
      }
    };
  }

  async loop(time) {
    const deltaMs = time - this.lastTime;
    this.lastTime = time;
    
    if (this.state === TURN_STATES.ANIMATING_TRACE) {
      await this.updateTraceAnimation(deltaMs);
    }
    
    // Physics ticks continuously in the background
    if (!this.isPhysicsTicking && this.physics) {
      this.isPhysicsTicking = true;
      
      const beforePieces = new Map(this.board.pieces);
      
      const movementDetected = await this.physics.step();
      this.board.removeDestroyedPieces();
      
      for (const [id, piece] of beforePieces.entries()) {
        if (!this.board.pieces.has(id)) {
          if (piece.playerId === 1) {
            this.p2Score += 100;
            const p2El = document.getElementById('p2-score');
            if(p2El) p2El.textContent = this.p2Score;
          } else {
            this.p1Score += 100;
            const p1El = document.getElementById('p1-score');
            if(p1El) p1El.textContent = this.p1Score;
          }
        }
      }
      
      this.isPhysicsTicking = false;
    }
    
    this.renderer.render();
    requestAnimationFrame(this.loop);
  }

  async updateTraceAnimation(deltaMs) {
    // Advance progress based on current curve's length to maintain constant speed
    const currentCurve = this.activeCurves[this.currentCurveIndex];
    if (!currentCurve) {
      this.finishTraceAnimation();
      return;
    }
    
    const speed = 300.0; // pixels per second
    const curveLength = currentCurve.length();
    const durationMs = (curveLength / speed) * 1000;
    
    this.curveProgress += deltaMs / durationMs;
    
    if (this.curveProgress >= 1) {
      this.currentCurveIndex++;
      this.curveProgress = 0;
      
      if (this.currentCurveIndex >= this.activeCurves.length) {
        await this.finishTraceAnimation(currentCurve);
        return;
      }
    }
    
    const activeCrv = this.activeCurves[this.currentCurveIndex];
    if (activeCrv) {
      const pt = activeCrv.get(Math.min(1, this.curveProgress));
      const piece = this.board.getPiece(this.animatingPieceId);
      if (piece) {
        piece.x = pt.x;
        piece.y = pt.y;
      }
    }
  }

  async finishTraceAnimation(lastCurve) {
    if (!lastCurve) {
      this.state = TURN_STATES.PHYSICS_RESOLVE;
      return;
    }
    
    // Transfer remaining momentum to physics
    const pt1 = lastCurve.get(0.95);
    const pt2 = lastCurve.get(1.0);
    const dx = pt2.x - pt1.x;
    const dy = pt2.y - pt1.y;
    
    const piece = this.board.getPiece(this.animatingPieceId);
    if(piece) {
      piece.x = pt2.x;
      piece.y = pt2.y;
    }
    
    // Calculate total energy modifier from multiple curves (Slingshot logic can be hooked here)
    const totalLength = this.activeCurves.reduce((acc, c) => acc + c.length(), 0);
    const lengthMultiplier = Math.min(totalLength / 200.0, 5.0); // max 5x multiplier
    
    await this.physics.teleportPiece(this.animatingPieceId, pt2.x, pt2.y);
    await this.physics.applyImpulse(this.animatingPieceId, { x: dx, y: dy }, 5000.0 * lengthMultiplier);
    
    // Pieces now bounce infinitely, so end turn immediately
    this.endTurn();
  }

  endTurn() {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.state = TURN_STATES.SELECT_PIECE;
    this.animatingPieceId = null;
    this.activeCurves = null;
    
    // Update HUD if we had one tied to an event
    const p1TurnElement = document.getElementById('turn-indicator');
    if (p1TurnElement) {
       p1TurnElement.textContent = `P${this.currentPlayer} Turn`;
       p1TurnElement.style.color = this.currentPlayer === 1 ? 'var(--accent-cyan)' : 'var(--accent-red)';
    }
  }
}
