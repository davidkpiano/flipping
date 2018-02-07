"use strict";
exports.__esModule = true;
var Rematrix = require("rematrix");
var constants_1 = require("./constants");
function mapValues(object, iteratee) {
    var result = {};
    Object.keys(object || {}).forEach(function (key) {
        result[key] = iteratee(object[key], key, object);
    });
    return result;
}
exports.mapValues = mapValues;
function mapTwoValues(a, b, iteratee) {
    var result = {};
    Object.keys(a || {}).forEach(function (key) {
        result[key] = iteratee(a[key], b[key], key);
    });
    return result;
}
exports.mapTwoValues = mapTwoValues;
function matrixTranslate(x, y) {
    return Rematrix.translate(x, y).join(',');
}
exports.matrixTranslate = matrixTranslate;
function matrixScale(x, y) {
    return Rematrix.scale(x, y).join(',');
}
exports.matrixScale = matrixScale;
function matrixMultiply() {
    var matrices = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        matrices[_i] = arguments[_i];
    }
    return matrices
        .filter(function (a) { return !!a; })
        .reduce(Rematrix.multiply)
        .join(',');
}
exports.matrixMultiply = matrixMultiply;
function styleValue(prop, value) {
    if (['height', 'width', 'top', 'left'].indexOf(prop) !== -1 && typeof value === 'number') {
        return value + "px";
    }
    return value;
}
exports.styleValue = styleValue;
function getStaggerDelay(index, stagger) {
    return typeof stagger === 'function'
        ? stagger(index)
        : (stagger || 0) * index;
}
exports.getStaggerDelay = getStaggerDelay;
exports.identity = function (a) { return a; };
exports.noop = function () { };
exports.rect = function (element) {
    var _a = element.getBoundingClientRect(), top = _a.top, left = _a.left, width = _a.width, height = _a.height;
    return {
        top: top,
        left: left,
        width: width,
        height: height,
        transform: getComputedStyle(element).transform || undefined
    };
};
function isVisible(element) {
    var _a = exports.rect(element), width = _a.width, height = _a.height;
    return !(width === 0 && height === 0);
}
exports.isVisible = isVisible;
function getDelta(a, b) {
    if (!a) {
        return constants_1.NO_DELTA;
    }
    if (!a.height) {
        return a;
    }
    if (!b.height) {
        return b;
    }
    return {
        top: a.top - b.top,
        left: a.left - b.left,
        width: a.width / b.width,
        height: a.height / b.height
    };
}
exports.getDelta = getDelta;
exports.deltaChanged = function (delta) {
    return !!delta.top || !!delta.left || delta.width !== 1 || delta.height !== 1;
};
exports.boundsChanged = function (a, b) {
    return !!(a.top - b.top ||
        a.left - b.left ||
        a.width - b.width ||
        a.height - b.height);
};
// (window as any).persistLayout = (node: Element): any[] => {
//   const result = [];
//   const { children } = node;
//   const parentRect = node.getBoundingClientRect();
//   for (let i = 0; i < children.length; i++) {
//     const child = children[i];
//     const rect = (child as Element).getBoundingClientRect();
//     result.push({
//       top: rect.top - parentRect.top,
//       left: rect.left - parentRect.left,
//       width: rect.width,
//       height: rect.height,
//     });
//   }
//   return result;
// }
