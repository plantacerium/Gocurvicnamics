import { PromptTemplates } from './PromptTemplates.js';
import { Logger } from '../utils/Logger.js';

const log = Logger('OllamaClient');

export class OllamaClient {
  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.model = 'gemma:2b';
  }

  async synthesize(p1Text, p2Text) {
    const prompt = PromptTemplates.synthesis(p1Text, p2Text);
    const response = await this._generate(prompt);
    return response;
  }

  async _generate(prompt) {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.response || '';
  }
}
