import { Canvas } from "../index";

const processRows = 11;
const processColumns = 21;

describe("Canvas", () => {
  let canvas: Canvas;
  let config: {
    height?: number;
    width?: number;
    bg?: RgbData | Color;
    fg?: RgbData | Color;
  };
  beforeEach(() => {
    process.stdout.rows = 11;
    process.stdout.columns = 21;
    process.stdout.write = jest.fn();
    config = { height: 10, width: 20, bg: "Black", fg: "White" };
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
        expect(canvas.canvas[0][0].bg).toBeNull();
      });
      it("should use null as foreground color", () => {
        expect(canvas.canvas[0][0].fg).toBeNull();
      });
    });
    it("should use the provided height", () => {
      expect(canvas.height).toBe(config.height);
    });
    it("should use the provided width", () => {
      expect(canvas.width).toBe(config.width);
    });
    it("should use the provided background color", () => {
      expect(canvas.canvas[0][0].bg).toBe(config.bg);
    });
    it("should use the provided foreground color", () => {
      expect(canvas.canvas[0][0].fg).toBe(config.fg);
    });
    it("should use empty strings as values", () => {
      expect(canvas.canvas[0][0].v).toBe(" ");
    });
  });
  describe("clear", () => {
    beforeEach(() => {
      canvas.setPixelData = jest.fn();
    });
    it("should call setPixelData for each pixel", () => {
      canvas.clear();
      expect(canvas.setPixelData).toHaveBeenCalledTimes(
        canvas.height * canvas.width,
      );
      expect((canvas.setPixelData as jest.Mock).mock.calls[0]).toEqual([
        0,
        0,
        { bg: null, fg: null, v: " " },
      ]);
    });
    it("should be able to set background color", () => {
      canvas.clear({ bg: "PaleVioletRed" });
      expect((canvas.setPixelData as jest.Mock).mock.calls[0]).toEqual([
        0,
        0,
        { bg: "PaleVioletRed", fg: null, v: " " },
      ]);
    });
    it("should be able to set foreground color", () => {
      canvas.clear({ fg: "PaleVioletRed" });
      expect((canvas.setPixelData as jest.Mock).mock.calls[0]).toEqual([
        0,
        0,
        { bg: null, fg: "PaleVioletRed", v: " " },
      ]);
    });
  });
  describe("getPixelData", () => {
    const somePixelData: Pixel = { bg: "PaleVioletRed", fg: "Olive", v: "*" };
    beforeEach(() => {
      canvas.canvas[1][2] = somePixelData;
    });
    it("should return the correct pixel data", () => {
      expect(canvas.getPixelData(1, 2)).toEqual(somePixelData);
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
  describe("setPixelData", () => {
    it("should work with partial pixel data", () => {
      canvas.setPixelData(1, 2, {});
      expect(canvas.canvas[1][2]).toEqual({ bg: "Black", fg: "White", v: " " });
    });
    it("should work with complete pixel data", () => {
      const pixel: Pixel = { bg: "PaleVioletRed", fg: "Olive", v: "*" };
      canvas.setPixelData(1, 2, pixel);
      expect(canvas.canvas[1][2]).toEqual(pixel);
    });
    it("should throw an error for a value with lenght of zero", () => {
      expect(() => canvas.setPixelData(1, 2, { v: "" })).toThrowError();
    });
    it("should throw an error for a value with lenght greater than", () => {
      expect(() =>
        canvas.setPixelData(1, 2, { v: "this is too long!" }),
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
      canvas.setPixelData(3, 5, { v: "*" });
      canvas.setPixelData(3, 1, { v: "a" });
      canvas.setPixelData(3, 2, { v: "b" });
      canvas.setPixelData(1, 2, { bg: "PaleVioletRed", fg: "Olive", v: "*" });
      canvas.setPixelData(3, 5, { bg: "White", fg: "Black", v: "\\" });
      canvas.setPixelData(3, 6, { bg: "White", fg: "Black", v: "/" });
      canvas.update();
      expect((process.stdout.write as jest.Mock).mock.calls).toMatchSnapshot();
    });
  });
  describe("writeCenteredRow", () => {
    const text = "foobar";
    const colors = { bg: "PaleVioletRed" as Color, fg: "Olive" as Color };
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
    const colors = { bg: "PaleVioletRed" as Color, fg: "Olive" as Color };
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
    const colors = { bg: "PaleVioletRed" as Color, fg: "Olive" as Color };
    beforeEach(() => {
      canvas.setPixelData = jest.fn();
    });
    it("should invoke setPixelData correctly without colors", () => {
      canvas.writeRow(2, 3, text);
      expect(canvas.setPixelData).toHaveBeenCalledTimes(3);
      expect(canvas.setPixelData).toHaveBeenCalledWith(2, 3, {
        bg: null,
        fg: null,
        v: "f",
      });
      expect(canvas.setPixelData).toHaveBeenCalledWith(2, 4, {
        bg: null,
        fg: null,
        v: "o",
      });
      expect(canvas.setPixelData).toHaveBeenCalledWith(2, 5, {
        bg: null,
        fg: null,
        v: "o",
      });
    });
    it("should invoke setPixelData correctly with colors", () => {
      canvas.writeRow(2, 3, text, colors);
      expect(canvas.setPixelData).toHaveBeenCalledTimes(3);
      expect(canvas.setPixelData).toHaveBeenCalledWith(2, 3, {
        bg: "PaleVioletRed",
        fg: "Olive",
        v: "f",
      });
      expect(canvas.setPixelData).toHaveBeenCalledWith(2, 4, {
        bg: "PaleVioletRed",
        fg: "Olive",
        v: "o",
      });
      expect(canvas.setPixelData).toHaveBeenCalledWith(2, 5, {
        bg: "PaleVioletRed",
        fg: "Olive",
        v: "o",
      });
    });
    it("should handle string that is too long for row", () => {
      canvas.writeRow(2, 19, text, colors);
      expect(canvas.setPixelData).toHaveBeenCalledTimes(1);
      expect(canvas.setPixelData).toHaveBeenCalledWith(2, 19, {
        bg: "PaleVioletRed",
        fg: "Olive",
        v: "f",
      });
    });
  });
});
