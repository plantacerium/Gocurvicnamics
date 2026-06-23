// Screen Router / Entry Point
import { TurnManager } from './engine/TurnManager.js';
import { ReplayerDB } from './db/ReplayerDB.js';

class GameApp {
  constructor() {
    this.appContainer = document.getElementById('app');
    this.currentState = 'CONFIG';
    
    // Create base canvas once
    this.canvas = document.createElement('canvas');
    this.appContainer.appendChild(this.canvas);
    
    // Create UI container layer
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'ui-layer';
    this.appContainer.appendChild(this.uiContainer);
    
    this.turnManager = null;
    this.db = new ReplayerDB();
    
    this.init();
  }

  init() {
    console.log('[GameApp] Initializing Gocurvicnamics...');
    this.renderCurrentState();
  }

  renderCurrentState() {
    this.uiContainer.innerHTML = '';
    
    if (this.currentState === 'CONFIG') {
      if (this.turnManager) {
         const ctx = this.canvas.getContext('2d');
         ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
         this.turnManager = null;
      }
      
      const configScreen = document.createElement('div');
      configScreen.className = 'fade-in';
      configScreen.style.width = '100%';
      configScreen.style.height = '100%';
      configScreen.style.pointerEvents = 'none';
      configScreen.style.display = 'flex';
      configScreen.style.flexDirection = 'column';
      configScreen.style.justifyContent = 'space-between';
      
      configScreen.innerHTML = `
        <div style="display: flex; justify-content: space-between; padding: 20px; pointer-events: none; flex: 1;">
          <!-- Side Panel -->
          <div class="glass-panel" style="width: 300px; display: flex; flex-direction: column; gap: 15px; pointer-events: auto;">
            <h2 style="color: var(--accent-cyan); font-size: 1.5rem;">Board Setup</h2>
            
            <div>
              <label style="color: var(--text-muted); font-size: 0.9rem;">Grid Layout (NxN): <span id="val-layout">2</span></label>
              <input type="range" id="cfg-layout" min="1" max="4" value="2" style="width: 100%;">
            </div>
            
            <div>
              <label style="color: var(--text-muted); font-size: 0.9rem;">Grid Size (cells): <span id="val-size">5</span></label>
              <input type="range" id="cfg-size" min="3" max="10" value="5" style="width: 100%;">
            </div>
            
            <div>
              <label style="color: var(--text-muted); font-size: 0.9rem;">Cell Size: <span id="val-cell">60</span>px</label>
              <input type="range" id="cfg-cell" min="40" max="100" value="60" step="5" style="width: 100%;">
            </div>
            
            <div>
              <label style="color: var(--text-muted); font-size: 0.9rem;">Empty Space (squares): <span id="val-space">15</span></label>
              <input type="range" id="cfg-space" min="5" max="30" value="15" style="width: 100%;">
            </div>

            <div style="margin-top: 10px;">
              <label style="color: var(--text-muted); font-size: 0.9rem;">Current Player: <span id="val-player" style="color: var(--accent-cyan); font-weight: bold;">Player 1</span></label>
              <button id="btn-toggle-player" style="width: 100%; margin-top: 5px;">Switch Player</button>
            </div>

            <button class="primary" id="btn-start" style="margin-top: auto;">Start Game</button>
          </div>
        </div>
        
        <!-- Bottom Panel -->
        <div class="glass-panel" style="margin: 20px; pointer-events: auto; display: flex; justify-content: center; gap: 20px;">
          <button class="piece-btn selected" data-type="BASE" style="border-color: #e2e8f0; color: #e2e8f0;">Base</button>
          <button class="piece-btn" data-type="DAMPENER" style="border-color: #94a3b8; color: #94a3b8;">Dampener</button>
          <button class="piece-btn" data-type="AMPLIFIER" style="border-color: #f43f5e; color: #f43f5e;">Amplifier</button>
          <button class="piece-btn" data-type="SLINGSHOT" style="border-color: #8b5cf6; color: #8b5cf6;">Slingshot</button>
        </div>
      `;
      
      this.uiContainer.appendChild(configScreen);

      // We need a setup manager for drawing the board and placing pieces.
      // Importing lazily to avoid circular dependencies if any, but since we use ES modules, we can just do it.
      import('./engine/SetupManager.js').then(({ SetupManager }) => {
        this.setupManager = new SetupManager(this.canvas);
        
        const updateConfig = () => {
          const layout = parseInt(document.getElementById('cfg-layout').value);
          const size = parseInt(document.getElementById('cfg-size').value);
          const cell = parseInt(document.getElementById('cfg-cell').value);
          const space = parseInt(document.getElementById('cfg-space').value);
          
          document.getElementById('val-layout').textContent = layout;
          document.getElementById('val-size').textContent = size;
          document.getElementById('val-cell').textContent = cell;
          document.getElementById('val-space').textContent = space;

          this.setupManager.updateConfig(layout, size, cell, space);
        };

        ['cfg-layout', 'cfg-size', 'cfg-cell', 'cfg-space'].forEach(id => {
          document.getElementById(id).addEventListener('input', updateConfig);
        });
        
        updateConfig(); // Initial call to sync board dimensions

        // Player toggle
        document.getElementById('btn-toggle-player').addEventListener('click', () => {
          this.setupManager.currentPlayer = this.setupManager.currentPlayer === 1 ? 2 : 1;
          const playerLabel = document.getElementById('val-player');
          playerLabel.textContent = `Player ${this.setupManager.currentPlayer}`;
          playerLabel.style.color = this.setupManager.currentPlayer === 1 ? 'var(--accent-cyan)' : 'var(--accent-red)';
        });

        // Piece selection
        document.querySelectorAll('.piece-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.piece-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            this.setupManager.selectedPieceType = e.target.getAttribute('data-type');
            
            // simple visual feedback for selection
            document.querySelectorAll('.piece-btn').forEach(b => b.style.background = 'rgba(255, 255, 255, 0.05)');
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          });
        });

        document.getElementById('btn-start').addEventListener('click', () => {
          this.currentState = 'GAME';
          this.setupManager.destroy(); // Stop setup loop
          this.turnManager = new TurnManager(this.canvas, this.setupManager.board);
          this.setupManager = null;
          this.renderCurrentState();
        });
      });
    } else if (this.currentState === 'GAME') {
      const gameUI = document.createElement('div');
      gameUI.className = 'fade-in';
      gameUI.style.width = '100%';
      gameUI.style.height = '100%';
      gameUI.style.pointerEvents = 'none';
      
      gameUI.innerHTML = `
        <div style="padding: 30px 40px; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none;">
          <div class="glass-panel" style="padding: 12px 24px; font-weight: bold; color: var(--text-main); border: 1px solid rgba(255,255,255,0.05); background: rgba(20, 24, 30, 0.4); border-radius: 12px; display: flex; gap: 20px;">
            <span style="color: var(--accent-cyan);" id="turn-indicator">P1 Turn</span>
            <span style="color: rgba(255,255,255,0.3);">|</span>
            <span style="color: var(--accent-cyan);">P1 Score: <span id="p1-score">0</span></span>
            <span style="color: rgba(255,255,255,0.3);">|</span>
            <span style="color: var(--accent-red);">P2 Score: <span id="p2-score">0</span></span>
          </div>
          <button id="btn-pause" class="glass-panel" style="padding: 12px 24px; background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: var(--text-main); pointer-events: auto; border-radius: 12px; transition: all 0.3s ease;">
            BINDÚ (Pause)
          </button>
        </div>
      `;
      
      this.uiContainer.appendChild(gameUI);
      
      document.getElementById('btn-pause').addEventListener('click', () => {
        this.currentState = 'BINDU_PAUSE';
        this.renderCurrentState();
      });
    } else if (this.currentState === 'BINDU_PAUSE') {
      const pauseUI = document.createElement('div');
      pauseUI.className = 'glass-panel fade-in';
      pauseUI.style.display = 'flex';
      pauseUI.style.flexDirection = 'column';
      pauseUI.style.justifyContent = 'center';
      pauseUI.style.alignItems = 'center';
      pauseUI.style.width = '100%';
      pauseUI.style.height = '100%';
      pauseUI.style.borderRadius = '0';
      pauseUI.style.border = 'none';
      pauseUI.style.background = 'rgba(0,0,0,0.8)';
      pauseUI.style.pointerEvents = 'auto';
      
      pauseUI.innerHTML = `
        <h2 style="font-size: 2rem; margin-bottom: 2rem; color: var(--accent-red);">Bindú State (Paused)</h2>
        <div style="display: flex; gap: 1rem;">
          <button id="btn-resume">Resume Flow</button>
          <button class="primary" id="btn-end">Enter Integration Room</button>
        </div>
      `;
      
      this.uiContainer.appendChild(pauseUI);
      
      document.getElementById('btn-resume').addEventListener('click', () => {
        this.currentState = 'GAME';
        this.renderCurrentState();
      });
      document.getElementById('btn-end').addEventListener('click', () => {
        this.currentState = 'INTEGRATION';
        this.renderCurrentState();
      });
    } else if (this.currentState === 'INTEGRATION') {
      const integrationUI = document.createElement('div');
      integrationUI.className = 'glass-panel fade-in';
      integrationUI.style.display = 'flex';
      integrationUI.style.flexDirection = 'column';
      integrationUI.style.justifyContent = 'center';
      integrationUI.style.alignItems = 'center';
      integrationUI.style.width = '100%';
      integrationUI.style.height = '100%';
      integrationUI.style.borderRadius = '0';
      integrationUI.style.border = 'none';
      integrationUI.style.pointerEvents = 'auto';
      
      integrationUI.innerHTML = `
        <h2 style="font-size: 2rem; margin-bottom: 20px; color: var(--accent-cyan);">Integration Room</h2>
        <div style="display: flex; width: 80%; height: 40%; gap: 20px; margin-bottom: 20px;">
          <div class="glass-panel" style="flex: 1; display: flex; flex-direction: column;">
            <h3 style="margin-bottom: 10px; color: var(--accent-cyan);">P1 Reflection</h3>
            <textarea id="p1-text" style="flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-main); padding: 10px; border-radius: 8px; resize: none; font-family: var(--font-body);"></textarea>
          </div>
          <div class="glass-panel" style="flex: 1; display: flex; flex-direction: column;">
            <h3 style="margin-bottom: 10px; color: var(--accent-red);">P2 Reflection</h3>
            <textarea id="p2-text" style="flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-main); padding: 10px; border-radius: 8px; resize: none; font-family: var(--font-body);"></textarea>
          </div>
        </div>
        
        <div class="glass-panel" style="width: 80%; padding: 20px; margin-bottom: 20px; min-height: 100px; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="color: var(--accent-violet);">Ollama / Gemma Synthesis</h3>
            <button id="btn-synthesize" style="padding: 5px 15px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.5); color: var(--text-main); border-radius: 6px; cursor: pointer; transition: all 0.2s;">Synthesize</button>
          </div>
          <p id="synthesis-result" style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">Awaiting inputs...</p>
        </div>

        <button id="btn-home" class="primary">Return to Source</button>
      `;
      
      this.uiContainer.appendChild(integrationUI);

      document.getElementById('btn-synthesize').addEventListener('click', async () => {
        const p1 = document.getElementById('p1-text').value;
        const p2 = document.getElementById('p2-text').value;
        const resultNode = document.getElementById('synthesis-result');
        resultNode.textContent = "Analizando ecos de consciencia...";
        resultNode.style.color = "var(--text-muted)";
        
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const response = await invoke('synthesize_reflections', { p1Text: p1, p2Text: p2 });
          resultNode.textContent = response;
          resultNode.style.color = "var(--text-main)";
        } catch (e) {
          resultNode.textContent = "Error: " + (e.toString() || "El modelo local de IA no está disponible.");
          resultNode.style.color = "var(--accent-red)";
        }
      });
      
      document.getElementById('btn-home').addEventListener('click', () => {
        this.currentState = 'CONFIG';
        this.renderCurrentState();
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new GameApp();
});
