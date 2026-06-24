import { isTauriAvailable } from '../utils/IPCDetector.js';
import { OllamaClient } from './OllamaClient.js';
import { Logger } from '../utils/Logger.js';

const log = Logger('AIClient');

export class AIClient {
  constructor() {
    this._tauriAvailable = false;
  }

  async initialize() {
    this._tauriAvailable = await isTauriAvailable();
    log.info(`AI Client initialized, Tauri available: ${this._tauriAvailable}`);
  }

  async synthesize(p1Text, p2Text) {
    if (this._tauriAvailable) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke('synthesize_reflections', {
          p1Text: p1Text || '',
          p2Text: p2Text || '',
        });
        return result;
      } catch (e) {
        log.warn('Tauri synthesis failed, falling back to direct Ollama:', e);
      }
    }

    try {
      const client = new OllamaClient();
      return await client.synthesize(p1Text, p2Text);
    } catch (e) {
      log.warn('Direct Ollama call failed:', e);
      return 'El modelo local de IA no está disponible. Escribe tus reflexiones y la síntesis se generará cuando el servicio esté activo.';
    }
  }
}
