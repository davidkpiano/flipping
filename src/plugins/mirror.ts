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
    const element = state.element || (state.previous && state.previous.element);

    if (element) {
      // const mirrorKey = element.getAttribute('data-flip-mirror');

      if (state.type === 'ENTER' || state.type === 'LEAVE') {
        let candidateElement = element.nextElementSibling;
        while (
          candidateElement &&
          (!candidateElement.hasAttribute('data-flip-key') ||
            states[candidateElement.getAttribute('data-flip-key') as string].type !== 'MOVE')
        ) {
          candidateElement = candidateElement.nextElementSibling;
        }

        if (candidateElement) {
          nextStates[key] = {
            ...state,
            delta: states[candidateElement.getAttribute('data-flip-key') as string].delta
          };
        } else {
          nextStates[key] = state;
        }
      } else {
        nextStates[key] = state;
      }
    }
  });

  return nextStates as IFlipStateMap;
}
