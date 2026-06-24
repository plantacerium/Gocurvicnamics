export const SCREENS = {
  CONFIG: 'CONFIG',
  GAME: 'GAME',
  BINDU_PAUSE: 'BINDU_PAUSE',
  INTEGRATION: 'INTEGRATION',
  REPLAYER: 'REPLAYER',
};

export const TURN_STATES = {
  SELECT_PIECE: 'SELECT_PIECE',
  DRAW_TRACE: 'DRAW_TRACE',
  ANIMATING_TRACE: 'ANIMATING_TRACE',
  PHYSICS_RESOLVE: 'PHYSICS_RESOLVE',
};

export const TRACE_STATES = {
  IDLE: 'IDLE',
  PLACING_CP1: 'PLACING_CP1',
  PLACING_CP2: 'PLACING_CP2',
  PLACING_END: 'PLACING_END',
  CONFIRM: 'CONFIRM',
};

export const GAME_EVENTS = {
  SCORE_CHANGED: 'score:changed',
  TURN_CHANGED: 'turn:changed',
  PIECE_DESTROYED: 'piece:destroyed',
  PIECE_DAMAGED: 'piece:damaged',
  COLLISION: 'collision:detected',
  SHOCKWAVE: 'shockwave:emitted',
  PHYSICS_STEP: 'physics:step',
  PHYSICS_SETTLED: 'physics:settled',
  TRACE_CONFIRMED: 'trace:confirmed',
  TRACE_CANCELLED: 'trace:cancelled',
  TRACE_SEGMENT_ADDED: 'trace:segment-added',
  GAME_STARTED: 'game:started',
  GAME_ENDED: 'game:ended',
  DB_SAVED: 'db:saved',
  AI_SYNTHESIS: 'ai:synthesis',
  REPLAY_STARTED: 'replay:started',
  REPLAY_ENDED: 'replay:ended',
};

export const EVENTS = GAME_EVENTS;

export const PLAYER_IDS = [1, 2];
