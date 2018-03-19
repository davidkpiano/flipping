# Flipping

A library (and collection of adapters) for [implementing FLIP transitions](https://css-tricks.com/animating-layouts-with-the-flip-technique/).

For more information about the FLIP technique, view the flipping slides:
- [CSS Dev Conf 2017](https://slides.com/davidkhourshid/flipping)
- [CSSConf AU 2018](https://slides.com/davidkhourshid/illusions)

## Examples
- https://codepen.io/davidkpiano/pen/xLKBpM
- https://codepen.io/davidkpiano/pen/vmXErw
- https://codepen.io/davidkpiano/pen/xPVJwm
- https://codepen.io/davidkpiano/pen/RjaBpW
- https://codepen.io/davidkpiano/pen/zWrRye

## Installation
```
npm install flipping@latest --save
```

Or grab the files directly:
- https://unpkg.com/flipping@latest/dist/flipping.js (core)
- https://unpkg.com/flipping@latest/dist/flipping.web.js (WAAPI adapter)
- 🔜 https://unpkg.com/flipping@latest/dist/flipping.css.js (CSS adapter - WIP!)

## Quick Start

In your HTML, add the `data-flip-key="..."` attribute to shared elements (see HTML example below).

```js
import Flipping from 'flipping';

const flipping = new Flipping();

// Before a layout change happens
flipping.read();

// Any effect that changes the layout
doSomething(); 

// After a layout change happens
// With an adapter, this will start the FLIP animation
flipping.flip();
```

```html
<!-- first view -->
<section class="gallery">
  <div class="photo-1" data-flip-key="photo-1">
    <img src="/photo-1"/>
  </div>
  <div class="photo-2" data-flip-key="photo-2">
    <img src="/photo-2"/>
  </div>
  <div class="photo-3" data-flip-key="photo-3">
    <img src="/photo-3"/>
  </div>
</section>

<!-- second view -->
<section class="details">
  <div class="photo" data-flip-key="photo-1">
    <img src="/photo-1"/>
  </div>
  <p class="description">
    Lorem ipsum dolor sit amet...
  </p>
</section>
```

## API

### `new Flipping(options?)`

Creates a new `Flipping` instance. This is the thing that keeps track of all the changes made, and determines if any elements changed positions or size.

**Parameters for `options`**

For greater control and custom animations, you can pass in the following parameters (all optional):

-  `selector?: (parent: Element) => Element[];` - Selects all "flippable" elements. Defaults to all elements that have a `[data-flip-key]` attribute.
-  `activeSelector: (element) => Element[];` - Selects the currently active "flippable" elements. Defaults to selecting the visible flippable elements.
-  `onFlip?: (state: IFlipStateMap) => void;` - Event listener. Called with the entire state map of tracked flippable elements whenever `.flip()` is called.
-  `onRead?: (state: IFlipStateMap) => void;` - Event listener. Called with the entire state map of tracked flippable elements whenever `.read()` is called.
-  `onEnter?: (state: IFlipStateMap) => void;` - Event listener. Called with the state map of elements that enter (that is, not previously tracked).
-  `onLeave?: (state: IFlipStateMap) => void;` - Event listener. Called with the state map of elements that leave (that is, previously tracked but no longer active).
-  `parent?: Element;` - The root element to query all flippable elements. Defaults to the `<body>`.
-  `plugins?: FlipPlugin[];` - An array of plugins that transform the state map before being emitted.

### `flipping.read(): void`

Queries all the flippable selectors and reads their bounds (position and size). This must be called before layout cahnges are made.

Will call any `onRead()` event listeners with the entire state map.

### `flipping.flip(): void`

Queries all the flippable selectors and reads their bounds (position and size), and then determines the deltas (changes in position and/or size)

Will call any `onFlip()` event listeners with the entire state map.

### `flipping.wrap(fn): void`

1. Calls `flipping.read()`
2. Calls the wrapped `fn()`
3. Returns the result of the wrapped `fn()`
4. Calls `flipping.flip()`

It's a nice shorthand. Use it.

### `data-flip-key="..."`

HTML data-attribute that tracks the same/shared elements and identifies them as the "same" element.

### `data-flip-no-scale`

HTML data-attribute that prevents the Flipping adapters from trying to apply `scale()` to a transformed element.

- https://codepen.io/davidkpiano/pen/RjaBpW
- https://codepen.io/davidkpiano/pen/xLKBpM
