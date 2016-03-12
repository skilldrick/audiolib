import {ctx} from './audio';
import fx from './fx';
import {connect, noteToFreq} from './util';

let initialized = false;
const oscOut = ctx.createGain();

const initSynth = (convolverBuffer) => {
  const filter = fx.createFilterNode(3000);
  const distortion = fx.createDistortionNode(1.2);
  const reverb = fx.createReverbNode(0.5, convolverBuffer);

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

  initialized = true;
};

const playNote = (note, when, length) => {
  playFreq(noteToFreq(note), when, length);
};

/*
Create Attack-Decay-Sustain-Release envelope

Attack is the time from note start to 1 gain.
Decay is the time from max gain to sustain gain.
Sustain is the gain decay goes to.
End is the length of the note.
Release is the time from end to 0 gain.

  1|     /\
   |    /  \
  s|   /    \________
   |  /              \
   | /                \
   |/                  \
   +----------------------
   |  a  | d |       | r|
 start              end
*/
const createAdsrEnvelope = (adsr, when, length) => {
  const releaseStart = when + length;
  const attackEnd = Math.min(when + adsr.attack, releaseStart);
  const decayEnd = Math.min(attackEnd + adsr.decay, releaseStart);
  const releaseEnd = releaseStart + adsr.release;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.gain.setValueAtTime(0, when);

  // Attack
  gain.gain.linearRampToValueAtTime(1, attackEnd);

  // Decay
  gain.gain.linearRampToValueAtTime(adsr.sustain, decayEnd);

  // Sustain
  gain.gain.setValueAtTime(adsr.sustain, releaseStart);

  // Release
  gain.gain.linearRampToValueAtTime(0, releaseEnd);

  return gain;
}

const playFreq = (freq, when, length) => {
  if (!initialized) throw new Error("Need to call initSynth");
const gain = ctx.createGain();
  gain.gain.value = 0.2;

  const adsrEnv = createAdsrEnvelope({
    attack: 0.05,
    decay: 0.3,
    sustain: 0.8,
    release: 0.3
  }, when, length);

  const osc = createOsc(freq);

  connect(osc, adsrEnv, gain, oscOut);

  osc.start(when);
  osc.stop(when + length + 0.3); // Shouldn't duplicate release value
};

// Create a periodic wave using an array of harmonic coefficients.
// DC offset is always set to 0.
// Imag values always set to 0 (they don't affect the tone, only the wave shape)
const createPeriodicWave = (reals) => {
  return ctx.createPeriodicWave(
    new Float32Array([0, ...reals]),
    new Float32Array(reals.length + 1)
  );
};

const createOsc = (frequency) => {
  const osc = ctx.createOscillator();
  osc.frequency.value = frequency;

  const wave = createPeriodicWave([0.6, 0.5, 0.1, 0.3, 0.1, 0.3]);
  osc.setPeriodicWave(wave);

  return osc;
};

module.exports = {playNote, playFreq, initSynth};
