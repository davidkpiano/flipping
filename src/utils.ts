import * as Rematrix from 'rematrix';
import { IBounds } from './types';
import { NO_DELTA } from './constants';

export function mapValues(
  object: object,
  iteratee: (value: any, key: string, object: object) => any
): object {
  const result = {};

  Object.keys(object || {}).forEach(key => {
    result[key] = iteratee(object[key], key, object);
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
  value: string | number
): string | number {
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
    transform: getComputedStyle(element).transform || undefined
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
// (window as any).persistLayout = (node: Element): any[] => {
//   const result = [];
//   const { children } = node;
//   const parentRect = node.getBoundingClientRect();

//   for (let i = 0; i < children.length; i++) {
//     const child = children[i];
//     const rect = (child as Element).getBoundingClientRect();

//     result.push({
//       top: rect.top - parentRect.top,
//       left: rect.left - parentRect.left,
//       width: rect.width,
//       height: rect.height,
//     });
//   }

//   return result;
// }
