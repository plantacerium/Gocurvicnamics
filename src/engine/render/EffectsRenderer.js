export class EffectsRenderer {
  constructor(ctx) {
    this.ctx = ctx;
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

  renderParticles(particles) {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
  }

  renderDestructionEffect(x, y, color) {
    const ctx = this.ctx;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const dist = 20 + Math.random() * 30;
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }
  }
}
