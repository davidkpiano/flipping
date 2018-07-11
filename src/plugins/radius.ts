import { IFlipStateMap } from '../types';
// import { deltaChanged } from '../utils';

export default function radiusPlugin(
  states: IFlipStateMap,
  event: string
): IFlipStateMap {
  if (event === 'read') {
    Object.keys(states).forEach(key => {
      const state = states[key];
      const { element } = state;
      if (!element) {
        return;
      }

      state.data.radius = getComputedStyle
        ? getComputedStyle(element).borderRadius || '0'
        : '0';
    });
  }

  return states;
}
