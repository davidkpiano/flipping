import Flipping, { IFlippingOptions } from './Flipping';
import * as sineInOut from 'eases/sine-in-out';
import * as Observable from 'zen-observable/index.js';
import * as Rematrix from 'rematrix';

const now = Date.now;
const identity = a => a;

const animationFrames = (duration: number) => new Observable(observer => {
  const start = now();
  let ticking = true;

  const tick = () => {
    const offset = (now() - start) / duration;

    if (offset >= 1 || !ticking) {
      observer.next(1);
      observer.complete();
    } else {
      observer.next(offset);
      requestAnimationFrame(tick);
    }
  }

  const unsubscribe = () => {
    ticking = false;
  }

  tick();

  return unsubscribe;
});

type AnimationFrameTiming = {
  delay?: number;
  duration?: number;
  easing?: Function;
};

const animationFrameOnFlip = (timingOptions: AnimationFrameTiming) => ({ delta, last, node, start }, done) => {
  const easing: Function = timingOptions.easing || sineInOut;
  const offset$ = animationFrames(timingOptions.duration);

  const animation = offset$.subscribe(offset => {
      const easeOffset = sineInOut(offset);
      const offsetRad = offset * Math.PI / 2;

      const x = delta.left - delta.left * Math.sin(offsetRad);
      const y = delta.top * Math.cos(offsetRad);
      const width = (1 - delta.width) * easeOffset + delta.width;
      const height = (1 - delta.height) * easeOffset + delta.height;

      const translate = Rematrix.translate(x, y);
      const scale = Rematrix.scale(width, height);
      const invertedMatrix = [
        Rematrix.parse(last.transform),
        translate,
        scale
      ].reduce(Rematrix.multiply).join(',');

      node.style.setProperty('transform', `matrix3d(${invertedMatrix})`);
    },
    () => { identity },
    () => {
      node.style.removeProperty('transform');
      done();
    });

  return animation;
}

const animationFrameOnRead = ({animation, node, bounds}) => {
  node.style.removeProperty('transform');
  animation && animation.unsubscribe();
}

const defaultTiming = {
  duration: 300,
  easing: sineInOut
};

class FlippingWeb extends Flipping {
  constructor(options: IFlippingOptions & AnimationFrameTiming) {
    const timingOptions: AnimationFrameTiming = {
      duration: options.duration || defaultTiming.duration,
      easing: options.easing || defaultTiming.easing
    };

    super({
      onRead: animationFrameOnRead,
      onFlip: animationFrameOnFlip(timingOptions),
      ...options,
    });
  }
}

export = FlippingWeb;
