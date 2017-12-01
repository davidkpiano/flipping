import * as mitt from 'mitt';
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
import mirrorPlugin from './plugins/mirror';

const selector = (parentElement: Element): Element[] => {
  const elements = parentElement.querySelectorAll(`[${KEY_ATTR}]`);
  const visibleElements = {};
  const result: Element[] = [];

  elements.forEach(element => {
    if (isHidden(element)) {
      return;
    }
    const key = element.getAttribute(KEY_ATTR);
    if (!key) {
      return;
    }

    visibleElements[key] = element;

    result.push(element);
  });

  return result;
};
const active = () => true;
const getKey = (element: Element): string | undefined => element.getAttribute(KEY_ATTR) || undefined;

class Flipping<TAnimation = any> {
  public plugins: FlipPlugin[];
  public selector: (element: Element) => Element[];
  public active: (element: Element) => boolean;
  private selectActive: (element) => Element[];
  public getBounds: (element: Element) => IBounds;
  public getKey: (element: Element) => string | undefined;
  public getDelta: (first: IBounds, last: IBounds) => IBounds;
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
    this.plugins = options.plugins || [mirrorPlugin];

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
    element: Element,
    parent: Element = this.parentElement
  ): Element {
    const parentKey = element.getAttribute('data-flip-parent');
    let currentParent = element.parentElement;

    if (!parentKey) {
      while (currentParent && !currentParent.hasAttribute('data-flip-key')) {
        currentParent = currentParent.parentElement;
      }
    } else {
      while (currentParent && this.getKey(currentParent) !== parentKey) {
        currentParent = currentParent.parentElement;
      }
    }

    return currentParent || parent;
  }
  private dispatch(event: FlipEventName, stateMap: IFlipStateMap): void {
    const finalStateMap = this.plugins.reduce(
      (intermediateStateMap, plugin) => {
        return plugin(intermediateStateMap, event);
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
            const state = stateMap[key as string];

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
    const elements = this.selectActive(parentElement);
    const fullState: IFlipStateMap = {};
    // const config = {
    //   onFlip: this.onFlip,
    //   onEnter: this.onEnter,
    //   onLeave: this.onLeave,
    //   ...options
    // };

    elements.forEach((element, index) => {
      const key = this.getKey(element);

      if (!key) { return; }

      const childParent = this.findParent(element, parentElement);
      const childParentKey = this.getKey(childParent);
      const childParentState = childParentKey ? fullState[childParentKey] : undefined;
      const parentBounds = this.getBounds(childParent);
      const previous = this.states[key];
      const isPresent = previous && previous.type !== 'LEAVE';

      const bounds = this.getRelativeBounds(
        parentBounds,
        this.getBounds(element)
      );
      const delta = isPresent && previous && previous.bounds
        ? this.getDelta(previous.bounds, bounds)
        : undefined;

      const newState: IFlipState = {
        type: isPresent ? 'MOVE' : 'ENTER',
        key,
        element,
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
              element: previous.element
            }
          : undefined,
        parent: childParentState
      };

      this.states[key] = fullState[key] = newState;
    });

    if (options.readOnly) {
      return this.dispatch('read', fullState);
    }

    Object.keys(this.states).forEach((key, index) => {
      if (fullState[key]) {
        return;
      }
      
      const prevState = this.states[key];

      this.states[key] = fullState[key] = {
        type: 'LEAVE',
        key,
        element: undefined,
        bounds: undefined,
        start: Date.now(),
        animation: undefined,
        delta: undefined,
        index,
        parent: undefined,
        previous: {
          type: prevState.type,
          bounds: prevState.bounds,
          animation: prevState.animation,
          element: prevState.element
        }
      } as IFlipState;
    });

    return this.dispatch('flip', fullState);
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
  public progress(key: string, fraction: number): IBounds | undefined {
    const { delta } = this.states[key];
    if (!delta) { return; }

    return Flipping.progress(delta, fraction);
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
  static willScale = (state: IFlipState): boolean => {
    return !!(state && state.element && !state.element.hasAttribute('data-noflip') && state.delta && (state.delta.width !== 1 || state.delta.height !== 1));
  }
  static willMove = (state: IFlipState): boolean => {
    if (!state || !state.delta) { return false; }
    return state && (state.delta.top !== 0 || state.delta.left !== 0);
  }
}

export default Flipping;
