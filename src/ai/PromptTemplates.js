export class PromptTemplates {
  static synthesis(p1Text, p2Text) {
    return `Analiza estas dos reflexiones post-partida de un juego de estrategia asimétrica abstracta llamado Gocurvicnamics. Haz una síntesis filosófica breve (1 párrafo, máximo 4 oraciones) sobre el choque de estas dos mentes durante el baile cinético.

Reflexión P1: ${p1Text || '(silencio)'}
Reflexión P2: ${p2Text || '(silencio)'}

Síntesis:`;
  }

  static analysis(gameStats) {
    return `Genera un breve análisis (2-3 oraciones) sobre esta partida de Gocurvicnamics:
- Turnos: ${gameStats.turns}
- P1 Score: ${gameStats.p1Score}
- P2 Score: ${gameStats.p2Score}
- Piezas destruidas: ${gameStats.destroyed}

Describe cómo fluyó la energía cinética entre los jugadores.`;
  }
}
