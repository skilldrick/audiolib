import { ctx } from './audio';

const getData = (filename, cb) => {
  return new Promise(resolve => {
    const request = new XMLHttpRequest();
    request.open('GET', filename, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
      resolve(request.response);
    };
    request.send();
  });
}

export default (filename) => new Promise((resolve, reject) => {
  getData(filename)
    .then(audioData => ctx.decodeAudioData(audioData, resolve))
    .catch(reject);
});
