export class Zone {
  constructor(id, player, x, y, cols, rows, cellSize) {
    this.id = id;
    this.player = player;
    this.x = x;
    this.y = y;
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.width = cols * cellSize;
    this.height = rows * cellSize;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  snapToCell(px, py) {
    const col = Math.floor((px - this.x) / this.cellSize);
    const row = Math.floor((py - this.y) / this.cellSize);
    const clampedCol = Math.max(0, Math.min(col, this.cols - 1));
    const clampedRow = Math.max(0, Math.min(row, this.rows - 1));
    return {
      col: clampedCol,
      row: clampedRow,
      x: this.x + clampedCol * this.cellSize + this.cellSize / 2,
      y: this.y + clampedRow * this.cellSize + this.cellSize / 2,
    };
  }

  cellCenter(col, row) {
    return {
      x: this.x + col * this.cellSize + this.cellSize / 2,
      y: this.y + row * this.cellSize + this.cellSize / 2,
    };
  }

  toJSON() {
    return { id: this.id, player: this.player, x: this.x, y: this.y, cols: this.cols, rows: this.rows, cellSize: this.cellSize };
  }
}
