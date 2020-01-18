#!/usr/bin/env node

const readline = require("readline");
const { default: Matrix } = require("../dist/index.js");

readline.emitKeypressEvents(process.stdin);
if (process.stdin.setRawMode) {
  process.stdin.setRawMode(true);
}

const matrix = new Matrix();

process.stdin.on("keypress", (_, key) => {
  if (key.ctrl && key.name === "c") {
    process.emit("SIGINT");
  }
});

const exitHandler = () => {
  matrix.showCursor();
  console.clear(); // tslint:disable-line no-console
  process.exit();
};

process.on("exit", () => exitHandler);
process.on("SIGINT", exitHandler);
process.on("SIGUSR2", exitHandler);
