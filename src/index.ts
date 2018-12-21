interface Rect extends ClientRect {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly width: number;
  readonly height: number;
  readonly transform?: string;
}

export function rect(element: Element): Rect {
  const {
    top,
    bottom,
    left,
    right,
    width,
    height
  } = element.getBoundingClientRect();

  return {
    top,
    bottom,
    left,
    right,
    width,
    height,
    get transform() {
      return getComputedStyle(element).transform || undefined;
    }
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
interface FlipData {
  key: string;
  element: HTMLElement;
  state: string;
  rect: Rect;
  delta: Delta;
  inverse: Delta;
  previous: FlipData | undefined;
}

type FlipElementMap = Record<string, HTMLElement | undefined>;

type FlipListener = (data: FlipData) => void;

export function isVisible(element: HTMLElement) {
  const { width, height } = rect(element);

  return !(width === 0 && height === 0);
}
export class Flipping {
  public data: Record<string, FlipData | undefined> = {};
  public listeners: Map<string, FlipListener> = new Map();
  public globalListeners: Set<FlipListener> = new Set();
  public static prefix = "flip";
  public static keyAttr = "data-flip-key";

  public config = {
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

  constructor() {}

  public onFlip(globalListener: FlipListener): void {
    this.globalListeners.add(globalListener);
  }

  private set(key: string, data: FlipData): void {
    this.data[key] = data;

    this.globalListeners.forEach(listener => {
      listener(data);
      const distX = Math.abs(data.delta.left);
      const distY = Math.abs(data.delta.top);

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
          // distance
          "distance-x": distX,
          "distance-y": distY,
          distance: Math.hypot(distX, distY)
        },
        { px: true }
      );
    });
  }

  public static style(
    data: FlipData,
    styles: Record<string, number | string>,
    options?: Partial<{ px: boolean }> // TODO
  ): void {
    const { element } = data;
    const resolvedOptions = { px: true, ...options };

    Object.keys(styles).forEach(property => {
      const fullProperty = `--${Flipping.prefix + "-" + property}`;
      const value = `${styles[property]}`;
      element.style.setProperty(fullProperty, value);

      if (resolvedOptions.px) {
        element.style.setProperty(`${fullProperty}-px`, `${value}px`);
      }
    });

    element.dataset.flipState = data.state;
  }

  private toElementMap(
    elements: HTMLElement[] | FlipElementMap | undefined
  ): FlipElementMap {
    if (!elements) {
      elements = Array.from(
        document.querySelectorAll(`[${Flipping.keyAttr}]`)
      ) as HTMLElement[];
    }
    const map: FlipElementMap = {};

    if (Array.isArray(elements)) {
      elements.forEach(element => {
        const key = this.config.getKey(element);

        map[key] = element;
      });

      return map;
    }

    return elements;
  }

  public read(): void;
  public read(elements: HTMLElement[]): void;
  public read(elementMap: FlipElementMap): void;
  public read(elements?: HTMLElement[] | FlipElementMap): void {
    const elementMap = this.toElementMap(elements);
    Object.keys(elementMap).forEach(key => {
      const element = elementMap[key];
      const previous = this.data[key];

      if (!element) {
        return;
      }

      const visible = isVisible(element);

      this.set(key, {
        key,
        element,
        state: visible ? "read" : "hidden",
        rect: rect(element),
        delta: NO_DELTA,
        inverse: NO_DELTA,
        previous
      });
    });
  }

  public flip(): void;
  public flip(elements: HTMLElement[]): void;
  public flip(elements?: HTMLElement[]) {
    if (!elements) {
      elements = Array.from(document.querySelectorAll("[data-flip-key]"));
    }

    elements.forEach(element => {
      const key = this.config.getKey(element);
      let data: FlipData;
      const existingData = this.data[key];

      const visible = isVisible(element);

      if (!existingData) {
        data = {
          key,
          element,
          state: "enter",
          rect: rect(element),
          delta: NO_DELTA,
          inverse: NO_DELTA,
          previous: undefined
        };
      } else {
        const delta = getDelta(existingData.rect, rect(element));
        data = {
          key,
          element,
          state:
            existingData.state === "hidden"
              ? visible
                ? "enter"
                : "hidden"
              : visible
                ? "move"
                : "exit",
          rect: rect(element),
          delta,
          inverse: getInverse(delta),
          previous: existingData
        };
      }

      requestAnimationFrame(() => {
        this.set(key, { ...data, state: `pre-${data.state}` });
        requestAnimationFrame(() => {
          this.set(key, data);
        });
      });
    });
  }
}

// function
