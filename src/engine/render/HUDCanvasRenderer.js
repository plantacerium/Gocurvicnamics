import { STONE_MAP } from './StoneImageLoader.js';

export class HUDCanvasRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(turnNumber, currentPlayer, scores, board) {
    const ctx = this.ctx;
    ctx.save();
    
    // Top-left panel background
    ctx.fillStyle = 'rgba(15, 17, 21, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(10, 10, 200, 110, 8);
    ctx.fill();
    ctx.stroke();

    // Turn info
    ctx.font = 'bold 16px var(--font-display, Outfit, sans-serif)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(`Turn ${turnNumber}`, 25, 25);

    // Get piece counts
    let p1Pieces = 0;
    let p2Pieces = 0;
    if (board) {
      const allPieces = board.getAllPieces();
      p1Pieces = allPieces.filter(p => p.playerId === 1).length;
      p2Pieces = allPieces.filter(p => p.playerId === 2).length;
    }

    // Player 1
    const p1Active = currentPlayer === 1;
    ctx.fillStyle = p1Active ? 'rgba(255, 51, 51, 1)' : 'rgba(255, 51, 51, 0.5)';
    ctx.font = p1Active ? 'bold 14px var(--font-body, Inter, sans-serif)' : '14px var(--font-body, Inter, sans-serif)';
    ctx.fillText(`P1 Score: ${scores[1] || 0}`, 25, 55);
    ctx.font = '12px var(--font-body, Inter, sans-serif)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`Pieces: ${p1Pieces}`, 130, 56);

    // Player 2
    const p2Active = currentPlayer === 2;
    ctx.fillStyle = p2Active ? 'rgba(51, 102, 255, 1)' : 'rgba(51, 102, 255, 0.5)';
    ctx.font = p2Active ? 'bold 14px var(--font-body, Inter, sans-serif)' : '14px var(--font-body, Inter, sans-serif)';
    ctx.fillText(`P2 Score: ${scores[2] || 0}`, 25, 80);
    ctx.font = '12px var(--font-body, Inter, sans-serif)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`Pieces: ${p2Pieces}`, 130, 81);

    ctx.restore();
  }
}
