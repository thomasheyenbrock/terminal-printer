# terminal-canvas

This module allows you to turn your terminal screen info a canvas where
you can simply print text in all imaginable colors. You can also do
pixel-art and finally create those fancy stuff you always imagined!

Here are some exampes of what you might be be able to do with this:

![presentation](/demo/presentation.gif)
![snake](/demo/snake.gif)
![matrix](/demo/matrix.gif)
![game-of-life](/demo/game-of-life.gif)

## Installation

Just install the package as dependency with `npm` or `yarn`:

```sh
npm install --save terminal-canvas

# or

yarn add terminal-canvas
```

## Getting started

The module exports one class called `Canvas` which you can use to create awesomeness.

```js
import { Canvas } from "terminal-canvas";

const canvas = new Canvas();
```

Usually you want to get the cursor out of the way while using the canvas. Nothing more easy that that!

```js
canvas.hideCursor();
```

First, let's print the canvas:

```js
canvas.print();
```

Per default the canvas spans accross the full width of your termial.

Now let's write some text:

```js
canvas.writeCenteredText("Hello world!");
```

Well, you might be sad until now, because the canvas is still empty. Thats because it does not automatically update, you have to explicitly tell it to do so. (The reason for this simply is performance. You often want to write multiple things. The `canvas` collects all updates and prints them in one go.)

So let's update the canvas to see the result:

```js
canvas.update();
```

Horray! You should now see the following:

![getting-started](/demo/getting-started.png)

In the end, don't forget to get your cursor back!

```js
canvas.showCursor();
```

## Documentation

### Constructor

The constructor accepts one optional argument `config`, which is an object that can be used to configure the canvas:

```ts
const canvas = new Canvas(config);

typeof config = {
  /*
   * `height` and `width` can be used to controll the rows and columns
   * of the canvas. Per default the value from the node process stdout
   * (`process.stdout.rows` and `process.stdout.columns`) are used
   */
  height?: number;
  width?: number;
  /*
   * You can optionally specify colors for background and foreground.
   * The type `Color` represents valid CSS color names as strings
   * (see https://www.w3schools.com/cssref/css_colors.asp for a list).
   */
  backgroundColor?: RgbColor | Color;
  foregroundColor?: RgbColor | Color;
};

/* This object type represents a color by its RGB values. */
type RgbColor = { r: number; g: number; b: number; };
```

### Properties

Here are the available properties of a `Canvas` object.

#### height

```js
canvas.height; // returns the height of the canvas, i.e. the number of rows
```

#### width

```js
canvas.width; // returns the width of the canvas, i.e. the number of columns
```

### Methods

Here are the available methods of a `Canvas` object.

#### clear

This method clears all content from the canvas. You can optionally specify the back- and foreground color after the reset. The method does not return anything.

```ts
canvas.clear(colors);

typeof colors = {
  backgroundColor?: RgbColor | Color;
  foregroundColor?: RgbColor | Color;
}
```

#### getPixel

This method returns the data for a specific pixel in your canvas. You have to specify the row and the column for the pixel you want to get.

The response will be an object containing `backgroundColor`, `foregroundColor` and `value` for the pixel.

```js
canvas.getPixel(17, 42);
/*
 * returns for example
 * {
 *   backgroundColor: "Black",
 *   foregroundColor: { r: 235, g: 255, b: 195 },
 *   value: "*"
 * }
 */
```

#### hideCursor

This method hides the cursor in the terimal. It does not return anything:

```js
canvas.hideCursor();
```

#### print

This method prints the complete canvas. This means that also those pixels will be re-printed where the values have actually not changed. The method does not return anything.

```js
canvas.print();
```

#### setPixel

This method allows you to set the value and the colors for a single pixel. With the first two arguments you have to specify the row and column of the pixel. The third parameter and its properties are all optional, so you could e.g. only set the value and leave the colors unchanged. The value (if specified) has to be a string of length one. The method does not return anything.

```js
canvas.setPixel(1, 2, {
  backgroundColor: "Black",
  foregroundColor: { r: 235, g: 255, b: 195 },
  value: "*",
});
canvas.setPixel(17, 42, {
  value: "X",
});
```

##### showCursor

This method shows the cursor in the terimal. It does not return anything:

```js
canvas.showCursor();
```

#### update

This method prints all pixels of the canvas that have changes since the last print or update. This means that only those pixels will be re-printed where the values have actually changed. It is therefore much more efficient to use `update` in comparison to `print`. The method does not return anything.

```js
canvas.update();
```

#### writeCenteredRow

This method writes some text into a specific row of the canvas and automatically centeres the text. The first argument is the number of the row, the second is the text. In an optional third argument you can specify back- and foreground colors. It does not return anyting:

```js
canvas.writeCenteredRow(1, "Hello world!", {
  backgroundColor: "Black",
  foregroundColor: { r: 235, g: 255, b: 195 },
});
canvas.writeCenteredRow(2, "I am text on the canvas.");
```

#### writeCenteredText

This method writes some text on the canvas and automatically centeres the text vertically and horizontally. The first argument is the text. It will be automatically splitted by newline-characters. In an optional second argument you can specify back- and foreground colors. It does not return anyting:

```js
canvas.writeCenteredText("Hello world!\nThis is the next row...", {
  backgroundColor: "Black",
  foregroundColor: { r: 235, g: 255, b: 195 },
});
canvas.writeCenteredText("Only one row in the end...works just as well!");
```

#### writeRow

This method writes some text into a specific row of the canvas. You can also choose in which column to start writing. The first argument is the number of the row, the second the column number and the third is the text. In an optional fourth argument you can specify back- and foreground colors. It does not return anyting:

```js
canvas.writeRow(7, 9, "Hello world!", {
  backgroundColor: "Black",
  foregroundColor: { r: 235, g: 255, b: 195 },
});
canvas.writedRow(9, 0, "This text starts right in the first column.");
```
