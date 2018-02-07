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
var GSAP = require("gsap");
function animate(mode, elementMap, options) {
    var elementAnimations = utils_1.mapValues(elementMap, function (element, key) {
        var animation = GSAP.TweenLite.fromTo(element, options.duration, utils_1.mapValues(mode[key].from, function (value, prop) { return utils_1.styleValue(prop, value); }), utils_1.mapValues(mode[key].to, function (value, prop) { return utils_1.styleValue(prop, value); }))
            .delay(options.delay || 0)
            .eventCallback('onComplete', function () {
            GSAP.TweenLite.set(element, { clearProps: 'all' });
            animation.kill();
        });
    });
    return {
        finish: function () {
            Object.keys(elementAnimations).forEach(function (key) {
                GSAP.TweenLite.set(elementMap[key], { clearProps: 'all' });
                elementAnimations[key].kill();
            });
        }
    };
}
var slidingLayersAnimation = function (state, options) {
    var element = state.element;
    if (!element || !element.parentElement) {
        return;
    }
    var mode = animations.slide(state);
    if (!mode) {
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
    var strategy = animations.scale(state);
    if (!strategy || !element) {
        return;
    }
    return animate(strategy, { element: element }, options);
};
var autoAnimation = function (state, options) {
    var element = state.element;
    var timingOptions = __assign({}, options, { duration: (options.duration || 0) / 1000, delay: +((options.delay || 0) + utils_1.getStaggerDelay(state.index, options.stagger)) /
            1000 });
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
function gsapOnRead(stateMap) {
    Object.keys(stateMap).forEach(function (key) {
        var animation = stateMap[key].animation;
        if (animation && animation.finish) {
            animation.finish();
        }
    });
}
var defaultOptions = {
    duration: 300,
    ease: GSAP.Power1.easeInOut
};
var FlippingGsap = /** @class */ (function (_super) {
    __extends(FlippingGsap, _super);
    function FlippingGsap(options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        var optionsWithDefaults = __assign({}, defaultOptions, options);
        _this = _super.call(this, {
            onRead: gsapOnRead,
            onEnter: function (stateMap) {
                Object.keys(stateMap).forEach(function (key) {
                    FlippingGsap.animate.auto(stateMap[key], optionsWithDefaults);
                });
            },
            onFlip: function (stateMap) {
                Object.keys(stateMap).forEach(function (key) {
                    FlippingGsap.animate.auto(stateMap[key], optionsWithDefaults);
                });
            }
        }) || this;
        return _this;
    }
    FlippingGsap.animate = {
        auto: autoAnimation,
        transform: scaleAnimation,
        slidingLayers: slidingLayersAnimation
    };
    return FlippingGsap;
}(Flipping_1["default"]));
module.exports = FlippingGsap;
