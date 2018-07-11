import { rect, isVisible, getDelta, mitt } from './utils';
import {
  IBounds,
  IFlippingConfig,
  IFlippingOptions,
  IFlipState,
  IFlipStateMap,
  FlipEventName,
  FlipPlugin,
  FlipEventListener,
  FlipStateEventListener,
  FlipSelector,
  FlipData,
  mitt as Mitt
} from './types';
import { NO_DELTA, KEY_ATTR } from './constants';
import mirrorPlugin from './plugins/mirror';
import radiusPlugin from './plugins/radius';

const active = () => true;
const identity: <T>(a: T) => T = a => a;

const flipDatasetMap: Record<
  string,
  [keyof FlipData, (value: string) => any]
> = {
  flipKey: ['key', identity],
  flipNoScale: ['noScale', () => true]
};

const getFlipData = (element: Element): FlipData => {
  if (!('dataset' in element)) {
    // not supported

    return {};
  }

  const dataset: Record<string, string> = (element as any).dataset;
  const data: FlipData = {};

  Object.keys(dataset).forEach(key => {
    if (flipDatasetMap[key]) {
      const [flipKey, project] = flipDatasetMap[key];
      data[flipKey] = project(dataset[key]);
    } else if (key.indexOf('flip') === 0) {
      data[key[4].toLowerCase() + key.slice(5)] = dataset[key];
    }
  });

  return data;
};

const createSelector = (
  selector: FlipSelector | string,
  attribute: string = KEY_ATTR
): FlipSelector => {
  if (typeof selector === 'string') {
    return (parentElement: Element) => {
      const elements = parentElement.querySelectorAll(selector);
      const visibleElements = {};
      const result: Element[] = [];

      elements.forEach(element => {
        if (!isVisible(element)) {
          return;
        }
        const key = element.getAttribute(attribute);
        if (!key) {
          return;
        }

        visibleElements[key] = element;

        result.push(element);
      });

      return result;
    };
  }

  return selector;
};

class Flipping<TAnimation = any, TAnimationConfig extends {} = {}> {
  public plugins: FlipPlugin[];
  public selector: FlipSelector;
  public attribute: string;
  public active: (element: Element) => boolean;
  private activeSelector: (element) => Element[];
  public getBounds: (element: Element) => IBounds;
  public getDelta: (first: IBounds, last: IBounds) => IBounds;
  public onEnter?: FlipEventListener;
  public onLeave?: FlipEventListener;
  public onRead?: (stateMap: IFlipStateMap) => void;
  public states: { [key: string]: IFlipState<TAnimation> };
  public parentElement: Element;

  private emitter: Mitt.Emitter;

  constructor(options: IFlippingConfig & Record<string, any> = {}) {
    this.attribute = options.attribute || KEY_ATTR;
    this.selector = createSelector(
      options.selector || `[${this.attribute}]`,
      this.attribute
    );
    this.active = options.active || active;
    this.activeSelector = options.activeSelector || isVisible;
    this.getBounds = options.getBounds || rect;
    this.getDelta = options.getDelta || getDelta;
    this.parentElement = options.parent || document.documentElement;
    this.plugins = options.plugins || [mirrorPlugin, radiusPlugin];

    this.emitter = mitt();
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
  private selectActive(parentElement: Element): Element[] {
    const elements = this.selector(parentElement);
    const activeElements = {};
    const result: Element[] = [];

    elements.forEach(element => {
      if (!this.activeSelector(element)) {
        return;
      }
      const key = element.getAttribute(this.attribute);
      if (!key) {
        return;
      }

      activeElements[key] = element;

      result.push(element);
    });

    return result;
  }
  private findParent(
    element: Element,
    parent: Element = this.parentElement
  ): Element {
    const parentKey = element.getAttribute('data-flip-parent');
    let currentParent = element.parentElement;

    if (!parentKey) {
      while (currentParent && !currentParent.hasAttribute(this.attribute)) {
        currentParent = currentParent.parentElement;
      }
    } else {
      while (
        currentParent &&
        currentParent.getAttribute(this.attribute) !== parentKey
      ) {
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
  public read(options: IFlippingOptions<TAnimationConfig> = {}) {
    this.flip({ ...options, readOnly: true });
  }
  public flip(options: IFlippingOptions<TAnimationConfig> = {}) {
    const parentElement = options.parent || this.parentElement;
    const elements = this.selectActive(parentElement);
    const fullState: IFlipStateMap = {};

    elements.forEach((element, index) => {
      const key = element.getAttribute(this.attribute);

      if (!key) {
        return;
      }

      const data = getFlipData(element);
      const childParent = this.findParent(element, parentElement);
      const childParentKey = childParent.getAttribute(this.attribute);
      const childParentState = childParentKey
        ? fullState[childParentKey]
        : undefined;
      const parentBounds = this.getBounds(childParent);
      const previous = this.states[key];
      const isPresent = previous && previous.type !== 'LEAVE';

      const bounds = this.getRelativeBounds(
        parentBounds,
        this.getBounds(element)
      );
      const delta =
        isPresent && previous && previous.bounds
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
              element: previous.element,
              data: previous.data
            }
          : undefined,
        parent: childParentState,
        data
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
    options: IFlippingOptions<TAnimationConfig> = {}
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
    if (!delta) {
      return;
    }

    return Flipping.progress(delta, fraction);
  }
  static progress(delta: IBounds | undefined, fraction: number): IBounds {
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
    return !!(
      state &&
      state.element &&
      !state.element.hasAttribute('data-noflip') &&
      state.delta &&
      (state.delta.width !== 1 || state.delta.height !== 1)
    );
  };
  static willMove = (state: IFlipState): boolean => {
    if (!state || !state.delta) {
      return false;
    }
    return state && (state.delta.top !== 0 || state.delta.left !== 0);
  };
}

export default Flipping;
