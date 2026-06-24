import { teamColor, teamDark } from '../../utils/ColorUtils.js';
import { UI_DEFAULTS } from '../../config/UIConfig.js';

export class PieceRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(pieces, selectedPieceId) {
    for (const piece of pieces) {
      this._renderPiece(piece, selectedPieceId === piece.id);
    }
  }

  _renderPiece(piece, isSelected) {
    const ctx = this.ctx;
    const tColor = teamColor(piece.playerId);
    const tDark = teamDark(piece.playerId);

    ctx.shadowColor = tColor;
    ctx.shadowBlur = UI_DEFAULTS.pieceGlowBlur;

    const gradient = ctx.createRadialGradient(
      piece.x - piece.radius * 0.3, piece.y - piece.radius * 0.3, 0,
      piece.x, piece.y, piece.radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, piece.color);
    gradient.addColorStop(1, tDark);
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, piece.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = tColor;
      ctx.lineWidth = 1;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    this._renderHPBar(piece);
  }

  _renderHPBar(piece) {
    const ctx = this.ctx;
    const hpPct = Math.max(0, piece.hp / piece.maxHp);
    const barW = UI_DEFAULTS.hpBarWidth;
    const barH = UI_DEFAULTS.hpBarHeight;
    const barY = piece.y - piece.radius - UI_DEFAULTS.hpBarOffset;

    ctx.fillStyle = 'rgba(255,0,0,0.5)';
    ctx.fillRect(piece.x - barW / 2, barY, barW, barH);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(piece.x - barW / 2, barY, barW * hpPct, barH);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${piece.hp}/${piece.maxHp}`, piece.x, barY - 5);
  }
}
