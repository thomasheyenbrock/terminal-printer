const fs = require('fs');
const readline = require('readline');
const Canvas = require('./canvas');
const randomCharacter = require('./charset').randomCharacter;
const randomCharacterArray = require('./charset').randomCharacterArray;

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const rows = process.stdout.rows;
const columns = process.stdout.columns;

const c = new Canvas(rows, columns);
c.hideCursor();
c.print();

class Matrix {
  constructor(canvas, rows, columns) {
    this.canvas = canvas;
    this.rows = rows;
    this.columns = columns;
    this.iteration = 0;
    this.chars = [];

    this.start();
  }

  start() {
    if (this.iteration % 9 === 0) {
      const column = parseInt(Math.random() * this.columns);

      if (this.canvas.getPixelData(0, column).v === ' ') {
        this.chars.push({
          col: column,
          decline: 6 + 4 * Math.random(),
          iteration: 0,
          speed: parseInt(2 + 3 * Math.random()),
          chars: randomCharacterArray(this.rows)
        });
      }
    }

    for (let i = this.chars.length - 1; i >= 0; i--) {
      if (this.chars[i].iteration > this.rows * this.chars[i].speed + parseInt(256 / 8) + parseInt(256 / 4)) {
        this.chars.splice(i, 1);
      }
    }

    this.chars.forEach(charCol => {
      let index = parseInt(charCol.iteration / charCol.speed);

      if (charCol.iteration % charCol.speed === 0 && index < this.rows) {
        this.canvas.setPixelData(
          index,
          charCol.col,
          {
            v: charCol.chars[index],
            fg: {r: 255, g: 255, b: 255}
          },
          false
        );
      }

      for (let i = 0; i < Math.min(index, this.rows); i++) {
        const pixelData = this.canvas.getPixelData(i, charCol.col).fg;
        const newData = {
          r: (pixelData.r > 0 ? Math.max(0, parseInt(pixelData.r - charCol.decline)) : 0),
          g: (pixelData.r > 0 ? 255 : Math.max(0, parseInt(pixelData.g - charCol.decline / 2))),
          b: (pixelData.r > 0 ? Math.max(0, parseInt(pixelData.b - charCol.decline)) : 0)
        }

        if (newData.g === 0) {
          this.canvas.setPixelData(i, charCol.col, {v: ' '}, false);
        } else {
          this.canvas.setPixelData(i, charCol.col, {fg: newData}, false);
        }
      }

      charCol.iteration++;
    });

    this.iteration++;

    setTimeout(() => {
      this.start();
    }, 1000 / 30);

    this.canvas.print();
  }
}

const m = new Matrix(c, rows, columns);

process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.emit('SIGINT');
  }
});

function exitHandler() {
  c.showCursor();
  console.clear();
  process.exit();
}

process.on('exit', () => exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUDR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('unhandledException', exitHandler);
