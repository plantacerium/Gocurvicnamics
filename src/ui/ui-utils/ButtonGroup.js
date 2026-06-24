export class ButtonGroup {
  constructor(options, selectedValue, onChange) {
    this.container = document.createElement('div');
    this.container.style.display = 'flex';
    this.container.style.justifyContent = 'center';
    this.container.style.gap = '10px';
    this.buttons = [];
    this.selectedValue = selectedValue;
    this.onChange = onChange;

    for (const opt of options) {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.dataset.value = opt.value;
      btn.style.borderColor = opt.color || 'var(--border-color)';
      btn.style.color = opt.color || 'var(--text-main)';
      if (opt.value === selectedValue) {
        btn.classList.add('selected');
        btn.style.background = 'rgba(255, 255, 255, 0.2)';
      }

      btn.addEventListener('click', () => {
        this.select(opt.value);
        if (this.onChange) this.onChange(opt.value);
      });

      this.container.appendChild(btn);
      this.buttons.push(btn);
    }
  }

  select(value) {
    this.selectedValue = value;
    for (const btn of this.buttons) {
      btn.classList.remove('selected');
      btn.style.background = 'rgba(255, 255, 255, 0.05)';
      if (btn.dataset.value === value) {
        btn.classList.add('selected');
        btn.style.background = 'rgba(255, 255, 255, 0.2)';
      }
    }
  }

  getElement() {
    return this.container;
  }
}
