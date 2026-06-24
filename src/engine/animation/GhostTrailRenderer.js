export class GhostTrailRenderer {
  constructor() {
    this.trails = [];
    this.maxTrails = 5;
  }

  addTrail(pieceId, curves, playerId) {
    this.trails.push({ pieceId, curves, playerId, opacity: 0.5 });
    if (this.trails.length > this.maxTrails) {
      this.trails.shift();
    }
  }

  render(ctx) {
    for (const trail of this.trails) {
      ctx.save();
      ctx.globalAlpha = trail.opacity;
      ctx.strokeStyle = trail.playerId === 1 ? 'rgba(6, 182, 212, 0.3)' : 'rgba(244, 63, 94, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);

      for (const curve of trail.curves) {
        const lut = curve.getLUT(30);
        ctx.beginPath();
        ctx.moveTo(lut[0].x, lut[0].y);
        for (let i = 1; i < lut.length; i++) {
          ctx.lineTo(lut[i].x, lut[i].y);
        }
        ctx.stroke();
      }

      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  clear() {
    this.trails = [];
  }
}
