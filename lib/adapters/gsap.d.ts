/// <reference types="web-animations-js" />
import Flipping from '../Flipping';
import { IFlippingConfig, IFlipState, GSAPAnimation } from '../types';
declare class FlippingGsap extends Flipping<GSAPAnimation> {
    static animate: {
        auto: (state: IFlipState<any>, options: any) => any;
        transform: (state: IFlipState<any>, options?: any) => any;
        slidingLayers: (state: IFlipState<any>, options: any) => any;
    };
    constructor(options?: IFlippingConfig & AnimationEffectTiming);
}
export = FlippingGsap;
