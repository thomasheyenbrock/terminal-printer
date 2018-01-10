const getTerminalColor = require('./colors').getTerminalColor;

class Canvas {
  constructor(height, width, bg, fg) {
    this.height = height;
    this.width = width;

    this.canvas = [];

    for (let i = 0; i < this.height; i++) {
      let row = [];

      for (let j = 0; j < this.width; j++) {
        row.push({
          bg: bg || null,
          fg: fg || null,
          v: ' '
        });
      }

      this.canvas.push(row);
    }
  }

  clear(bg, fg) {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        this.setPixelData(i, j, {v: ' ', bg, fg});
      }
    }
  }

  getPixelData(row, col) {
    return this.canvas[row][col];
  }

  hideCursor() {
    process.stdout.write('\u001B[?25l');
  }

  pixel(row, col) {
    const data = this.canvas[row][col];

    function write(string) {
      process.stdout.write(string);
    }

    write(`\x1b[${row + 1};${col + 1}H`);
    if (data.bg) {
      write(getTerminalColor('bg', data.bg));
    }
    if (data.fg) {
      write(getTerminalColor('fg', data.fg));
    }
    write(data.v);
  }

  print() {
    const print = this.canvas.map(row => {
      return row.map(cell => {
        return `${
          cell.fg ? getTerminalColor('fg', cell.fg) : ''
        }${
          cell.bg ? getTerminalColor('bg', cell.bg) : ''
        }${
          cell.v
        }`;
      }).join('');
    }).join('');

    process.stdout.write('\x1b[1;1H');
    process.stdout.write(print);
  }

  setPixelData(row, col, data, update) {
    Object.assign(this.canvas[row][col], data);
    if (!(update === false)) {
      this.pixel(row, col);
    }
  }

  showCursor() {
    process.stdout.write('\u001B[?25h');
  }

  writeCenteredRow(row, text, bg, fg) {
    this.writeRow(row, parseInt((this.width - text.length) / 2), text, bg, fg);
  }

  writeCenteredText(text, bg, fg) {
    const textArray = text.split('\n');
    const firstRow = parseInt((this.height - textArray.length) / 2);

    textArray.forEach((s, i) => {
      this.writeCenteredRow(firstRow + i, s, bg, fg);
    });
  }

  writeRow(row, col, text, bg, fg) {
    for (let i = 0; i < text.length; i++) {
      if (col + i < this.width) {
        let data = {v: text.substr(i, 1)};

        if (bg) {
          data.bg = bg;
        }

        if (fg) {
          data.fg = fg;
        }

        this.setPixelData(row, col + i, data);
      }
    }
  }
}

module.exports = Canvas;
