import { GameConfig } from '../core/GameConfig.js';
import { PIECE_TYPES, PIECE_TYPE_LIST } from '../config/PieceConfig.js';

export class ConfigScreen {
  constructor(router) {
    this.router = router;
    this.canvas = router.canvas;
    this.uiContainer = router.uiContainer;
    this.config = new GameConfig();
    this.setupManager = null;
  }

  async render() {
    this.uiContainer.innerHTML = '';
    this._buildUI();

    const { SetupManager } = await import('../engine/SetupManager.js');
    this.setupManager = new SetupManager(this.canvas);
    this.setupManager.board.config = this.config;

    this._bindSliders();
    this._bindPlayerToggle();
    this._bindPieceSelection();
    this._bindStart();
    
    this.setupManager.onBoardChanged = () => this._updateCounters();
    this._updateCounters();
  }

  _buildUI() {
    this.uiContainer.innerHTML = `
      <button id="btn-toggle-config" class="primary" style="position: absolute; top: 20px; left: 20px; z-index: 100;">⚙️ Board Setup</button>
      
      <div id="config-modal" class="glass-panel" style="position: absolute; top: 70px; left: 20px; width: 300px; display: none; flex-direction: column; gap: 15px; pointer-events: auto; z-index: 90;">
        <h2 style="color: var(--accent-violet); font-size: 1.5rem; display: flex; justify-content: space-between;">Board Setup <span id="btn-close-config" style="cursor:pointer;">✖</span></h2>
        <div><label style="color: var(--text-muted); font-size: 0.9rem;">Grid Layout (NxN): <span id="val-layout">2</span></label>
          <input type="range" id="cfg-layout" min="1" max="10" value="2" style="width: 100%;"></div>
        <div><label style="color: var(--text-muted); font-size: 0.9rem;">Grid Size (cells): <span id="val-size">5</span></label>
          <input type="range" id="cfg-size" min="3" max="20" value="5" style="width: 100%;"></div>
        <div><label style="color: var(--text-muted); font-size: 0.9rem;">Cell Size: <span id="val-cell">60</span>px</label>
          <input type="range" id="cfg-cell" min="20" max="200" value="60" step="5" style="width: 100%;"></div>
        <div><label style="color: var(--text-muted); font-size: 0.9rem;">Empty Space: <span id="val-space">15</span></label>
          <input type="range" id="cfg-space" min="5" max="50" value="15" style="width: 100%;"></div>
        <div style="margin-top: 10px;">
          <label style="color: var(--text-muted); font-size: 0.9rem;">Current Player: <span id="val-player" style="color: var(--team1-color); font-weight: bold;">Player 1</span></label>
          <button id="btn-toggle-player" style="width: 100%; margin-top: 5px;">Switch Player</button>
        </div>
      </div>

      <button class="primary" id="btn-start" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 100; font-size: 1.2rem; padding: 10px 30px;">Start Game</button>

      <!-- P1 Selector (Left) -->
      <div style="position: absolute; top: 50%; left: 20px; transform: translateY(-50%); pointer-events: auto; display: flex; flex-direction: row; flex-wrap: wrap; width: 140px; justify-content: center; gap: 8px; max-height: 80vh; overflow-y: auto; padding: 10px;" class="glass-panel">
        <h4 style="color: var(--team1-color); margin: 0 0 10px 0; text-align: center; font-size: 0.8rem; width: 100%;">P1 STONES <span id="p1-total-count">(0)</span></h4>
        ${PIECE_TYPE_LIST.map(t => {
          const specs = this.config.pieces.specs[t];
          const label = specs?.label || t;
          const hp = specs?.hp || 1;
          const mass = specs?.mass || 1.0;
          
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
          const imgSrc = imgMap[t] || imgMap.BASE;
          
          return `
            <div class="piece-card ${t === 'BASE' ? 'selected' : ''}" data-type="${t}" data-player="1" style="width: 50px; height: 60px; display: flex; flex-direction: column; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 4px; border: 2px solid transparent; border-radius: 8px; transition: all 0.2s;">
              <div id="badge-p1-${t}" style="position: absolute; top: -5px; right: -5px; background: var(--team1-color); color: white; border-radius: 50%; width: 16px; height: 16px; font-size: 0.55rem; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; pointer-events: none; border: 1px solid rgba(255,255,255,0.2);">0</div>
              <img src="${imgSrc}" style="width: 35px; height: 35px; object-fit: contain; margin-bottom: 2px; pointer-events: none;" />
              <span style="font-size: 0.55rem; color: var(--text-main); pointer-events: none; text-align: center; line-height: 1;">${label}</span>
              <div class="tooltip">
                <strong>${label}</strong><br/>HP: ${hp} | Mass: ${mass}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- P2 Selector (Right) -->
      <div style="position: absolute; top: 50%; right: 20px; transform: translateY(-50%); pointer-events: auto; display: flex; flex-direction: row; flex-wrap: wrap; width: 140px; justify-content: center; gap: 8px; max-height: 80vh; overflow-y: auto; padding: 10px;" class="glass-panel">
        <h4 style="color: var(--team2-color); margin: 0 0 10px 0; text-align: center; font-size: 0.8rem; width: 100%;">P2 STONES <span id="p2-total-count">(0)</span></h4>
        ${PIECE_TYPE_LIST.map(t => {
          const specs = this.config.pieces.specs[t];
          const label = specs?.label || t;
          const hp = specs?.hp || 1;
          const mass = specs?.mass || 1.0;
          
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
          const imgSrc = imgMap[t] || imgMap.BASE;
          
          return `
            <div class="piece-card ${t === 'BASE' ? 'selected' : ''}" data-type="${t}" data-player="2" style="width: 50px; height: 60px; display: flex; flex-direction: column; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); padding: 4px; border: 2px solid transparent; border-radius: 8px; transition: all 0.2s;">
              <div id="badge-p2-${t}" style="position: absolute; top: -5px; right: -5px; background: var(--team2-color); color: white; border-radius: 50%; width: 16px; height: 16px; font-size: 0.55rem; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; pointer-events: none; border: 1px solid rgba(255,255,255,0.2);">0</div>
              <img src="${imgSrc}" style="width: 35px; height: 35px; object-fit: contain; margin-bottom: 2px; pointer-events: none;" />
              <span style="font-size: 0.55rem; color: var(--text-main); pointer-events: none; text-align: center; line-height: 1;">${label}</span>
              <div class="tooltip">
                <strong>${label}</strong><br/>HP: ${hp} | Mass: ${mass}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  _bindSliders() {
    const refs = {
      layout: document.getElementById('cfg-layout'),
      size: document.getElementById('cfg-size'),
      cell: document.getElementById('cfg-cell'),
      space: document.getElementById('cfg-space'),
      valLayout: document.getElementById('val-layout'),
      valSize: document.getElementById('val-size'),
      valCell: document.getElementById('val-cell'),
      valSpace: document.getElementById('val-space'),
    };

    const updateConfig = () => {
      refs.valLayout.textContent = refs.layout.value;
      refs.valSize.textContent = refs.size.value;
      refs.valCell.textContent = refs.cell.value;
      refs.valSpace.textContent = refs.space.value;

      this.setupManager.updateConfig(
        parseInt(refs.layout.value),
        parseInt(refs.size.value),
        parseInt(refs.cell.value),
        parseInt(refs.space.value)
      );
    };

    [refs.layout, refs.size, refs.cell, refs.space].forEach(el => {
      el.addEventListener('input', updateConfig);
    });
    updateConfig();
    
    // Toggle Modal Logic
    const modal = document.getElementById('config-modal');
    document.getElementById('btn-toggle-config').addEventListener('click', () => {
      modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
    });
    document.getElementById('btn-close-config').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  _bindPlayerToggle() {
    document.getElementById('btn-toggle-player').addEventListener('click', () => {
      this.setupManager.currentPlayer = this.setupManager.currentPlayer === 1 ? 2 : 1;
      const el = document.getElementById('val-player');
      el.textContent = `Player ${this.setupManager.currentPlayer}`;
      el.style.color = this.setupManager.currentPlayer === 1 ? 'var(--team1-color)' : 'var(--team2-color)';
      this._updatePieceBorders();
    });
  }

  _updatePieceBorders() {
    const activePlayer = this.setupManager.currentPlayer;
    document.querySelectorAll('.piece-card').forEach(card => {
      const cardPlayer = parseInt(card.getAttribute('data-player'), 10);
      if (cardPlayer === activePlayer) {
         card.style.opacity = '1';
         card.style.pointerEvents = 'auto';
         const color = activePlayer === 1 ? 'var(--team1-color)' : 'var(--team2-color)';
         card.style.borderColor = card.classList.contains('selected') ? color : 'transparent';
      } else {
         card.style.opacity = '0.4';
         card.style.pointerEvents = 'none';
         card.classList.remove('selected');
         card.style.borderColor = 'transparent';
      }
    });
  }

  _bindPieceSelection() {
    document.querySelectorAll('.piece-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const player = target.getAttribute('data-player');
        
        document.querySelectorAll(`.piece-card[data-player="${player}"]`).forEach(b => {
          b.classList.remove('selected');
          b.style.borderColor = 'transparent';
          b.style.background = 'rgba(255, 255, 255, 0.05)';
        });
        target.classList.add('selected');
        target.style.background = 'rgba(255, 255, 255, 0.2)';
        this.setupManager.selectedPieceType = target.getAttribute('data-type');
        this._updatePieceBorders();
      });
    });
    // Initial border update
    this._updatePieceBorders();
  }

  _bindStart() {
    document.getElementById('btn-start').addEventListener('click', () => {
      if (this.setupManager.board.getAllPieces().length === 0) {
        this.setupManager.populateDefaultPieces();
      }
      this.setupManager.destroy();
      this.router.navigate('GAME', {
        board: this.setupManager.board,
        config: this.config,
      });
    });
  }

  _updateCounters() {
    let p1Total = 0;
    let p2Total = 0;
    const p1Counts = {};
    const p2Counts = {};
    
    for (const type of PIECE_TYPE_LIST) {
       p1Counts[type] = 0;
       p2Counts[type] = 0;
    }
    
    for (const piece of this.setupManager.board.getAllPieces()) {
       if (piece.playerId === 1) {
          p1Total++;
          p1Counts[piece.type]++;
       } else {
          p2Total++;
          p2Counts[piece.type]++;
       }
    }
    
    const p1Title = document.getElementById('p1-total-count');
    if (p1Title) p1Title.textContent = `(${p1Total})`;
    
    const p2Title = document.getElementById('p2-total-count');
    if (p2Title) p2Title.textContent = `(${p2Total})`;
    
    for (const type of PIECE_TYPE_LIST) {
       const badge1 = document.getElementById(`badge-p1-${type}`);
       if (badge1) {
          badge1.textContent = p1Counts[type];
          badge1.style.opacity = p1Counts[type] > 0 ? '1' : '0';
       }
       const badge2 = document.getElementById(`badge-p2-${type}`);
       if (badge2) {
          badge2.textContent = p2Counts[type];
          badge2.style.opacity = p2Counts[type] > 0 ? '1' : '0';
       }
    }
  }

  destroy() {
    if (this.setupManager) {
      this.setupManager.destroy();
      this.setupManager = null;
    }
  }
}
