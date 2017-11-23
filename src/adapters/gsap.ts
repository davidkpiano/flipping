import Flipping from '../Flipping';
import {
  IFlippingConfig,
  IFlipState,
  IFlipElementsStrategy,
  IFlipStateMap
} from '../types';
import * as animations from '../animations';
import { mapValues, styleValue, getStaggerDelay } from '../utils';
import * as GSAP from 'gsap';

type GSAPAnimation = {
  finish: () => void;
};

function animate(
  mode: IFlipElementsStrategy,
  elementMap: Record<string, Element>,
  options
): any {
  const elementAnimations = mapValues(elementMap, (element, key) => {
    return GSAP.TweenLite
      .fromTo(
        element,
        options.duration,
        mapValues(mode[key].from, (value, prop) => styleValue(prop, value)),
        mapValues(mode[key].to, (value, prop) => styleValue(prop, value))
      )
      .delay(options.delay);
  });

  return {
    finish: () => {
      Object.keys(elementAnimations).forEach(key => {
        GSAP.TweenLite.set(elementMap[key], { clearProps: 'all' });
        elementAnimations[key].kill();
      });
    }
  };
}

const slidingLayersAnimation = (state: IFlipState, options): any => {
  const { element } = state;
  const mode = animations.slide(state);

  return animate(
    mode,
    {
      element,
      container: element.parentElement
    },
    options
  );
};

const scaleAnimation = (state: IFlipState, options: any = {}): any => {
  const { element } = state;
  const strategy = animations.scale(state);

  return animate(strategy, { element }, options);
};

const autoAnimation = (state: IFlipState, options): any => {
  const { element } = state;

  const timingOptions = {
    ...options,
    duration: (options.duration || 0) / 1000,
    delay:
      +((options.delay || 0) + getStaggerDelay(state.index, options.stagger)) /
      1000
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

function gsapOnRead(stateMap: IFlipStateMap<GSAPAnimation>): void {
  Object.keys(stateMap).forEach(key => {
    const { animation } = stateMap[key];

    if (animation && animation.finish) {
      animation.finish();
    }
  });
}

const defaultOptions: IFlippingConfig & Record<string, any> = {
  duration: 0.3,
  ease: GSAP.Power1.easeInOut,
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

class FlippingGsap extends Flipping<GSAPAnimation> {
  static animate = {
    auto: autoAnimation,
    transform: scaleAnimation,
    slidingLayers: slidingLayersAnimation
  };

  constructor(options: IFlippingConfig & AnimationEffectTiming = {}) {
    const optionsWithDefaults = {
      ...defaultOptions,
      ...options
    };

    super({
      onRead: gsapOnRead,
      onEnter: stateMap => {
        Object.keys(stateMap).forEach(key => {
          FlippingGsap.animate.auto(stateMap[key], optionsWithDefaults);
        });
      },
      onFlip: stateMap => {
        Object.keys(stateMap).forEach(key => {
          FlippingGsap.animate.auto(stateMap[key], optionsWithDefaults);
        });
      }
    });
  }
}

export = FlippingGsap;
