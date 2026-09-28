import {makeProject} from '@motion-canvas/core';
import holdouts from './scenes/holdouts?scene';
import vo from './audio/vo.wav';
export default makeProject({scenes: [holdouts], audio: vo});
