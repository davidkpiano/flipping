import Flipping from '../Flipping';
import {
  IFlippingConfig,
  IFlipState,
  IFlipNodesMode,
  IFlipStateMap
} from '../types';
import * as animations from '../animations';
import { mapValues, styleValue, getStaggerDelay } from '../utils';
import * as GSAP from 'gsap';

type GSAPAnimation = {
  finish: () => void;
};

function animate(
  mode: IFlipNodesMode,
  nodeMap: Record<string, Element>,
  options
): any {
  const nodeAnimations = mapValues(nodeMap, (node, nodeKey) => {
    return GSAP.TweenLite
      .fromTo(
        node,
        options.duration,
        mapValues(mode[nodeKey].from, (value, prop) => styleValue(prop, value)),
        mapValues(mode[nodeKey].to, (value, prop) => styleValue(prop, value))
      )
      .delay(options.delay);
  });

  return {
    finish: () => {
      Object.keys(nodeAnimations).forEach(nodeKey => {
        GSAP.TweenLite.set(nodeMap[nodeKey], { clearProps: 'all' });
        nodeAnimations[nodeKey].kill();
      });
    }
  };
}

const slidingLayersAnimation = (state: IFlipState, options): any => {
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

const scaleAnimation = (state: IFlipState, options: any = {}): any => {
  const { node } = state;
  const mode = animations.scale(state);

  return animate(mode, { node }, options);
};

const autoAnimation = (state: IFlipState, options): any => {
  const { node } = state;

  const timingOptions = {
    ...options,
    duration: (options.duration || 0) / 1000,
    delay:
      +((options.delay || 0) + getStaggerDelay(state.index, options.stagger)) /
      1000
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
