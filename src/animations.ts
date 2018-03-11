import {
  IFlipState,
  IFlipElementStrategy,
  IFlipElementsStrategy
} from './types';
import { matrixTranslate, matrixMultiply } from './utils';
import * as Rematrix from 'rematrix';

export const scale = (state: IFlipState): IFlipElementsStrategy | undefined => {
  const { bounds, delta, element } = state;

  if (!element || !delta || !bounds) {
    return undefined;
  }

  const scaleChanged =
    !state.data.noScale && (delta.width !== 1 || delta.height !== 1);
  const translate = Rematrix.translate(delta.left, delta.top);
  const scale = scaleChanged
    ? Rematrix.scale(delta.width, delta.height)
    : undefined;
  const transformOrigin = scaleChanged ? 'top left' : undefined;
  const invertedMatrix = matrixMultiply(
    // Rematrix.parse(bounds.transform),
    translate,
    scale
  );

  const elementPosition: IFlipElementStrategy = {
    from: {
      x: delta.left,
      y: delta.top,
      ...(transformOrigin ? { transformOrigin } : undefined),
      transform: `matrix3d(${invertedMatrix})`
    },
    to: {
      x: bounds.left,
      y: bounds.top,
      ...(transformOrigin ? { transformOrigin } : undefined),
      transform: bounds.transform || 'none'
    }
  };

  return {
    element: elementPosition
  };
};

export const slide = (state: IFlipState): IFlipElementsStrategy | undefined => {
  const { delta, previous, bounds } = state;

  if (!previous || !previous.bounds || !bounds) {
    return;
  }

  const height = Math.max(previous.bounds.height, bounds.height);
  const width = Math.max(previous.bounds.width, bounds.width);

  const elementPosition: IFlipElementStrategy = {
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
  const containerPosition: IFlipElementStrategy = {
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

  const deltaWidth = bounds.width - previous.bounds.width;
  const deltaHeight = bounds.height - previous.bounds.height;

  if (!delta) {
    return;
  }

  if (deltaWidth > 0) {
    containerPosition.from.x = -deltaWidth + delta.left;
    containerPosition.to.x = 0;
    elementPosition.from.x = deltaWidth;
    elementPosition.to.x = 0;
  } else {
    containerPosition.from.x = 0;
    containerPosition.to.x = deltaWidth - delta.left;
    elementPosition.from.x = 0;
    elementPosition.to.x = -deltaWidth;
  }

  if (deltaHeight > 0) {
    containerPosition.from.y = -deltaHeight + delta.top;
    containerPosition.to.y = 0;
    elementPosition.from.y = deltaHeight;
    elementPosition.to.y = 0;
  } else {
    containerPosition.from.y = 0;
    containerPosition.to.y = deltaHeight - delta.top;
    elementPosition.from.y = 0;
    elementPosition.to.y = -deltaHeight;
  }

  const elementFrom = matrixTranslate(
    elementPosition.from.x,
    elementPosition.from.y
  );
  const elementTo = matrixTranslate(elementPosition.to.x, elementPosition.to.y);
  const containerFrom = matrixTranslate(
    containerPosition.from.x,
    containerPosition.from.y
  );
  const containerTo = matrixTranslate(
    containerPosition.to.x,
    containerPosition.to.y
  );

  elementPosition.from.transform = `matrix3d(${elementFrom})`;
  elementPosition.to.transform = `matrix3d(${elementTo})`;
  containerPosition.from.transform = `matrix3d(${containerFrom})`;
  containerPosition.to.transform = `matrix3d(${containerTo})`;

  return {
    element: elementPosition,
    container: containerPosition
  };
};
