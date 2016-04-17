import { createGain } from './nodes';

// For a node to act as an input, it must either be an AudioNode/AudioParam or have an input property
const inputNode = (node) =>
  (node instanceof AudioNode || node instanceof AudioParam) ? node : node.input;

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
  constructor(input, output) {
    this.input = input || createGain();
    this.output = output || createGain();
  }

  connect(node) {
    connect(this.output, node);
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
  }

  setMix = (mix) => {
    this.dryMix.gain.value = 1 - mix;
    this.wetMix.gain.value = mix;
  }
}
