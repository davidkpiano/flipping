type Bounds = {
  top?: Number;
  left?: Number;
  width?: Number;
  height?: Number;
};

export type FlippingOptions = {
  getDelta?: (Bounds) => Bounds,
  getBounds?: (Element) => Bounds,
  selector?: <T>() => T,
  onFlip?: (state: FlipState, done?: Function) => any,
  onRead?: (state: ReadState) => void,
  getKey?: () => string;
};

const identity: <T>(arg: T) => T = a => a;

const rect = (node: Element): Bounds => {
  const {
    top,
    left,
    width,
    height,
  } = node.getBoundingClientRect();
  
  return { top, left, width, height };
}

function forEach(array: ArrayLike<any>, callback: Function): void {
  for (let i = 0; i < array.length; i++) {
    callback(array[i], i, array);
  }
}

type FlipState = {
  key: string,
  node: Element,
  first: Bounds,
  last: Bounds,
  delta: Bounds,
  type: 'ENTER' | 'MOVE' | 'LEAVE',
  animation: any,
};

type ReadState = {
  key: string,
  node: Element,
  bounds: Bounds,
  animation: any,
};

type ListenerDict<T> = {
  [key: string]: (state: T) => void;
};

function getDelta(a: Bounds, b: Bounds): Bounds {
  if (!a.height) { return a };
  if (!b.height) { return b };
  return {
    top: <number>a.top - <number>b.top,
    left: <number>a.left - <number>b.left,
    width: <number>a.width / <number>b.width,
    height: <number>a.height / <number>b.height,
  };
}

const selector = (parentNode: Element): NodeListOf<Element> =>
  parentNode.querySelectorAll('[data-key]');
const getKey = (node: Element): string =>
  node.getAttribute('data-key');
const deltaChanged = (delta: Bounds): boolean => {
  return !!delta.top
    || !!delta.left
    || (delta.width !== 1)
    || (delta.height !== 1);
};

class Flipping {
  selector: (Element) => NodeListOf<Element>;
  getBounds: (Element) => Bounds;
  getKey: (Element) => String;
  getDelta: (first: Bounds, last: Bounds) => Bounds;
  flipListeners: ListenerDict<FlipState>;
  readListeners: ListenerDict<ReadState>;
  bounds: { [key: string]: Bounds };
  animations: { [key: string]: any };
  onFlip?: (state: FlipState, done: Function) => any;
  onRead?: (state: ReadState) => void;
  listeners: {[type: string]: Function[]};

  constructor(options: FlippingOptions = {}) {
    this.selector = options.selector || selector;
    this.getBounds = options.getBounds || rect;
    this.getDelta = options.getDelta || getDelta;
    this.getKey = options.getKey || getKey;
    this.onFlip = options.onFlip || identity;
    this.onRead = options.onRead || identity;

    this.flipListeners = {};
    this.readListeners = {};

    this.bounds = {};
    this.animations = {};
    this.listeners = {};
  }
  on(type: string, handler: Function): void {
    (this.listeners[type] || (this.listeners[type] = [])).push(handler);
  }
  off(type: string, handler: Function): void {
    const listenersOfType = this.listeners[type];
    let index;
    if (!listenersOfType || (index = listenersOfType.indexOf(handler)) === -1) {
      return;
    }

    listenersOfType.splice(index, 1);
  }
  private emit(type: string, event: any) {
    const listenersOfType = this.listeners[type];
    if (!listenersOfType || !listenersOfType.length) return;

    listenersOfType.forEach(handler => handler(event));
  }
  read(parentNode: Element = document.documentElement) {
    let nodes: NodeList = this.selector(parentNode);
    const fullState: {[key: string]: ReadState} = {};

    forEach(nodes, (node) => {
      const key = <string>this.getKey(node);
      const bounds = this.bounds[key] = this.getBounds(node);
      const animation = this.animations[key];

      const state: ReadState = {
        key,
        node,
        bounds,
        animation,
      };

      fullState[key] = state;

      this.onRead(state);
    });

    this.emit('read', fullState);
  }
  flip(parentNode: Element = document.documentElement) {
    let nodes: NodeList = this.selector(parentNode);
    const fullState: {[key: string]: FlipState} = {};
    let flipped = false;

    forEach(nodes, (node) => {
      const key = <string>this.getKey(node);
      const first = this.bounds[key];
      const last = this.getBounds(node);
      const animation = this.animations[key];
      const delta = this.getDelta(first, last)

      if (!deltaChanged(delta)) return;

      flipped = true;

      const state: FlipState = {
        key,
        node,
        first,
        last,
        delta: this.getDelta(first, last),
        type: !first ? 'ENTER' : !last ? 'LEAVE' : 'MOVE',
        animation,
      };

      const nextAnimation = this.onFlip(state, () => this.read(parentNode));

      fullState[key] = {...state, animation: nextAnimation};
      this.animations[key] = nextAnimation;
    });

    if (flipped) this.emit('flip', fullState);
  }
  wrap(fn: Function): Function {
    return (...args) => {
      this.read();
      const result = fn(...args);
      this.flip();
      return result;
    }
  }
}

export default Flipping;
