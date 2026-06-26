export const BOARD_DEFAULTS = {
  width: 1400,
  height: 800,
  defaultLayout: 2,
  defaultGridSize: 5,
  defaultCellSize: 60,
  defaultEmptySpace: 15,
  minLayout: 1,
  maxLayout: 4,
  minGridSize: 3,
  maxGridSize: 10,
  minCellSize: 50,
  maxCellSize: 100,
  cellSizeStep: 5,
  minEmptySpace: 5,
  maxEmptySpace: 30,
  spaceUnitPx: 20,
  wallThickness: 50,
};

export const getBoardDimensions = (layout, size, cell, space) => {
  const padding = space * BOARD_DEFAULTS.spaceUnitPx;
  const gridW = size * cell;
  const gridH = size * cell;
  const totalW = layout * gridW + (layout + 1) * padding;
  const totalH = layout * gridH + (layout + 1) * padding;
  return { width: totalW, height: totalH, gridW, gridH, padding };
};
