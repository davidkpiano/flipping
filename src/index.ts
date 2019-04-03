interface StyleMap {
  readonly [key: string]: string | number;
}
interface Rect extends ClientRect {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly width: number;
  readonly height: number;
  readonly transform?: string;
}

export function getRect(element: HTMLElement, ancestor?: HTMLElement): Rect {
  const {
    top,
    bottom,
    left,
    right,
    width,
    height
  } = element.getBoundingClientRect();

  const parentRect = ancestor ? ancestor.getBoundingClientRect() : undefined;

  return {
    top: top - (parentRect ? parentRect.top : 0),
    bottom,
    left: left - (parentRect ? parentRect.left : 0),
    right,
    width,
    height,
    get transform() {
      return getComputedStyle(element).transform || undefined;
    }
  };
}

export function getStyles(element: HTMLElement): StyleMap {
  const computedStyle = getComputedStyle(element);

  return {
    radius: computedStyle.borderRadius || 0
  };
}

interface Delta extends Rect {
  x: number;
  y: number;
  widthRatio: number;
  heightRatio: number;
}

const NO_DELTA: Delta = {
  x: 0,
  y: 0,
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  width: 0,
  height: 0,
  widthRatio: 1,
  heightRatio: 1
};

export function getDelta(firstRect: Rect, lastRect: Rect): Delta {
  const dx = lastRect.left - firstRect.left;
  const dy = lastRect.top - firstRect.top;
  const dw = lastRect.width - firstRect.width;
  const dh = lastRect.height - firstRect.height;

  return {
    x: dx,
    y: dy,
    top: dy,
    bottom: lastRect.bottom - firstRect.bottom,
    left: dx,
    right: lastRect.right - firstRect.right,
    width: dw,
    height: dh,
    widthRatio: lastRect.width / firstRect.width,
    heightRatio: lastRect.height / firstRect.height
  };
}

export function getInverse(delta: Delta): Delta {
  return {
    x: -1 * delta.x,
    y: -1 * delta.y,
    top: -1 * delta.top,
    bottom: -1 * delta.bottom,
    left: -1 * delta.left,
    right: -1 * delta.right,
    width: -1 * delta.width,
    height: -1 * delta.height,
    widthRatio: 1 / delta.widthRatio,
    heightRatio: 1 / delta.heightRatio
  };
}
type FlipData = {
  state:
    | 'read'
    | 'pre-enter'
    | 'enter'
    | 'pre-move'
    | 'move'
    | 'pre-exit'
    | 'exit';
  key: string;
  element: HTMLElement | undefined;
  rect: Rect | undefined;
  styles: StyleMap | undefined;
  delta: Delta;
  inverse: Delta;
  previous: FlipData | undefined;
};

type FlipElementMap = Record<string, HTMLElement | undefined>;

type FlipListener = (data: FlipData) => void;

export function isVisible(element?: HTMLElement) {
  if (!element) {
    return false;
  }

  const { width, height } = getRect(element);

  return !(width === 0 && height === 0);
}

interface FlippingConfig {
  getKey: ((element: HTMLElement) => string | null | undefined) | string;
}
export class Flipping {
  public data: Record<string, FlipData | undefined> = {};
  public listeners: Map<string, FlipListener> = new Map();
  public globalListeners: Set<FlipListener> = new Set();
  public config: FlippingConfig;
  public static prefix = 'flip';
  public static keyAttr = 'data-flip-key';

  public static defaultConfig = {
    getKey(element: Element): string {
      const key = element.getAttribute(Flipping.keyAttr);

      if (!key) {
        // tslint:disable-next-line:no-console
        console.error(`No flip key found for element:`, element);
        throw new Error(`Missing flip key for element`);
      }

      return key;
    }
  };

  public static create(config: FlippingConfig = Flipping.defaultConfig) {
    return new Flipping(config);
  }

  constructor(config: FlippingConfig = Flipping.defaultConfig) {
    this.config = {
      ...Flipping.defaultConfig,
      ...config
    };
  }

