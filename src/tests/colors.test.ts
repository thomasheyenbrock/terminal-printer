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
    describe.each([["foreground", "3"], ["background", "4"]])(
      "color for %s",
      (type, expectedNumber) => {
        it("should return nothing when no color is passed", () => {
          expect(
            getTerminalColor(type as "foreground" | "background", null),
          ).toBe("");
        });
        it("should return the correct color if the color is a string", () => {
          expect(
            getTerminalColor(
              type as "foreground" | "background",
              "PaleVioletRed",
            ),
          ).toBe(`\x1b[${expectedNumber}8;2;219;112;147m`);
        });
        it("should return the correct color if the color is an object", () => {
          expect(
            getTerminalColor(type as "foreground" | "background", {
              b: 3,
              g: 2,
              r: 1,
            }),
          ).toBe(`\x1b[${expectedNumber}8;2;1;2;3m`);
        });
      },
    );
  });
  describe("toHex", () => {
    describe.each(Object.keys(colors))("color %s", color => {
      it("should find the color", () => {
        expect(toHex(color as Color)).toBe(colors[color as Color]);
      });
    });
    it("should throw an error for an unknown color", () => {
      const unknownColor = "foobar";
      const expectedError = new Error(`Color ${unknownColor} was not found.`);
      expect(() => toHex(unknownColor as Color)).toThrowError(expectedError);
    });
  });
});
