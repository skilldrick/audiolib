// Helper for creating an AudioNode-like object, for use with with `connect`
const node = (input, output) => ({
  input: input,
  connect: (node) => output.connect(node)
});

const connectNodes = (node1, node2) => {
  node1.connect(node2 instanceof AudioNode ? node2 : node2.input);
  return node2;
};

// Connect `nodes` together in a chain. Can be AudioNode or AudioNode-like
const connect = (...nodes) => nodes.reduce(connectNodes);

const noteToFreq = (note) => 440 * Math.pow(2, note / 12);

// Randomly detune freq by +/- percent
const detune = (freq, percent) => {
  const amount = percent / 100;
  const detuneScalar = 1 + Math.random() * amount * 2 - amount;
  return freq * detuneScalar;
};

module.exports = {connect, node, detune, noteToFreq};
