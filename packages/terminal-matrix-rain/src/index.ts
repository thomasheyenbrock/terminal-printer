import { Canvas } from "terminal-canvas";

import { getRandomCharacterArray } from "./charset";
export default class Matrix {
  canvas: Canvas;
  rows: number;
  columns: number;
  iteration: number;
  charColumns: CharColumn[];

  constructor() {
    this.canvas = new Canvas({ backgroundColor: "Black" });
    this.rows = process.stdout.rows!;
    this.columns = process.stdout.columns!;
    this.iteration = 0;
    this.charColumns = [];

    this.canvas.hideCursor();
    this.canvas.print();

    this.doIteration();
  }

  addNewColumn() {
    if (this.iteration % 2 === 0) {
      const column = Math.floor(Math.random() * this.columns);

      if (this.canvas.getPixel(0, column).value === " ") {
        this.charColumns.push({
          chars: getRandomCharacterArray(this.rows),
          column,
          decline: 6 + 4 * Math.random(),
          iteration: 0,
          speed: Math.floor(2 + 3 * Math.random())
        });
      }
    }
  }

  doIteration() {
    this.addNewColumn();
    this.removeFinishedColumns();

    // Update all remaining columns.
    this.charColumns.forEach(charColumn => {
      // index is the row of the furthest visible char
      const index = Math.floor(charColumn.iteration / charColumn.speed);

      if (charColumn.iteration % charColumn.speed === 0 && index < this.rows) {
        // draw a new char
        this.canvas.setPixel(index, charColumn.column, {
          foregroundColor: { r: 255, g: 255, b: 255 },
          value: charColumn.chars[index]
        });
      }

      if (charColumn.iteration % 2 === 0) {
        for (let i = 0; i < Math.min(index, this.rows); i += 1) {
          const pixel = this.canvas.getPixel(i, charColumn.column)
            .foregroundColor as RgbData;
          const newForegroundColor = {
            b:
              pixel.r > 0
                ? Math.max(0, Math.floor(pixel.b - 2 * charColumn.decline))
                : 0,
            g:
              pixel.r > 0
                ? 255
                : Math.max(
                    0,
                    Math.floor(pixel.g - (2 * charColumn.decline) / 2)
                  ),
            r:
              pixel.r > 0
                ? Math.max(0, Math.floor(pixel.r - 2 * charColumn.decline))
                : 0
          };

          if (newForegroundColor.g === 0) {
            this.canvas.setPixel(i, charColumn.column, { value: " " });
          } else {
            this.canvas.setPixel(i, charColumn.column, {
              foregroundColor: newForegroundColor
            });
          }
        }
      }

      charColumn.iteration += 1;
    });

    this.iteration += 1;

    setTimeout(() => {
      this.doIteration();
    }, 1000 / 24);

    this.canvas.update();
  }

  removeFinishedColumns() {
    this.charColumns = this.charColumns.filter(
      char =>
        char.iteration <=
        this.rows * char.speed + Math.floor(256 / 8) + Math.floor(256 / 4)
    );
  }

  showCursor() {
    this.canvas.showCursor();
  }
}
