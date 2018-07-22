import * as readline from "readline";
import { Canvas } from "terminal-canvas";

import { randomCharacterArray } from "./charset";

readline.emitKeypressEvents(process.stdin);
if (process.stdin.setRawMode) {
  process.stdin.setRawMode(true);
}

class Matrix {
  canvas: Canvas;
  rows: number;
  columns: number;
  iteration: number;
  chars: Char[];

  constructor() {
    this.canvas = new Canvas({ bg: "Black" });
    this.rows = process.stdout.rows!;
    this.columns = process.stdout.columns!;
    this.iteration = 0;
    this.chars = [];

    this.canvas.hideCursor();
    this.canvas.print();

    this.doIteration();
  }

  addNewColumn() {
    if (this.iteration % 5 === 0) {
      const column = Math.floor(Math.random() * this.columns);

      if (this.canvas.getPixelData(0, column).v === " ") {
        this.chars.push({
          chars: randomCharacterArray(this.rows),
          col: column,
          decline: 6 + 4 * Math.random(),
          iteration: 0,
          speed: Math.floor(2 + 3 * Math.random())
        });
      }
    }
  }

  doIteration() {
    // const timer = new Date();

    this.addNewColumn();
    this.removeFinishedColumns();

    // Update all remaining columns.
    this.chars.forEach(charCol => {
      // index is the row of the furthest visible char
      const index = Math.floor(charCol.iteration / charCol.speed);

      if (charCol.iteration % charCol.speed === 0 && index < this.rows) {
        // draw a new char
        this.canvas.setPixelData(index, charCol.col, {
          fg: { r: 255, g: 255, b: 255 },
          v: charCol.chars[index]
        });
      }

      if (charCol.iteration % 2 === 0) {
        for (let i = 0; i < Math.min(index, this.rows); i += 1) {
          const pixelData = this.canvas.getPixelData(i, charCol.col)
            .fg as RgbData;
          const newData = {
            b:
              pixelData.r > 0
                ? Math.max(0, Math.floor(pixelData.b - 2 * charCol.decline))
                : 0,
            g:
              pixelData.r > 0
                ? 255
                : Math.max(
                    0,
                    Math.floor(pixelData.g - (2 * charCol.decline) / 2)
                  ),
            r:
              pixelData.r > 0
                ? Math.max(0, Math.floor(pixelData.r - 2 * charCol.decline))
                : 0
          };

          if (newData.g === 0) {
            this.canvas.setPixelData(i, charCol.col, { v: " " });
          } else {
            this.canvas.setPixelData(i, charCol.col, { fg: newData });
          }
        }
      }

      charCol.iteration += 1;
    });

    this.iteration += 1;

    setTimeout(() => {
      this.doIteration();
    }, 1000 / 24);

    this.canvas.update();
  }

  removeFinishedColumns() {
    this.chars = this.chars.filter(
      char =>
        char.iteration <=
        this.rows * char.speed + Math.floor(256 / 8) + Math.floor(256 / 4)
    );
  }

  showCursor() {
    this.canvas.showCursor();
  }
}

const m = new Matrix();

process.stdin.on("keypress", (_, key) => {
  if (key.ctrl && key.name === "c") {
    process.emit("SIGINT");
  }
});

const exitHandler = () => {
  m.showCursor();
  console.clear(); // tslint:disable-line no-console
  process.exit();
};

process.on("exit", () => exitHandler);
process.on("SIGINT", exitHandler);
process.on("SIGUSR2", exitHandler);
