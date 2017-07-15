import Flipping, { IFlippingConfig, IFlipState } from './Flipping';
import * as modes from './modes';
// import { matrixMultiply } from './utils';
// import * as Rematrix from 'rematrix';

const slidingLayersAnimation = (state: IFlipState, options): any => {
  const { node } = state;
  const mode = modes.slide(state);

  const nodeAnim = node.animate(
    [
      {
        height: `${mode.node.from.height}px`,
        width: `${mode.node.from.width}px`,
        transformOrigin: mode.node.from.transformOrigin,
        transform: mode.node.from.transform
      },
      {
        height: `${mode.node.to.height}px`,
        width: `${mode.node.to.width}px`,
        transformOrigin: mode.node.to.transformOrigin,
        transform: mode.node.to.transform
      }
    ],
    options
  );

  const containerAnim = node.parentElement.animate(
    [
      {
        willChange: 'transform',
        height: `${mode.container.from.height}px`,
        width: `${mode.container.from.width}px`,
        transformOrigin: mode.container.from.transformOrigin,
        transform: mode.container.from.transform
      },
      {
        willChange: 'transform',
        height: `${mode.container.to.height}px`,
        width: `${mode.container.to.width}px`,
        transformOrigin: mode.container.to.transformOrigin,
        transform: mode.container.to.transform
      }
    ],
    options
  );

  return {
    finish: () => {
      nodeAnim.finish();
      containerAnim.finish();
    }
  };
};

const scaleAnimation = (state: IFlipState, options: any = {}): any => {
  const { node } = state;
  const mode = modes.scale(state);

  const nodeAnim = node.animate(
    [
      {
        transformOrigin: mode.node.from.transformOrigin || 'inherit',
        transform: mode.node.from.transform
      },
      {
        transformOrigin: mode.node.to.transformOrigin || 'inherit',
        transform: mode.node.to.transform
      }
    ],
    options
  );

  // if (options.crossFade && previous && previous.node) {
  //   const matrix = matrixMultiply(
  //     Rematrix.parse(first.transform),
  //     Rematrix.translate(-1 * delta.left, -1 * delta.top),
  //     Rematrix.scale(1 / delta.width, 1 / delta.height)
  //   );
  //   const prevNodeAnim = previous.node.animate(
  //     [
  //       {
  //         opacity: 1,
  //         visibility: 'visible',
  //         transformOrigin: 'top left',
  //         transform: first.transform
  //       },
  //       {
  //         opacity: 0,
  //         visibility: 'hidden',
  //         transformOrigin: 'top left',
  //         transform: `matrix3d(${matrix})`
  //       }
  //     ],
  //     options
  //   );

  //   return {
  //     finish: () => {
  //       nodeAnim.finish();
  //       prevNodeAnim.finish();
  //     }
  //   };
  // }

  return nodeAnim;
};

const strategyAnimation = (state: IFlipState, options): any => {
  const { node } = state;

  if (!node) {
    return;
  }

  if (
    node &&
    node.parentElement &&
    node.parentElement.hasAttribute('data-flip-wrap')
  ) {
    return slidingLayersAnimation(state, options);
  }

  return scaleAnimation(state, options);
};

const waapiOnRead = ({ animation }) => {
  if (animation && animation.finish) {
    animation.finish();
  }
};

const defaultOptions: IFlippingConfig & AnimationEffectTiming = {
  duration: 300,
  easing: 'ease',
  fill: 'none',
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
  }
};

class FlippingWeb extends Flipping {
  static animate = {
    default: strategyAnimation,
    transform: scaleAnimation,
    slidingLayers: slidingLayersAnimation
  };

  constructor(options: IFlippingConfig & AnimationEffectTiming = {}) {
    const optionsWithDefaults = {
      ...defaultOptions,
      ...options
    };

    super({
      onRead: waapiOnRead,
      onFlip: state => FlippingWeb.animate.default(state, optionsWithDefaults),
      ...optionsWithDefaults
    });
  }
}

export = FlippingWeb;
