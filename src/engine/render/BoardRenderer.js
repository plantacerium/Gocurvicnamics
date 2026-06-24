export class BoardRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(board) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, board.width, board.height);

    for (const zone of board.anchorZones) {
      this._renderZone(zone);
    }
  }

  _renderZone(zone) {
    const ctx = this.ctx;
    const zoneGrad = ctx.createLinearGradient(
      zone.x, zone.y, zone.x + zone.width, zone.y + zone.height
    );
    const playerColor = zone.player === 1 ? 'rgba(6, 182, 212, 0.05)'
      : zone.player === 2 ? 'rgba(244, 63, 94, 0.05)'
      : 'rgba(255, 255, 255, 0.02)';
    zoneGrad.addColorStop(0, playerColor);
    zoneGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = zoneGrad;
    ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= zone.cols; i++) {
      ctx.moveTo(zone.x + i * zone.cellSize, zone.y);
      ctx.lineTo(zone.x + i * zone.cellSize, zone.y + zone.height);
    }
    for (let i = 0; i <= zone.rows; i++) {
      ctx.moveTo(zone.x, zone.y + i * zone.cellSize);
      ctx.lineTo(zone.x + zone.width, zone.y + i * zone.cellSize);
    }
    ctx.stroke();
  }
}
