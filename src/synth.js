import {ctx} from './audio';
import fx from './fx';
import nodes from './nodes';
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

  const gain = nodes.createGain(0);
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

class Synth {
  constructor() {
    this.output = nodes.createGain();
  }

  playNote = (note, when, length) => {
    this.playFreq(noteToFreq(note), when, length);
  }

  connect = (other) => {
    this.output.connect(other);
  }
}

class HarmonicSynth extends Synth {
  constructor(adsr, coefficientsOrType) {
    super();
    this.adsr = adsr;
    this.coefficientsOrType = coefficientsOrType;
  }

  playFreq = (freq, when, length) => {
    const osc = nodes.createOscillator(freq, this.coefficientsOrType);
    const adsrEnv = createAdsrEnvelope(this.adsr, when, length);

    connect(osc, adsrEnv, this.output);

    osc.start(when);
    osc.stop(when + length + this.adsr.release);
  }
};

class FmSynth extends Synth {
  constructor() {
    super();
    this.color = 8;
    this.intensity = 1000;
  }

  playFreq(freq, when, length) {
    const osc = nodes.createOscillator(freq, 'square');
    const mod = nodes.createOscillator(freq * this.color);

    const adsrEnv1 = createAdsrEnvelope(this.adsr, when, length);
    const adsrEnv2 = createAdsrEnvelope(this.adsr, when, length);

    const g = nodes.createGain(this.intensity);

    connect(osc, adsrEnv1, this.output);
    connect(mod, g, adsrEnv2, osc.frequency);

    [osc, mod].forEach(node => {
      node.start(when);
      node.stop(when + length);
    });
  }
}

module.exports = {FmSynth, HarmonicSynth};