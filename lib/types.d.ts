/// <reference types="web-animations-js" />
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
export declare type FlipIteratee = (state: IFlipState, key: string, fullState: {
    [key: string]: IFlipState;
}) => any;
export declare type FlipEventName = 'read' | 'flip' | 'enter' | 'leave';
export declare type FlipEventListener = (fullState: IFlipStateMap) => any;
export declare type FlipStateEventListener = (state: IFlipState) => any;
export declare type FlipEmit = (type: FlipEventName, event?: IFlipStateMap) => void;
export declare type FlipPlugin = (stateMap: IFlipStateMap, eventName: FlipEventName) => IFlipStateMap;
export interface IFlippingConfig {
    active?: (element: Element) => boolean;
    getDelta?: (Bounds) => IBounds;
    getBounds?: (element: Element) => IBounds;
    selector?: (parent: Element) => Element[];
    onFlip?: (state: IFlipStateMap) => void;
    onRead?: (state: IFlipStateMap) => void;
    onEnter?: (state: IFlipStateMap) => void;
    onLeave?: (state: IFlipStateMap) => void;
    getKey?: () => string;
    parent?: Element;
    plugins?: FlipPlugin[];
}
export interface IFlippingOptions extends IFlippingConfig {
    readOnly?: boolean;
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
    element: IFlipElementStrategy;
    container?: IFlipElementStrategy;
}
export declare type IFlipStateType = 'PENDING' | 'ENTER' | 'MOVE' | 'LEAVE';
export interface IFlipState<TAnimation = any> {
    type: IFlipStateType;
    key: string;
    element: Element | undefined;
    bounds: IBounds | undefined;
    delta: IBounds | undefined;
    animation: TAnimation;
    index: number;
    previous: Pick<IFlipState, 'type' | 'bounds' | 'animation' | 'element'> | undefined;
    start: number;
    parent: IFlipState<TAnimation> | undefined;
}
export interface ICustomEffectTiming {
    stagger?: number | ((index: number) => number);
}
export declare type FlippingWebOptions = IFlippingConfig & AnimationEffectTiming & ICustomEffectTiming;
export declare type GSAPAnimation = {
    finish: () => void;
};
export interface IGSAPOptions {
    duration: number;
    delay?: number;
}
