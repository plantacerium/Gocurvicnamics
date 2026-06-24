export const createGlassPanel = (children = [], style = {}) => {
  const el = document.createElement('div');
  el.className = 'glass-panel fade-in';
  Object.assign(el.style, style);
  for (const child of children) {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else el.appendChild(child);
  }
  return el;
};
