import { identity, noop, rect, isHidden, getDelta } from './utils';
import { IBounds, IFlippingConfig, IFlippingOptions, IFlipState } from './types';
import { NO_DELTA, KEY_ATTR, FOLLOW_ATTR } from './constants';

const selector = (parentNode: Element): Element[] => {
  const nodes = parentNode.querySelectorAll(`[${KEY_ATTR}]`);
  const visibleNodes = {};
  const result = [];

  nodes.forEach(node => {
    if (isHidden(node)) {
      return;
    }
    const key = node.getAttribute(KEY_ATTR);
    visibleNodes[key] = node;

    result.push(node);
  });

  return result;
};
const active = () => true;
const getKey = (node: Element): string => node.getAttribute(KEY_ATTR);

interface IFlipStateMap {
  [key: string]: IFlipState;
}

type FlipEventHandler = (
  state: IFlipState,
  key: string,
  fullState: IFlipStateMap
) => any;

class Flipping {
  public selector: (element: Element) => Element[];
  public active: (element: Element) => boolean;
  private selectActive: (element) => Element[];
  public getBounds: (element: Element) => IBounds;
  public getKey: (element: Element) => string;
  public getDelta: (first: IBounds, last: IBounds) => IBounds;
  public onFlip?: FlipEventHandler;
  public onEnter?: FlipEventHandler;
  public onLeave?: FlipEventHandler;
  public onRead?: (state: IFlipState) => void;
  public states: { [key: string]: IFlipState };
  public parentElement: Element;

  constructor(options: IFlippingConfig & { [key: string]: any } = {}) {
    this.selector = options.selector || selector;
    this.active = options.active || active;
    this.selectActive = (node: Element) =>
      this.selector(node).filter(element => {
        return this.active(element);
      });
    this.getBounds = options.getBounds || rect;
    this.getDelta = options.getDelta || getDelta;
    this.getKey = options.getKey || getKey;
    this.onRead = options.onRead || identity;
    this.onEnter = options.onEnter || noop;
    this.onFlip = options.onFlip || noop;
    this.onLeave = options.onLeave || noop;
    this.parentElement = options.parent || document.documentElement;

    this.states = {};
  }
  private getRelativeBounds(
    parentBounds: IBounds,
    childBounds: IBounds
  ): IBounds {
    return {
      ...childBounds,
      top: childBounds.top - parentBounds.top,
      left: childBounds.left - parentBounds.left
    };
  }
  private findParent(node: Element, parent: Element = this.parentElement): Element {
    const parentKey = node.getAttribute('data-flip-parent');

    if (!parentKey) {
      return parent;
    }

    let currentParent = node.parentElement;

    while (currentParent && this.getKey(currentParent) !== parentKey) {
      currentParent = currentParent.parentElement;
    }

    return currentParent || parent;
  }
  public read(
    options: IFlippingOptions = {}
  ) {
    this.flip({ ...options, readOnly: true });
  }
  public flip(
    options: IFlippingOptions = {}
  ) {
    const parentElement = options.parent || this.parentElement;
    const nodes = this.selectActive(parentElement);
    const fullState: IFlipStateMap = {};
    const config = {
      onFlip: this.onFlip,
      onEnter: this.onEnter,
      onLeave: this.onLeave,
      ...options
    };
    
    nodes.forEach((node, index) => {
      const key = this.getKey(node);
      const childParent = this.findParent(node, parentElement);
      const parentBounds = this.getBounds(childParent);
      const previous = this.states[key];
      const isPresent = previous && previous.type !== 'LEAVE';

      const bounds = this.getRelativeBounds(parentBounds, this.getBounds(node));
      const delta = isPresent ? this.getDelta(previous.bounds, bounds) : undefined;

      const newState: IFlipState = {
        type: isPresent ? 'MOVE' : 'ENTER',
        key,
        node,
        bounds,
        delta,
        start: Date.now(),
        animation: isPresent ? previous.animation : undefined,
        index,
        previous: previous ? {
          type: previous.type,
          bounds: previous.bounds,
          animation: previous.animation,
          node: previous.node,
        } : undefined
      };

      this.states[key] = fullState[key] = newState;

      if (options.readOnly) {      
        this.onRead(newState);
      }
    });

    if (options.readOnly) {
      return;
    }

    Object.keys(this.states).forEach(key => {
      const prevState = this.states[key];

      if (fullState[key]) {
        return;
      }

      this.states[key] = fullState[key] = {
        type: 'LEAVE',
        key,
        node: undefined,
        bounds: undefined,
        start: Date.now(),
        animation: undefined,
        previous: {
          type: prevState.type,
          bounds: prevState.bounds,
          animation: prevState.animation,
          node: prevState.node
        }
      } as IFlipState;
    });

    Object.keys(fullState).forEach(key => {
      const state = fullState[key];
      const node = state.node || (state.previous && state.previous.node);

      if (node) {
        const followKey = node.getAttribute(FOLLOW_ATTR);

        if ((state.type === 'ENTER' || state.type === 'LEAVE') && followKey) {
          state.delta = fullState[followKey].delta;
        }
      }

      const nextAnimation = {
        ENTER: config.onEnter,
        MOVE: config.onFlip,
        LEAVE: config.onLeave
      }[state.type].call(this, state, key, fullState);

      if (nextAnimation) {
        this.setAnimation(key, nextAnimation);
      }
    });
  }
  public setAnimation(key: string, animation: any): void {
    this.states[key].animation = animation;
  }
  public wrap(
    fn: Function,
    options: IFlippingOptions = {}
  ): Function {
    return (...args) => {
      this.read(options);
      const result = fn.apply(null, args);
      this.flip(options);
      return result;
    };
  }
  public progress(key: string, fraction: number): IBounds {
    return Flipping.progress(this.states[key].delta, fraction);
  }
  static progress(delta: IBounds, fraction: number): IBounds {
    if (!delta) {
      return NO_DELTA;
    }

    const invFraction = 1 - fraction;

    return {
      top: delta.top * invFraction,
      left: delta.left * invFraction,
      width: delta.width * invFraction,
      height:  delta.height * invFraction
    };
  }
  static rect = rect;
}

export default Flipping;
