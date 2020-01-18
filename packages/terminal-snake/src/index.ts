import * as fs from "fs";
import * as readline from "readline";
import { Printer } from "terminal-printer";

readline.emitKeypressEvents(process.stdin);
if (process.stdin.setRawMode) {
  process.stdin.setRawMode(true);
}

const rows = process.stdout.rows || 0;
const columns = process.stdout.columns || 0;

class Snake {
  printer: Printer;
  rows: number;
  columns: number;
  initialPosition: Position;
  initialLength: number;
  direction: Direction;
  state: State;
  blocks: Position[];
  food: Position;
  speed: number;

  constructor(
    printer: Printer,
    printerRows: number,
    printerColumns: number,
    initialLength: number
  ) {
    this.printer = printer;
    this.rows = printerRows;
    this.columns = printerColumns;
    this.initialPosition = {
      col: Math.floor(this.columns / 2),
      row: Math.floor(this.rows / 2)
    };
    this.initialLength = initialLength;
    this.direction = "right";
    this.state = "start";
    this.blocks = [];
    this.food = { row: -1, col: -1 };
    this.speed = 100;

    const startScreen = fs.readFileSync(
      `${__dirname}/../ascii/start.txt`,
      "utf8"
    );

    this.printer.hideCursor();
    this.printer.print();
    this.printer.writeCenteredText(startScreen, {
      backgroundColor: "Black",
      foregroundColor: "White"
    });
    this.printer.update();
  }

  endGame() {
    this.state = "start";

    const startScreen = fs.readFileSync(
      `${__dirname}/../ascii/gameOver.txt`,
      "utf8"
    );
    this.printer.writeCenteredText(startScreen, {
      backgroundColor: "Black",
      foregroundColor: "White"
    });
    this.printer.update();

    this.direction = "right";
  }

  getNewBlock(): Position {
    const firstBlock = this.blocks[this.blocks.length - 1];

    switch (this.direction) {
      case "up":
        return { row: firstBlock.row - 1, col: firstBlock.col };
      case "down":
        return { row: firstBlock.row + 1, col: firstBlock.col };
      case "left":
        return { row: firstBlock.row, col: firstBlock.col - 1 };
      default:
      case "right":
        return { row: firstBlock.row, col: firstBlock.col + 1 };
    }
  }

  getState() {
    return this.state;
  }

  move() {
    const newBlock = this.getNewBlock();

    if (
      newBlock.row < 0 ||
      newBlock.row >= rows ||
      newBlock.col < 0 ||
      newBlock.col >= columns ||
      this.blocks.findIndex(
        block => block.row === newBlock.row && block.col === newBlock.col
      ) >= 0
    ) {
      this.endGame();
      return;
    }

    const lastBlock = this.blocks[0];

    if (!(newBlock.row === this.food.row && newBlock.col === this.food.col)) {
      this.blocks.splice(0, 1);
    } else {
      this.placeFood();
      this.speed -= 1;
    }

    this.blocks.push(newBlock);
    this.printer.setPixel(lastBlock.row, lastBlock.col, {
      backgroundColor: null,
      foregroundColor: null,
      value: " "
    });
    this.printer.setPixel(newBlock.row, newBlock.col, {
      backgroundColor: null,
      foregroundColor: null,
      value: "x"
    });
    this.printer.update();
    setTimeout(this.move.bind(this), this.speed);
  }

  placeFood() {
    let row = Math.floor(Math.random() * this.rows);
    let col = Math.floor(Math.random() * this.columns);

    while (
      this.blocks.findIndex(block => block.row === row && block.col === col) >=
      0
    ) {
      row = Math.floor(Math.random() * this.rows);
      col = Math.floor(Math.random() * this.columns);
    }

    this.food = {
      col,
      row
    };
    this.printer.setPixel(row, col, {
      backgroundColor: null,
      foregroundColor: null,
      value: "o"
    });
    this.printer.update();
  }

  setDirection(direction: Direction) {
    if (
      !(
        (this.direction === "down" && direction === "up") ||
        (this.direction === "up" && direction === "down") ||
        (this.direction === "left" && direction === "right") ||
        (this.direction === "right" && direction === "left")
      )
    ) {
      this.direction = direction;
    }
  }

  startGame() {
    this.printer.clear({ backgroundColor: "White", foregroundColor: "Black" });

    this.blocks = [];

    for (let i = 0; i < this.initialLength; i += 1) {
      this.blocks.push({
        col: this.initialPosition.col - (this.initialLength - i - 1),
        row: this.initialPosition.row
      });
    }

    this.blocks.forEach(block => {
      this.printer.setPixel(block.row, block.col, {
        backgroundColor: null,
        foregroundColor: null,
        value: "x"
      });
    });
    this.printer.update();

    this.state = "game";
    this.placeFood();
    setTimeout(this.move.bind(this), (this.speed = 100));
  }
}

const c = new Printer({
  backgroundColor: "White",
  foregroundColor: "Black",
  height: rows,
  width: columns
});
const s = new Snake(c, rows, columns, 6);

const validKeys = ["left", "right", "up", "down"];

process.stdin.on("keypress", (_, key) => {
  const state = s.getState();

  if (key.ctrl && key.name === "c") {
    process.emit("SIGINT");
  } else if (state === "game" && validKeys.indexOf(key.name) >= 0) {
    s.setDirection(key.name);
  } else if (state === "start" && key.name === "q") {
    process.emit("SIGINT");
  } else if (state === "start" && key.name === "s") {
    s.startGame();
  }
});

const exitHandler = () => {
  c.showCursor();
  console.clear(); // tslint:disable-line no-console
  process.exit();
};

process.on("exit", () => exitHandler);
process.on("SIGINT", exitHandler);
process.on("SIGUSR2", exitHandler);
