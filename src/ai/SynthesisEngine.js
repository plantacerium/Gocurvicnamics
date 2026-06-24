import { AIClient } from './AIClient.js';
import { Logger } from '../utils/Logger.js';

const log = Logger('SynthesisEngine');

export class SynthesisEngine {
  constructor() {
    this.client = new AIClient();
    this._ready = false;
  }

  async initialize() {
    await this.client.initialize();
    this._ready = true;
  }

  async generate(p1Text, p2Text) {
    if (!this._ready) {
      await this.initialize();
    }
    log.info('Generating synthesis...');
    const result = await this.client.synthesize(p1Text, p2Text);
    return result;
  }
}
