const fs = require('fs');

class Canvas {
  constructor(height, width) {
    this.height = height;
    this.width = width;

    this.canvas = [];

    for (let i = 0; i < this.height; i++) {
      let row = [];

      for (let j = 0; j < this.width; j++) {
        row.push({
          fg: {r: 255, g: 255, b: 255},
          v: ' '
        });
      }

      this.canvas.push(row);
    }
  }

  getPixelData(row, col) {
    return this.canvas[row][col];
  }

  hideCursor() {
    process.stdout.write('\u001B[?25l');
  }

  print(iteration) {
    const print = this.canvas.map(row => {
      return row.map(cell => {
        return cell.v === ' ' ? ' ' : `\x1b[38;2;${cell.fg.r};${cell.fg.g};${cell.fg.b}m${cell.v}`;
      }).join('');
    }).join('');

    // let print = '';

    // for (let i = 0; i < this.height; i++) {
    //   for (let j = 0; j < this.width; j++) {
    //     if (this.canvas[i][j].v !== ' ') {
    //       let cell = this.canvas[i][j];
    //       print += `\x1b[${i};${j}H\x1b[38;2;${cell.fg.r};${cell.fg.g};${cell.fg.b}m${cell.v}`;
    //     }
    //   }
    // }

    // fs.appendFileSync(`${__dirname}/logfile.txt`, `${print.length}\n`);

    process.stdout.write('\x1b[1;1H');
    process.stdout.write('\x1b[48;2;0;0;0m');
    process.stdout.write(print);
  }

  setPixelData(row, col, data) {
    Object.assign(this.canvas[row][col], data);
  }

  showCursor() {
    process.stdout.write('\u001B[?25h');
  }
}

module.exports = Canvas;
