export interface IBounds {
  top: number;
  left: number;
  width: number;
  height: number;
  transform?: string;
}

export interface IFlipStateMap<TAnimation = any> {
  [key: string]: IFlipState<TAnimation>;
}

export type FlipIteratee = (
  state: IFlipState,
  key: string,
  fullState: { [key: string]: IFlipState }
) => any;

export type FlipEventName = 'read' | 'flip' | 'enter' | 'leave';
export type FlipEventListener = (fullState: IFlipStateMap) => any;
export type FlipStateEventListener = (state: IFlipState) => any;
export type FlipEmit = (type: FlipEventName, event?: IFlipStateMap) => void;
export type FlipPlugin = (
  stateMap: IFlipStateMap,
  eventName: FlipEventName
) => IFlipStateMap;

export interface IFlippingConfig {
  active?: (element: Element) => boolean;
  getDelta?: (Bounds) => IBounds;
  getBounds?: (element: Element) => IBounds;
  selector?: (parent: Element) => Element[];
  attribute?: string;
  onFlip?: (state: IFlipStateMap) => void;
  onRead?: (state: IFlipStateMap) => void;
  onEnter?: (state: IFlipStateMap) => void;
  onLeave?: (state: IFlipStateMap) => void;
  getKey?: () => string;
  parent?: Element;
  plugins?: FlipPlugin[];
}

export interface IFlippingOptions<TAnimationConfig = {}>
  extends IFlippingConfig {
  readOnly?: boolean;
  timing?: TAnimationConfig | Record<string, TAnimationConfig>;
}

export interface IFlipElementStrategy {
  from: {
    x?: number;
    y?: number;
    [key: string]: string | number | undefined;
  };
  to: {
    x?: number;
    y?: number;
    [key: string]: string | number | undefined;
  };
}

export interface IFlipElementsStrategy {
  [key: string]: IFlipElementStrategy;
}

export type IFlipStateType = 'PENDING' | 'ENTER' | 'MOVE' | 'LEAVE';
export interface IFlipState<TAnimation = any> {
  type: IFlipStateType;
  key: string;
  element: Element | undefined;
  bounds: IBounds | undefined;
  delta: IBounds | undefined;
  animation: TAnimation;
  index: number;
  previous:
    | Pick<IFlipState, 'type' | 'bounds' | 'animation' | 'element' | 'data'>
    | undefined;
  start: number;
  parent: IFlipState<TAnimation> | undefined;
  data: FlipData;
}

export interface IFlipData {
  key?: string;
  noScale?: boolean;
  state?: string;
}

export type FlipData = { [key: string]: string } & IFlipData;

export interface ICustomEffectTiming {
  stagger?: number | ((index: number) => number);
}

export interface AnimationEffectTiming {
  duration?: number;
  delay?: number;
  easing?: string;
  fill?: 'none' | 'forwards' | 'backwards' | 'both' | 'auto' | undefined;
  stagger?: number;
}

export type FlippingWebOptions = IFlippingConfig &
  AnimationEffectTiming &
  ICustomEffectTiming;

export type GSAPAnimation = {
  finish: () => void;
};

export interface IGSAPOptions {
  duration: number;
  delay?: number;
}

export type FlipSelector = (element: Element) => Element[];

export namespace mitt {
  type Handler = (event?: any) => void;

  export interface Emitter {
    /**
     * Register an event handler for the given type.
     *
     * @param {string} type Type of event to listen for, or `"*"` for all events.
     * @param {Handler} handler Function to call in response to the given event.
     *
     * @memberOf Mitt
     */
    on(type: string, handler: Handler): void;

    /**
     * Function to call in response to the given event
     *
     * @param {string} type Type of event to unregister `handler` from, or `"*"`
     * @param {Handler} handler Handler function to remove.
     *
     * @memberOf Mitt
     */
    off(type: string, handler: Handler): void;

    /**
     * Invoke all handlers for the given type.
     * If present, `"*"` handlers are invoked prior to type-matched handlers.
     *
     * @param {string} type The event type to invoke
     * @param {any} [event] An event object, passed to each handler
     *
     * @memberOf Mitt
     */
    emit(type: string, event?: any): void;
  }
}
