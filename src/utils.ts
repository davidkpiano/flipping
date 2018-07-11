import * as Rematrix from 'rematrix';
import { IBounds } from './types';
import { NO_DELTA } from './constants';

export function mapValues<T, P>(
  collection: { [key: string]: T },
  iteratee: (item: T, key: string, collection: { [key: string]: T }) => P
): { [key: string]: P } {
  const result = {};

  Object.keys(collection).forEach(key => {
    result[key] = iteratee(collection[key], key, collection);
  });

  return result;
}

export function mapTwoValues(a, b, iteratee) {
  const result = {};

  Object.keys(a || {}).forEach(key => {
    result[key] = iteratee(a[key], b[key], key);
  });

  return result;
}

export function matrixTranslate(x, y) {
  return Rematrix.translate(x, y).join(',');
}

export function matrixScale(x, y) {
  return Rematrix.scale(x, y).join(',');
}

export function matrixMultiply(...matrices) {
  return matrices
    .filter(a => !!a)
    .reduce(Rematrix.multiply)
    .join(',');
}

export function styleValue(
  prop: string,
  value: string | number | undefined
): string | number | undefined {
  if (
    ['height', 'width', 'top', 'left'].indexOf(prop) !== -1 &&
    typeof value === 'number'
  ) {
    return `${value}px`;
  }

  return value;
}

export function getStaggerDelay(
  index: number,
  stagger: number | ((index: number) => number)
): number {
  return typeof stagger === 'function'
    ? stagger(index)
    : (stagger || 0) * index;
}

export const identity: <T>(arg: T) => T = a => a;
export const noop = () => {};
export const rect = (element: Element): IBounds => {
  const { top, left, width, height } = element.getBoundingClientRect();

  return {
    top,
    left,
    width,
    height,
    get transform() {
      return getComputedStyle(element).transform || undefined;
    }
  };
};
export function isVisible(element: Element) {
  const { width, height } = rect(element);

  return !(width === 0 && height === 0);
}
export function getDelta(a: IBounds, b: IBounds): IBounds {
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
export const deltaChanged = (delta: IBounds): boolean => {
  return !!delta.top || !!delta.left || delta.width !== 1 || delta.height !== 1;
};
export const boundsChanged = (a: IBounds, b: IBounds): boolean => {
  return !!(
    a.top - b.top ||
    a.left - b.left ||
    a.width - b.width ||
    a.height - b.height
  );
};

type EventHandler = (event?: any) => void;
type WildCardEventHandler = (type: string, event?: any) => void;
type EventHandlerList = Array<EventHandler>;
type WildCardEventHandlerList = Array<WildCardEventHandler>;

export function mitt() {
  const all: Record<string, EventHandlerList> = {};
  const wild: WildCardEventHandlerList = [];

  return {
    /**
     * Register an event handler for the given type.
     *
     * @param  {String} type	Type of event to listen for, or `"*"` for all events
     * @param  {Function} handler Function to call in response to given event
     * @memberOf mitt
     */
    on(type: string, handler: EventHandler) {
      if (type === '*') {
        wild.push(handler);
      } else {
        (all[type] || (all[type] = [])).push(handler);
      }
    },

    /**
     * Remove an event handler for the given type.
     *
     * @param  {String} type	Type of event to unregister `handler` from, or `"*"`
     * @param  {Function} handler Handler function to remove
     * @memberOf mitt
     */
    off(type: string, handler: EventHandler) {
      if (type === '*') {
        wild.splice(wild.indexOf(handler) >>> 0, 1);
      } else if (all[type]) {
        all[type].splice(all[type].indexOf(handler) >>> 0, 1);
      }
    },

    /**
     * Invoke all handlers for the given type.
     * If present, `"*"` handlers are invoked after type-matched handlers.
     *
     * @param {String} type  The event type to invoke
     * @param {Any} [evt]  Any value (object is recommended and powerful), passed to each handler
     * @memberOf mitt
     */
    emit(type: string, evt: any) {
      (all[type] || []).slice().map(handler => {
        handler(evt);
      });
      wild.slice().map(handler => {
        handler(type, evt);
      });
    }
  };
}
