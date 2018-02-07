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
var utils_1 = require("./utils");
var Rematrix = require("rematrix");
exports.scale = function (state) {
    var bounds = state.bounds, delta = state.delta, type = state.type, element = state.element;
    if (!element || !delta || !bounds) {
        return undefined;
    }
    if (type === 'ENTER') {
        return {
            element: {
                from: {
                    transform: "translate(\n            " + (delta ? delta.left : 0) + "px,\n            " + (delta ? delta.top : 0) + "px)\n            scale(.01)"
                },
                to: {
                    transform: 'scale(1)'
                }
            }
        };
    }
    var preventScale = element.hasAttribute('data-flip-no-scale');
    var scaleChanged = !preventScale && (delta.width !== 1 || delta.height !== 1);
    var translate = Rematrix.translate(delta.left, delta.top);
    var scale = scaleChanged
        ? Rematrix.scale(delta.width, delta.height)
        : undefined;
    var transformOrigin = scaleChanged ? 'top left' : undefined;
    var invertedMatrix = utils_1.matrixMultiply(
    // Rematrix.parse(bounds.transform),
    translate, scale);
    var elementPosition = {
        from: __assign({ x: delta.left, y: delta.top }, transformOrigin ? { transformOrigin: transformOrigin } : undefined, { transform: "matrix3d(" + invertedMatrix + ")" }),
        to: __assign({ x: bounds.left, y: bounds.top }, transformOrigin ? { transformOrigin: transformOrigin } : undefined, { transform: bounds.transform || 'none' })
    };
    return {
        element: elementPosition
    };
};
exports.slide = function (state) {
    var delta = state.delta, previous = state.previous, bounds = state.bounds;
    if (!previous || !previous.bounds || !bounds) {
        return;
    }
    var height = Math.max(previous.bounds.height, bounds.height);
    var width = Math.max(previous.bounds.width, bounds.width);
    var elementPosition = {
        from: {
            height: height,
            width: width,
            transformOrigin: 'top left'
        },
        to: {
            height: height,
            width: width,
            transformOrigin: 'top left'
        }
    };
    var containerPosition = {
        from: {
            height: height,
            width: width,
            transformOrigin: 'top left'
        },
        to: {
            height: height,
            width: width,
            transformOrigin: 'top left'
        }
    };
    var deltaWidth = bounds.width - previous.bounds.width;
    var deltaHeight = bounds.height - previous.bounds.height;
    if (!delta) {
        return;
    }
    if (deltaWidth > 0) {
        containerPosition.from.x = -deltaWidth + delta.left;
        containerPosition.to.x = 0;
        elementPosition.from.x = deltaWidth;
        elementPosition.to.x = 0;
    }
    else {
        containerPosition.from.x = 0;
        containerPosition.to.x = deltaWidth - delta.left;
        elementPosition.from.x = 0;
        elementPosition.to.x = -deltaWidth;
    }
    if (deltaHeight > 0) {
        containerPosition.from.y = -deltaHeight + delta.top;
        containerPosition.to.y = 0;
        elementPosition.from.y = deltaHeight;
        elementPosition.to.y = 0;
    }
    else {
        containerPosition.from.y = 0;
        containerPosition.to.y = deltaHeight - delta.top;
        elementPosition.from.y = 0;
        elementPosition.to.y = -deltaHeight;
    }
    var elementFrom = utils_1.matrixTranslate(elementPosition.from.x, elementPosition.from.y);
    var elementTo = utils_1.matrixTranslate(elementPosition.to.x, elementPosition.to.y);
    var containerFrom = utils_1.matrixTranslate(containerPosition.from.x, containerPosition.from.y);
    var containerTo = utils_1.matrixTranslate(containerPosition.to.x, containerPosition.to.y);
    elementPosition.from.transform = "matrix3d(" + elementFrom + ")";
    elementPosition.to.transform = "matrix3d(" + elementTo + ")";
    containerPosition.from.transform = "matrix3d(" + containerFrom + ")";
    containerPosition.to.transform = "matrix3d(" + containerTo + ")";
    return {
        element: elementPosition,
        container: containerPosition
    };
};
