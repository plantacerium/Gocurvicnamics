export class GridUtils {
  static snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
  }

  static worldToGrid(worldX, worldY, originX, originY, cellSize) {
    return {
      col: Math.floor((worldX - originX) / cellSize),
      row: Math.floor((worldY - originY) / cellSize),
    };
  }

  static gridToWorld(col, row, originX, originY, cellSize) {
    return {
      x: originX + col * cellSize + cellSize / 2,
      y: originY + row * cellSize + cellSize / 2,
    };
  }

  static isInBounds(px, py, width, height, margin = 0) {
    return px >= margin && px <= width - margin &&
           py >= margin && py <= height - margin;
  }
}
