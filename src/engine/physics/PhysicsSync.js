import { isTauriAvailable, FORCE_ENGINE } from '../../utils/IPCDetector.js';
import { PhysicsTauri } from './PhysicsTauri.js';
import { PhysicsMatter } from './PhysicsMatter.js';
import { Logger } from '../../utils/Logger.js';

const log = Logger('PhysicsSync');

export class PhysicsSync {
  static async create(board) {
    let engine;

    if (FORCE_ENGINE === 'matter') {
      engine = new PhysicsMatter(board);
      log.info('Forced Matter.js engine');
    } else if (FORCE_ENGINE === 'tauri') {
      engine = new PhysicsTauri(board);
      log.info('Forced Tauri engine');
    } else {
      const tauriOk = await isTauriAvailable();
      if (tauriOk) {
        engine = new PhysicsTauri(board);
        log.info('Auto-detected Tauri, using Rapier2D');
      } else {
        engine = new PhysicsMatter(board);
        log.info('Tauri unavailable, using Matter.js fallback');
      }
    }

    await engine.initialize();
    await engine.syncFromBoard();
    return engine;
  }
}
