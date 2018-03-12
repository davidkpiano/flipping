import Flipping from '../Flipping';

function styleVars(
  element: HTMLElement,
  valueMap: Record<string, number | undefined>,
  prefix: string = 'flip'
): void {
  Object.keys(valueMap).forEach(property => {
    const value = valueMap[property];
    if (value === undefined || !element) {
      return;
    }

    element.style.setProperty(
      `--${prefix}-${property}`,
      `${valueMap[property]}`
    );
  });
}

class FlippingCSS extends Flipping {
  constructor() {
    super({
      onFlip: stateMap => {
        Object.keys(stateMap).forEach(key => {
          const state = stateMap[key];

          if (state.delta) {
            styleVars(
              state.element as HTMLElement,
              {
                dx: state.delta.left,
                dy: state.delta.top,
                dw: state.delta.width,
                dh: state.delta.height,
                ...(state.data && state.data.noScale
                  ? { dw: 1, dh: 1 }
                  : undefined),
                active: 0
              } as Record<string, any>
            );
          }
        });
        setTimeout(() => {
          Object.keys(stateMap).forEach(key => {
            const state = stateMap[key];

            if (state.bounds) {
              styleVars(
                state.element as HTMLElement,
                {
                  dx: 0,
                  dy: 0,
                  dw: 1,
                  dh: 1,
                  active: 1
                } as Record<string, any>
              );
            }
          });
        }, 0);
      }
    });
  }
}

export = FlippingCSS;
