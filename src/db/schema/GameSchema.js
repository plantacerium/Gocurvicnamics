export const GAME_SCHEMA = 'id, createdAt, status';

export const createGameObject = (config, initialState) => ({
  id: 'game_' + Date.now(),
  createdAt: new Date(),
  status: 'active',
  config,
  initialState,
});
