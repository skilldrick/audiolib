import { createGain } from './nodes';

// For a node to act as an input, it must either be an AudioNode/AudioParam or have an input property
const inputNode = (node) =>
  (node instanceof AudioNode || node instanceof AudioParam) ? node : node.input;

// Helper for creating an AudioNode-like object, for use with with `connect`
// Use `props` to add extra properties to the object
export const node = (input, output, props={}) => Object.assign({
  input: inputNode(input),
  connect: (node) => output.connect(node)
}, props);

// Connect `nodes` together in a chain. Can be AudioNode or node with input property
export const connect = (...nodes) => nodes.reduce((node1, node2) => {
  node1.connect(inputNode(node2));
  return node2;
});

export const noteToFreq = (note) => 440 * Math.pow(2, note / 12);

// Randomly detune freq by +/- percent
export const detune = (freq, percent) => {
  const amount = percent / 100;
  const detuneScalar = 1 + Math.random() * amount * 2 - amount;
  return freq * detuneScalar;
};

// A superclass for AudioNode-like objects
export class Node {
  constructor() {
    this.input = createGain();
    this.output = createGain();
  }

  connect(node) {
    this.output.connect(node);
  }
}

// A superclass for AudioNode-like objects with dry:wet mix
export class MixNode extends Node {
  constructor(mix) {
    super();
    this.wetMix = createGain();
    this.dryMix = createGain();
    this.setMix(mix);
  }

  setMix = (mix) => {
    this.dryMix.gain.value = 1 - mix;
    this.wetMix.gain.value = mix;
  }
}