  public onFlip(globalListener: FlipListener): void {
    this.globalListeners.add(globalListener);
  }

  private findAncestor(element: HTMLElement): HTMLElement | undefined {
    let currentParent = element.parentElement;

    while (currentParent && !currentParent.hasAttribute(Flipping.keyAttr)) {
      currentParent = currentParent.parentElement;
    }

    return currentParent || undefined;
  }

  private set(key: string, data: FlipData): void {
    this.data[key] = data;

    this.globalListeners.forEach(listener => {
      listener(data);
    });

    if (data.element) {
      data.element.dataset.flipState = data.state;
    } else if (data.previous && data.previous.element) {
      data.previous.element.dataset.flipState = data.state;
    }
    if (!data.rect || !data.styles) {
      return;
    }

    const distX = Math.abs(data.delta.left);
    const distY = Math.abs(data.delta.top);

    // const h = Math.hypot(distX, distY);
    // const arm = h / 2 / Math.cos(Math.atan(distX / distY));
    // const arm2 = (distX + distY) / 2;
    // const armRatio = arm / distY;
    // const theta = Math.asin(h / 2 / arm) * 2;

    const inverseXY = `translate(${data.inverse.left}px, ${
      data.inverse.top
    }px)`;
    const inverseScale = `scale(${data.inverse.widthRatio}, ${
      data.inverse.heightRatio
    })`;

    // const s = `translateY(${data.inverse.top *
    //   armRatio}px) rotate(${-theta}rad) translateY(${data.delta.top *
    //   armRatio}px) rotate(${theta}rad)`;

    // const ss = `translateY(${data.inverse.top *
    //   armRatio}px) rotate(0deg) translateY(${data.delta.top *
    //   armRatio}px) rotate(0deg)`;

    const a = `translate(${data.inverse.left + data.inverse.top}px, ${
      data.inverse.top
    }px) rotate(-90deg) translateY(${
      data.delta.top
    }px) rotate(90deg) ${inverseScale}`;
    const aa = `translate(${data.inverse.left + data.inverse.top}px, ${
      data.inverse.top
    }px) rotate(0deg) translate(${data.delta.left + data.delta.top}px, ${
      data.delta.top
    }px) rotate(0deg) scale(1)`;

    Flipping.style(
      data,
      {
        // position
        x: data.rect.left,
        y: data.rect.top,
        // delta
        dx: data.delta.left,
        dy: data.delta.top,
        // inverse delta
        ix: data.inverse.left,
        iy: data.inverse.top,
        'inverse-xy': inverseXY,
        // scale
        iw: data.inverse.width,
        ih: data.inverse.height,
        'iw-ratio': data.inverse.widthRatio,
        'ih-ratio': data.inverse.heightRatio,
        'inverse-scale': inverseScale,
        // distance
        'distance-x': distX,
        'distance-y': distY,
        distance: Math.hypot(distX, distY),
        // radius
        'inverse-radius-x': `calc((${data.styles.radius} * ${
          data.delta.widthRatio
        }))`,
        'inverse-radius-y': `calc((${data.styles.radius} * ${
          data.delta.heightRatio
        }))`,
        'inverse-radius': `var(--flip-inverse-radius-x) / var(--flip-inverse-radius-y)`,
        // curve
        curve: a,
        fcurve: aa
      },
      { px: true }
    );
  }

  public static style(
    data: FlipData,
    styles: Record<string, number | string>,
    options?: Partial<{ px: boolean }> // TODO
  ): void {
    const { element } = data;

    if (!element) {
      return;
    }

    const resolvedOptions = { px: true, ...options };

    Object.keys(styles).forEach(property => {
      const fullProperty = `--${Flipping.prefix + '-' + property}`;
      const value = `${styles[property]}`;
      element.style.setProperty(fullProperty, value);

      if (resolvedOptions.px && !isNaN(+fullProperty)) {
        element.style.setProperty(`${fullProperty}-px`, `${value}px`);
      }
    });
  }

