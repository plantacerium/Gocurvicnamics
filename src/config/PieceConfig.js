export const PIECE_TYPES = {
  BASE: 'BASE',
  DAMPENER: 'DAMPENER',
  AMPLIFIER: 'AMPLIFIER',
  SLINGSHOT: 'SLINGSHOT',
};

export const PIECE_TYPE_LIST = Object.values(PIECE_TYPES);

export const PIECE_SPECS = {
  [PIECE_TYPES.BASE]: { mass: 1.0, hp: 3, maxHp: 3, radiusMultiplier: 1.0, color: '#e2e8f0', label: 'Base' },
  [PIECE_TYPES.DAMPENER]: { mass: 1.5, hp: 8, maxHp: 8, radiusMultiplier: 1.2, color: '#94a3b8', label: 'Dampener' },
  [PIECE_TYPES.AMPLIFIER]: { mass: 0.5, hp: 1, maxHp: 1, radiusMultiplier: 0.8, color: '#f43f5e', label: 'Amplifier' },
  [PIECE_TYPES.SLINGSHOT]: { mass: 0.8, hp: 2, maxHp: 2, radiusMultiplier: 0.9, color: '#8b5cf6', label: 'Slingshot' },
};

export const PIECE_COLORS = {
  [PIECE_TYPES.BASE]: '#e2e8f0',
  [PIECE_TYPES.DAMPENER]: '#94a3b8',
  [PIECE_TYPES.AMPLIFIER]: '#f43f5e',
  [PIECE_TYPES.SLINGSHOT]: '#8b5cf6',
};

export const PIECE_DEFAULTS = {
  baseRadius: 20,
  startCountPerZone: 3,
};
