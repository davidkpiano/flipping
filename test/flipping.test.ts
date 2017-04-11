import Flipping, { FlippingOptions } from '../src/flipping';
import { assert } from 'chai';

const createMockNode = () => ({
  rect: {
    top: 0,
    left: 0,
    height: 100,
    width: 100,
  },
  getAttribute() {
    return 'test';
  },
  getBoundingClientRect() {
    return this.rect;
  }
});

function createMockFlip(node, options: FlippingOptions) {
  return new Flipping({
    selector: () => [node],
    ...options,
  });
}

describe('Flipping', () => {
  it('should exist', () => {
    assert.isFunction(Flipping);
  });

  describe('reading', () => {
    it('should provide the current bounds of the node', (done) => {
      const mockNode = createMockNode();
      const MockFlip = createMockFlip(mockNode, {
        onRead: (state) => {
          assert.deepEqual(state.bounds, mockNode.rect);
          done();
        }
      });

      MockFlip.read(null);
    });
  });

  describe('flipping', () => {
    it('should provide the correct first, last and delta of the node', (done) => {
      const mockNode = createMockNode();
      const MockFlip = createMockFlip(mockNode, {
        onFlip: (state) => {
          assert.deepEqual(state.first, {
            top: 0,
            left: 0,
            height: 100,
            width: 100,
          }, 'first should be correct');
          assert.deepEqual(state.last, {
            top: 20,
            left: 30,
            height: 200,
            width: 400,
          }, 'last should be correct');
          assert.deepEqual(state.delta, {
            top: -20,
            left: -30,
            height: 0.5,
            width: 0.25,
          }, 'delta should be correct');
          done();
        }
      });

      MockFlip.read(null);

      mockNode.rect = {
        top: 20,
        left: 30,
        height: 200,
        width: 400,
      };

      MockFlip.flip(null);
    });
  });

  describe('on read', () => {
    const mockNode = createMockNode();
    const MockFlip = createMockFlip(mockNode, {});

    it('can subscribe to "read" events and return the state', () => {
      MockFlip.on('read', (state) => {
        assert.property(state, 'test');
        assert.deepEqual(state.test.bounds, mockNode.rect);
      });

      MockFlip.read(null);
    });
  });

  describe('on flip', () => {
    it('can subscribe to "flip" events and return the state', () => {
      const mockNode = createMockNode();
      const MockFlip = createMockFlip(mockNode, {});

      MockFlip.on('flip', (state) => {
        assert.property(state, 'test');
        assert.deepEqual(state.test.delta, {
          top: -20,
          left: -30,
          width: 0.25,
          height: 0.5,
        });
      });

      MockFlip.read(null);

      mockNode.rect = {
        top: 20,
        left: 30,
        height: 200,
        width: 400,
      };

      MockFlip.flip(null);
    });

    it('only flips if delta has changed', () => {
      const mockNode = createMockNode();
      const MockFlip = createMockFlip(mockNode, {});

      MockFlip.on('flip', (state) => {
        throw new Error('Fuck')
      });

      MockFlip.read(null);

      MockFlip.flip(null);
    });
  });
});
