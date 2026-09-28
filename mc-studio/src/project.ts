import {makeProject} from '@motion-canvas/core';
import pizza from './scenes/pizza?scene';
import vo from './audio/vo_pizza.wav';
export default makeProject({scenes: [pizza], audio: vo});
