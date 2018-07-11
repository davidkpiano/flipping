import {
  IFlipState,
  IFlipStateMap,
  IFlipElementsStrategy,
  FlippingWebOptions
} from '../types';
import Flipping from '../Flipping';
import * as animations from '../animations';
import { mapValues, styleValue, getStaggerDelay, deltaChanged } from '../utils';

const STATE_ATTR = 'data-flip-state';

function animate(
  strategy: IFlipElementsStrategy,
  elementMap: Record<string, Element>,
  options: FlippingWebOptions
): any {
  const elementAnimations = mapValues(elementMap, (element, key) => {
    requestAnimationFrame(() => element.setAttribute(STATE_ATTR, 'active'));

    const animation = element.animate(
      [
        mapValues(strategy[key].from, (value, prop) =>
          styleValue(prop, value)
        ) as AnimationKeyFrame,
        mapValues(strategy[key].to, (value, prop) =>
          styleValue(prop, value)
        ) as AnimationKeyFrame
      ],
      options
    );

    animation.onfinish = () => {
      element.setAttribute(STATE_ATTR, 'complete');
    };

    return animation;
  });

  return {
    finish: () => {
      mapValues(elementAnimations, elementAnimation => {
        elementAnimation.finish();
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

  if (!mode || !element || !element.parentElement) {
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

  if (!mode || !element) {
    return;
  }

  return animate(mode, { element }, options);
};

const autoAnimation = (state: IFlipState, options: FlippingWebOptions): any => {
  const { element, delta } = state;

  const timingOptions: FlippingWebOptions = {
    ...options,
    delay:
      +(options.delay || 0) +
      getStaggerDelay(state.index, options.stagger || 0),
    fill: options.stagger ? 'both' : 'none'
  };

  if (!element) {
    return;
  }

  if (!delta || !deltaChanged(delta)) {
    return;
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
    delay: 0,
    easing: `cubic-bezier(.5, 0, .5, 1)`,
    fill: 'none',
    stagger: 0
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
