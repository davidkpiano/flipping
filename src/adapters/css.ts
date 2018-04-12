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

const matrixRegex = /matrix\(.*, .*, .*, .*, (.*), (.*)\)/;

class FlippingCSS extends Flipping {
  constructor() {
    super({
      onFlip: stateMap => {
        Object.keys(stateMap).forEach(key => {
          const state = stateMap[key];

          if (state.delta) {
            
            let tx = 0;
            let ty = 0;

            if ( state.bounds && state.bounds.transform )
            {
              const match = state.bounds.transform.match(matrixRegex);
              if ( match && match.length === 3 )
              {
                tx = parseFloat( match[1] );
                ty = parseFloat( match[2] );
              }
            }

            styleVars(
              state.element as HTMLElement,
              {
                dx: state.delta.left + tx,
                dy: state.delta.top + ty,
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
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
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
          });
        });
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
