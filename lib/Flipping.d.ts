import { IBounds, IFlippingConfig, IFlippingOptions, IFlipState, IFlipStateMap, FlipEventName, FlipPlugin, FlipEventListener, FlipStateEventListener } from './types';
declare class Flipping<TAnimation = any> {
    plugins: FlipPlugin[];
    selector: (element: Element) => Element[];
    active: (element: Element) => boolean;
    private activeSelector;
    getBounds: (element: Element) => IBounds;
    getKey: (element: Element) => string | undefined;
    getDelta: (first: IBounds, last: IBounds) => IBounds;
    onEnter?: FlipEventListener;
    onLeave?: FlipEventListener;
    onRead?: (stateMap: IFlipStateMap) => void;
    states: {
        [key: string]: IFlipState<TAnimation>;
    };
    parentElement: Element;
    private emitter;
    constructor(options?: IFlippingConfig & {
        [key: string]: any;
    });
    private getRelativeBounds(parentBounds, childBounds);
    private selectActive(parentElement);
    private findParent(element, parent?);
    private dispatch(event, stateMap);
    on(event: FlipEventName, listener: FlipEventListener): void;
    onFlip(key: string, listener: FlipStateEventListener): void;
    onFlip(listener: FlipEventListener): void;
    read(options?: IFlippingOptions): void;
    flip(options?: IFlippingOptions): void;
    setAnimation(key: string, animation: any): void;
    wrap<T>(fn: (...args: any[]) => T, options?: IFlippingOptions): Function;
    progress(key: string, fraction: number): IBounds | undefined;
    static progress(delta: IBounds | undefined, fraction: number): IBounds;
    static rect: (element: Element) => IBounds;
    static willScale: (state: IFlipState<any>) => boolean;
    static willMove: (state: IFlipState<any>) => boolean;
}
export default Flipping;
