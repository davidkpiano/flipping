import { IFlipState, IFlipNodeMode, IFlipNodesMode } from './Flipping';
import { matrixTranslate, matrixMultiply } from './utils';
import * as Rematrix from 'rematrix';

export const scale = (state: IFlipState): IFlipNodesMode => {
  const { last, delta } = state;
  const scaleChanged = delta.width !== 1 || delta.height !== 1;
  const translate = Rematrix.translate(delta.left, delta.top);
  const scale = scaleChanged
    ? Rematrix.scale(delta.width, delta.height)
    : undefined;
  const transformOrigin = scaleChanged ? 'top left' : undefined;
  const invertedMatrix = matrixMultiply(
    // Rematrix.parse(last.transform),
    translate,
    scale
  );

  const nodePos: IFlipNodeMode = {
    from: {
      x: delta.left,
      y: delta.top,
      transformOrigin,
      transform: `matrix3d(${invertedMatrix})`
    },
    to: {
      x: last.left,
      y: last.top,
      transformOrigin,
      transform: last.transform
    }
  };

  return {
    node: nodePos
  };
};

export const slide = (state: IFlipState): IFlipNodesMode => {
  const { delta, first, last } = state;

  const height = Math.max(first.height, last.height);
  const width = Math.max(first.width, last.width);

  const nodePos: IFlipNodeMode = {
    from: {
      height,
      width,
      transformOrigin: 'top left'
    },
    to: {
      height,
      width,
      transformOrigin: 'top left'
    }
  };
  const containerPos: IFlipNodeMode = {
    from: {
      height,
      width,
      transformOrigin: 'top left'
    },
    to: {
      height,
      width,
      transformOrigin: 'top left'
    }
  };

  const deltaWidth = last.width - first.width;
  const deltaHeight = last.height - first.height;

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

  const nodeFrom = matrixTranslate(nodePos.from.x, nodePos.from.y);
  const nodeTo = matrixTranslate(nodePos.to.x, nodePos.to.y);
  const containerFrom = matrixTranslate(
    containerPos.from.x,
    containerPos.from.y
  );
  const containerTo = matrixTranslate(containerPos.to.x, containerPos.to.y);

  nodePos.from.transform = `matrix3d(${nodeFrom})`;
  nodePos.to.transform = `matrix3d(${nodeTo})`;
  containerPos.from.transform = `matrix3d(${containerFrom})`;
  containerPos.to.transform = `matrix3d(${containerTo})`;

  return {
    node: nodePos,
    container: containerPos
  };
};
