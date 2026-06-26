import { PIECE_TYPES } from '../../config/PieceConfig.js';
import { PieceTypeRegistry } from './PieceTypeRegistry.js';
import { BasePiece } from './BasePiece.js';
import { DampenerPiece } from './DampenerPiece.js';
import { AmplifierPiece } from './AmplifierPiece.js';
import { SlingshotPiece } from './SlingshotPiece.js';
import { GravitonPiece } from './GravitonPiece.js';
import { PhantomPiece } from './PhantomPiece.js';
import { BrawlerPiece } from './BrawlerPiece.js';
import { GlassCannonPiece } from './GlassCannonPiece.js';
import { JuggernautPiece } from './JuggernautPiece.js';
import { PebblePiece } from './PebblePiece.js';
import { GhostPiece } from './GhostPiece.js';
import { MiragePiece } from './MiragePiece.js';
import { SpecterPiece } from './SpecterPiece.js';
import { BlinkPiece } from './BlinkPiece.js';
import { ShadowPiece } from './ShadowPiece.js';
import { WispPiece } from './WispPiece.js';
import { Piece } from './Piece.js';

const TYPE_MAP = {
  [PIECE_TYPES.BASE]: BasePiece,
  [PIECE_TYPES.DAMPENER]: DampenerPiece,
  [PIECE_TYPES.AMPLIFIER]: AmplifierPiece,
  [PIECE_TYPES.SLINGSHOT]: SlingshotPiece,
  [PIECE_TYPES.GRAVITON]: GravitonPiece,
  [PIECE_TYPES.PHANTOM]: PhantomPiece,
  [PIECE_TYPES.BRAWLER]: BrawlerPiece,
  [PIECE_TYPES.GLASS_CANNON]: GlassCannonPiece,
  [PIECE_TYPES.JUGGERNAUT]: JuggernautPiece,
  [PIECE_TYPES.PEBBLE]: PebblePiece,
  [PIECE_TYPES.GHOST]: GhostPiece,
  [PIECE_TYPES.MIRAGE]: MiragePiece,
  [PIECE_TYPES.SPECTER]: SpecterPiece,
  [PIECE_TYPES.BLINK]: BlinkPiece,
  [PIECE_TYPES.SHADOW]: ShadowPiece,
  [PIECE_TYPES.WISP]: WispPiece,
};

export class PieceFactory {
  static create(id, playerId, type, x, y) {
    const Cls = TYPE_MAP[type];
    if (Cls) return new Cls(id, playerId, x, y);
    console.warn(`[PieceFactory] Unknown type "${type}", falling back to base`);
    return new Piece(id, playerId, PIECE_TYPES.BASE, x, y);
  }

  static createFromData(data) {
    const piece = PieceFactory.create(data.id, data.playerId, data.type, data.x, data.y);
    if (data.hp !== undefined) piece.hp = Math.min(data.hp, piece.maxHp);
    if (data.vx !== undefined) { piece.vx = data.vx; piece.vy = data.vy; }
    if (data.destroyed !== undefined) piece.destroyed = data.destroyed;
    return piece;
  }

  static createBatch(pieceDataArray) {
    return pieceDataArray.map(d => PieceFactory.createFromData(d));
  }
}
