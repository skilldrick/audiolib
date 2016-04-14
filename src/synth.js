import { ctx } from './audio';
import { createGain, createOscillator } from './nodes';
import { connect, noteToFreq, SourceNode } from './util';

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

  const gain = createGain(0);
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

// Subclasses of Synth must define this.playFreq
export class Synth extends Node {
  playNote = (note, when, length, detune=0) => {
    this.playFreq(noteToFreq(note), when, length, detune);
  }
}

export class HarmonicSynth extends Synth {
  constructor(adsr, coefficientsOrType) {
    super();
    this.adsr = adsr;
    this.coefficientsOrType = coefficientsOrType;
  }

  playFreq = (freq, when, length, detune=0) => {
    const osc = createOscillator(freq, this.coefficientsOrType, detune);
    const adsrEnv = createAdsrEnvelope(this.adsr, when, length);

    connect(osc, adsrEnv, this.output);

    osc.start(when);
    osc.stop(when + length + this.adsr.release);
  }
};

export class FmSynth extends Synth {
  constructor() {
    super();
    this.color = 8;
    this.intensity = 1000;
    this.fmDetune = 0;
    this.adsr = {};
  }

  playFreq(freq, when, length, detune=0) {
    const osc = createOscillator(freq, 'square', detune);
    const mod = createOscillator(freq * this.color, 'sine', this.fmDetune);

    const adsrEnv1 = createAdsrEnvelope(this.adsr, when, length);
    const adsrEnv2 = createAdsrEnvelope(this.adsr, when, length);

    const g = createGain(this.intensity);

    connect(osc, adsrEnv1, this.output);
    connect(mod, g, adsrEnv2, osc.frequency);

    [osc, mod].forEach(node => {
      node.start(when);
      node.stop(when + length);
    });
  }
}

// A HarmonicSynth with a simple interface for modifying coefficients.
// setOddEven: sets ratio of odd to even harmonics
// setLowHigh: sets dominant harmonic (harmonics decay on either side of this)
export class EasyHarmonicSynth extends HarmonicSynth {
  constructor(adsr={}) {
    super(adsr, []);
    this._oddEven = 0;
    this._lowHigh = 0;
    this.resetCoefficients();
  }

  setOddEven = (value) => {
    this._oddEven = value;
    this.resetCoefficients();
  };

  setLowHigh = (value) => {
    this._lowHigh = value;
    this.resetCoefficients();
  };

  resetCoefficients() {
    this.coefficientsOrType = this.calculateCoefficients();
  }

  calculateCoefficients() {
    const coefficientCount = 10;
    const dominantCoefficient = Math.floor(this._lowHigh * (coefficientCount - 1));

    // Set odd and even coefficient level based on odd:even ratio
    const setOddEven = (el, i) => {
      // odd coefficients are even indexes, because coefficients start at 1
      return (i % 2 == 0) ? 1 - this._oddEven : this._oddEven;
    };

    const similarity = (a, b) => 1 / (Math.abs(a - b) + 1);

    // Set coefficient gain based on similarity to dominant coefficient
    const setGain = (el, i) => {
      const gain = similarity(i, dominantCoefficient);
      return el * gain;
    };

    const coefficients = Array.from(new Array(coefficientCount));

    return coefficients.map(setOddEven).map(setGain);
  }
}
