import {Circle, makeScene2D} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
export default makeScene2D(function* (view) {
  view.fill('#1c2240');
  const c = createRef<Circle>();
  view.add(<Circle ref={c} x={-300} size={160} fill="#ffd23f" />);
  yield* c().position.x(300, 1).to(-300, 1);
});
