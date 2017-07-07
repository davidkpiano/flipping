import Flipping, {
  IFlippingOptions,
  IFlipState,
  FlipIteratee
} from './Flipping';
import { slide as slideMode } from './modes/slide';
import { position as positionMode } from './modes/position';
import { matrixTranslate, matrixScale, matrixMultiply } from './utils';
import * as Rematrix from 'rematrix';

const slidingLayersAnimation = (state: IFlipState, options): any => {
  const { delta, node, previous, first, last } = state;
  const mode = slideMode(state);
  const containerFrom = matrixTranslate(
    mode.container.from.x,
    mode.container.from.y
  );
  const containerTo = matrixTranslate(mode.container.to.x, mode.container.to.y);
  const nodeFrom = matrixTranslate(mode.node.from.x, mode.node.from.y);
  const nodeTo = matrixTranslate(mode.node.to.x, mode.node.to.y);

  const nodeAnim = (node as any).animate(
    [
      {
        height: `${mode.container.height}px`,
        width: `${mode.container.width}px`,
        transformOrigin: 'top left',
        transform: `matrix3d(${nodeFrom})`
      },
      {
        height: `${mode.container.height}px`,
        width: `${mode.container.width}px`,
        transformOrigin: 'top left',
        transform: `matrix3d(${nodeTo})`
      }
    ],
    options
  );

  const containerAnim = (node.parentNode as any).animate(
    [
      {
        willChange: 'transform',
        height: `${mode.container.height}px`,
        width: `${mode.container.width}px`,
        transformOrigin: 'top left',
        transform: `matrix3d(${containerFrom})`
      },
      {
        willChange: 'transform',
        height: `${mode.container.height}px`,
        width: `${mode.container.width}px`,
        transformOrigin: 'top left',
        transform: `matrix3d(${containerTo})`
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

const scaleAnimation = (state: IFlipState, options): any => {
  const { delta, node, previous, first, last } = state;
  const translate = Rematrix.translate(delta.left, delta.top);

  const scale = Rematrix.scale(delta.width, delta.height);

  const invertedMatrix = matrixMultiply(
    Rematrix.parse(last.transform),
    translate,
    scale
  );

  return node.animate(
    [
      {
        transformOrigin: 'top left',
        transform: `matrix3d(${invertedMatrix})`
      },
      {
        transformOrigin: 'top left',
        transform: last.transform
      }
    ],
    options
  );
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

const defaultOptions: IFlippingOptions & AnimationEffectTiming = {
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

  constructor(options: IFlippingOptions & AnimationEffectTiming = {}) {
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
