"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
exports.__esModule = true;
var mitt = require("mitt");
var utils_1 = require("./utils");
var constants_1 = require("./constants");
var mirror_1 = require("./plugins/mirror");
var selector = function (parentElement) {
    var elements = parentElement.querySelectorAll("[" + constants_1.KEY_ATTR + "]");
    var visibleElements = {};
    var result = [];
    elements.forEach(function (element) {
        if (!utils_1.isVisible(element)) {
            return;
        }
        var key = element.getAttribute(constants_1.KEY_ATTR);
        if (!key) {
            return;
        }
        visibleElements[key] = element;
        result.push(element);
    });
    return result;
};
var active = function () { return true; };
var getKey = function (element) { return element.getAttribute(constants_1.KEY_ATTR) || undefined; };
var Flipping = /** @class */ (function () {
    function Flipping(options) {
        if (options === void 0) { options = {}; }
        this.selector = options.selector || selector;
        this.active = options.active || active;
        this.activeSelector = options.activeSelector || utils_1.isVisible;
        this.getBounds = options.getBounds || utils_1.rect;
        this.getDelta = options.getDelta || utils_1.getDelta;
        this.getKey = options.getKey || getKey;
        this.parentElement = options.parent || document.documentElement;
        this.plugins = options.plugins || [mirror_1["default"]];
        this.emitter = new mitt();
        if (options.onRead) {
            this.on('read', options.onRead);
        }
        if (options.onFlip) {
            this.on('flip', options.onFlip);
        }
        if (options.onEnter) {
            this.on('enter', options.onEnter);
        }
        if (options.onLeave) {
            this.on('leave', options.onLeave);
        }
        this.states = {};
    }
    Flipping.prototype.getRelativeBounds = function (parentBounds, childBounds) {
        return __assign({}, childBounds, { top: childBounds.top - parentBounds.top, left: childBounds.left - parentBounds.left });
    };
    Flipping.prototype.selectActive = function (parentElement) {
        var _this = this;
        var elements = parentElement.querySelectorAll("[" + constants_1.KEY_ATTR + "]");
        var activeElements = {};
        var result = [];
        elements.forEach(function (element) {
            if (!_this.activeSelector(element)) {
                return;
            }
            var key = element.getAttribute(constants_1.KEY_ATTR);
            if (!key) {
                return;
            }
            activeElements[key] = element;
            result.push(element);
        });
        return result;
    };
    Flipping.prototype.findParent = function (element, parent) {
        if (parent === void 0) { parent = this.parentElement; }
        var parentKey = element.getAttribute('data-flip-parent');
        var currentParent = element.parentElement;
        if (!parentKey) {
            while (currentParent && !currentParent.hasAttribute('data-flip-key')) {
                currentParent = currentParent.parentElement;
            }
        }
        else {
            while (currentParent && this.getKey(currentParent) !== parentKey) {
                currentParent = currentParent.parentElement;
            }
        }
        return currentParent || parent;
    };
    Flipping.prototype.dispatch = function (event, stateMap) {
        var finalStateMap = this.plugins.reduce(function (intermediateStateMap, plugin) {
            return plugin(intermediateStateMap, event);
        }, stateMap);
        this.emitter.emit(event, finalStateMap);
    };
    Flipping.prototype.on = function (event, listener) {
        this.emitter.on(event, listener);
    };
    Flipping.prototype.onFlip = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var key;
        var listener;
        if (args.length === 2) {
            key = args[0], listener = args[1];
        }
        else {
            listener = args[0];
        }
        this.emitter.on('flip', key
            ? function (stateMap) {
                var state = stateMap[key];
                if (state) {
                    listener(state);
                }
            }
            : listener);
    };
    Flipping.prototype.read = function (options) {
        if (options === void 0) { options = {}; }
        this.flip(__assign({}, options, { readOnly: true }));
    };
    Flipping.prototype.flip = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var parentElement = options.parent || this.parentElement;
        var elements = this.selectActive(parentElement);
        var fullState = {};
        // const config = {
        //   onFlip: this.onFlip,
        //   onEnter: this.onEnter,
        //   onLeave: this.onLeave,
        //   ...options
        // };
        elements.forEach(function (element, index) {
            var key = _this.getKey(element);
            if (!key) {
                return;
            }
            var childParent = _this.findParent(element, parentElement);
            var childParentKey = _this.getKey(childParent);
            var childParentState = childParentKey ? fullState[childParentKey] : undefined;
            var parentBounds = _this.getBounds(childParent);
            var previous = _this.states[key];
            var isPresent = previous && previous.type !== 'LEAVE';
            var bounds = _this.getRelativeBounds(parentBounds, _this.getBounds(element));
            var delta = isPresent && previous && previous.bounds
                ? _this.getDelta(previous.bounds, bounds)
                : undefined;
            var newState = {
                type: isPresent ? 'MOVE' : 'ENTER',
                key: key,
                element: element,
                bounds: bounds,
                delta: delta,
                start: Date.now(),
                animation: isPresent ? previous.animation : undefined,
                index: index,
                previous: previous
                    ? {
                        type: previous.type,
                        bounds: previous.bounds,
                        animation: previous.animation,
                        element: previous.element
                    }
                    : undefined,
                parent: childParentState
            };
            _this.states[key] = fullState[key] = newState;
        });
        if (options.readOnly) {
            return this.dispatch('read', fullState);
        }
        Object.keys(this.states).forEach(function (key, index) {
            if (fullState[key]) {
                return;
            }
            var prevState = _this.states[key];
            _this.states[key] = fullState[key] = {
                type: 'LEAVE',
                key: key,
                element: undefined,
                bounds: undefined,
                start: Date.now(),
                animation: undefined,
                delta: undefined,
                index: index,
                parent: undefined,
                previous: {
                    type: prevState.type,
                    bounds: prevState.bounds,
                    animation: prevState.animation,
                    element: prevState.element
                }
            };
        });
        return this.dispatch('flip', fullState);
    };
    Flipping.prototype.setAnimation = function (key, animation) {
        this.states[key].animation = animation;
    };
    Flipping.prototype.wrap = function (fn, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.read(options);
            var result = fn.apply(null, args);
            _this.flip(options);
            return result;
        };
    };
    Flipping.prototype.progress = function (key, fraction) {
        var delta = this.states[key].delta;
        if (!delta) {
            return;
        }
        return Flipping.progress(delta, fraction);
    };
    Flipping.progress = function (delta, fraction) {
        if (!delta) {
            return constants_1.NO_DELTA;
        }
        var invFraction = 1 - fraction;
        return {
            top: delta.top * invFraction,
            left: delta.left * invFraction,
            width: delta.width * invFraction,
            height: delta.height * invFraction
        };
    };
    Flipping.rect = utils_1.rect;
    Flipping.willScale = function (state) {
        return !!(state && state.element && !state.element.hasAttribute('data-noflip') && state.delta && (state.delta.width !== 1 || state.delta.height !== 1));
    };
    Flipping.willMove = function (state) {
        if (!state || !state.delta) {
            return false;
        }
        return state && (state.delta.top !== 0 || state.delta.left !== 0);
    };
    return Flipping;
}());
exports["default"] = Flipping;
