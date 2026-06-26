export class GhostTrailRenderer {
  constructor() {
    this.trails = [];
    this.maxTrails = 8;
  }

  addTrail(pieceId, curves, playerId) {
    this.trails.push({ 
      pieceId, 
      curves, 
      playerId, 
      opacity: 0.8,
      age: 0
    });
    if (this.trails.length > this.maxTrails) {
      this.trails.shift();
    }
  }

  render(ctx) {
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const trail = this.trails[i];
      
      // Progressive fade
      trail.age += 1;
      trail.opacity = Math.max(0, trail.opacity - 0.005);
      
      if (trail.opacity <= 0) {
        this.trails.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = trail.opacity;
      
      // P1 = Red, P2 = Blue
      ctx.strokeStyle = trail.playerId === 1 ? 'rgba(255, 51, 51, 0.5)' : 'rgba(51, 102, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);

      for (const curve of trail.curves) {
        const lut = curve.getLUT(30);
        ctx.beginPath();
        ctx.moveTo(lut[0].x, lut[0].y);
        for (let j = 1; j < lut.length; j++) {
          ctx.lineTo(lut[j].x, lut[j].y);
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
