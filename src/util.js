import { createGain } from './nodes';

// For a node to act as an input, it must either be an AudioNode/AudioParam or have an input property
const inputNode = (node) =>
  (node instanceof AudioNode || node instanceof AudioParam) ? node : node.input;

// Connect `nodes` together in a chain. Can be AudioNode or node with input property
export const connect = (...nodes) => nodes.reduce((node1, node2) => {
  node1.connect(inputNode(node2));
  return node2;
});

export const A440 = 440;

export const noteToFreq = (note) => A440 * Math.pow(2, note / 12);

export const freqToNote = (freq) => Math.log2(freq / A440) * 12;

export const noteNames = [
  'c',
  'c#',
  'd',
  'd#',
  'e',
  'f',
  'f#',
  'g',
  'g#',
  'a',
  'a#',
  'b'
];

// Generate map of full note name to semitone offset from A440
// See https://en.wikipedia.org/wiki/Scientific_pitch_notation
// { 'c0': -48 ... 'c4': 0, ... 'a4': 9, ... 'b9': 71 }
export const noteNameOffsetsFromMiddleC = (() => {
  const map = {};

  for (let octave = 0; octave < 10; octave++) {
    noteNames.forEach((noteName, i) => {
      map[noteName + octave] = (octave - 3) * 12 + i;
    });
  }

  return map;
})();

// Offsets from A440 are more useful for calculating frequencies
export const noteNameOffsetsFromA440 = _.mapValues(
  noteNameOffsetsFromMiddleC,
  (value) => value - 9
);

// Randomly detune freq by +/- percent
export const detune = (freq, percent) => {
  const amount = percent / 100;
  const detuneScalar = 1 + Math.random() * amount * 2 - amount;
  return freq * detuneScalar;
};

// A superclass for AudioNode-like objects
export class Node {
  constructor(input, output) {
    this.input = input || createGain();
    this.output = output || createGain();
  }

  connect(node) {
    connect(this.output, node);
  }

  disconnect() {
    this.output.disconnect();
  }

  setInputGain(gain) {
    this.input.gain.value = gain;
  }

  setOutputGain(gain) {
    this.output.gain.value = gain;
  }
}

// A superclass for AudioNode-like objects with dry:wet mix
export class MixNode extends Node {
  constructor(mix) {
    super();
    this.wetMix = createGain();
    this.dryMix = createGain();
    this.setMix(mix);

    connect(this.input, this.dryMix, this.output);
    connect(this.wetMix, this.output);
  }

  setMix = (mix) => {
    this.dryMix.gain.value = 1 - mix;
    this.wetMix.gain.value = mix;
  }
}
