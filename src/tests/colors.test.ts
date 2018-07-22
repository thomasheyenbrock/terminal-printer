import { colors, getRgbFromHex, getTerminalColor, toHex } from "../colors";

describe("colors", () => {
  describe("getRgbFromHex", () => {
    it("should convert the hex color correctly", () => {
      expect(getRgbFromHex("#9932CC")).toEqual({
        b: 204,
        g: 50,
        r: 153,
      });
    });
  });
  describe("getTerminalColor", () => {
    describe.each([["fg", "3"], ["bg", "4"]])(
      "color for %s",
      (type, expectedNumber) => {
        it("should return nothing when no color is passed", () => {
          expect(getTerminalColor(type, null)).toBe("");
        });
        it("should return the correct color if the color is a string", () => {
          expect(getTerminalColor(type, "PaleVioletRed")).toBe(
            `\x1b[${expectedNumber}8;2;219;112;147m`,
          );
        });
        it("should return the correct color if the color is an object", () => {
          expect(getTerminalColor(type, { r: 1, g: 2, b: 3 })).toBe(
            `\x1b[${expectedNumber}8;2;1;2;3m`,
          );
        });
      },
    );
  });
  describe("toHex", () => {
    describe.each(Object.keys(colors))("color %s", (color: Color) => {
      it("should find the color", () => {
        expect(toHex(color)).toBe(colors[color]);
      });
    });
    it("should throw an error for an unknown color", () => {
      const unknownColor = "foobar";
      const expectedError = new Error(`Color ${unknownColor} was not found.`);
      expect(() => toHex(unknownColor as Color)).toThrowError(expectedError);
    });
  });
});
