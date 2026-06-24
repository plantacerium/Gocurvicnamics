export class HUDCanvasRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(turnNumber, currentPlayer, scores) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`Turn ${turnNumber}`, 10, 20);

    const p1Color = currentPlayer === 1 ? '#06b6d4' : 'rgba(255,255,255,0.3)';
    const p2Color = currentPlayer === 2 ? '#f43f5e' : 'rgba(255,255,255,0.3)';
    ctx.fillStyle = p1Color;
    ctx.fillText(`P1: ${scores[1] || 0}`, 10, 40);
    ctx.fillStyle = p2Color;
    ctx.fillText(`P2: ${scores[2] || 0}`, 10, 58);
    ctx.restore();
  }
}
