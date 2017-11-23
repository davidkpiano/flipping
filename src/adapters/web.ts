import {
  IFlippingConfig,
  IFlipState,
  IFlipStateMap,
  IFlipElementsStrategy
} from '../types';
import Flipping from '../Flipping';
import * as animations from '../animations';
import { mapValues, styleValue, getStaggerDelay } from '../utils';

const STATE_ATTR = 'data-flip-state';

interface ICustomEffectTiming {
  stagger?: number | ((index: number) => number);
}

type FlippingWebOptions = IFlippingConfig &
  AnimationEffectTiming &
  ICustomEffectTiming;

function animate(
  mode: IFlipElementsStrategy,
  elementMap: Record<string, Element>,
  options: FlippingWebOptions
): any {
  const elementAnimations = mapValues(elementMap,(element, key) => {
    element.setAttribute(STATE_ATTR, 'active');

    const animation = element.animate(
      [
        mapValues(mode[key].from, (value, prop) => styleValue(prop, value)) as AnimationKeyFrame,
        mapValues(mode[key].to, (value, prop) => styleValue(prop, value)) as AnimationKeyFrame
      ],
      options
    );

    animation.onfinish = () => element.setAttribute(STATE_ATTR, 'complete');

    return animation;
  });

  return {
    finish: () => {
      mapValues(elementAnimations, (elementAnimation) => {
        elementAnimation.finish()
      });
    }
  };
}

const slidingLayersAnimation = (
  state: IFlipState,
  options: FlippingWebOptions
): any => {
  const { element } = state;
  const mode = animations.slide(state);

  if (!mode) {
    return;
  }

  return animate(
    mode,
    {
      element,
      container: element.parentElement
    },
    options
  );
};

const scaleAnimation = (
  state: IFlipState,
  options: FlippingWebOptions = {}
): any => {
  const { element } = state;
  const mode = animations.scale(state);

  return animate(mode, { element }, options);
};

const autoAnimation = (state: IFlipState, options: FlippingWebOptions): any => {
  const { element } = state;

  const timingOptions: FlippingWebOptions = {
    ...options,
    delay:
      +(options.delay || 0) + getStaggerDelay(state.index, options.stagger),
    fill: options.stagger ? 'both' : 'none'
  };

  if (!element) {
    return;
  }

  if (
    element &&
    element.parentElement &&
    element.parentElement.hasAttribute('data-flip-wrap')
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
    delay:1000,
    easing: 'ease',
    fill: 'none',
    stagger: 0,
    getBounds: element => {
      const bounds = Flipping.rect(element);

      if (
        element &&
        element.parentElement &&
        element.parentElement.hasAttribute('data-flip-wrap')
      ) {
        const wrapBounds = Flipping.rect(element.parentElement);

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
