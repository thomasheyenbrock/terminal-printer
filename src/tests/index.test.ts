import { Printer } from "../index";

const processRows = 11;
const processColumns = 21;

describe("Printer", () => {
  let printer: Printer;
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
    printer = new Printer(config);
  });
  describe("constructor", () => {
    describe("without config", () => {
      beforeEach(() => {
        printer = new Printer();
      });
      it("should throw an error if no height could be found", () => {
        delete process.stdout.rows;
        expect(() => new Printer()).toThrowError();
      });
      it("should throw an error if no width could be found", () => {
        delete process.stdout.columns;
        expect(() => new Printer()).toThrowError();
      });
      it("should use the process rows as height", () => {
        expect(printer.height).toBe(processRows);
      });
      it("should use the process columns as width", () => {
        expect(printer.width).toBe(processColumns);
      });
      it("should use null as background color", () => {
        expect(printer.getPixel(0, 0).backgroundColor).toBeNull();
      });
      it("should use null as foreground color", () => {
        expect(printer.getPixel(0, 0).foregroundColor).toBeNull();
      });
    });
    it("should use the provided height", () => {
      expect(printer.height).toBe(config.height);
    });
    it("should use the provided width", () => {
      expect(printer.width).toBe(config.width);
    });
    it("should use the provided background color", () => {
      expect(printer.getPixel(0, 0).backgroundColor).toBe(
        config.backgroundColor,
      );
    });
    it("should use the provided foreground color", () => {
      expect(printer.getPixel(0, 0).foregroundColor).toBe(
        config.foregroundColor,
      );
    });
    it("should use empty strings as values", () => {
      expect(printer.getPixel(0, 0).value).toBe(" ");
    });
  });
  describe("clear", () => {
    beforeEach(() => {
      printer.setPixel = jest.fn();
    });
    it("should call setPixel for each pixel", () => {
      printer.clear();
      expect(printer.setPixel).toHaveBeenCalledTimes(
        printer.height * printer.width,
      );
      expect((printer.setPixel as jest.Mock).mock.calls[0]).toEqual([
        0,
        0,
        { backgroundColor: null, foregroundColor: null, value: " " },
      ]);
    });
    it("should be able to set background color", () => {
      printer.clear({ backgroundColor: "PaleVioletRed" });
      expect((printer.setPixel as jest.Mock).mock.calls[0]).toEqual([
        0,
        0,
        { backgroundColor: "PaleVioletRed", foregroundColor: null, value: " " },
      ]);
    });
    it("should be able to set foreground color", () => {
      printer.clear({ foregroundColor: "PaleVioletRed" });
      expect((printer.setPixel as jest.Mock).mock.calls[0]).toEqual([
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
      printer.setPixel(1, 2, somePixel);
    });
    it("should return the correct pixel", () => {
      expect(printer.getPixel(1, 2)).toEqual(somePixel);
    });
  });
  describe("hideCursor", () => {
    it("should print the expected string", () => {
      printer.hideCursor();
      expect(process.stdout.write).toHaveBeenCalledTimes(1);
      expect(process.stdout.write).toHaveBeenCalledWith("\u001B[?25l");
    });
  });
  describe("print", () => {
    it("should print the complete canvas", () => {
      printer.print();
      expect(process.stdout.write).toHaveBeenCalledTimes(2);
      expect((process.stdout.write as jest.Mock).mock.calls).toMatchSnapshot();
    });
  });
  describe("setPixel", () => {
    it("should work with partial pixel", () => {
      printer.setPixel(1, 2, {});
      expect(printer.getPixel(1, 2)).toEqual({
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
      printer.setPixel(1, 2, pixel);
      expect(printer.getPixel(1, 2)).toEqual(pixel);
    });
    it("should throw an error for a value with lenght of zero", () => {
      expect(() => printer.setPixel(1, 2, { value: "" })).toThrowError();
    });
    it("should throw an error for a value with lenght greater than", () => {
      expect(() =>
        printer.setPixel(1, 2, { value: "this is too long!" }),
      ).toThrowError();
    });
  });
  describe("showCursor", () => {
    it("should print the expected string", () => {
      printer.showCursor();
      expect(process.stdout.write).toHaveBeenCalledTimes(1);
      expect(process.stdout.write).toHaveBeenCalledWith("\u001B[?25h");
    });
  });
  describe("update", () => {
    it("should print the expected string", () => {
      printer.setPixel(3, 5, { value: "*" });
      printer.setPixel(3, 1, { value: "a" });
      printer.setPixel(3, 2, { value: "b" });
      printer.setPixel(1, 2, {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "*",
      });
      printer.setPixel(3, 5, {
        backgroundColor: "White",
        foregroundColor: "Black",
        value: "\\",
      });
      printer.setPixel(3, 6, {
        backgroundColor: "White",
        foregroundColor: "Black",
        value: "/",
      });
      printer.update();
      expect((process.stdout.write as jest.Mock).mock.calls).toMatchSnapshot();
    });
    it("should print the expected string when the first pixel has no colors", () => {
      printer.setPixel(1, 2, { value: "*" });
      printer.update();
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
      printer.writeRow = jest.fn();
    });
    it("should invoke writeRow correctly without colors", () => {
      printer.writeCenteredRow(2, text);
      expect(printer.writeRow).toHaveBeenCalledTimes(1);
      expect(printer.writeRow).toHaveBeenCalledWith(2, 7, text, undefined);
    });
    it("should invoke writeRow correctly with colors", () => {
      printer.writeCenteredRow(2, text, colors);
      expect(printer.writeRow).toHaveBeenCalledTimes(1);
      expect(printer.writeRow).toHaveBeenCalledWith(2, 7, text, colors);
    });
  });
  describe("writeCenteredText", () => {
    const text = "foo\nbar";
    const colors = {
      backgroundColor: "PaleVioletRed" as Color,
      foregroundColor: "Olive" as Color,
    };
    beforeEach(() => {
      printer.writeCenteredRow = jest.fn();
    });
    it("should invoke writeCenteredText correctly without colors", () => {
      printer.writeCenteredText(text);
      expect(printer.writeCenteredRow).toHaveBeenCalledTimes(2);
      expect(printer.writeCenteredRow).toHaveBeenCalledWith(
        4,
        "foo",
        undefined,
      );
      expect(printer.writeCenteredRow).toHaveBeenCalledWith(
        5,
        "bar",
        undefined,
      );
    });
    it("should invoke writeCenteredText correctly without colors", () => {
      printer.writeCenteredText(text, colors);
      expect(printer.writeCenteredRow).toHaveBeenCalledTimes(2);
      expect(printer.writeCenteredRow).toHaveBeenCalledWith(4, "foo", colors);
      expect(printer.writeCenteredRow).toHaveBeenCalledWith(5, "bar", colors);
    });
  });
  describe("writeRow", () => {
    const text = "foo";
    const colors = {
      backgroundColor: "PaleVioletRed" as Color,
      foregroundColor: "Olive" as Color,
    };
    beforeEach(() => {
      printer.setPixel = jest.fn();
    });
    it("should invoke setPixel correctly without colors", () => {
      printer.writeRow(2, 3, text);
      expect(printer.setPixel).toHaveBeenCalledTimes(3);
      expect(printer.setPixel).toHaveBeenCalledWith(2, 3, {
        backgroundColor: null,
        foregroundColor: null,
        value: "f",
      });
      expect(printer.setPixel).toHaveBeenCalledWith(2, 4, {
        backgroundColor: null,
        foregroundColor: null,
        value: "o",
      });
      expect(printer.setPixel).toHaveBeenCalledWith(2, 5, {
        backgroundColor: null,
        foregroundColor: null,
        value: "o",
      });
    });
    it("should invoke setPixel correctly with colors", () => {
      printer.writeRow(2, 3, text, colors);
      expect(printer.setPixel).toHaveBeenCalledTimes(3);
      expect(printer.setPixel).toHaveBeenCalledWith(2, 3, {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "f",
      });
      expect(printer.setPixel).toHaveBeenCalledWith(2, 4, {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "o",
      });
      expect(printer.setPixel).toHaveBeenCalledWith(2, 5, {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "o",
      });
    });
    it("should handle string that is too long for row", () => {
      printer.writeRow(2, 19, text, colors);
      expect(printer.setPixel).toHaveBeenCalledTimes(1);
      expect(printer.setPixel).toHaveBeenCalledWith(2, 19, {
        backgroundColor: "PaleVioletRed",
        foregroundColor: "Olive",
        value: "f",
      });
    });
  });
});
