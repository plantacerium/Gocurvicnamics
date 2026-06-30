import { UI_DEFAULTS } from '../../config/UIConfig.js';

const TEAM_BORDER_COLORS = {
  1: '#FF3333',
  2: '#3366FF',
};

const TEAM_GLOW_COLORS = {
  1: 'rgba(255, 51, 51, 0.6)',
  2: 'rgba(51, 102, 255, 0.6)',
};

const SELECTED_GLOW = 'rgba(255, 255, 255, 0.8)';
const BORDER_WIDTH = 4;
const SELECTED_BORDER_WIDTH = 5;

export class PieceRenderer {
  constructor(ctx, stoneLoader) {
    this.ctx = ctx;
    this.stoneLoader = stoneLoader;
    this._pulsePhase = 0;
  }

  render(pieces, traceInput, dt = 0) {
    this._pulsePhase += dt * 0.004;
    for (const piece of pieces) {
      const isSelected = traceInput && traceInput.pieceTraceMap.has(piece.id);
      this._renderPiece(piece, isSelected, dt);
    }
  }

  _renderPiece(piece, isSelected, dt) {
    if (piece.type === 'SHADOW') {
      const speed = Math.sqrt((piece.vx || 0) ** 2 + (piece.vy || 0) ** 2);
      if (speed < 0.5) return; // Invisible when stationary
    }

    const ctx = this.ctx;
    const teamColor = TEAM_BORDER_COLORS[piece.playerId] || '#ffffff';
    const glowColor = TEAM_GLOW_COLORS[piece.playerId] || 'rgba(255,255,255,0.4)';
    const img = this.stoneLoader?.getImage(piece.type);
    const drawRadius = piece.radius;

    ctx.save();

    // Glow effect
    if (isSelected) {
      const pulseIntensity = 15 + Math.sin(this._pulsePhase) * 10;
      ctx.shadowColor = SELECTED_GLOW;
      ctx.shadowBlur = pulseIntensity + 15;
    } else {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = UI_DEFAULTS.pieceGlowBlur;
    }

    // Team border circle (drawn underneath)
    const borderW = isSelected ? SELECTED_BORDER_WIDTH : BORDER_WIDTH;
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, drawRadius + borderW / 2 + 1, 0, Math.PI * 2);
    ctx.strokeStyle = isSelected ? '#ffffff' : teamColor;
    ctx.lineWidth = borderW;
    ctx.stroke();

    // Clip to circle for the image
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, drawRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (img) {
      // Draw stone image inside the clipped circle
      const imgSize = drawRadius * 2;
      ctx.drawImage(
        img,
        piece.x - drawRadius,
        piece.y - drawRadius,
        imgSize,
        imgSize
      );
    } else {
      // Fallback: gradient circle
      this._renderFallbackCircle(piece, teamColor);
    }

    ctx.restore();

    // Second border pass (on top, without clip)
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, drawRadius + borderW / 2 + 1, 0, Math.PI * 2);
    ctx.strokeStyle = isSelected ? '#ffffff' : teamColor;
    ctx.lineWidth = borderW;
    ctx.stroke();
    ctx.restore();

    // Cooldown Wave Effect
    if (piece.cooldown > 0) {
      this._renderCooldownWave(piece, dt);
    }

    // HP bar
    this._renderHPBar(piece, teamColor);

    // Type label
    this._renderTypeLabel(piece);
  }

  _renderCooldownWave(piece, dt) {
    // Initialize or update wave phase
    if (!piece._wavePhase) piece._wavePhase = 0;
    piece._wavePhase += dt * 0.003;
    
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    
    // Draw 3 concentric expanding waves
    for (let i = 0; i < 3; i++) {
      const phase = (piece._wavePhase + (i * 0.33)) % 1.0;
      const waveRadius = piece.radius + (phase * piece.radius * 1.5);
      const alpha = 1.0 - phase;
      
      ctx.beginPath();
      ctx.arc(piece.x, piece.y, waveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
      ctx.stroke();
    }
    
    // Draw cooldown timer text over the piece
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((piece.cooldown / 1000).toFixed(1) + 's', piece.x, piece.y);
    
    ctx.restore();
  }

  _renderFallbackCircle(piece, teamColor) {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(
      piece.x - piece.radius * 0.3, piece.y - piece.radius * 0.3, 0,
      piece.x, piece.y, piece.radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, piece.color);
    gradient.addColorStop(1, teamColor);
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, piece.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  _renderHPBar(piece, teamColor) {
    const ctx = this.ctx;
    const hpPct = Math.max(0, piece.hp / piece.maxHp);
    const barW = UI_DEFAULTS.hpBarWidth;
    const barH = UI_DEFAULTS.hpBarHeight;
    const barY = piece.y - piece.radius - UI_DEFAULTS.hpBarOffset - 4;
    const barX = piece.x - barW / 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);
    ctx.fill();

    // Empty bar
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(barX, barY, barW, barH);

    // Filled bar — green to yellow to red gradient based on HP
    const hpColor = hpPct > 0.6 ? '#10b981' : hpPct > 0.3 ? '#f59e0b' : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${piece.hp}/${piece.maxHp}`, piece.x, barY - 2);
  }

  _renderTypeLabel(piece) {
    const ctx = this.ctx;
    const labelY = piece.y + piece.radius + 14;

    ctx.font = '8px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(piece.type, piece.x, labelY);
  }
}
