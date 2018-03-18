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

const flipStyle = (attr: string) => `
[${attr}] {
  transition-property: transform;
  transition-duration: calc(var(--flip-active, 1) * 0.6s);
  transform-origin: top left;
  transform:
    translateX(calc(var(--flip-dx, 0) * 1px))
    translateY(calc(var(--flip-dy, 0) * 1px))
    scale(var(--flip-dw, 1), var(--flip-dh, 1));
}
`;

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

    this.injectStyle();
  }
  injectStyle() {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = flipStyle(this.attribute);

    document.querySelector('head')!.appendChild(styleEl);
  }
}

export = FlippingCSS;
