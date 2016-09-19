function mapValues(object, iteratee) {
  const result = {};

  Object.keys(object || {}).forEach((key) => {
    result[key] = iteratee(object[key], key, object);
  });

  return result;
}

const rect = (node) => {
  const {
    top,
    left,
    width,
    height,
  } = node.getBoundingClientRect();
  
  return { top, left, width, height };
}

const waapi = (deltas) => {
  Object.keys(deltas).forEach(key => {
    const delta = deltas[key];

    delta.node.animate([
      {transform: `translate(${delta.left}px, ${delta.top}px)`},
      {transform: `translate(0,0)`}
    ], 300)
  });
}

const makeWaapiAnimator = (timing) => (deltas) => {
  Object.keys(deltas).forEach(key => {
    const delta = deltas[key];

    delta.node.animate([
      {transform: `translate(${delta.left}px, ${delta.top}px)`},
      {transform: `translate(0,0)`}
    ], timing);
  });
}

function Flipping(implementation = waapi, attr = 'data-key') {
  const defaultSelector = `[${attr}]`;
  
  return (fn, selector = defaultSelector) => {
    return (...args) => {      
      const firstNodes = document.querySelectorAll(selector);

      let firstRects = {};

      firstNodes.forEach((node) => {
        const key = node.getAttribute(attr);

        firstRects[key] = rect(node);
      });

      const result = fn(...args);

      const lastNodes = document.querySelectorAll(selector);
      
      let deltas = {};
      
      lastNodes.forEach((node) => {
        const key = node.getAttribute(attr);

        const nodeRect = rect(node);
        
        deltas[key] = {
          node,
          top: firstRects[key].top - nodeRect.top,
          left: firstRects[key].left - nodeRect.left,
          width: firstRects[key].width - nodeRect.width,
          height: firstRects[key].height - nodeRect.height,
        };
      });
      
      // perform FLIP
      implementation(deltas);
      
      return result;
    }
  }
}

Flipping.animate = (timing = 300, attr = 'data-key') => Flipping(makeWaapiAnimator(timing), attr);

window.foo = () => document.querySelector('body').classList.toggle('active');
// window.flipFoo = Flipping()(foo);

module.exports = Flipping;
