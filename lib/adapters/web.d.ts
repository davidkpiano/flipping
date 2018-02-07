import { IFlipState, FlippingWebOptions } from '../types';
import Flipping from '../Flipping';
declare class FlippingWeb extends Flipping {
    static defaults: FlippingWebOptions;
    static animate: {
        auto: (state: IFlipState<any>, options: FlippingWebOptions) => any;
        transform: (state: IFlipState<any>, options?: FlippingWebOptions) => any;
        slidingLayers: (state: IFlipState<any>, options: FlippingWebOptions) => any;
    };
    constructor(options?: FlippingWebOptions);
}
export = FlippingWeb;
