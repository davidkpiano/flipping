import Flipping from '../src/flipping';
import { assert } from 'chai';

(global as any).getComputedStyle = () => ({});

declare type Element = {
  getAttribute: (attr: string) => string;
  hasAttribute: (attr: string) => boolean;
  getBoundingClientRect: () => IRect;
  _setRect: (rect: IRect) => void;
};

function mockGetBounds(element: Element) {
  return {
    ...element.getBoundingClientRect()
  };
}

interface IRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function createMockElement(key: string, rect: IRect): Element {
  let currentRect = rect;

  return {
    getAttribute() {
      return key;
    },
    hasAttribute() {
      return false;
    },
    getBoundingClientRect() {
      return currentRect;
    },
    _setRect(newRect: IRect) {
      currentRect = newRect;
    }
  };
}

function createMockFlip(element: Element, options) {
  return new Flipping({
    selector: () => [element as Element],
    getBounds: mockGetBounds,
    parent: createMockElement('parent', {
      top: 0,
      left: 0,
      width: 1000,
      height: 1000
    }),
    ...options
  });
}

describe('Flipping', () => {
  it('should exist', () => {
    assert.isFunction(Flipping);
  });

  describe('reading', () => {
    it('should provide the current bounds of the element', done => {
      const mockElement = createMockElement('test', {
        top: 0,
        left: 0,
        width: 10,
        height: 10
      });
      const MockFlip = createMockFlip(mockElement, {
        onRead: states => {
          assert.deepEqual(
            states.test.bounds,
            mockElement.getBoundingClientRect()
          );
          done();
        }
      });

      MockFlip.read();
    });
  });

  describe('flipping', () => {
    it('should provide the correct first, last and delta of the element', done => {
      const mockElement = createMockElement('test', {
        top: 0,
        left: 0,
        width: 100,
        height: 100
      });
      const MockFlip = createMockFlip(mockElement, {
        onFlip: states => {
          assert.deepEqual(
            states.test.previous.bounds,
            {
              top: 0,
              left: 0,
              height: 100,
              width: 100
            },
            'previous bounds should be correct'
          );
          assert.deepEqual(
            states.test.bounds,
            {
              top: 20,
              left: 30,
              height: 200,
              width: 400
            },
            'bounds should be correct'
          );
          assert.deepEqual(
            states.test.delta,
            {
              top: -20,
              left: -30,
              height: 0.5,
              width: 0.25
            },
            'delta should be correct'
          );
          done();
        }
      });

      MockFlip.read();

      mockElement._setRect({
        top: 20,
        left: 30,
        height: 200,
        width: 400
      });

      MockFlip.flip();
    });
  });

  describe('progress', () => {
    it('should calculate fractional delta', () => {
      const delta = {
        top: 10,
        left: 20,
        width: 2,
        height: 3
      };
      const halfProgress = Flipping.progress(delta, 0.5);
      assert.deepEqual(halfProgress, {
        top: 5,
        left: 10,
        width: 1,
        height: 1.5
      });
    });

    it('should return zero delta if not moved', () => {
      const halfProgress = Flipping.progress(undefined, 0.5);
      assert.deepEqual(halfProgress, {
        top: 0,
        left: 0,
        width: 1,
        height: 1
      });
    });
  });
});
