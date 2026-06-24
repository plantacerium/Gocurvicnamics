const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

let currentLevel = LEVELS.INFO;

export const setLogLevel = (level) => { currentLevel = level; };

const prefix = (level, module) => `[${level}]${module ? `[${module}]` : ''}`;

export const Logger = (module) => ({
  debug: (...args) => { if (currentLevel <= LEVELS.DEBUG) console.debug(prefix('DEBUG', module), ...args); },
  info: (...args) => { if (currentLevel <= LEVELS.INFO) console.info(prefix('INFO', module), ...args); },
  warn: (...args) => { if (currentLevel <= LEVELS.WARN) console.warn(prefix('WARN', module), ...args); },
  error: (...args) => { if (currentLevel <= LEVELS.ERROR) console.error(prefix('ERROR', module), ...args); },
});

export { LEVELS };
