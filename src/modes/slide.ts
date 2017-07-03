import Flipping, {
  IFlippingOptions,
  IFlipState,
  IFlipNodeMode,
  IFlipNodesMode
} from '../Flipping';

export const slide = (state: IFlipState): IFlipNodesMode => {
  const { delta, first, last } = state;

  const nodePos: IFlipNodeMode = { from: {}, to: {} };
  const containerPos: IFlipNodeMode = { from: {}, to: {} };

  const deltaWidth = last.width - first.width;
  const deltaHeight = last.height - first.height;

  const height = Math.max(first.height, last.height);
  const width = Math.max(first.width, last.width);

  containerPos.height = height;
  containerPos.width = width;

  if (deltaWidth > 0) {
    containerPos.from.x = -deltaWidth + delta.left;
    containerPos.to.x = 0;
    nodePos.from.x = deltaWidth;
    nodePos.to.x = 0;
  } else {
    containerPos.from.x = 0;
    containerPos.to.x = deltaWidth - delta.left;
    nodePos.from.x = 0;
    nodePos.to.x = -deltaWidth;
  }

  if (deltaHeight > 0) {
    containerPos.from.y = -deltaHeight + delta.top;
    containerPos.to.y = 0;
    nodePos.from.y = deltaHeight;
    nodePos.to.y = 0;
  } else {
    containerPos.from.y = 0;
    containerPos.to.y = deltaHeight - delta.top;
    nodePos.from.y = 0;
    nodePos.to.y = -deltaHeight;
  }

  return {
    node: nodePos,
    container: containerPos,
  };
};
