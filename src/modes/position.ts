import Flipping, { IFlippingOptions, IFlipState } from '../Flipping';

interface IFlipNodeStrategy {
  height?: number;
  width?: number;
  from: {
    [key: string]: string | number;
  };
  to: {
    [key: string]: string | number;
  };
};

interface IFlipNodesStrategy {
  node: IFlipNodeStrategy;
  container?: IFlipNodeStrategy;
}

export const position = (state: IFlipState): IFlipNodesStrategy => {
  const { first, last, node } = state;
  const parentRect = node.parentElement.getBoundingClientRect();

  const nodePos: IFlipNodeStrategy = {
    from: {
      x: first.left - parentRect.left,
      y: first.top - parentRect.top,
      position: 'absolute',
    },
    to: {
      x: last.left - parentRect.left,
      y: last.top - parentRect.top,
      position: 'absolute',
    },
  };

  return {
    node: nodePos,
  };
};
