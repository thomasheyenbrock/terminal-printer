const fs = require('fs');
const readline = require('readline');
const Canvas = require('../terminal-canvas');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const rows = process.stdout.rows;
const columns = process.stdout.columns;

class Snake {
  constructor(canvas, rows, columns, initialPosition, initialLength, initialDirection) {
    this.canvas = canvas;
    this.rows = rows;
    this.columns = columns;
    this.initialPosition = initialPosition;
    this.initialLength = initialLength;
    this.initialDirection = initialDirection;
    this.state = 'start';
    this.blocks = [];
    this.food = {};
    this.speed = 100;

    const startScreen = fs.readFileSync(`${__dirname}/ascii/start.txt`, 'utf8');

    this.canvas.hideCursor();
    this.canvas.print();
    this.canvas.writeCenteredText(startScreen, 'Black', 'White');
  }

  endGame() {
    this.state = 'start';

    const startScreen = fs.readFileSync(`${__dirname}/ascii/gameOver.txt`, 'utf8');
    this.canvas.writeCenteredText(startScreen, 'Black', 'White');
  }

  getState() {
    return this.state;
  }

  move() {
    const firstBlock = this.blocks[this.blocks.length - 1];

    let newBlock = {};

    switch (this.direction) {
      case 'up':
        newBlock.row = firstBlock.row - 1;
        newBlock.col = firstBlock.col;
        break;
      case 'down':
        newBlock.row = firstBlock.row + 1;
        newBlock.col = firstBlock.col;
        break;
      case 'left':
        newBlock.row = firstBlock.row;
        newBlock.col = firstBlock.col - 1;
        break;
      case 'right':
        newBlock.row = firstBlock.row;
        newBlock.col = firstBlock.col + 1;
        break;
    }

    if (
      newBlock.row < 0 ||
      newBlock.row >= rows ||
      newBlock.col < 0 ||
      newBlock.col >= columns ||
      this.blocks.findIndex(block => block.row === newBlock.row && block.col === newBlock.col) >= 0
    ) {
      this.endGame();
      return;
    }

    let lastBlock = this.blocks[0];
    if (!(newBlock.row === this.food.row && newBlock.col === this.food.col)) {
      this.blocks.splice(0, 1)[0];
    } else {
      this.placeFood();
      this.speed--;
    }

    this.blocks.push(newBlock);
    this.canvas.setPixelData(lastBlock.row, lastBlock.col, {v: ' '});
    this.canvas.setPixelData(newBlock.row, newBlock.col, {v: 'x'});
    setTimeout(this.move.bind(this), this.speed);
  }

  placeFood() {
    let row = parseInt(Math.random() * this.rows);
    let col = parseInt(Math.random() * this.columns);

    while (this.blocks.findIndex(block => block.row === row && block.col === col) >= 0) {
      row = parseInt(Math.random() * this.rows);
      col = parseInt(Math.random() * this.columns);
    }

    this.food = {row, col};
    this.canvas.setPixelData(row, col, {v: 'o'});
  }

  setDirection(direction) {
    if (!(
      (this.direction === 'down' && direction === 'up') ||
      (this.direction === 'up' && direction === 'down') ||
      (this.direction === 'left' && direction === 'right') ||
      (this.direction === 'right' && direction === 'left')
    )) {
      this.direction = direction;
    }
  }

  startGame() {
    this.canvas.clear('White', 'Black');

    this.direction = this.initialDirection;
    this.blocks = [];

    for (let i = 0; i < this.initialLength; i++) {
      this.blocks.push({
        row: this.initialPosition.row,
        col: this.initialPosition.col - (this.initialLength - i - 1)
      });
    }

    this.blocks.forEach((block) => {
      this.canvas.setPixelData(block.row, block.col, {v: 'x'});
    });

    this.state = 'game';
    this.placeFood();
    setTimeout(this.move.bind(this), this.speed = 100);
  }
}

const c = new Canvas(rows, columns, 'White', 'Black');
const s = new Snake(
  c,
  rows,
  columns,
  {
    row: parseInt(rows / 2),
    col: parseInt(columns / 2)
  },
  6,
  'right'
);

const validKeys = ['left', 'right', 'up', 'down'];

process.stdin.on('keypress', (str, key) => {
  const state = s.getState();

  if (key.ctrl && key.name === 'c') {
    process.emit('SIGINT');
  } else if (state === 'game' && validKeys.indexOf(key.name) >= 0) {
    s.setDirection(key.name);
  } else if (state === 'start' && key.name === 'q') {
    process.emit('SIGINT');
  } else if (state === 'start' && key.name === 's') {
    s.startGame();
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
