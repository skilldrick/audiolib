import {ctx} from './audio';
import {getAudioBuffer} from './ajax';
import {connect, node} from './util';
import {collectPromise} from './promise_collector';
import impulseResponse from './assets/Conic Long Echo Hall.wav';

const createFilterNode = (freq) =>{
  const filter = ctx.createBiquadFilter();
  filter.frequency.value = freq;
  return filter;
};

const createReverbNode = (mix) => {
  const convolver = ctx.createConvolver();

  collectPromise(getAudioBuffer(ctx, impulseResponse)).then(buffer => {
    convolver.buffer = buffer;
  });

  const input = ctx.createGain();
  const dryMix = ctx.createGain();
  const wetMix = ctx.createGain();
  const output = ctx.createGain();

  dryMix.gain.value = 1 - mix;
  wetMix.gain.value = mix;

  connect(input, dryMix, output);
  connect(input, convolver, wetMix, output);

  return node(input, output);
};

const createDelayNode = (options) => {
  // Set up options
  const dryMix = options.dryMix || 1;
  const wetMix = options.wetMix || 0.5;
  const delayTime = options.delayTime || 0.5;
  const feedback = options.feedback || 0.2;
  const cutoff = options.cutoff || 5000;

  // Create nodes
  const input = ctx.createGain();
  const output = ctx.createGain();
  const delay = ctx.createDelay(3);
  const feedbackGain = ctx.createGain();
  const dryMixNode = ctx.createGain();
  const wetMixNode = ctx.createGain();
  const filter = createFilterNode(cutoff);

  // Configure nodes
  delay.delayTime.value = delayTime;
  feedbackGain.gain.value = feedback;
  dryMixNode.gain.value = dryMix;
  wetMixNode.gain.value = wetMix;

  // Node graph:
  // input -> dryMixNode ------------------------------------+-> output
  //   `----> filter -> feedbackGain -> delay -> wetMixNode -'
  //            ^-------------------------'

  // Connect dry chain
  connect(input, dryMixNode, output);

  // Connect wet chain
  connect(input, filter, feedbackGain, delay, wetMixNode, output);

  // Connect feedback
  connect(delay, filter);

  return node(input, output);
};

const createDistortionNode = (distortion) => {
  const hardDistortion = (item) => {
    const deg = Math.PI / 180;
    const k = (distortion - 1) * 200;
    return ( 3 + k ) * item * 20 * deg / ( Math.PI + k * Math.abs(item) );
  };

  const softDistortion = (item) => {
    return Math.pow(Math.sin(item * Math.PI / 2), 1 / distortion);
  };

  const waveShaperNode = ctx.createWaveShaper();
  waveShaperNode.curve = makeDistortionCurve(softDistortion);
  waveShaperNode.oversample = '4x';
  return waveShaperNode;
};

/*
A distortion curve maps input to output. A straight line from
(-1, -1) to (1, 1) leaves the sound unchanged. A straight line
from (-1, 0.5) to (1, 0.5) is the equivalent of applying a gain
of 0.5 (the output level is half the input level).

                 output
                  1|         .
                   |       .
                   |     .
                   |   .
                   | .
         ----------0---------- input
        -1       . |         1
               .   |
             .     |
           .       |
         .       -1|

If the curve is not a straight line (see below), different parts of
the signal will be amplified differently from others, changing the
shape of the waveform. This produces distortion. The curve below
also increases the overall level of the signal, as quieter samples
are boosted louder.

                 output
                  1|         .
                   |     .
                   |   .
                   | .
                   |.
         ----------0---------- input
        -1        .|         1
                 . |
               .   |
             .     |
         .       -1|

A mirrored distortion curve (negative inputs are modified by the same
amount as positive inputs) is usually best, as it prevents the output
from having a DC offset. The curve above is mirrored.

The WaveShaperNode uses a Float32Array to represent the distortion
curve. The indices of the array correspond to the input range [-1, 1]
and the values in the array correspond to the output range [-1, 1].

makeDistortionCurve takes a func, applies it to the range [0, 1], and
applies the inverse of the function to the range [-1, 0] to create
a mirrored distortion curve, like above.
*/

const makeDistortionCurve = (func) => {
  const mirror = (func) => {
    return (item, i) => {
      if (i < halfLength) {
        return -func(-item);
      } else {
        return func(item);
      }
    };
  };

  //keep within -1,1 range
  const clamp = (items) => {
    return items.map((item) => Math.max(Math.min(item, 1), -1));
  }

  const length = Math.pow(2, 16);
  const halfLength = length / 2;
  const linearCurve = [];

  // create linear identity curve
  for (let i = 0; i < length; i++) {
    linearCurve[i] = i / halfLength - 1;
  }

  const curve = clamp(linearCurve.map(mirror(func)));

  return new Float32Array(curve);
};

module.exports = {createFilterNode, createReverbNode, createDelayNode, createDistortionNode};
