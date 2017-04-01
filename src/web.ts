import Flipping, { FlippingOptions } from './Flipping';

type AnimationEffectTiming = {
  delay?: number;
  duration?: string | number;
  easing?: string;
};

const waapiOnFlip = (timingOptions) => ({ delta, node }) => {
  console.log(timingOptions);
  return node.animate([
    {transformOrigin: 'top left', transform: `translate(${delta.left}px, ${delta.top}px)`},
    {transformOrigin: 'top left', transform: `translate(0,0) scale(1)`}
  ], timingOptions);
}

const waapiOnRead = ({ animation }) => animation && animation.cancel && animation.cancel();

const defaultTiming = {
  duration: 3000,
  easing: 'ease'
};

class FlippingWeb extends Flipping {
  constructor(options: FlippingOptions & AnimationEffectTiming) {
    const timingOptions = {
      duration: options.duration || defaultTiming.duration,
      easing: options.easing || defaultTiming.easing
    };

    super({
      onRead: waapiOnRead,
      onFlip: waapiOnFlip(timingOptions),
      ...options,
    });
  }
}

export = FlippingWeb;
