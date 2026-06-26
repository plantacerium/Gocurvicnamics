export class EffectsRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.activeParticles = [];
  }

  renderShockwaves(shockwaves) {
    const ctx = this.ctx;
    for (const sw of shockwaves) {
      const alpha = Math.max(0, sw.life);
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244, 63, 94, ${alpha * 0.6})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.currentRadius * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244, 63, 94, ${alpha * 0.3})`;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }
  }

  renderActiveParticles() {
    const ctx = this.ctx;
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= 0.02;
      p.x += p.vx;
      p.y += p.vy;
      p.size *= 0.95;

      if (p.life <= 0) {
        this.activeParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.size * 2;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();
    }
  }

  emitDestructionParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.activeParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: color,
        life: 1.0 + Math.random() * 0.5
      });
    }
  }

  emitTrailParticle(x, y, color) {
    this.activeParticles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      size: 1 + Math.random() * 2,
      color: color,
      life: 0.5 + Math.random() * 0.5
    });
  }
}
