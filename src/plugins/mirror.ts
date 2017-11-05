import { IFlipStateMap } from '../types';

export default function mirrorPlugin(
  states: IFlipStateMap,
  event: string
): IFlipStateMap {
  if (event !== 'flip') {
    return states;
  }

  const nextStates: Partial<IFlipStateMap> = {};

  Object.keys(states).forEach(key => {
    const state = states[key];
    const node = state.node || (state.previous && state.previous.node);

    if (node) {
      // const mirrorKey = node.getAttribute('data-flip-mirror');

      if (state.type === 'ENTER' || state.type === 'LEAVE') {
        let m = node.nextElementSibling;
        while (
          m &&
          (!m.hasAttribute('data-flip-key') ||
            states[m.getAttribute('data-flip-key')].type !== 'MOVE')
        ) {
          m = m.nextElementSibling;
        }

        if (m) {
          nextStates[key] = {
            ...state,
            delta: states[m.getAttribute('data-flip-key')].delta
          };
        } else {
          nextStates[key] = state;
        }
      } else {
        nextStates[key] = state;
      }
    }
  });

  return nextStates;
}
