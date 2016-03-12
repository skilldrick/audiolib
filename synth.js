import {ctx} from './audio';
import fx from './fx';
import {connect, noteToFreq} from './util';

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

const createSynth = (gain, adsr, coefficients) => {
  const output = fx.createGainNode();
  const gainNode = fx.createGainNode(gain);

  const playNote = (note, when, length) => {
    playFreq(noteToFreq(note), when, length);
  };

  const playFreq = (freq, when, length) => {
    const osc = createOsc(freq, coefficients);
    const adsrEnv = createAdsrEnvelope(adsr, when, length);

    connect(osc, adsrEnv, gainNode, output);

    osc.start(when);
    osc.stop(when + length + adsr.release);
  };

  return {
    playFreq,
    playNote,
    connect: output.connect.bind(output)
  };
};

module.exports = {createSynth};
