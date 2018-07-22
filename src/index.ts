import { getTerminalColor } from "./colors";

export class Canvas implements CanvasInterface {
  public height: number;
  public width: number;
  public canvas: Pixel[][];
  private updateBuffer: Update[];

  constructor(config?: {
    height?: number;
    width?: number;
    bg?: RgbData | Color;
    fg?: RgbData | Color;
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

    this.canvas = Array.from({ length: this.height }).map(_ =>
      Array.from({ length: this.width }).map(__ => ({
        bg: (config && config.bg) || null,
        fg: (config && config.fg) || null,
        v: " ",
      })),
    );
    this.updateBuffer = [];
  }

  public clear(config?: { bg?: RgbData | Color; fg?: RgbData | Color }): void {
    const bg = (config && config.bg) || null;
    const fg = (config && config.fg) || null;

    Array.from({ length: this.height }).forEach((_, i) => {
      Array.from({ length: this.width }).forEach((__, j) => {
        this.setPixelData(i, j, { v: " ", bg, fg });
      });
    });
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
              `${getTerminalColor("fg", cell.fg)}${getTerminalColor(
                "bg",
                cell.bg,
              )}${cell.v}`,
          )
          .join(""),
      )
      .join("");

    process.stdout.write("\x1b[1;1H");
    process.stdout.write(print);
  }

  public setPixelData(row: number, column: number, data: Partial<Pixel>): void {
    if (typeof data.v === "string" && data.v.length !== 1) {
      throw new Error(
        "Can't set values for a single pixel that have a length which is " +
          "not equal to 1.",
      );
    }

    this.canvas[row][column] = {
      ...this.canvas[row][column],
      ...data,
    };

    const elementInUpdateBuffer = this.updateBuffer.findIndex(
      update => update.row === row && update.column === column,
    );
    if (elementInUpdateBuffer < 0) {
      this.updateBuffer.push({
        column,
        data: {
          bg: data.bg || null,
          fg: data.fg || null,
          v: data.v || this.canvas[row][column].v,
        },
        row,
      });
    } else {
      this.updateBuffer.splice(elementInUpdateBuffer, 1, {
        column,
        data: {
          ...this.updateBuffer[elementInUpdateBuffer].data,
          ...data,
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
            "bg",
            updateElement.data.bg || null,
          );
          newUpdateString += getTerminalColor(
            "fg",
            updateElement.data.fg || null,
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
              previousElement.data.bg || null,
              updateElement.data.bg || null,
            )
          ) {
            newUpdateString += getTerminalColor(
              "bg",
              updateElement.data.bg || null,
            );
          }

          // write foreground color (if necessary)
          if (
            !this.equalColors(
              previousElement.data.fg || null,
              updateElement.data.fg || null,
            )
          ) {
            newUpdateString += getTerminalColor(
              "fg",
              updateElement.data.fg || null,
            );
          }
        }

        // write value
        newUpdateString += updateElement.data.v;

        return newUpdateString;
      },
      "",
    );

    setTimeout(() => process.stdout.write(updateString), 0);

    this.updateBuffer = [];
  }

  public writeCenteredRow(
    row: number,
    text: string,
    colors?: {
      bg?: RgbData | Color;
      fg?: RgbData | Color;
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
      bg?: RgbData | Color;
      fg?: RgbData | Color;
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
      bg?: RgbData | Color;
      fg?: RgbData | Color;
    },
  ): void {
    const bg = (colors && colors.bg) || null;
    const fg = (colors && colors.fg) || null;

    text.split("").forEach((v, index) => {
      if (column + index < this.width) {
        this.setPixelData(row, column + index, {
          bg,
          fg,
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
