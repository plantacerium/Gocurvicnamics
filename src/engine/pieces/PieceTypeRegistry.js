import { PIECE_SPECS, PIECE_TYPES } from '../../config/PieceConfig.js';

export class PieceTypeRegistry {
  static getSpecs(type) {
    const specs = PIECE_SPECS[type];
    if (!specs) throw new Error(`Unknown piece type: ${type}`);
    return specs;
  }

  static isValidType(type) {
    return type in PIECE_SPECS;
  }

  static getTypes() {
    return Object.keys(PIECE_SPECS);
  }

  static getColor(type) {
    return PIECE_SPECS[type]?.color || '#ffffff';
  }

  static getMass(type) {
    return PIECE_SPECS[type]?.mass || 1.0;
  }

  static getHP(type) {
    return PIECE_SPECS[type]?.hp || 1;
  }

  static getRadiusMultiplier(type) {
    return PIECE_SPECS[type]?.radiusMultiplier || 1.0;
  }

  static getLabel(type) {
    return PIECE_SPECS[type]?.label || type;
  }
}
