export interface IBounds {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  transform?: string;
}

export type FlipIteratee = (
  state: IFlipState,
  key: string,
  fullState: { [key: string]: IFlipState }
) => any;

export interface IFlippingConfig {
  active?: (element: Element) => boolean;
  getDelta?: (Bounds) => IBounds;
  getBounds?: (node: Element) => IBounds;
  selector?: (parent: Element) => Element[];
  onFlip?: FlipIteratee;
  onRead?: (state: IFlipState) => void;
  onEnter?: (state: IFlipState) => void;
  onLeave?: (state: IFlipState) => void;
  getKey?: () => string;
  parent?: Element;
}

export interface IFlippingOptions extends IFlippingConfig {
  readOnly?: boolean;
}

export interface IFlipNodeMode {
  from: {
    x?: number;
    y?: number;
    [key: string]: string | number;
  };
  to: {
    x?: number;
    y?: number;
    [key: string]: string | number;
  };
}

export interface IFlipNodesMode {
  node: IFlipNodeMode;
  container?: IFlipNodeMode;
}

export type IFlipStateType = 'ENTER' | 'MOVE' | 'LEAVE';

export interface IFlipState {
  type: IFlipStateType;
  key: string;
  node: Element | undefined;
  bounds: IBounds;
  delta: IBounds | undefined;
  animation: any;
  index: number;
  previous: Pick<IFlipState, 'type' | 'bounds' | 'animation' | 'node'> | undefined;
  start: number;
}
