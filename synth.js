import {ctx} from './audio';
import fx from './fx';
import {connect, noteToFreq} from './util';

let initialized = false;

const createSynth = (adsr, coefficients) => {
  const output = fx.createGainNode();

  const playNote = (note, when, length) => {
    playFreq(noteToFreq(note), when, length);
  };

  const playFreq = (freq, when, length) => {
    if (!initialized) throw new Error("Need to call initSynth");

    const gain = fx.createGainNode(0.2);
    const adsrEnv = createAdsrEnvelope(adsr, when, length);
    const osc = createOsc(freq, coefficients);

    connect(osc, adsrEnv, gain, output);

    osc.start(when);
    osc.stop(when + length + 0.3); // Shouldn't duplicate release value
  };

  return {
    playFreq,
    playNote,
    connect: output.connect.bind(output)
  };
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

  const gain = fx.createGainNode(0);
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

const createOsc = (frequency, coefficients) => {
  const osc = ctx.createOscillator();
  osc.frequency.value = frequency;

  // Create a periodic wave using an array of harmonic coefficients.
  // DC offset is always set to 0.
  // Imag values always set to 0 (they don't affect the tone, only the wave shape)
  const wave = ctx.createPeriodicWave(
    new Float32Array([0, ...coefficients]),
    new Float32Array(coefficients.length + 1)
  );

  osc.setPeriodicWave(wave);

  return osc;
};

const synth = createSynth({
  attack: 0.05,
  decay: 0.3,
  sustain: 0.8,
  release: 0.3
}, [0.6, 0.5, 0.1, 0.3, 0.1, 0.3]);

const initSynth = (convolverBuffer) => {
  const filter = fx.createFilterNode(3000);
  const distortion = fx.createDistortionNode(1.2);
  const reverb = fx.createReverbNode(0.5, convolverBuffer);

  const delay = fx.createDelayFeedbackNode({
    delayTime: 1.333,
    feedback: 0.4,
    dryMix: 1,
    wetMix: 0.7,
    cutoff: 1000
  });

  connect(
    synth,
    delay,
    distortion,
    reverb,
    filter,
    ctx.destination
  );

  initialized = true;
};

module.exports = {
  playNote: synth.playNote,
  playFreq: synth.playFreq,
  initSynth
};
