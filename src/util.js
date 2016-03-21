// For a node to act as an input, it must either be an AudioNode/AudioParam or have an input property
const inputNode = (node) =>
  (node instanceof AudioNode || node instanceof AudioParam) ? node : node.input;

// Helper for creating an AudioNode-like object, for use with with `connect`
const node = (input, output) => ({
  input: inputNode(input),
  connect: (node) => output.connect(node)
});

const connectNodes = (node1, node2) => {
  node1.connect(inputNode(node2));
  return node2;
};

// Connect `nodes` together in a chain. Can be AudioNode or node with input property
const connect = (...nodes) => nodes.reduce(connectNodes);

const noteToFreq = (note) => 440 * Math.pow(2, note / 12);

// Randomly detune freq by +/- percent
const detune = (freq, percent) => {
  const amount = percent / 100;
  const detuneScalar = 1 + Math.random() * amount * 2 - amount;
  return freq * detuneScalar;
};

module.exports = {connect, node, detune, noteToFreq};
