export function mapValues(object: object, iteratee: (value: any, key: string, object: object) => object): object {
  const result = {};

  Object.keys(object || {}).forEach((key) => {
    result[key] = iteratee(object[key], key, object);
  });

  return result;
}

export function mapTwoValues(a, b, iteratee) {
  const result = {};

  Object.keys(a || {}).forEach((key) => {
    result[key] = iteratee(a[key], b[key], key);
  });

  return result; 
}
