"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var Flipping_1 = require("../Flipping");
var animations = require("../animations");
var utils_1 = require("../utils");
var STATE_ATTR = 'data-flip-state';
function animate(strategy, elementMap, options) {
    var elementAnimations = utils_1.mapValues(elementMap, function (element, key) {
        requestAnimationFrame(function () { return element.setAttribute(STATE_ATTR, 'active'); });
        var animation = element.animate([
            utils_1.mapValues(strategy[key].from, function (value, prop) {
                return utils_1.styleValue(prop, value);
            }),
            utils_1.mapValues(strategy[key].to, function (value, prop) {
                return utils_1.styleValue(prop, value);
            })
        ], options);
        animation.onfinish = function () {
            element.setAttribute(STATE_ATTR, 'complete');
        };
        return animation;
    });
    return {
        finish: function () {
            utils_1.mapValues(elementAnimations, function (elementAnimation) {
                elementAnimation.finish();
            });
        }
    };
}
var slidingLayersAnimation = function (state, options) {
    var element = state.element;
    var mode = animations.slide(state);
    if (!mode || !element || !element.parentElement) {
        return;
    }
    return animate(mode, {
        element: element,
        container: element.parentElement
    }, options);
};
var scaleAnimation = function (state, options) {
    if (options === void 0) { options = {}; }
    var element = state.element;
    var mode = animations.scale(state);
    if (!mode || !element) {
        return;
    }
    return animate(mode, { element: element }, options);
};
var autoAnimation = function (state, options) {
    var element = state.element;
    var timingOptions = __assign({}, options, { delay: +(options.delay || 0) +
            utils_1.getStaggerDelay(state.index, options.stagger || 0), fill: options.stagger ? 'both' : 'none' });
    if (!element) {
        return;
    }
    if (element &&
        element.parentElement &&
        element.parentElement.hasAttribute('data-flip-wrap')) {
        return slidingLayersAnimation(state, timingOptions);
    }
    return scaleAnimation(state, timingOptions);
};
function waapiOnRead(stateMap) {
    Object.keys(stateMap).forEach(function (key) {
        var animation = stateMap[key].animation;
        if (animation && animation.finish) {
            animation.finish();
        }
    });
}
var FlippingWeb = /** @class */ (function (_super) {
    __extends(FlippingWeb, _super);
    function FlippingWeb(options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        var optionsWithDefaults = __assign({}, FlippingWeb.defaults, options);
        _this = _super.call(this, __assign({ onRead: waapiOnRead, onFlip: function (stateMap) {
                Object.keys(stateMap).forEach(function (key) {
                    var animation = FlippingWeb.animate.auto(stateMap[key], optionsWithDefaults);
                    _this.setAnimation(key, animation);
                });
            } }, optionsWithDefaults)) || this;
        return _this;
    }
    FlippingWeb.defaults = {
        duration: 300,
        delay: 0,
        easing: 'ease',
        fill: 'none',
        stagger: 0
    };
    FlippingWeb.animate = {
        auto: autoAnimation,
        transform: scaleAnimation,
        slidingLayers: slidingLayersAnimation
    };
    return FlippingWeb;
}(Flipping_1["default"]));
module.exports = FlippingWeb;
