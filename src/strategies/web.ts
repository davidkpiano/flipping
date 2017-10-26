import {
  IFlippingConfig,
  IFlipState,
  IFlipStateMap,
  IFlipNodesMode
} from '../types';
import Flipping from '../Flipping';
import * as animations from '../animations';
import { mapValues, styleValue, getStaggerDelay } from '../utils';

interface ICustomEffectTiming {
  stagger?: number | ((index: number) => number);
}

type FlippingWebOptions = IFlippingConfig &
  AnimationEffectTiming &
  ICustomEffectTiming;

function animate(
  mode: IFlipNodesMode,
  nodeMap: Record<string, Element>,
  options: FlippingWebOptions
): any {
  const nodeAnimations = mapValues(nodeMap, (node, nodeKey) => {
    return node.animate(
      [
        mapValues(mode[nodeKey].from, (value, prop) => styleValue(prop, value)),
        mapValues(mode[nodeKey].to, (value, prop) => styleValue(prop, value))
      ],
      options
    );
  });

  return {
    finish: () => {
      Object.keys(nodeAnimations).forEach(nodeKey =>
        nodeAnimations[nodeKey].finish()
      );
    }
  };
}

const slidingLayersAnimation = (
  state: IFlipState,
  options: FlippingWebOptions
): any => {
  const { node } = state;
  const mode = animations.slide(state);

  return animate(
    mode,
    {
      node,
      container: node.parentElement
    },
    options
  );
};

const scaleAnimation = (
  state: IFlipState,
  options: FlippingWebOptions = {}
): any => {
  const { node } = state;
  const mode = animations.scale(state);

  return animate(mode, { node }, options);
};

const autoAnimation = (state: IFlipState, options: FlippingWebOptions): any => {
  const { node } = state;

  const timingOptions: FlippingWebOptions = {
    ...options,
    delay:
      +(options.delay || 0) + getStaggerDelay(state.index, options.stagger),
    fill: options.stagger ? 'both' : 'none'
  };

  if (!node) {
    return;
  }

  if (
    node &&
    node.parentElement &&
    node.parentElement.hasAttribute('data-flip-wrap')
  ) {
    return slidingLayersAnimation(state, timingOptions);
  }

  return scaleAnimation(state, timingOptions);
};

function waapiOnRead(stateMap: IFlipStateMap): void {
  Object.keys(stateMap).forEach(key => {
    const { animation } = stateMap[key];

    if (animation && animation.finish) {
      animation.finish();
    }
  });
}

class FlippingWeb extends Flipping {
  static defaults: FlippingWebOptions = {
    duration: 300,
    easing: 'ease',
    fill: 'none',
    stagger: 0,
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

  static animate = {
    auto: autoAnimation,
    transform: scaleAnimation,
    slidingLayers: slidingLayersAnimation
  };

  constructor(options: FlippingWebOptions = {}) {
    const optionsWithDefaults = {
      ...FlippingWeb.defaults,
      ...options
    };

    super({
      onRead: waapiOnRead,
      onEnter: stateMap => {
        Object.keys(stateMap).forEach(key => {
          const animation = FlippingWeb.animate.auto(
            stateMap[key],
            optionsWithDefaults
          );
          this.setAnimation(key, animation);
        });
      },
      onFlip: stateMap => {
        Object.keys(stateMap).forEach(key => {
          const animation = FlippingWeb.animate.auto(
            stateMap[key],
            optionsWithDefaults
          );
          this.setAnimation(key, animation);
        });
      },
      ...optionsWithDefaults
    });
  }
}

export = FlippingWeb;
