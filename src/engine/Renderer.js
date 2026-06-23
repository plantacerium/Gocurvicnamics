import { DEFAULT_CONFIG } from '../config/defaults.js';
import { TRACE_STATES } from './TraceInput.js';

export class Renderer {
  constructor(canvas, board, traceInput) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.board = board;
    this.traceInput = traceInput;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    // Keep internal resolution fixed to board config, let CSS scale the canvas bounding box
    this.canvas.width = this.board.width || DEFAULT_CONFIG.board.width;
    this.canvas.height = this.board.height || DEFAULT_CONFIG.board.height;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw map limits
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.renderBoard();
    this.renderTraceInput();
    this.renderPieces();
  }

  renderBoard() {
    // Render Anchor Zones
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;

    this.board.anchorZones.forEach(zone => {
      // Subtle gradient for anchor zones
      const zoneGrad = this.ctx.createLinearGradient(zone.x, zone.y, zone.x + zone.cols * zone.cellSize, zone.y + zone.rows * zone.cellSize);
      zoneGrad.addColorStop(0, zone.player === 1 ? 'rgba(6, 182, 212, 0.05)' : 'rgba(244, 63, 94, 0.05)');
      zoneGrad.addColorStop(1, 'transparent');
      
      this.ctx.fillStyle = zoneGrad;
      this.ctx.fillRect(zone.x, zone.y, zone.cols * zone.cellSize, zone.rows * zone.cellSize);
      
      // Draw grid
      this.ctx.beginPath();
      for (let i = 0; i <= zone.cols; i++) {
        this.ctx.moveTo(zone.x + i * zone.cellSize, zone.y);
        this.ctx.lineTo(zone.x + i * zone.cellSize, zone.y + zone.rows * zone.cellSize);
      }
      for (let i = 0; i <= zone.rows; i++) {
        this.ctx.moveTo(zone.x, zone.y + i * zone.cellSize);
        this.ctx.lineTo(zone.x + zone.cols * zone.cellSize, zone.y + i * zone.cellSize);
      }
      this.ctx.stroke();
    });
  }

  renderPieces() {
    const pieces = this.board.getAllPieces();
    
    pieces.forEach(piece => {
      // Glow effect for team
      const teamColor = piece.playerId === 1 ? 'rgba(6, 182, 212, 1)' : 'rgba(244, 63, 94, 1)';
      this.ctx.shadowColor = teamColor;
      this.ctx.shadowBlur = 20;
      
      // Main body gradient
      const gradient = this.ctx.createRadialGradient(
        piece.x - piece.radius * 0.3, piece.y - piece.radius * 0.3, 0,
        piece.x, piece.y, piece.radius
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.2, piece.color);
      gradient.addColorStop(1, piece.playerId === 1 ? '#0369a1' : '#9f1239'); // Dark edge
      
      this.ctx.beginPath();
      this.ctx.arc(piece.x, piece.y, piece.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      
      // Stroke
      this.ctx.strokeStyle = teamColor;
      this.ctx.lineWidth = 1;
      
      // Highlight selected piece
      if (this.traceInput.selectedPieceId === piece.id) {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 4;
      }
      
      this.ctx.stroke();
      this.ctx.shadowBlur = 0; // Reset shadow

      // HP Bar (simple visual indicator)
      if (piece.hp < piece.maxHp || true) { // Always show HP if requested by user
        const hpPct = Math.max(0, piece.hp / piece.maxHp);
        this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
        this.ctx.fillRect(piece.x - 15, piece.y - piece.radius - 10, 30, 4);
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(piece.x - 15, piece.y - piece.radius - 10, 30 * hpPct, 4);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${piece.hp}/${piece.maxHp}`, piece.x, piece.y - piece.radius - 15);
      }
    });
  }

  renderTraceInput() {
    if (this.traceInput.state === TRACE_STATES.IDLE) return;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    // Draw control points lines
    if (this.traceInput.cp1) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.traceInput.startPt.x, this.traceInput.startPt.y);
      this.ctx.lineTo(this.traceInput.cp1.x, this.traceInput.cp1.y);
      this.ctx.stroke();
      this.drawNode(this.traceInput.cp1, '#f43f5e');
    }
    
    if (this.traceInput.cp2) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.traceInput.cp1.x, this.traceInput.cp1.y);
      this.ctx.lineTo(this.traceInput.cp2.x, this.traceInput.cp2.y);
      this.ctx.stroke();
      this.drawNode(this.traceInput.cp2, '#f43f5e');
      
      if (this.traceInput.endPt) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.traceInput.cp2.x, this.traceInput.cp2.y);
        this.ctx.lineTo(this.traceInput.endPt.x, this.traceInput.endPt.y);
        this.ctx.stroke();
        this.drawNode(this.traceInput.endPt, '#10b981');
      }
    }
    
    this.ctx.setLineDash([]);
    
    // Draw Completed Curves
    if (this.traceInput.completedCurves && this.traceInput.completedCurves.length > 0) {
      this.ctx.beginPath();
      for (const curve of this.traceInput.completedCurves) {
        const lut = curve.getLUT(50);
        this.ctx.moveTo(lut[0].x, lut[0].y);
        for(let i=1; i<lut.length; i++) {
          this.ctx.lineTo(lut[i].x, lut[i].y);
        }
      }
      this.ctx.strokeStyle = '#06b6d4';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }
    
    // Draw Active Curve
    if (this.traceInput.activeCurve) {
      this.ctx.beginPath();
      const lut = this.traceInput.activeCurve.getLUT(50);
      this.ctx.moveTo(lut[0].x, lut[0].y);
      for(let i=1; i<lut.length; i++) {
        this.ctx.lineTo(lut[i].x, lut[i].y);
      }
      this.ctx.strokeStyle = '#06b6d4';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    } else if (this.traceInput.state === TRACE_STATES.PLACING_CP1) {
      // Just draw line to mouse
      this.ctx.beginPath();
      this.ctx.moveTo(this.traceInput.startPt.x, this.traceInput.startPt.y);
      this.ctx.lineTo(this.traceInput.mousePos.x, this.traceInput.mousePos.y);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.stroke();
    }
  }

  drawNode(pt, color) {
    this.ctx.beginPath();
    this.ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }
}
