import { eventBus } from '../core/EventBus.js';
import { EVENTS, SCREENS } from '../core/Constants.js';
import { PIECE_TYPE_LIST, PIECE_SPECS } from '../config/PieceConfig.js';

export class GameHUD {
  constructor(container, router) {
    this.container = container;
    this.router = router;
    this.selectedPieces = { 1: 'BASE', 2: 'BASE' };
    this._unsubs = [];
    this._bindEvents();
  }

  render(scores = {1:0, 2:0}) {
    const p1Score = scores[1] || 0;
    const p2Score = scores[2] || 0;

    const imgMap = {
      BASE: 'assets/stones/piece_1_base_1782403856623.png',
      DAMPENER: 'assets/stones/piece_2_dampener_1782403868335.png',
      AMPLIFIER: 'assets/stones/piece_3_amplifier_v2_1782404059346.png',
      SLINGSHOT: 'assets/stones/piece_4_slingshot_1782403893916.png',
      GRAVITON: 'assets/stones/piece_5_graviton_1782403906467.png',
      PHANTOM: 'assets/stones/piece_6_phantom_1782403917700.png',
      BRAWLER: 'assets/stones/piece_7_brawler_1782404073633.png',
      GLASS_CANNON: 'assets/stones/piece_8_glass_cannon_1782404085338.png',
      JUGGERNAUT: 'assets/stones/piece_9_juggernaut_1782404097456.png',
      PEBBLE: 'assets/stones/piece_10_pebble_1782404106565.png',
      GHOST: 'assets/stones/piece_11_ghost_1782404118723.png',
      MIRAGE: 'assets/stones/piece_12_mirage_1782404130644.png',
      SPECTER: 'assets/stones/piece_13_specter_1782404143497.png',
      BLINK: 'assets/stones/piece_14_blink_1782404154343.png',
      SHADOW: 'assets/stones/piece_15_shadow_1782404165927.png',
      WISP: 'assets/stones/piece_16_wisp_1782404178419.png',
    };

    this.container.innerHTML = `
      <!-- P1 Selector (Left) -->
      <div style="position: absolute; top: 50%; left: 20px; transform: translateY(-50%); pointer-events: auto; display: flex; flex-direction: row; flex-wrap: wrap; width: 140px; justify-content: center; gap: 8px; max-height: 80vh; overflow-y: auto; padding: 10px;" class="glass-panel">
        <h4 style="color: var(--team1-color); margin: 0 0 10px 0; text-align: center; font-size: 0.8rem; width: 100%;">P1 STONES</h4>
        ${PIECE_TYPE_LIST.map(t => {
          const specs = PIECE_SPECS[t];
          const label = specs?.label || t;
          const imgSrc = imgMap[t] || imgMap.BASE;
          const isSelected = t === this.selectedPieces[1];
          return `
            <div class="hud-piece-card ${isSelected ? 'selected' : ''}" data-type="${t}" data-player="1" style="width: 50px; height: 60px; display: flex; flex-direction: column; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 4px; border: 2px solid ${isSelected ? 'var(--team1-color)' : 'transparent'}; border-radius: 8px; transition: all 0.2s; pointer-events: auto;">
              <img src="${imgSrc}" style="width: 35px; height: 35px; object-fit: contain; margin-bottom: 2px; pointer-events: none;" />
              <span style="font-size: 0.55rem; color: var(--text-main); pointer-events: none; text-align: center; line-height: 1;">${label}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- P2 Selector (Right) -->
      <div style="position: absolute; top: 50%; right: 20px; transform: translateY(-50%); pointer-events: auto; display: flex; flex-direction: row; flex-wrap: wrap; width: 140px; justify-content: center; gap: 8px; max-height: 80vh; overflow-y: auto; padding: 10px;" class="glass-panel">
        <h4 style="color: var(--team2-color); margin: 0 0 10px 0; text-align: center; font-size: 0.8rem; width: 100%;">P2 STONES</h4>
        ${PIECE_TYPE_LIST.map(t => {
          const specs = PIECE_SPECS[t];
          const label = specs?.label || t;
          const imgSrc = imgMap[t] || imgMap.BASE;
          const isSelected = t === this.selectedPieces[2];
          return `
            <div class="hud-piece-card ${isSelected ? 'selected' : ''}" data-type="${t}" data-player="2" style="width: 50px; height: 60px; display: flex; flex-direction: column; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 4px; border: 2px solid ${isSelected ? 'var(--team2-color)' : 'transparent'}; border-radius: 8px; transition: all 0.2s; pointer-events: auto;">
              <img src="${imgSrc}" style="width: 35px; height: 35px; object-fit: contain; margin-bottom: 2px; pointer-events: none;" />
              <span style="font-size: 0.55rem; color: var(--text-main); pointer-events: none; text-align: center; line-height: 1;">${label}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 40px; display: flex; flex-direction: column; align-items: center; pointer-events: none;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
          <div class="glass-panel" style="padding: 12px 24px; font-weight: bold; color: var(--text-main); border: 1px solid rgba(255,255,255,0.05); background: rgba(20, 24, 30, 0.4); border-radius: 12px; display: flex; gap: 20px;">
            <span style="color: var(--accent-violet);" id="turn-indicator">REAL-TIME</span>
          <span style="color: rgba(255,255,255,0.3);">|</span>
          <span style="color: var(--team1-color);">P1 Score: <span id="p1-score">${p1Score}</span></span>
          <span style="color: rgba(255,255,255,0.3);">|</span>
          <span style="color: var(--team2-color);">P2 Score: <span id="p2-score">${p2Score}</span></span>
          </div>
          <button id="btn-pause" class="glass-panel" style="padding: 12px 24px; background: rgba(51, 102, 255, 0.15); border: 1px solid rgba(51, 102, 255, 0.3); color: var(--text-main); pointer-events: auto; border-radius: 12px; transition: all 0.3s ease;">
            BINDÚ (Pause)
          </button>
        </div>
      </div>
    `;
    this._bindPieceSelection();
    document.getElementById('btn-pause').addEventListener('click', () => {
      this.router.navigate(SCREENS.BINDU_PAUSE);
    });
  }

  updateScores(scores) {
    const p1 = document.getElementById('p1-score');
    const p2 = document.getElementById('p2-score');
    if (p1) p1.textContent = scores[1] || 0;
    if (p2) p2.textContent = scores[2] || 0;
  }

  updateTurn(playerId) {
    // No-op for real-time
  }

  _bindPieceSelection() {
    document.querySelectorAll('.hud-piece-card').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        // Prevent default to avoid synthetic mouse events firing if using touch
        e.preventDefault();
        
        const target = e.currentTarget;
        const player = target.getAttribute('data-player');
        
        document.querySelectorAll(`.hud-piece-card[data-player="${player}"]`).forEach(b => {
          b.classList.remove('selected');
          b.style.borderColor = 'transparent';
          b.style.background = 'rgba(255, 255, 255, 0.05)';
        });
        target.classList.add('selected');
        target.style.background = 'rgba(255, 255, 255, 0.2)';
        this.selectedPieces[player] = target.getAttribute('data-type');
        
        const color = player === '1' ? 'var(--team1-color)' : 'var(--team2-color)';
        target.style.borderColor = color;
        
        eventBus.emit('HUD_PIECE_SELECTED', { 
          type: this.selectedPieces[player], 
          player: parseInt(player, 10),
          pointerId: e.pointerId 
        });
      });
    });
  }

  _bindEvents() {
    this._unsubs.push(
      eventBus.on(EVENTS.SCORE_CHANGED, (data) => this.updateScores(data.total))
    );
  }

  destroy() {
    this._unsubs.forEach(fn => fn());
    this._unsubs = [];
    this.container.innerHTML = '';
  }
}
