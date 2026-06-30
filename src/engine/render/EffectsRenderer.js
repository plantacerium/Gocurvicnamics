export class EffectsRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.activeParticles = [];
    this.cosmicPhase = 0;
  }

  renderCosmicEvents(events, dt) {
    if (!events || events.length === 0) return;
    this.cosmicPhase += dt * 0.002;
    
    const ctx = this.ctx;
    ctx.save();
    
    for (const ev of events) {
      // Fade in/out based on life
      let alpha = 1.0;
      if (ev.life < 2000) alpha = ev.life / 2000;
      else if (ev.life > ev.maxLife - 2000 && ev.maxLife) alpha = (ev.maxLife - ev.life) / 2000;
      
      const isGravity = ev.type === 'BLACK_HOLE';
      const baseColor = isGravity ? `rgba(139, 92, 246, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;
      const secondaryColor = isGravity ? `rgba(88, 28, 135, ${alpha * 0.3})` : `rgba(224, 242, 254, ${alpha * 0.3})`;
      
      ctx.translate(ev.x, ev.y);
      
      // Draw background glow
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, ev.radius);
      grad.addColorStop(0, secondaryColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, ev.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw swirling event horizon lines
      const numLines = 5;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;
      
      for (let i = 0; i < numLines; i++) {
        // Black holes pull IN (phase subtracts), White holes push OUT (phase adds)
        const direction = isGravity ? -1 : 1;
        const phaseOffset = (this.cosmicPhase * direction) + (i * Math.PI * 2 / numLines);
        
        ctx.beginPath();
        for (let r = 20; r < ev.radius; r += 10) {
          // spiral math
          const angle = phaseOffset + (r * 0.02 * direction);
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (r === 20) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      
      ctx.translate(-ev.x, -ev.y);
    }
    
    ctx.restore();
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
