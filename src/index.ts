import { getTerminalColor } from "./colors";

export class Canvas {
  height: number;
  public width: number;
  public canvas: Pixel[][];
  private updateBuffer: Update[];

  constructor(
    height: number,
    width: number,
    bg: RgbData | Color,
    fg: RgbData | Color,
  ) {
    this.height = height;
    this.width = width;

    this.canvas = Array.from({ length: this.height }).map(_ =>
      Array.from({ length: this.width }).map(__ => ({
        bg: bg || null,
        fg: fg || null,
        v: " ",
      })),
    );
    this.updateBuffer = [];
  }

  public clear(bg: RgbData | Color | null, fg: RgbData | Color | null): void {
    for (let i = 0; i < this.height; i += 1) {
      for (let j = 0; j < this.width; j += 1) {
        this.setPixelData(i, j, { v: " ", bg, fg });
      }
    }
  }

  public getPixelData(row: number, column: number): Pixel {
    return this.canvas[row][column];
  }

  public hideCursor(): void {
    process.stdout.write("\u001B[?25l");
  }

  public print(): void {
    const print = this.canvas
      .map(row =>
        row
          .map(
            cell =>
              `${cell.fg ? getTerminalColor("fg", cell.fg) : ""}${
                cell.bg ? getTerminalColor("bg", cell.bg) : ""
              }${cell.v}`,
          )
          .join(""),
      )
      .join("");

    process.stdout.write("\x1b[1;1H");
    process.stdout.write(print);
  }

  public setPixelData(row: number, column: number, data: Pixel): void {
    const elementInUpdateBuffer = this.updateBuffer.findIndex(
      update => update.row === row && update.column === column,
    );
    if (elementInUpdateBuffer < 0) {
      this.updateBuffer.push({
        column,
        data,
        row,
      });
    } else {
      this.updateBuffer.splice(elementInUpdateBuffer, 1, {
        column,
        data: {
          ...this.updateBuffer[elementInUpdateBuffer],
          ...data,
        } as Pixel,
        row,
      });
    }
  }

  public showCursor(): void {
    process.stdout.write("\u001B[?25h");
  }

  public update(): void {
    this.sortUpdateBuffer();

    const updateString = this.updateBuffer.reduce(
      (currentUpdateString, updateElement, index) => {
        let newUpdateString = currentUpdateString;
        if (index === 0) {
          // this element is the first, so write position and both colors
          newUpdateString += `\x1b[${updateElement.row +
            1};${updateElement.column + 1}H`;
          newUpdateString += getTerminalColor("bg", updateElement.data.bg);
          newUpdateString += getTerminalColor("fg", updateElement.data.fg);
        } else {
          // write position (if necessary)
          const previousElement = this.updateBuffer[index - 1];
          const hasPredecessorInSameRow =
            updateElement.column > 0 &&
            this.updateBuffer[index - 1].row === updateElement.row;
          if (!hasPredecessorInSameRow) {
            // there is no update element in this row, so position the
            // cursor at the location of the update element
            newUpdateString += `\x1b[${updateElement.row +
              1};${updateElement.column + 1}H`;
          } else {
            // there is a update element in this row, so the cursor is
            // already located in this row
            const hasDirectPredecessor =
              hasPredecessorInSameRow &&
              previousElement.column === updateElement.column - 1;

            if (!hasDirectPredecessor) {
              // the current element does not directly follow the last
              // element, so move the cursor as many columns forward as
              // necessary
              newUpdateString += `\x1b[${updateElement.column -
                previousElement.column -
                1}C`;
            }
          }

          // write background color (if necessary)
          if (
            !this.equalColors(previousElement.data.bg, updateElement.data.bg)
          ) {
            newUpdateString += getTerminalColor("bg", updateElement.data.bg);
          }

          // write foreground color (if necessary)
          if (
            !this.equalColors(previousElement.data.fg, updateElement.data.fg)
          ) {
            newUpdateString += getTerminalColor("fg", updateElement.data.fg);
          }
        }

        // write value
        newUpdateString += updateElement.data.v;

        return newUpdateString;
      },
      "",
    );

    process.stdout.write(updateString);

    this.updateBuffer = [];
  }

  public writeCenteredRow(
    row: number,
    text: string,
    bg?: RgbData | Color,
    fg?: RgbData | Color,
  ): void {
    this.writeRow(
      row,
      Math.round((this.width - text.length) / 2),
      text,
      bg,
      fg,
    );
  }

  public writeCenteredText(
    text: string,
    bg?: RgbData | Color,
    fg?: RgbData | Color,
  ): void {
    const textArray = text.split("\n");
    const firstRow = Math.round((this.height - textArray.length) / 2);

    textArray.forEach((string, index) => {
      this.writeCenteredRow(firstRow + index, string, bg, fg);
    });
  }

  public writeRow(
    row: number,
    column: number,
    text: string,
    bg?: RgbData | Color,
    fg?: RgbData | Color,
  ): void {
    text.split("").forEach((v, index) => {
      if (column + index < this.width) {
        this.setPixelData(row, column + index, {
          bg: bg || null,
          fg: fg || null,
          v,
        });
      }
    });
  }

  private equalColors(
    firstColor: RgbData | Color | null,
    secondColor: RgbData | Color | null,
  ): boolean {
    if (firstColor === null && secondColor === null) {
      return true;
    }
    if (firstColor === null || secondColor === null) {
      return false;
    }
    return (
      getTerminalColor("fg", firstColor) === getTerminalColor("fg", secondColor)
    );
  }

  private sortUpdateBuffer(): void {
    this.updateBuffer = this.updateBuffer.sort(
      (firstElement, secondElement) => {
        if (
          firstElement.row < secondElement.row ||
          (firstElement.row === secondElement.row &&
            firstElement.column < secondElement.column)
        ) {
          return -1;
        }
        if (
          firstElement.row > secondElement.row ||
          (firstElement.row === secondElement.row &&
            firstElement.column > secondElement.column)
        ) {
          return 1;
        }
        return 0;
      },
    );
  }
}
