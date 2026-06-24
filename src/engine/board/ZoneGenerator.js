import { Zone } from './Zone.js';
import { BOARD_DEFAULTS, getBoardDimensions } from '../../config/BoardConfig.js';

export class ZoneGenerator {
  static generate(layout, size, cell, space) {
    const { width, height, gridW, gridH, padding } = getBoardDimensions(layout, size, cell, space);
    const zones = [];
    const isOdd = layout % 2 !== 0;
    const centerCol = Math.floor(layout / 2);

    for (let r = 0; r < layout; r++) {
      for (let c = 0; c < layout; c++) {
        let player = 0;
        if (c < centerCol) {
          player = 1;
        } else if (c > centerCol || (!isOdd && c === centerCol)) {
          player = 2;
        }
        zones.push(new Zone(
          `z_r${r}_c${c}`,
          player,
          padding + c * (gridW + padding),
          padding + r * (gridH + padding),
          size,
          size,
          cell
        ));
      }
    }

    return { zones, boardWidth: width, boardHeight: height, isOdd, centerCol };
  }

  static getPlayerZones(zones, playerId) {
    return zones.filter(z => z.player === playerId);
  }

  static getNeutralZones(zones) {
    return zones.filter(z => z.player === 0);
  }
}
