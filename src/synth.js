import { getCurrentTime, ctx } from './audio';
import { createBufferSource, createGain, createOscillator } from './nodes';
import { connect, noteToFreq, freqToNote, Node, noteNameOffsetsFromA440 } from './util';

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

const createReleaseEnvelope = (release, when) => {
  const releaseEnd = when + release;
  const gain = createGain(1);

  gain.gain.setValueAtTime(1, when);
  gain.gain.linearRampToValueAtTime(0, releaseEnd);

  return gain;
}

const validateAdsr = (adsr) => {
  const expectedFields = [
    'attack', 'decay', 'sustain', 'release'
  ];

  if (!adsr) {
    throw new Error("adsr required");
  }

  expectedFields.forEach(field => {
    const value = adsr[field];

    if (value === undefined) {
      throw new Error(field + " in adsr is required");
    }
  });

  return adsr;
}

// Subclasses of Synth must define this.playFreq, which plays
// the specified frequency at the specified time. This method
// should return an object with a stop method, which stops the
// note, preferably with the appropriate release.
export class Synth extends Node {
  constructor() {
    super();
    this.notesPlaying = {};
  }

  playNote = (note, when, length, detune=0) => {
    const freq = noteToFreq(note);
    this.notesPlaying[freq] = this.playFreq(freq, when, length, detune);
  }

  stopNote = (note, when) => {
    const freq = noteToFreq(note);
    this.stopFreq(freq, when);
  }

  stopFreq = (freq, when) => {
    const note = this.notesPlaying[freq];

    if (note) {
      note.stop(when);
      delete this.notesPlaying[freq];
    }
  }
}

/*
  Example
    new HarmonicSynth({
      attack: 0.001,
      decay: 0.1,
      sustain: 0.4,
      release: 0.2
    }, [1, 1, 1, 1, 1]);
*/
export class HarmonicSynth extends Synth {
  constructor(adsr, coefficientsOrType) {
    super();
    this.adsr = validateAdsr(adsr);
    this.coefficientsOrType = coefficientsOrType;
  }

  playFreq = (freq, when, length, detune=0) => {
    const osc = createOscillator(freq, this.coefficientsOrType, detune);
    const adsrEnv = createAdsrEnvelope(this.adsr, when, length);

    connect(osc, adsrEnv, this.output);

    osc.start(when);
    osc.stop(when + length + this.adsr.release);

    return {
      stop: (when) => {
        const releaseEnd = when + this.adsr.release;

        // Cancel ADSR
        adsrEnv.gain.cancelScheduledValues(0);

        // Add new release
        adsrEnv.gain.setValueAtTime(adsrEnv.gain.value, when);
        adsrEnv.gain.linearRampToValueAtTime(0, releaseEnd);

        try {
          osc.stop(releaseEnd);
        } catch (e) { }
      }
    };
  }
};

/*
  Example
    new FmSynth({
      attack: 0.001,
      decay: 0.1,
      sustain: 0.4,
      release: 0.2
    }, {
      color: 3,
      intensity: 500
    });
*/
export class FmSynth extends Synth {
  constructor(adsr, settings = {}) {
    super();
    this.color = settings.color || 8;
    this.intensity = settings.intensity || 1000;
    this.fmDetune = settings.fmDetune || 0;
    this.adsr = validateAdsr(adsr);
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

    return {
      stop: (when) => {
        const releaseEnd = when + this.adsr.release;

        // Cancel ADSR
        [adsrEnv1, adsrEnv2].forEach(env => {
          env.gain.cancelScheduledValues(0);

          // Add new release
          env.gain.setValueAtTime(env.gain.value, when);
          env.gain.linearRampToValueAtTime(0, releaseEnd);
        });

        [osc, mod].forEach(node => {
          try {
            node.stop(releaseEnd);
          } catch (e) { }
        });
      }
    };
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

/*
  Example
    new SamplerSynth({
      attack: 0.1,
      decay: 0.1,
      sustain: 0.4,
      release: 0.2
    }, {
      'a2': <buffer for a2>,
      'a#2': <buffer for a#2>,
      ...
    });

  playFreq will find the closest sample and modify its playback rate
  to match the expected frequency.
*/
export class SamplerSynth extends Synth {
  // bufferMap is map of note names to buffers
  constructor(adsr, bufferMap) {
    super();
    this.adsr = validateAdsr(adsr);

    // Create map of semitone values to buffers
    this.semitoneBufferMap = _.mapKeys(bufferMap, (value, key) => {
      return noteNameOffsetsFromA440[key];
    });
  }

  findClosestSample(note) {
    // notes is an array of the semitone offsets for the available buffers
    const notes = Object.keys(this.semitoneBufferMap);
    // find closest entry in notes array to `note`
    return _.minBy(notes, _note => Math.abs(note - _note));
  }

  playFreq = (freq, when, length, detune=0) => {
    const semitonesFromA = freqToNote(freq);
    const closestSample = this.findClosestSample(semitonesFromA);
    const semitonesFromSample = semitonesFromA - closestSample;
    const offsetFromSample = Math.pow(2, semitonesFromSample / 12);

    const source = createBufferSource(this.semitoneBufferMap[closestSample], offsetFromSample);

    const adsrEnv = createAdsrEnvelope(this.adsr, when, length);

    connect(source, adsrEnv, this.output);

    source.start(when);

    return {
      stop: (when) => {
        const releaseEnd = when + this.adsr.release;

        // Cancel ADSR
        adsrEnv.gain.cancelScheduledValues(0);

        // Add new release
        adsrEnv.gain.setValueAtTime(adsrEnv.gain.value, when);
        adsrEnv.gain.linearRampToValueAtTime(0, releaseEnd);

        try {
          source.stop(releaseEnd);
        } catch (e) { }
      }
    };
  }
}