  private toElementMap(
    elements: HTMLElement[] | FlipElementMap | undefined
  ): FlipElementMap {
    if (!elements) {
      elements = (Array.from(
        document.querySelectorAll(`[${Flipping.keyAttr}]`)
      ) as HTMLElement[]).filter(el => isVisible(el));
    }
    const map: FlipElementMap = {};

    if (Array.isArray(elements)) {
      elements.forEach(element => {
        const key =
          typeof this.config.getKey === 'string'
            ? element.getAttribute(this.config.getKey)
            : this.config.getKey(element);

        if (!key) {
          return;
        }

        map[key] = element;
      });

      return map;
    }

    return elements;
  }

  public read(elements?: HTMLElement[] | FlipElementMap): void {
    const elementMap = this.toElementMap(elements);
    Object.keys(elementMap).forEach(key => {
      const element = elementMap[key];
      const previous = this.data[key];

      if (!element) {
        return;
      }

      this.set(key, {
        key,
        element,
        state: 'read',
        rect: getRect(element, this.findAncestor(element)),
        styles: getStyles(element),
        delta: NO_DELTA,
        inverse: NO_DELTA,
        previous
      });
    });
  }

  public flip(elements?: HTMLElement[]) {
    const elementMap = this.toElementMap(elements);
    const allKeys = new Set(
      Object.keys(this.data).concat(Object.keys(elementMap))
    );

    allKeys.forEach(key => {
      const element = elementMap[key];
      let data: FlipData;
      const existingData = this.data[key];

      const visible = isVisible(element);

      if (!element || !visible) {
        data = {
          key,
          element,
          state: 'exit',
          rect: undefined,
          styles: undefined,
          delta: NO_DELTA,
          inverse: NO_DELTA,
          previous: existingData
        };
      } else if (!existingData && element && visible) {
        data = {
          key,
          element,
          state: 'enter',
          rect: getRect(element, this.findAncestor(element)),
          styles: getStyles(element),
          delta: NO_DELTA,
          inverse: NO_DELTA,
          previous: undefined
        };
      } else if (existingData && element && visible) {
        const delta = existingData.rect
          ? getDelta(
              existingData.rect,
              getRect(element, this.findAncestor(element))
            )
          : NO_DELTA;
        // console.log(existingData, getRect(element), delta);
        data = {
          key,
          element,
          state:
            existingData.state === 'exit'
              ? visible
                ? 'enter'
                : 'exit'
              : visible
              ? 'move'
              : 'exit',
          rect: getRect(element, this.findAncestor(element)),
          styles: getStyles(element),
          delta,
          inverse: getInverse(delta),
          previous: existingData
        };
      }

      requestAnimationFrame(() => {
        this.set(key, {
          ...data,
          state: `pre-${data.state}` as 'pre-enter' | 'pre-move' | 'pre-exit'
        });

        requestAnimationFrame(() => {
          this.set(key, data);
        });
      });
    });
  }
  public wrap<T>(
    fn: (...args: any[]) => T,
    elements?: HTMLElement[]
  ): (...args: any[]) => T {
    return (...args) => {
      this.read(elements);
      const result = fn.apply(null, args) as T;
      this.flip(elements);
      return result;
    };
  }
  public applyDefaultStyles() {
    const styles = `
      [data-flip-state] {
        will-change: transform;
      }
      [data-flip-state="read"] {
        transition: none;
      }
      [data-flip-state="pre-move"] {
        transition: none;
        transform: var(--flip-inverse-xy);
        --clip-path: polygon(0% 0%, calc(var(--flip-iw-ratio) * 100%) 0, calc(var(--flip-iw-ratio) * 100%) calc(var(--flip-ih-ratio) * 100%), 0 calc(var(--flip-ih-ratio) * 100%));
      }
      [data-flip-state="move"] {
        transition: all .6s ease;
        transform: none;
        --clip-path: polygon(0% 0%, 100% 0, 100% 100%, 0 100%);
      }
    `;

    const elStyle = document.createElement('style');
    elStyle.innerHTML = styles;
    document.head.appendChild(elStyle);
  }
}

export const create = Flipping.create;
