import mitt from 'mitt';
import { rect, isHidden, getDelta } from './utils';
import {
  IBounds,
  IFlippingConfig,
  IFlippingOptions,
  IFlipState,
  IFlipStateMap,
  FlipEventName,
  FlipPlugin,
  FlipEventListener,
  FlipStateEventListener
} from './types';
import { NO_DELTA, KEY_ATTR /* FOLLOW_ATTR */ } from './constants';

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

class Flipping<TAnimation = any> {
  public plugins: FlipPlugin[];
  public selector: (element: Element) => Element[];
  public active: (element: Element) => boolean;
  private selectActive: (element) => Element[];
  public getBounds: (element: Element) => IBounds;
  public getKey: (element: Element) => string;
  public getDelta: (first: IBounds, last: IBounds) => IBounds;
  // public onFlip?: FlipEventListener;
  public onEnter?: FlipEventListener;
  public onLeave?: FlipEventListener;
  public onRead?: (stateMap: IFlipStateMap) => void;
  public states: { [key: string]: IFlipState<TAnimation> };
  public parentElement: Element;

  private emitter: mitt.Emitter;

  constructor(options: IFlippingConfig & { [key: string]: any } = {}) {
    this.selector = options.selector || selector;
    this.active = options.active || active;
    this.selectActive = this.selector;
    this.getBounds = options.getBounds || rect;
    this.getDelta = options.getDelta || getDelta;
    this.getKey = options.getKey || getKey;
    this.parentElement = options.parent || document.documentElement;
    this.plugins = options.plugins || [];

    this.emitter = new mitt();
    if (options.onRead) {
      this.on('read', options.onRead);
    }
    if (options.onFlip) {
      this.on('flip', options.onFlip);
    }
    if (options.onEnter) {
      this.on('enter', options.onEnter);
    }
    if (options.onLeave) {
      this.on('leave', options.onLeave);
    }

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
  private findParent(
    node: Element,
    parent: Element = this.parentElement
  ): Element {
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
  private dispatch(event: FlipEventName, stateMap: IFlipStateMap): void {
    const finalStateMap = this.plugins.reduce(
      (intermediateStateMap, plugin) => {
        return plugin(
          intermediateStateMap,
          event,
          this.emitter.emit.bind(this)
        );
      },
      stateMap
    );

    this.emitter.emit(event, finalStateMap);
  }
  public on(event: FlipEventName, listener: FlipEventListener): void {
    this.emitter.on(event, listener);
  }
  public onFlip(key: string, listener: FlipStateEventListener): void;
  public onFlip(listener: FlipEventListener): void;
  public onFlip(...args: any[]) {
    let key: string | undefined;
    let listener: FlipStateEventListener | FlipEventListener;

    if (args.length === 2) {
      [key, listener] = args;
    } else {
      [listener] = args;
    }

    this.emitter.on(
      'flip',
      key
        ? (stateMap: IFlipStateMap) => {
            const state = stateMap[key];

            if (state) {
              (listener as FlipStateEventListener)(state);
            }
          }
        : listener
    );
  }
  public read(options: IFlippingOptions = {}) {
    this.flip({ ...options, readOnly: true });
  }
  public flip(options: IFlippingOptions = {}) {
    const parentElement = options.parent || this.parentElement;
    const nodes = this.selectActive(parentElement);
    const fullState: IFlipStateMap = {};
    // const config = {
    //   onFlip: this.onFlip,
    //   onEnter: this.onEnter,
    //   onLeave: this.onLeave,
    //   ...options
    // };

    nodes.forEach((node, index) => {
      const key = this.getKey(node);
      const childParent = this.findParent(node, parentElement);
      const parentBounds = this.getBounds(childParent);
      const previous = this.states[key];
      const isPresent = previous && previous.type !== 'LEAVE';

      const bounds = this.getRelativeBounds(parentBounds, this.getBounds(node));
      const delta = isPresent
        ? this.getDelta(previous.bounds, bounds)
        : undefined;

      const newState: IFlipState = {
        type: isPresent ? 'MOVE' : 'ENTER',
        key,
        node,
        bounds,
        delta,
        start: Date.now(),
        animation: isPresent ? previous.animation : undefined,
        index,
        previous: previous
          ? {
              type: previous.type,
              bounds: previous.bounds,
              animation: previous.animation,
              node: previous.node
            }
          : undefined
      };

      this.states[key] = fullState[key] = newState;
    });

    if (options.readOnly) {
      return this.dispatch('read', fullState);
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

    return this.dispatch('flip', fullState);

    // config.onFlip(fullState);

    // Object.keys(fullState).forEach(key => {
    //   const state = fullState[key];
    //   const node = state.node || (state.previous && state.previous.node);

    //   if (node) {
    //     const followKey = node.getAttribute(FOLLOW_ATTR);

    //     if ((state.type === 'ENTER' || state.type === 'LEAVE') && followKey) {
    //       state.delta = fullState[followKey].delta;
    //     }
    //   }

    //   const nextAnimation = {
    //     ENTER: config.onEnter,
    //     MOVE: config.onFlip,
    //     LEAVE: config.onLeave
    //   }[state.type].call(this, state, key, fullState);

    //   if (nextAnimation) {
    //     this.setAnimation(key, nextAnimation);
    //   }
    // });
  }
  public setAnimation(key: string, animation: any): void {
    this.states[key].animation = animation;
  }
  public wrap<T>(
    fn: (...args: any[]) => T,
    options: IFlippingOptions = {}
  ): Function {
    return (...args) => {
      this.read(options);
      const result = fn.apply(null, args) as T;
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
      height: delta.height * invFraction
    };
  }
  static rect = rect;
}

export default Flipping;
