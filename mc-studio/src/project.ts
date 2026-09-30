import {makeProject} from '@motion-canvas/core';
import newyear from './scenes/newyear?scene';
import music from './audio/music_ny.wav';
export default makeProject({scenes: [newyear], audio: music});
