import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { Printer } from "terminal-printer";

export class Presentation {
  printer: Printer;
  slides: string[];
  currentSlide: number;

  constructor() {
    if (process.argv.length < 3) {
      throw new Error(
        "Please specify a directory containing the txt-files for the presentation.",
      );
    }

    const directory = process.argv[2];
    const files = fs
      .readdirSync(path.join(directory))
      .filter(name => name.endsWith(".txt"));

    if (files.length === 0) {
      throw new Error("The given directory does not contain any txt-files.");
    }

    this.slides = files.map(name =>
      fs.readFileSync(path.resolve(directory, name), "utf8"),
    );
    this.printer = new Printer({
      backgroundColor: "White",
      foregroundColor: "Black",
    });
    this.currentSlide = 0;

    this.printer.hideCursor();
    this.printer.print();
    this.printer.writeCenteredText(
      [
        "Press s to start the presentation.",
        "Press q to quit the presentation.",
        "Press left and right arrow keys to change the presentation slides.",
        "Press r to reload the current slide.",
      ].join("\n"),
    );
    this.printer.update();
  }

  nextSlide() {
    this.currentSlide += 1;

    if (this.currentSlide > this.slides.length - 1) {
      this.currentSlide -= 1;
    } else {
      this.printSlide();
    }
  }

  previousSlide() {
    this.currentSlide -= 1;

    if (this.currentSlide < 0) {
      this.currentSlide += 1;
    } else {
      this.printSlide();
    }
  }

  printSlideWithColor(color: number) {
    this.printer.writeCenteredText(this.slides[this.currentSlide], {
      foregroundColor: { b: color, g: color, r: color },
    });
    this.printer.update();
  }

  printSlide() {
    let color = 255;

    this.printer.clear();

    const intervalHandler = setInterval(() => {
      color = Math.max(color - 16, 0);
      this.printSlideWithColor(color);

      if (color === 0) {
        clearInterval(intervalHandler);
      }
    }, 1000 / 60);
  }

  reloadSlide() {
    this.printSlide();
  }

  start() {
    this.currentSlide = 0;
    this.printSlide();
  }
}

export const run = () => {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  const presentation = new Presentation();

  process.stdin.on("keypress", (_, key) => {
    if ((key.ctrl && key.name === "c") || key.name === "q") {
      process.emit("SIGINT", "SIGINT");
    } else if (key.name === "s") {
      presentation.start();
    } else if (key.name === "left") {
      presentation.previousSlide();
    } else if (key.name === "right") {
      presentation.nextSlide();
    } else if (key.name === "r") {
      presentation.reloadSlide();
    }
  });

  const exitHandler = () => {
    presentation.printer.showCursor();
    // tslint:disable-next-line no-console
    console.clear();
    process.exit();
  };

  process.on("exit", () => exitHandler);
  process.on("SIGINT", exitHandler);
  process.on("SIGUSR2", exitHandler);
};
