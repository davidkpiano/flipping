import Flipping, { FlippingOptions } from './Flipping';
import * as sineInOut from 'eases/sine-in-out';
import * as Observable from 'zen-observable/index.js';

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

const animationFrameOnFlip = (timingOptions: AnimationFrameTiming) => ({ delta, node }, done) => {
  const start = now();
  const easing: Function = timingOptions.easing || sineInOut;
  const offset$ = animationFrames(timingOptions.duration);

  const animation = offset$.subscribe(offset => {
      const easeOffset = sineInOut(offset);
      const offsetRad = offset * Math.PI / 2;

      const x = delta.left - delta.left * Math.sin(offsetRad);
      const y = delta.top * Math.cos(offsetRad);

      node.style.setProperty('transform', `translate(${x}px, ${y}px)`);
    },
    () => { identity },
    () => {
      node.style.setProperty('transform', 'none');
      done();
    });

  return animation;
}

const animationFrameOnRead = ({animation, node}) => {
  node.style.setProperty('transform', 'none');
  animation && animation.unsubscribe();
}

const defaultTiming = {
  duration: 300,
  easing: sineInOut
};

class FlippingWeb extends Flipping {
  constructor(options: FlippingOptions & AnimationFrameTiming) {
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
