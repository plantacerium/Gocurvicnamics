export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

export const lerp = (a, b, t) => a + (b - a) * t;

export const distance = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

export const magnitude = (x, y) => Math.sqrt(x * x + y * y);

export const normalize = (x, y) => {
  const mag = magnitude(x, y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: x / mag, y: y / mag };
};

export const dot = (x1, y1, x2, y2) => x1 * x2 + y1 * y2;

export const angleBetween = (x1, y1, x2, y2) => {
  return Math.atan2(y2 - y1, x2 - x1);
};

export const randomRange = (min, max) => Math.random() * (max - min) + min;

export const randomInt = (min, max) => Math.floor(randomRange(min, max + 1));

export const toRad = (deg) => deg * (Math.PI / 180);

export const toDeg = (rad) => rad * (180 / Math.PI);
