import {getAudioBuffer} from './ajax';

const ctx = new (window.AudioContext || window.webkitAudioContext)();

const createSource = (buffer) => {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  return source;
};

const getCurrentTime = () => ctx.currentTime;

module.exports = {ctx, createSource, getCurrentTime};
