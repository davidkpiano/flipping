interface IBounds {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  transform?: string;
}

export type FlipIteratee = (
  state: IFlipState,
  key: string,
  fullState: { [key: string]: IFlipState }
) => any;

export interface IFlippingConfig {
  active?: (element: Element) => boolean;
  getDelta?: (Bounds) => IBounds;
  getBounds?: (node: Element) => IBounds;
  selector?: (parent: Element) => Element[];
  onFlip?: FlipIteratee;
  onRead?: (state: IFlipState) => void;
  onEnter?: (state: IFlipState) => void;
  onLeave?: (state: IFlipState) => void;
  getKey?: () => string;
}

interface IFlippingOptions extends IFlippingConfig {
  readOnly?: boolean;
}

export interface IFlipNodeMode {
  from: {
    x?: number;
    y?: number;
    [key: string]: string | number;
  };
  to: {
    x?: number;
    y?: number;
    [key: string]: string | number;
  };
}

export interface IFlipNodesMode {
  node: IFlipNodeMode;
  container?: IFlipNodeMode;
}

export interface IFlipState {
  type: 'ENTER' | 'MOVE' | 'LEAVE';
  key: string;
  node: Element | undefined;
  bounds: IBounds;
  delta: IBounds;
  animation: any;
  previous: IFlipState | undefined;
  start: number;
}

const identity: <T>(arg: T) => T = a => a;

const rect = (node: Element): IBounds => {
  const { top, left, width, height } = node.getBoundingClientRect();

  return {
    top,
    left,
    width,
    height,
    transform: getComputedStyle(node).transform
  };
};

const FOLLOW_ATTR = 'data-flip-follow';
const KEY_ATTR = 'data-flip-key';

function isHidden(node: Element) {
  const { width, height } = rect(node);

  return width === 0 && height === 0;
}

const NO_DELTA: IBounds = { top: 0, left: 0, width: 1, height: 1 };

function getDelta(a: IBounds, b: IBounds): IBounds {
  if (!a) {
    return NO_DELTA;
  }
  if (!a.height) {
    return a;
  }
  if (!b.height) {
    return b;
  }
  return {
    top: a.top - b.top,
    left: a.left - b.left,
    width: a.width / b.width,
    height: a.height / b.height
  };
}

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

  // return Object.keys(visibleNodes).map(key => visibleNodes[key]);
  return result;
};
const active = () => true;
const getKey = (node: Element): string => node.getAttribute(KEY_ATTR);
// const deltaChanged = (delta: IBounds): boolean => {
//   return !!delta.top || !!delta.left || delta.width !== 1 || delta.height !== 1;
// };
// const boundsChanged = (a: IBounds, b: IBounds): boolean => {
//   return !!(
//     a.top - b.top ||
//     a.left - b.left ||
//     a.width - b.width ||
//     a.height - b.height
//   );
// };

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
    this.onFlip = options.onFlip || identity;
    this.onRead = options.onRead || identity;
    this.onEnter = options.onEnter || identity;
    this.onLeave = options.onLeave || identity;

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
  public read(
    parentNode: Element = document.documentElement,
    options: IFlippingOptions = {}
  ) {
    this.flip(parentNode, { ...options, readOnly: true });
  }
  public flip(
    parentNode: Element = document.documentElement,
    options: IFlippingOptions
  ) {
    const nodes = this.selectActive(parentNode);
    const fullState: IFlipStateMap = {};
    const parentBounds = this.getBounds(parentNode);
    let flipped = false;

    nodes.forEach(node => {
      const key = this.getKey(node);
      const previous = this.states[key];
      const isPresent = previous && previous.type !== 'LEAVE';

      flipped = true;
      const bounds = this.getRelativeBounds(parentBounds, this.getBounds(node));

      const newState: IFlipState = {
        type: isPresent ? 'MOVE' : 'ENTER',
        key,
        node,
        bounds,
        delta: isPresent ? this.getDelta(previous.bounds, bounds) : undefined,
        start: Date.now(),
        animation: isPresent ? previous.animation : undefined,
        previous
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
        previous: this.states[key]
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

      const nextAnimation = this.onFlip(state, key, fullState);

      if (nextAnimation) {
        this.animate(key, nextAnimation);
      }
    });
  }
  public animate(key: string, animation: any): void {
    this.states[key].animation = animation;
  }
  public wrap(
    fn: Function,
    parentNode?: Element,
    options: IFlippingOptions = {}
  ): Function {
    return (...args) => {
      this.read(parentNode);
      const result = fn.apply(null, args);
      this.flip(parentNode, options);
      return result;
    };
  }
  static rect = rect;
}

export default Flipping;
