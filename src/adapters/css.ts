import Flipping from '../Flipping';

class FlippingCSS extends Flipping {
  constructor() {
    super({
      onFlip: stateMap => {
        console.log(stateMap);
      }
    });
  }
}

export = FlippingCSS;
