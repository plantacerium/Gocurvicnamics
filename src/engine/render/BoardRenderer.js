export class BoardRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(board) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, board.width, board.height);

    this._renderExpanse(board);

    for (const zone of board.anchorZones) {
      this._renderZone(zone);
    }
  }

  _renderExpanse(board) {
    const p1Zones = board.anchorZones.filter(z => z.player === 1);
    const p2Zones = board.anchorZones.filter(z => z.player === 2);
    if (p1Zones.length === 0 || p2Zones.length === 0) return;

    let maxX1 = 0;
    for (const z of p1Zones) {
        if (z.x + z.width > maxX1) maxX1 = z.x + z.width;
    }

    let minX2 = board.width;
    for (const z of p2Zones) {
        if (z.x < minX2) minX2 = z.x;
    }

    if (minX2 > maxX1) {
        const expanseX = maxX1;
        const expanseWidth = minX2 - maxX1;
        
        const ctx = this.ctx;
        const grad = ctx.createLinearGradient(expanseX, 0, expanseX + expanseWidth, 0);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
        grad.addColorStop(0.5, 'rgba(20, 10, 40, 0.3)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

        ctx.fillStyle = grad;
        ctx.fillRect(expanseX, 0, expanseWidth, board.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let x = expanseX; x < minX2; x += 40) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, board.height);
        }
        ctx.stroke();
    }
  }

  _renderZone(zone) {
    const ctx = this.ctx;
    
    // Background gradient
    const zoneGrad = ctx.createLinearGradient(
      zone.x, zone.y, zone.x + zone.width, zone.y + zone.height
    );
    const playerColor = zone.player === 1 ? 'rgba(255, 51, 51, 0.08)'
      : zone.player === 2 ? 'rgba(51, 102, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.02)';
    const borderColor = zone.player === 1 ? 'rgba(255, 51, 51, 0.3)'
      : zone.player === 2 ? 'rgba(51, 102, 255, 0.3)'
      : 'rgba(255, 255, 255, 0.1)';

    zoneGrad.addColorStop(0, playerColor);
    zoneGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = zoneGrad;
    ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < zone.cols; i++) {
      ctx.moveTo(zone.x + i * zone.cellSize, zone.y);
      ctx.lineTo(zone.x + i * zone.cellSize, zone.y + zone.height);
    }
    for (let i = 1; i < zone.rows; i++) {
      ctx.moveTo(zone.x, zone.y + i * zone.cellSize);
      ctx.lineTo(zone.x + zone.width, zone.y + i * zone.cellSize);
    }
    ctx.stroke();

    // Zone Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

    // Player Label
    if (zone.player > 0) {
      ctx.font = 'bold 24px var(--font-display, Outfit, sans-serif)';
      ctx.fillStyle = borderColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `P${zone.player}`, 
        zone.x + zone.width / 2, 
        zone.y + zone.height / 2
      );
    }
  }
}
