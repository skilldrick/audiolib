import {ctx} from './audio';
import fx from './fx';
import {getAudioBuffer} from './ajax';
import {connect, noteToFreq} from './util';


const oscOut = ctx.createGain();

const filter = fx.createFilterNode(3000);
const distortion = fx.createDistortionNode(1.2);
const reverb = fx.createReverbNode(0.5);

const delay = fx.createDelayNode({
  delayTime: 1.333,
  feedback: 0.4,
  dryMix: 1,
  wetMix: 0.7,
  cutoff: 1000
});

connect(
  oscOut,
  delay,
  distortion,
  reverb,
  filter,
  ctx.destination
);

const playNote = (note, when, length) => {
  playFreq(noteToFreq(note), when, length);
};

const playFreq = (freq, when, length) => {
  const gain = ctx.createGain();
  gain.gain.value = 0;

  const osc = createOsc(freq);
  connect(osc, gain, oscOut);

  const targetGain = 0.2;
  const fadeTime = 0.03;

  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(targetGain, when + fadeTime);
  gain.gain.setValueAtTime(targetGain, when + length);
  gain.gain.linearRampToValueAtTime(0, when + length + fadeTime);

  osc.start(when);
  osc.stop(when + length + fadeTime);
};

const createOsc = (frequency) => {

  const osc = ctx.createOscillator();
  osc.frequency.value = frequency;

  const real = new Float32Array(6);
  const imag = new Float32Array(6);

  real[0] = 0;
  imag[0] = 0;
  real[1] = 0.6;
  imag[1] = 0;
  real[2] = 0.5;
  imag[2] = 0;
  real[3] = 0.5;
  imag[3] = 0;
  real[4] = 0.2;
  imag[4] = 0;
  real[5] = 0.2;
  imag[5] = 0;
  real[6] = 0.1;
  imag[6] = 0;

  const wave = ctx.createPeriodicWave(real, imag);
  osc.setPeriodicWave(wave);

  return osc;
};

module.exports = {playNote, playFreq};
