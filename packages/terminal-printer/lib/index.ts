import { getTerminalColor } from "./colors";

export class Printer implements PrinterInterface {
  public height: number;
  public width: number;
  private printer: Pixel[][];
  private updateBuffer: Update[];

  constructor(config?: {
    height?: number;
    width?: number;
    backgroundColor?: RgbData | Color;
    foregroundColor?: RgbData | Color;
  }) {
    if (
      (!config || !config.height) &&
      typeof process.stdout.rows !== "number"
    ) {
      throw new Error(
        "Could not fall back to a default height, because " +
          "'process.stdout.rows' is no number. You have to " +
          "specify 'height' when calling the constructor.",
      );
    }
    if (
      (!config || !config.width) &&
      typeof process.stdout.columns !== "number"
    ) {
      throw new Error(
        "Could not fall back to a default width, because " +
          "'process.stdout.columns' is no number. You have to " +
          "specify 'width' when calling the constructor.",
      );
    }

    this.height = (config && config.height) || process.stdout.rows!;
    this.width = (config && config.width) || process.stdout.columns!;

    this.printer = Array.from({ length: this.height }).map(_ =>
      Array.from({ length: this.width }).map(__ => ({
        backgroundColor: (config && config.backgroundColor) || null,
        foregroundColor: (config && config.foregroundColor) || null,
        value: " ",
      })),
    );
    this.updateBuffer = [];
  }

  public clear(colors?: {
    backgroundColor?: RgbData | Color;
    foregroundColor?: RgbData | Color;
  }): void {
    const backgroundColor = (colors && colors.backgroundColor) || null;
    const foregroundColor = (colors && colors.foregroundColor) || null;

    Array.from({ length: this.height }).forEach((_, i) => {
      Array.from({ length: this.width }).forEach((__, j) => {
        this.setPixel(i, j, {
          backgroundColor,
          foregroundColor,
          value: " ",
        });
      });
    });
  }

  public getPixel(row: number, column: number): Pixel {
    return this.printer[row][column];
  }

  public hideCursor(): void {
    process.stdout.write("\u001B[?25l");
  }

  public print(): void {
    const print = this.printer
      .map(row =>
        row
          .map(
            cell =>
              `${getTerminalColor(
                "foreground",
                cell.foregroundColor,
              )}${getTerminalColor("background", cell.backgroundColor)}${
                cell.value
              }`,
          )
          .join(""),
      )
      .join("");

    process.stdout.write("\x1b[1;1H");
    process.stdout.write(print);
  }

  public setPixel(row: number, column: number, pixel: Partial<Pixel>): void {
    if (typeof pixel.value === "string" && pixel.value.length !== 1) {
      throw new Error(
        "Can't set values for a single pixel that have a length which is " +
          "not equal to 1.",
      );
    }

    this.printer[row][column] = {
      ...this.printer[row][column],
      ...pixel,
    };

    const elementInUpdateBuffer = this.updateBuffer.findIndex(
      update => update.row === row && update.column === column,
    );
    if (elementInUpdateBuffer < 0) {
      this.updateBuffer.push({
        column,
        pixel: {
          backgroundColor: pixel.backgroundColor || null,
          foregroundColor: pixel.foregroundColor || null,
          value: pixel.value || this.printer[row][column].value,
        },
        row,
      });
    } else {
      this.updateBuffer.splice(elementInUpdateBuffer, 1, {
        column,
        pixel: {
          ...this.updateBuffer[elementInUpdateBuffer].pixel,
          ...pixel,
        },
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
          newUpdateString += getTerminalColor(
            "background",
            updateElement.pixel.backgroundColor || null,
          );
          newUpdateString += getTerminalColor(
            "foreground",
            updateElement.pixel.foregroundColor || null,
          );
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
            !this.equalColors(
              previousElement.pixel.backgroundColor || null,
              updateElement.pixel.backgroundColor || null,
            )
          ) {
            newUpdateString += getTerminalColor(
              "background",
              updateElement.pixel.backgroundColor || null,
            );
          }

          // write foreground color (if necessary)
          if (
            !this.equalColors(
              previousElement.pixel.foregroundColor || null,
              updateElement.pixel.foregroundColor || null,
            )
          ) {
            newUpdateString += getTerminalColor(
              "foreground",
              updateElement.pixel.foregroundColor || null,
            );
          }
        }

        // write value
        newUpdateString += updateElement.pixel.value;

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
    colors?: {
      backgroundColor?: RgbData | Color;
      foregroundColor?: RgbData | Color;
    },
  ): void {
    this.writeRow(
      row,
      Math.floor((this.width - text.length) / 2),
      text,
      colors,
    );
  }

  public writeCenteredText(
    text: string,
    colors?: {
      backgroundColor?: RgbData | Color;
      foregroundColor?: RgbData | Color;
    },
  ): void {
    const textArray = text.split("\n");
    const firstRow = Math.floor((this.height - textArray.length) / 2);

    textArray.forEach((string, index) => {
      this.writeCenteredRow(firstRow + index, string, colors);
    });
  }

  public writeRow(
    row: number,
    column: number,
    text: string,
    colors?: {
      backgroundColor?: RgbData | Color;
      foregroundColor?: RgbData | Color;
    },
  ): void {
    const backgroundColor = (colors && colors.backgroundColor) || null;
    const foregroundColor = (colors && colors.foregroundColor) || null;

    text.split("").forEach((value, index) => {
      if (column + index < this.width) {
        this.setPixel(row, column + index, {
          backgroundColor,
          foregroundColor,
          value,
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
      getTerminalColor("foreground", firstColor) ===
      getTerminalColor("foreground", secondColor)
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
        /* istanbul ignore else */
        if (
          firstElement.row > secondElement.row ||
          (firstElement.row === secondElement.row &&
            firstElement.column > secondElement.column)
        ) {
          return 1;
        }
        /* istanbul ignore next */
        return 0;
      },
    );
  }
}
