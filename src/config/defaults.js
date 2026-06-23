export const DEFAULT_CONFIG = {
  board: {
    width: 1400,
    height: 800,
    anchorZones: [
      // Player 1 Zones (Left side)
      { id: 'p1_z1', player: 1, x: 100, y: 100, cols: 5, rows: 5, cellSize: 60 },
      { id: 'p1_z2', player: 1, x: 100, y: 500, cols: 5, rows: 5, cellSize: 60 },
      // Player 2 Zones (Right side)
      { id: 'p2_z1', player: 2, x: 1000, y: 100, cols: 5, rows: 5, cellSize: 60 },
      { id: 'p2_z2', player: 2, x: 1000, y: 500, cols: 5, rows: 5, cellSize: 60 }
    ],
    // The rest is considered VOID EXPANSE (transit space)
  },
  pieces: {
    startCountPerZone: 3, // Initial pieces per anchor zone
    baseRadius: 20
  },
  physics: {
    gravity: { x: 0, y: 0 }, // Top-down view, no gravity
    frictionAir: 0.05, // Kinetic decay in the void
    restitution: 0.8 // Bounciness
  }
};
