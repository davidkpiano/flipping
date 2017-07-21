import Flipping, { IFlipState, IFlippingConfig } from './Flipping';
import * as modes from './modes';
import { matrixTranslate } from './utils';
import * as sineInOut from 'eases/sine-in-out';
import * as quadOut from 'eases/quad-out';
import * as Observable from 'zen-observable/index.js';
import * as Rematrix from 'rematrix';

const now = Date.now;
const identity = a => a;

const animationFrames = (duration: number) =>
  new Observable(observer => {
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
    };

    const unsubscribe = () => {
      ticking = false;
      observer.complete();
    };

    tick();

    return unsubscribe;
  });

const style = (node: Element, style: string): void => {
  node.setAttribute('style', style);
};

const unstyle = (node: Element): void => {
  node.setAttribute('style', '');
};

type AnimationFrameTiming = {
  delay?: number;
  duration?: number;
  easing?: Function;
};

const slidingLayersAnimation = (state: IFlipState, options): any => {
  const { node } = state;
  const mode = modes.slide(state);
  const offset$ = animationFrames(options.duration);

  const animation = offset$.subscribe(
    offset => {
      const easeOffset = (options.easing || sineInOut)(offset);

      const containerDeltaLeft = mode.container.to.x - mode.container.from.x;
      const containerDeltaTop = mode.container.to.y - mode.container.from.y;

      const nodeDeltaLeft = mode.node.to.x - mode.node.from.x;
      const nodeDeltaTop = mode.node.to.y - mode.node.from.y;

      const containerX =
        mode.container.from.x + containerDeltaLeft * easeOffset;
      const containerY = mode.container.from.y + containerDeltaTop * easeOffset;

      const nodeX = mode.node.from.x + nodeDeltaLeft * easeOffset;
      const nodeY = mode.node.from.y + nodeDeltaTop * easeOffset;

      style(
        node,
        `
        height: ${mode.node.from.height}px;
        width: ${mode.node.from.width}px;
        transform-origin: ${mode.node.from.transformOrigin};
        transform: matrix3d(${matrixTranslate(nodeX, nodeY)});
      `
      );

      style(
        node.parentElement,
        `
        height: ${mode.container.to.height}px;
        width: ${mode.container.to.width}px;
        transform-origin: ${mode.container.to.transformOrigin};
        transform: matrix3d(${matrixTranslate(containerX, containerY)});
      `
      );
    },
    identity,
    () => {
      unstyle(node);
      unstyle(node.parentElement);
    }
  );

  return animation;
};

const scaleAnimation = (
  { delta, bounds, node }: IFlipState,
  timingOptions: AnimationFrameTiming
) => {
  const easing: Function = timingOptions.easing || sineInOut;
  const offset$ = animationFrames(timingOptions.duration);

  const animation = offset$.subscribe(
    offset => {
      const easeOffset = easing(offset);
      const offsetRad = easeOffset * Math.PI / 2;

      const x = delta.left - delta.left * Math.sin(offsetRad);
      const y = delta.top * Math.cos(offsetRad);
      const scaleChanged = delta.width !== 1 || delta.height !== 1;
      const width = (1 - delta.width) * easeOffset + delta.width;
      const height = (1 - delta.height) * easeOffset + delta.height;

      const translate = Rematrix.translate(x, y);
      const scale = Rematrix.scale(width, height);
      const invertedMatrix = [
        translate,
        scale,
        Rematrix.parse(bounds.transform)
      ]
        .reduce(Rematrix.multiply)
        .join(',');

      style(
        node,
        `
        ${scaleChanged ? 'transform-origin: top left;' : ''}
        transform: matrix3d(${invertedMatrix});
      `
      );
    },
    () => identity,
    () => {
      unstyle(node);
    }
  );

  return animation;
};

const animationFrameOnRead = ({ animation, node }) => {
  node.setAttribute('style', '');
  (node.parentNode as HTMLElement).setAttribute('style', '');
  if (animation) {
    animation.unsubscribe();
  }
};

const defaultTiming = {
  duration: 300,
  easing: quadOut
};

const strategyAnimation = (state: IFlipState, options) => {
  const { node } = state;

  if (
    node &&
    node.parentElement &&
    node.parentElement.hasAttribute('data-flip-wrap')
  ) {
    return slidingLayersAnimation(state, options);
  }

  return scaleAnimation(state, options);
};

class FlippingAnimationFrame extends Flipping {
  static animate = {
    auto: strategyAnimation,
    transform: scaleAnimation,
    slidingLayers: slidingLayersAnimation
  };

  constructor(options: IFlippingConfig & AnimationFrameTiming = {}) {
    const timingOptions: AnimationFrameTiming = {
      duration: options.duration || defaultTiming.duration,
      easing: options.easing || defaultTiming.easing
    };

    super({
      onRead: animationFrameOnRead,
      onEnter: state =>
        FlippingAnimationFrame.animate.auto(state, timingOptions),
      onFlip: state =>
        FlippingAnimationFrame.animate.auto(state, timingOptions),
      getBounds: node => {
        const bounds = Flipping.rect(node);

        if (
          node &&
          node.parentElement &&
          node.parentElement.hasAttribute('data-flip-wrap')
        ) {
          const wrapBounds = Flipping.rect(node.parentElement);

          bounds.width -= Math.abs(bounds.left - wrapBounds.left);
          bounds.height -= Math.abs(bounds.top - wrapBounds.top);
        }

        return bounds;
      },
      ...options
    });
  }
}

export = FlippingAnimationFrame;
