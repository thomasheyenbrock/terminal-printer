import * as minimist from "minimist";
import * as readline from "readline";
import { Printer } from "terminal-printer";

readline.emitKeypressEvents(process.stdin);
if (process.stdin.setRawMode) {
  process.stdin.setRawMode(true);
}

const args = minimist(process.argv.slice(2));

class GameOfLife {
  printer: Printer;
  rows: number;
  columns: number;
  alive: string;
  dead: string;
  cells: Cell[][];

  constructor(dead: string, alive: string, rate: number) {
    this.printer = new Printer();
    this.rows = this.printer.height;
    this.columns = this.printer.width;
    this.alive = alive;
    this.dead = dead;

    this.cells = [];

    this.cells = Array.from({ length: this.rows }).map(() =>
      Array.from({ length: this.columns }).map(() =>
        Math.random() < rate ? 1 : 0,
      ),
    );

    this.printer.hideCursor();
  }

  firstGeneration() {
    this.cells.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        this.printer.setPixel(rowIndex, colIndex, {
          value: col === 1 ? this.alive : this.dead,
        });
      });
    });
    this.printer.print();
  }

  nextGeneration() {
    let changes = 0;
    const newCells: Cell[][] = JSON.parse(JSON.stringify(this.cells));

    this.cells.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        let aliveSurroundingCells = 0;

        if (rowIndex > 0 && colIndex > 0) {
          aliveSurroundingCells += this.cells[rowIndex - 1][colIndex - 1];
        }
        if (rowIndex > 0) {
          aliveSurroundingCells += this.cells[rowIndex - 1][colIndex];
        }
        if (rowIndex > 0 && colIndex < this.columns - 1) {
          aliveSurroundingCells += this.cells[rowIndex - 1][colIndex + 1];
        }
        if (colIndex < this.columns - 1) {
          aliveSurroundingCells += this.cells[rowIndex][colIndex + 1];
        }
        if (rowIndex < this.rows - 1 && colIndex < this.columns - 1) {
          aliveSurroundingCells += this.cells[rowIndex + 1][colIndex + 1];
        }
        if (rowIndex < this.rows - 1) {
          aliveSurroundingCells += this.cells[rowIndex + 1][colIndex];
        }
        if (rowIndex < this.rows - 1 && colIndex > 0) {
          aliveSurroundingCells += this.cells[rowIndex + 1][colIndex - 1];
        }
        if (colIndex > 0) {
          aliveSurroundingCells += this.cells[rowIndex][colIndex - 1];
        }

        if (
          col === 1 &&
          (aliveSurroundingCells < 2 || aliveSurroundingCells > 3)
        ) {
          changes += 1;
          newCells[rowIndex][colIndex] = 0;
          this.printer.setPixel(rowIndex, colIndex, { value: this.dead });
        } else if (col === 0 && aliveSurroundingCells === 3) {
          changes += 1;
          newCells[rowIndex][colIndex] = 1;
          this.printer.setPixel(rowIndex, colIndex, { value: this.alive });
        }
      });
    });
    this.cells = newCells;
    this.printer.update();

    if (changes === 0) {
      this.printer.showCursor();
      process.exit();
    }
  }

  showCursor() {
    this.printer.showCursor();
  }

  start() {
    this.firstGeneration();
    setInterval(() => this.nextGeneration(), 1000 / 12);
  }
}

const game = new GameOfLife(" ", "\u2022", args.rate || 0.5);

game.start();

process.stdin.on("keypress", (_, key) => {
  if (key.ctrl && key.name === "c") {
    game.showCursor();
    process.exit(0);
  }
});
