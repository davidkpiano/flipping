// import Flipping, { IFlippingOptions } from '../src/flipping';
// import { assert } from 'chai';

// const createMockNode: () => Element = () => ({
//   rect: {
//     top: 0,
//     left: 0,
//     height: 100,
//     width: 100
//   },
//   getAttribute() {
//     return 'test';
//   },
//   getBoundingClientRect() {
//     return this.rect;
//   }
// });

// function createMockFlip(node: Element, options: IFlippingOptions) {
//   return new Flipping({
//     selector: (element: Element) => [node],
//     ...options
//   });
// }

// describe('Flipping', () => {
//   it('should exist', () => {
//     assert.isFunction(Flipping);
//   });

//   describe('reading', () => {
//     it('should provide the current bounds of the node', done => {
//       const mockNode = createMockNode();
//       const MockFlip = createMockFlip(mockNode, {
//         onRead: state => {
//           assert.deepEqual(state.last, mockNode.rect);
//           done();
//         }
//       });

//       MockFlip.read(null);
//     });
//   });

//   describe('flipping', () => {
//     it('should provide the correct first, last and delta of the node', done => {
//       const mockNode = createMockNode();
//       const MockFlip = createMockFlip(mockNode, {
//         onFlip: state => {
//           assert.deepEqual(
//             state.first,
//             {
//               top: 0,
//               left: 0,
//               height: 100,
//               width: 100
//             },
//             'first should be correct'
//           );
//           assert.deepEqual(
//             state.last,
//             {
//               top: 20,
//               left: 30,
//               height: 200,
//               width: 400
//             },
//             'last should be correct'
//           );
//           assert.deepEqual(
//             state.delta,
//             {
//               top: -20,
//               left: -30,
//               height: 0.5,
//               width: 0.25
//             },
//             'delta should be correct'
//           );
//           done();
//         }
//       });

//       MockFlip.read(null);

//       mockNode.rect = {
//         top: 20,
//         left: 30,
//         height: 200,
//         width: 400
//       };

//       MockFlip.flip(null);
//     });
//   });
// });
