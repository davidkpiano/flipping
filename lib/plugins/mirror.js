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
function mirrorPlugin(states, event) {
    if (event !== 'flip') {
        return states;
    }
    var nextStates = {};
    Object.keys(states).forEach(function (key) {
        var state = states[key];
        var element = state.element || (state.previous && state.previous.element);
        if (element) {
            // const mirrorKey = element.getAttribute('data-flip-mirror');
            if (state.type === 'ENTER' || state.type === 'LEAVE') {
                var candidateElement = element.nextElementSibling;
                while (candidateElement &&
                    (!candidateElement.hasAttribute('data-flip-key') ||
                        states[candidateElement.getAttribute('data-flip-key')].type !== 'MOVE')) {
                    candidateElement = candidateElement.nextElementSibling;
                }
                if (candidateElement) {
                    nextStates[key] = __assign({}, state, { delta: states[candidateElement.getAttribute('data-flip-key')].delta });
                }
                else {
                    nextStates[key] = state;
                }
            }
            else {
                nextStates[key] = state;
            }
        }
    });
    return nextStates;
}
exports["default"] = mirrorPlugin;
