export const REFLECTION_SCHEMA = 'id, gameId';

export const createReflectionObject = (gameId, p1Text, p2Text) => ({
  id: `ref_${gameId}`,
  gameId,
  p1Text,
  p2Text,
  timestamp: new Date(),
});
