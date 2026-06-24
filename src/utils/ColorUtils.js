import { UI_DEFAULTS } from '../config/UIConfig.js';

export const teamColor = (playerId) =>
  playerId === 1 ? UI_DEFAULTS.team1Color : UI_DEFAULTS.team2Color;

export const teamDark = (playerId) =>
  playerId === 1 ? UI_DEFAULTS.team1Dark : UI_DEFAULTS.team2Dark;

export const teamLabel = (playerId) =>
  playerId === 1 ? UI_DEFAULTS.team1Label : UI_DEFAULTS.team2Label;

export const rgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const teamRgba = (playerId, alpha) => rgba(teamColor(playerId), alpha);

export const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};
