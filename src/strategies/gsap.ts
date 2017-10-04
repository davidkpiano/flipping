import Flipping, { IFlippingConfig, IFlipState, IFlipNodesMode } from '../Flipping';
import * as animations from '../animations';
import { mapValues, styleValue } from '../utils';
import * as GSAP from 'gsap';

function animate(mode: IFlipNodesMode, nodeMap: Record<string, Element>, options): any {
  const nodeAnimations = mapValues(nodeMap, (node, nodeKey) => {
    return (window as any).aa = GSAP.TweenLite.fromTo(
      node,
      options.duration,
      mapValues(mode[nodeKey].from, (value, prop) => styleValue(prop, value)),
      mapValues(mode[nodeKey].to, (value, prop) => styleValue(prop, value))
    );
  });

  return {
    finish: () => {
      Object.keys(nodeAnimations).forEach(nodeKey => {
        GSAP.TweenLite.set(nodeMap[nodeKey], { clearProps: 'all' });
        nodeAnimations[nodeKey].kill()
      });
    }
  }
}

const slidingLayersAnimation = (state: IFlipState, options): any => {
  const { node } = state;
  const mode = animations.slide(state);

  return animate(mode, {
    node,
    container: node.parentElement
  }, options);
};

const scaleAnimation = (state: IFlipState, options: any = {}): any => {
  const { node } = state;
  const mode = animations.scale(state);

  return animate(mode, { node }, options);
};

const autoAnimation = (state: IFlipState, options): any => {
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

class FlippingWeb extends Flipping {
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
      onRead: waapiOnRead,
      onEnter: state => FlippingWeb.animate.auto(state, optionsWithDefaults),
      onFlip: state => FlippingWeb.animate.auto(state, optionsWithDefaults),
      ...optionsWithDefaults
    });
  }
}

export = FlippingWeb;
