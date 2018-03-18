import { IFlipStateMap } from '../types';
import { deltaChanged } from '../utils';

export default function radiusPlugin(
  states: IFlipStateMap,
  event: string
): IFlipStateMap {
  if (event !== 'flip') {
    return states;
  }

  const nextStates: Partial<IFlipStateMap> = {};

  Object.keys(states).forEach(key => {
    const state = states[key];
    const { element, previous, delta } = state;

    if (!element || !previous || !previous.element) {
      return;
    }

    if (!delta || !deltaChanged(delta)) {
      return;
    }

    const prevComputedStyle = getComputedStyle(previous.element);
    const computedStyle = getComputedStyle(element);

    const { borderRadius: prevRadius } = prevComputedStyle;
    const { borderRadius: radius } = computedStyle;

    if (prevRadius === radius) {
      return;
    }

    console.log({ prevRadius, radius });
  });

  return Object.assign(states, nextStates) as IFlipStateMap;
}
