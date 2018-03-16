import { IFlipStateMap, IBounds } from '../types';

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

      if (element.hasAttribute('data-flip-follow')) {
        const followKey = element.getAttribute('data-flip-follow')!;

        if (followKey && states[followKey]) {
          nextStates[key] = {
            ...state,
            delta: {
              left: 0,
              top: 0,
              ...states[followKey].delta,
              width: 1,
              height: 1
            } as IBounds
          };
        } else if (state.type === 'ENTER' || state.type === 'LEAVE') {
          let candidateElement = element.nextElementSibling;
          while (
            candidateElement &&
            (!candidateElement.hasAttribute('data-flip-key') ||
              states[candidateElement.getAttribute('data-flip-key')!].type !==
                'MOVE')
          ) {
            candidateElement = candidateElement.nextElementSibling;
          }

          if (candidateElement) {
            const candidateDelta = states[
              candidateElement.getAttribute('data-flip-key')!
            ].delta!;

            nextStates[key] = {
              ...state,
              delta: {
                left: candidateDelta.left,
                top: candidateDelta.top,
                width: 1,
                height: 1
              }
            };
          }
        }
      }
    }
  });

  return Object.assign(states, nextStates) as IFlipStateMap;
}
