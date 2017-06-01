import Flipping, { IFlippingOptions, IFlipState } from './Flipping';
import * as Rematrix from 'rematrix';

interface IAnimationEffectTiming {
  delay?: number;
  duration?: string | number;
  easing?: string;
};

const waapiOnFlip = (timingOptions) => ({ delta, node, previous, first, last }: IFlipState) => {
  const translate = Rematrix.translate(
    delta.left,
    delta.top,    
  );

  const scale = Rematrix.scale(
    delta.width,
    delta.height,
  );
  
  const invertedMatrix = [
    Rematrix.parse(last.transform),
    translate,
    scale
  ].reduce(Rematrix.multiply).join(',');

  return (node as any).animate([
    {
      transform: `matrix3d(${invertedMatrix})`
    },
    {
      transform: last.transform
    }
  ], timingOptions);
};

const waapiOnRead = ({ animation }) => {
  animation
  && animation.cancel
  && animation.cancel();
};

const defaultTiming = {
  duration: 300,
  easing: 'ease'
};

class FlippingWeb extends Flipping {
  constructor(options: IFlippingOptions & IAnimationEffectTiming) {
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
