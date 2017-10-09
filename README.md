# Flipping (beta)

A tiny library (and collection of adapters) for [implementing FLIP transitions](https://aerotwist.com/blog/flip-your-animations/) easily.
Still in beta! Expect the API to change slightly before v1.0.

For more information about the FLIP technique, [view the FLIPping slides](https://slides.com/davidkhourshid/flipping).

## Quick Start
```
npm install flipping --save
```

Or grab the files directly:
- https://unpkg.com/flipping@latest/dist/flipping.js (core)
- https://unpkg.com/flipping@latest/dist/flipping.web.js (WAAPI adapter)
- https://unpkg.com/flipping@latest/dist/flipping.gsap.js (GSAP adapter)

```js
// import Flipping from 'flipping/strategies/web';
// import Flipping from 'flipping/strategies/gsap';
import Flipping from 'flipping';

const flipping = new Flipping();

// or, for example:
// const flipping = new Flipping({
//   onFlip: (state) => doYourAnimation(state)
// });

// ...
flipping.read();

doSomething(); // anything that changes the layout

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

Coming soon! For now, take a look at some of these examples:
- https://codepen.io/davidkpiano/pen/23400cac57335942be28642f6eb8bc7c
- https://codepen.io/davidkpiano/pen/xLKBpM
