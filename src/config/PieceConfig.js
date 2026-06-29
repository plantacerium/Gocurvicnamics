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

// Per-piece physics signature for the particle collider system.
// restitution    : elasticity of bounce (1.0 = perfect, >1 = superelastic, <1 = lossy)
// speed          : velocity multiplier when launched or hit
// curvature      : angular deflection per tick (Magnus / curve-ball effect), 0 = straight
// curveDir       : 1=clockwise, -1=counter-clockwise, 0=random per collision (chaos pieces)
// massInteraction: how strongly this piece transfers momentum (0=absorbs, 1=normal, 2=amplifies)
// spinFactor     : lateral deflection kick on collision (makes bounces non-linear)
// blink          : true = teleport-on-hit special behaviour
export const PIECE_SPECS = {
  [PIECE_TYPES.BASE]: {
    mass: 1.0, hp: 3, maxHp: 3, radiusMultiplier: 1.0, color: '#e2e8f0', label: 'Base',
    restitution: 1.0, speed: 1.0, curvature: 0.0,  curveDir:  0, massInteraction: 1.0, spinFactor: 0.0,
  },
  [PIECE_TYPES.DAMPENER]: {
    mass: 1.5, hp: 8, maxHp: 8, radiusMultiplier: 1.2, color: '#94a3b8', label: 'Dampener',
    restitution: 0.4, speed: 0.6, curvature: 0.0,  curveDir:  0, massInteraction: 0.5, spinFactor: 0.0,
  },
  [PIECE_TYPES.AMPLIFIER]: {
    mass: 0.5, hp: 1, maxHp: 1, radiusMultiplier: 0.8, color: '#f43f5e', label: 'Amplifier',
    restitution: 1.5, speed: 1.8, curvature: 0.0,  curveDir:  0, massInteraction: 1.5, spinFactor: 0.0,
  },
  [PIECE_TYPES.SLINGSHOT]: {
    mass: 0.8, hp: 2, maxHp: 2, radiusMultiplier: 0.9, color: '#8b5cf6', label: 'Slingshot',
    restitution: 1.2, speed: 1.0, curvature: 0.0,  curveDir:  0, massInteraction: 1.8, spinFactor: 0.0,
  },
  [PIECE_TYPES.GRAVITON]: {
    mass: 2.5, hp: 5, maxHp: 5, radiusMultiplier: 1.2, color: '#f59e0b', label: 'Graviton',
    restitution: 0.8, speed: 0.5, curvature: 0.0,  curveDir:  0, massInteraction: 3.0, spinFactor: 0.0,
  },
  [PIECE_TYPES.PHANTOM]: {
    mass: 0.6, hp: 2, maxHp: 2, radiusMultiplier: 0.8, color: '#a78bfa', label: 'Phantom',
    restitution: 1.0, speed: 1.5, curvature: 0.04, curveDir:  0, massInteraction: 0.3, spinFactor: 0.5,
  },
  [PIECE_TYPES.BRAWLER]: {
    mass: 1.2, hp: 4, maxHp: 4, radiusMultiplier: 1.1, color: '#ef4444', label: 'Brawler',
    restitution: 0.9, speed: 1.2, curvature: 0.0,  curveDir:  0, massInteraction: 1.1, spinFactor: 0.6,
  },
  [PIECE_TYPES.GLASS_CANNON]: {
    mass: 1.5, hp: 1, maxHp: 1, radiusMultiplier: 1.1, color: '#38bdf8', label: 'Glass Cannon',
    restitution: 1.3, speed: 2.5, curvature: 0.0,  curveDir:  0, massInteraction: 2.0, spinFactor: 0.0,
  },
  [PIECE_TYPES.JUGGERNAUT]: {
    mass: 2.0, hp: 6, maxHp: 6, radiusMultiplier: 1.3, color: '#fb923c', label: 'Juggernaut',
    restitution: 0.6, speed: 0.4, curvature: 0.0,  curveDir:  0, massInteraction: 4.0, spinFactor: 0.0,
  },
  [PIECE_TYPES.PEBBLE]: {
    mass: 0.2, hp: 1, maxHp: 1, radiusMultiplier: 0.5, color: '#d1d5db', label: 'Pebble',
    restitution: 1.8, speed: 3.0, curvature: 0.0,  curveDir:  0, massInteraction: 0.2, spinFactor: 0.0,
  },
  [PIECE_TYPES.GHOST]: {
    mass: 1.0, hp: 2, maxHp: 2, radiusMultiplier: 1.0, color: '#c084fc', label: 'Ghost',
    restitution: 1.0, speed: 1.0, curvature: 0.0,  curveDir:  0, massInteraction: 0.05, spinFactor: 0.0,
  },
  [PIECE_TYPES.MIRAGE]: {
    mass: 0.5, hp: 1, maxHp: 1, radiusMultiplier: 0.9, color: '#2dd4bf', label: 'Mirage',
    restitution: 1.4, speed: 1.5, curvature: 0.06, curveDir:  0, massInteraction: 0.4, spinFactor: 1.0,
  },
  [PIECE_TYPES.SPECTER]: {
    mass: 0.8, hp: 2, maxHp: 2, radiusMultiplier: 0.9, color: '#9ca3af', label: 'Specter',
    restitution: 0.9, speed: 0.9, curvature: 0.02, curveDir:  1, massInteraction: 0.8, spinFactor: 0.2,
  },
  [PIECE_TYPES.BLINK]: {
    mass: 1.0, hp: 2, maxHp: 2, radiusMultiplier: 1.0, color: '#fbbf24', label: 'Blink',
    restitution: 1.1, speed: 2.0, curvature: 0.0,  curveDir:  0, massInteraction: 1.0, spinFactor: 0.0,
    blink: true,
  },
  [PIECE_TYPES.SHADOW]: {
    mass: 0.9, hp: 3, maxHp: 3, radiusMultiplier: 0.9, color: '#4b5563', label: 'Shadow',
    restitution: 0.7, speed: 0.8, curvature: 0.015, curveDir: -1, massInteraction: 1.2, spinFactor: 0.4,
  },
  [PIECE_TYPES.WISP]: {
    mass: 0.4, hp: 2, maxHp: 2, radiusMultiplier: 0.7, color: '#60a5fa', label: 'Wisp',
    restitution: 2.0, speed: 3.5, curvature: 0.10, curveDir:  0, massInteraction: 0.1, spinFactor: 0.8,
  },
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
