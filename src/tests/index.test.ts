import { Canvas } from "../index";

const processRows = 11;
const processColumns = 21;

describe("Canvas", () => {
  let canvas: Canvas;
  let config: {
    height?: number;
    width?: number;
    backgroundColor?: RgbData | Color;
    foregroundColor?: RgbData | Color;
  };
  beforeEach(() => {
    process.stdout.rows = 11;
    process.stdout.columns = 21;
    process.stdout.write = jest.fn();
    config = {
      backgroundColor: "Black",
      foregroundColor: "White",
      height: 10,
      width: 20,
    };
    canvas = new Canvas(config);
  });
  describe("constructor", () => {
    describe("without config", () => {
      beforeEach(() => {
        canvas = new Canvas();
      });
      it("should throw an error if no height could be found", () => {
        delete process.stdout.rows;
        expect(() => new Canvas()).toThrowError();
      });
      it("should throw an error if no width could be found", () => {
        delete process.stdout.columns;
        expect(() => new Canvas()).toThrowError();
      });
      it("should use the process rows as height", () => {
        expect(canvas.height).toBe(processRows);
      });
      it("should use the process columns as width", () => {
        expect(canvas.width).toBe(processColumns);
      });
      it("should use null as background color", () => {
        expect(canvas.canvas[0][0].backgroundColor).toBeNull();
      });
      it("should use null as foreground color", () => {
        expect(canvas.canvas[0][0].foregroundColor).toBeNull();
      });
    });
    it("should use the provided height", () => {
      expect(canvas.height).toBe(config.height);
    });
    it("should use the provided width", () => {
      expect(canvas.width).toBe(config.width);
    });
    it("should use the provided background color", () => {
      expect(canvas.canvas[0][0].backgroundColor).toBe(config.backgroundColor);
    });
    it("should use the provided foreground color", () => {
      expect(canvas.canvas[0][0].foregroundColor).toBe(config.foregroundColor);
    });
    it("should use empty strings as values", () => {
      expect(canvas.canvas[0][0].value).toBe(" ");
    });
  });
  describe("clear", () => {
    beforeEach(() => {
      canvas.setPixel = jest.fn();
    });
    it("should call setPixel for each pixel", () => {
      canvas.clear();
      expect(canvas.setPixel).toHaveBeenCalledTimes(
        canvas.height * canvas.width,
      );
      expect((canvas.setPixel as jest.Mock).mock.calls[0]).toEqual([
        0,
        0,
        { backgroundColor: null, foregroundColor: null, value: " " },
      ]);
    });
    it("should be able to set background color", () => {
      canvas.clear({ backgroundColor: "PaleVioletRed" });
      expect((canvas.setPixel as jest.Mock).mock.calls[0]).toEqual([
        0,
        0,
        { backgroundColor: "PaleVioletRed", foregroundColor: null, value: " " },
      ]);
    });
    it("should be able to set foreground color", () => {
      canvas.clear({ foregroundColor: "PaleVioletRed" });
      expect((canvas.setPixel as jest.Mock).mock.calls[0]).toEqual([
        0,
        0,
        { backgroundColor: null, foregroundColor: "PaleVioletRed", value: " " },
      ]);
    });
  });
  describe("getPixel", () => {
    const somePixel: Pixel = {
      backgroundColor: "PaleVioletRed",
      foregroundColor: "Olive",
      value: "*",
    };
    beforeEach(() => {
      canvas.canvas[1][2] = somePixel;
    });
    it("should return the correct pixel", () => {
      expect(canvas.getPixel(1, 2)).toEqual(somePixel);
    });
  });
  describe("hideCursor", () => {
    it("should print the expected string", () => {
      canvas.hideCursor();
      expect(process.stdout.write).toHaveBeenCalledTimes(1);
      expect(process.stdout.write).toHaveBeenCalledWith("\u001B[?25l");
    });
  });
  describe("print", () => {
    it("should print the canvas", () => {
      canvas.print();
      expect(process.stdout.write).toHaveBeenCalledTimes(2);
      expect((process.stdout.write as jest.Mock).mock.calls).toMatchSnapshot();
    });
  });
  describe("setPixel", () => {
    it("should work with partial pixel", () => {
      canvas.setPixel(1, 2, {});
      expect(canvas.canvas[1][2]).toEqual({
        backgroundColor: "Black",
        foregroundColor: "White",
        value: " ",
      });
    });
    it("should work with complete pixel", () => {
      const pixel: Pixel = {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "*",
      };
      canvas.setPixel(1, 2, pixel);
      expect(canvas.canvas[1][2]).toEqual(pixel);
    });
    it("should throw an error for a value with lenght of zero", () => {
      expect(() => canvas.setPixel(1, 2, { value: "" })).toThrowError();
    });
    it("should throw an error for a value with lenght greater than", () => {
      expect(() =>
        canvas.setPixel(1, 2, { value: "this is too long!" }),
      ).toThrowError();
    });
  });
  describe("showCursor", () => {
    it("should print the expected string", () => {
      canvas.showCursor();
      expect(process.stdout.write).toHaveBeenCalledTimes(1);
      expect(process.stdout.write).toHaveBeenCalledWith("\u001B[?25h");
    });
  });
  describe("update", () => {
    it("should print the expected string", () => {
      canvas.setPixel(3, 5, { value: "*" });
      canvas.setPixel(3, 1, { value: "a" });
      canvas.setPixel(3, 2, { value: "b" });
      canvas.setPixel(1, 2, {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "*",
      });
      canvas.setPixel(3, 5, {
        backgroundColor: "White",
        foregroundColor: "Black",
        value: "\\",
      });
      canvas.setPixel(3, 6, {
        backgroundColor: "White",
        foregroundColor: "Black",
        value: "/",
      });
      canvas.update();
      expect((process.stdout.write as jest.Mock).mock.calls).toMatchSnapshot();
    });
    it("should print the expected string when the first pixel has no colors", () => {
      canvas.setPixel(1, 2, { value: "*" });
      canvas.update();
      expect((process.stdout.write as jest.Mock).mock.calls).toMatchSnapshot();
    });
  });
  describe("writeCenteredRow", () => {
    const text = "foobar";
    const colors = {
      backgroundColor: "PaleVioletRed" as Color,
      foregroundColor: "Olive" as Color,
    };
    beforeEach(() => {
      canvas.writeRow = jest.fn();
    });
    it("should invoke writeRow correctly without colors", () => {
      canvas.writeCenteredRow(2, text);
      expect(canvas.writeRow).toHaveBeenCalledTimes(1);
      expect(canvas.writeRow).toHaveBeenCalledWith(2, 7, text, undefined);
    });
    it("should invoke writeRow correctly with colors", () => {
      canvas.writeCenteredRow(2, text, colors);
      expect(canvas.writeRow).toHaveBeenCalledTimes(1);
      expect(canvas.writeRow).toHaveBeenCalledWith(2, 7, text, colors);
    });
  });
  describe("writeCenteredText", () => {
    const text = "foo\nbar";
    const colors = {
      backgroundColor: "PaleVioletRed" as Color,
      foregroundColor: "Olive" as Color,
    };
    beforeEach(() => {
      canvas.writeCenteredRow = jest.fn();
    });
    it("should invoke writeCenteredText correctly without colors", () => {
      canvas.writeCenteredText(text);
      expect(canvas.writeCenteredRow).toHaveBeenCalledTimes(2);
      expect(canvas.writeCenteredRow).toHaveBeenCalledWith(4, "foo", undefined);
      expect(canvas.writeCenteredRow).toHaveBeenCalledWith(5, "bar", undefined);
    });
    it("should invoke writeCenteredText correctly without colors", () => {
      canvas.writeCenteredText(text, colors);
      expect(canvas.writeCenteredRow).toHaveBeenCalledTimes(2);
      expect(canvas.writeCenteredRow).toHaveBeenCalledWith(4, "foo", colors);
      expect(canvas.writeCenteredRow).toHaveBeenCalledWith(5, "bar", colors);
    });
  });
  describe("writeRow", () => {
    const text = "foo";
    const colors = {
      backgroundColor: "PaleVioletRed" as Color,
      foregroundColor: "Olive" as Color,
    };
    beforeEach(() => {
      canvas.setPixel = jest.fn();
    });
    it("should invoke setPixel correctly without colors", () => {
      canvas.writeRow(2, 3, text);
      expect(canvas.setPixel).toHaveBeenCalledTimes(3);
      expect(canvas.setPixel).toHaveBeenCalledWith(2, 3, {
        backgroundColor: null,
        foregroundColor: null,
        value: "f",
      });
      expect(canvas.setPixel).toHaveBeenCalledWith(2, 4, {
        backgroundColor: null,
        foregroundColor: null,
        value: "o",
      });
      expect(canvas.setPixel).toHaveBeenCalledWith(2, 5, {
        backgroundColor: null,
        foregroundColor: null,
        value: "o",
      });
    });
    it("should invoke setPixel correctly with colors", () => {
      canvas.writeRow(2, 3, text, colors);
      expect(canvas.setPixel).toHaveBeenCalledTimes(3);
      expect(canvas.setPixel).toHaveBeenCalledWith(2, 3, {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "f",
      });
      expect(canvas.setPixel).toHaveBeenCalledWith(2, 4, {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "o",
      });
      expect(canvas.setPixel).toHaveBeenCalledWith(2, 5, {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "o",
      });
    });
    it("should handle string that is too long for row", () => {
      canvas.writeRow(2, 19, text, colors);
      expect(canvas.setPixel).toHaveBeenCalledTimes(1);
      expect(canvas.setPixel).toHaveBeenCalledWith(2, 19, {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "f",
      });
    });
  });
});
