export class SliderControl {
  constructor(label, id, min, max, value, step = 1, onChange) {
    this.container = document.createElement('div');
    this.label = document.createElement('label');
    this.label.style.color = 'var(--text-muted)';
    this.label.style.fontSize = '0.9rem';
    this.label.textContent = `${label}: `;
    this.valueSpan = document.createElement('span');
    this.valueSpan.id = `val-${id}`;
    this.valueSpan.textContent = value;
    this.label.appendChild(this.valueSpan);

    this.input = document.createElement('input');
    this.input.type = 'range';
    this.input.id = `cfg-${id}`;
    this.input.min = min;
    this.input.max = max;
    this.input.value = value;
    this.input.step = step;
    this.input.style.width = '100%';

    this.input.addEventListener('input', () => {
      this.valueSpan.textContent = this.input.value;
      if (onChange) onChange(parseInt(this.input.value));
    });

    this.container.appendChild(this.label);
    this.container.appendChild(this.input);
  }

  getValue() {
    return parseInt(this.input.value);
  }

  getElement() {
    return this.container;
  }
}
