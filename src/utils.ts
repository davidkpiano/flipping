import * as Rematrix from 'rematrix';

export function mapValues(
  object: object,
  iteratee: (value: any, key: string, object: object) => object
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
  return matrices.filter(a => !!a).reduce(Rematrix.multiply).join(',');
}

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
