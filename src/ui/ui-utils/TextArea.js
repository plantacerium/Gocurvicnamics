export const createTextArea = (placeholder = '', style = {}) => {
  const textarea = document.createElement('textarea');
  textarea.style.cssText = `
    flex: 1;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--text-main);
    padding: 10px;
    border-radius: 8px;
    resize: none;
    font-family: var(--font-body);
  `;
  textarea.placeholder = placeholder;
  Object.assign(textarea.style, style);
  return textarea;
};
