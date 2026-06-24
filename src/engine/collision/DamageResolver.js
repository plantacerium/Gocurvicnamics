import { CollisionDetector } from './CollisionDetector.js';
import { PHYSICS_DEFAULTS } from '../../config/PhysicsConfig.js';
import { GAMEPLAY_DEFAULTS } from '../../config/GameplayConfig.js';

export class DamageResolver {
  constructor() {
    this.currentTick = 0;
  }

  resolve(pieceA, pieceB, relVel) {
    const result = {
      damageA: 0,
      damageB: 0,
      shockwave: false,
      shockwavePos: null,
      shockwaveRadius: 0,
      shockwaveForce: 0,
    };

    if (!CollisionDetector.areAdversaries(pieceA, pieceB)) return result;
    if (!CollisionDetector.isSignificantImpact(relVel, PHYSICS_DEFAULTS.minImpactForDamage)) return result;

    const collA = pieceA.onCollision ? pieceA.onCollision(pieceB, relVel) : { damage: 1, shockwave: false };
    const collB = pieceB.onCollision ? pieceB.onCollision(pieceA, relVel) : { damage: 1, shockwave: false };

    result.damageA = collB.damage || 0;
    result.damageB = collA.damage || 0;

    if (collA.shockwave) {
      result.shockwave = true;
      result.shockwavePos = { x: pieceA.x, y: pieceA.y };
      result.shockwaveRadius = collA.shockwaveRadius || PHYSICS_DEFAULTS.shockwaveRadius;
      result.shockwaveForce = collA.shockwaveForce || PHYSICS_DEFAULTS.shockwaveForce;
    }
    if (collB.shockwave) {
      result.shockwave = true;
      result.shockwavePos = { x: pieceB.x, y: pieceB.y };
      result.shockwaveRadius = collB.shockwaveRadius || PHYSICS_DEFAULTS.shockwaveRadius;
      result.shockwaveForce = collB.shockwaveForce || PHYSICS_DEFAULTS.shockwaveForce;
    }

    if (result.damageA > 0) pieceA.takeDamage(result.damageA);
    if (result.damageB > 0) pieceB.takeDamage(result.damageB);

    this.currentTick++;
    return result;
  }
}
