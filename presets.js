import {connect, node} from './util';
import {Synth} from './synth';
import fx from './fx';

const synth1 = new Synth(0.3, {
  attack: 0.1,
  decay: 0.3,
  sustain: 0.9,
  release: 0.3
}, [0.6, 0.5, 0.1, 0.3, 0.1, 0.3]);

// fxPreset1 requires a convolver buffer.
// This is passed in so the application has control of resource loading
const fxPreset1 = (convolverBuffer) => {
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
    delay,
    distortion,
    reverb,
    filter
  );

  return node(delay, filter);
};

const synth2 = new Synth(0.3, {
  attack: 0.1,
  decay: 0.3,
  sustain: 0.9,
  release: 0.1
}, [0.6, 0.5, 0.1, 0.3, 0.1, 0.1]);


module.exports = {synth1, synth2, fxPreset1};
