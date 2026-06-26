export const PIECE_TYPES = {
  BASE: 'BASE',
  DAMPENER: 'DAMPENER',
  AMPLIFIER: 'AMPLIFIER',
  SLINGSHOT: 'SLINGSHOT',
  GRAVITON: 'GRAVITON',
  PHANTOM: 'PHANTOM',
  BRAWLER: 'BRAWLER',
  GLASS_CANNON: 'GLASS_CANNON',
  JUGGERNAUT: 'JUGGERNAUT',
  PEBBLE: 'PEBBLE',
  GHOST: 'GHOST',
  MIRAGE: 'MIRAGE',
  SPECTER: 'SPECTER',
  BLINK: 'BLINK',
  SHADOW: 'SHADOW',
  WISP: 'WISP',
};

export const PIECE_TYPE_LIST = Object.values(PIECE_TYPES);

export const PIECE_SPECS = {
  [PIECE_TYPES.BASE]: { mass: 1.0, hp: 3, maxHp: 3, radiusMultiplier: 1.0, color: '#e2e8f0', label: 'Base' },
  [PIECE_TYPES.DAMPENER]: { mass: 1.5, hp: 8, maxHp: 8, radiusMultiplier: 1.2, color: '#94a3b8', label: 'Dampener' },
  [PIECE_TYPES.AMPLIFIER]: { mass: 0.5, hp: 1, maxHp: 1, radiusMultiplier: 0.8, color: '#f43f5e', label: 'Amplifier' },
  [PIECE_TYPES.SLINGSHOT]: { mass: 0.8, hp: 2, maxHp: 2, radiusMultiplier: 0.9, color: '#8b5cf6', label: 'Slingshot' },
  [PIECE_TYPES.GRAVITON]: { mass: 2.5, hp: 5, maxHp: 5, radiusMultiplier: 1.2, color: '#f59e0b', label: 'Graviton' },
  [PIECE_TYPES.PHANTOM]: { mass: 0.6, hp: 2, maxHp: 2, radiusMultiplier: 0.8, color: '#a78bfa', label: 'Phantom' },
  [PIECE_TYPES.BRAWLER]: { mass: 1.2, hp: 4, maxHp: 4, radiusMultiplier: 1.1, color: '#ef4444', label: 'Brawler' },
  [PIECE_TYPES.GLASS_CANNON]: { mass: 1.5, hp: 1, maxHp: 1, radiusMultiplier: 1.1, color: '#38bdf8', label: 'Glass Cannon' },
  [PIECE_TYPES.JUGGERNAUT]: { mass: 2.0, hp: 6, maxHp: 6, radiusMultiplier: 1.3, color: '#fb923c', label: 'Juggernaut' },
  [PIECE_TYPES.PEBBLE]: { mass: 0.2, hp: 1, maxHp: 1, radiusMultiplier: 0.5, color: '#d1d5db', label: 'Pebble' },
  [PIECE_TYPES.GHOST]: { mass: 1.0, hp: 2, maxHp: 2, radiusMultiplier: 1.0, color: '#c084fc', label: 'Ghost' },
  [PIECE_TYPES.MIRAGE]: { mass: 0.5, hp: 1, maxHp: 1, radiusMultiplier: 0.9, color: '#2dd4bf', label: 'Mirage' },
  [PIECE_TYPES.SPECTER]: { mass: 0.8, hp: 2, maxHp: 2, radiusMultiplier: 0.9, color: '#9ca3af', label: 'Specter' },
  [PIECE_TYPES.BLINK]: { mass: 1.0, hp: 2, maxHp: 2, radiusMultiplier: 1.0, color: '#fbbf24', label: 'Blink' },
  [PIECE_TYPES.SHADOW]: { mass: 0.9, hp: 3, maxHp: 3, radiusMultiplier: 0.9, color: '#4b5563', label: 'Shadow' },
  [PIECE_TYPES.WISP]: { mass: 0.4, hp: 2, maxHp: 2, radiusMultiplier: 0.7, color: '#60a5fa', label: 'Wisp' },
};

export const PIECE_COLORS = {
  [PIECE_TYPES.BASE]: '#e2e8f0',
  [PIECE_TYPES.DAMPENER]: '#94a3b8',
  [PIECE_TYPES.AMPLIFIER]: '#f43f5e',
  [PIECE_TYPES.SLINGSHOT]: '#8b5cf6',
  [PIECE_TYPES.GRAVITON]: '#f59e0b',
  [PIECE_TYPES.PHANTOM]: '#a78bfa',
  [PIECE_TYPES.BRAWLER]: '#ef4444',
  [PIECE_TYPES.GLASS_CANNON]: '#38bdf8',
  [PIECE_TYPES.JUGGERNAUT]: '#fb923c',
  [PIECE_TYPES.PEBBLE]: '#d1d5db',
  [PIECE_TYPES.GHOST]: '#c084fc',
  [PIECE_TYPES.MIRAGE]: '#2dd4bf',
  [PIECE_TYPES.SPECTER]: '#9ca3af',
  [PIECE_TYPES.BLINK]: '#fbbf24',
  [PIECE_TYPES.SHADOW]: '#4b5563',
  [PIECE_TYPES.WISP]: '#60a5fa',
};

export const PIECE_DEFAULTS = {
  baseRadius: 16,
  startCountPerZone: 3,
};
