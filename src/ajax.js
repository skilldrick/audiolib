import { ctx } from './audio';

export default (filename) => new Promise((resolve, reject) => {
  fetch(filename)
    .then(response => response.arrayBuffer())
    .then(audioData => ctx.decodeAudioData(audioData, resolve))
    .catch(reject);
});
