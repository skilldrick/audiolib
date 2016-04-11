import { ctx } from './audio';
import getAudioBuffer from './ajax';
import { connect, node, Node, MixNode } from './util';
import { createGain, createDelay, createFilter } from './nodes';


export class Reverb extends MixNode {
  constructor(mix, convolverBuffer) {
    super(mix);

    this.convolver = ctx.createConvolver();
    this.convolver.buffer = convolverBuffer;

    // Dry chain
    connect(this.input, this.dryMix, this.output);

    // Wet chain
    connect(this.input, this.convolver, this.wetMix, this.output);
  }
}

export class FeedbackDelay extends MixNode {
  constructor(options) {
    // Set up options
    const mix = options.mix || 0.5;
    const delayTime = options.delayTime || 0.5;
    const feedback = options.feedback || 0.2;
    const cutoff = options.cutoff || 5000;

    super(mix);

    // Create nodes
    this.delay = createDelay(3, delayTime);
    this.feedbackGain = createGain(feedback);
    this.filter = createFilter(cutoff);

    // Set up nodes
    this.setDelayTime(delayTime);
    this.setMix(mix);

    // Node graph:
    // input -> dryMix ------------------------------------+-> output
    //   `----> filter -> feedbackGain -> delay -> wetMix -'
    //            ^-------------------------'

    // Dry chain
    connect(this.input, this.dryMix, this.output);

    // Wet chain
    connect(this.input, this.filter, this.feedbackGain, this.delay, this.wetMix, this.output);

    // Feedback
    connect(this.delay, this.filter);
  }

  setDelayTime = (delayTime) => {
    this.delay.delayTime.value = delayTime;
  }
}

export class Distortion extends Node {
  constructor(distortion, type='soft') {
    super();

    this.waveShaperNode = ctx.createWaveShaper();
    this.waveShaperNode.oversample = '4x';
    this.setDistortion(distortion, type);

    connect(this.input, this.waveShaperNode, this.output);
  }

  setDistortion = (distortion, type='soft') => {
    this.waveShaperNode.curve = this.makeDistortionCurve(
      this.distortionFactory(distortion, type));
  }

  distortionFactory(intensity, type) {
    if (type == 'hard') {
      return (item) => {
        const deg = Math.PI / 180;
        const k = (intensity - 1) * 200;
        return ( 3 + k ) * item * 20 * deg / ( Math.PI + k * Math.abs(item) );
      };
    } else if (type == 'soft') {
      return (item) => {
        return Math.pow(Math.sin(item * Math.PI / 2), 1 / intensity);
      };
    } else {
      throw new Error('Unknown distortion type');
    }
  }

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

  `makeDistortionCurve` takes a func, applies it to the range [0, 1], and
  applies the inverse of the function to the range [-1, 0] to create
  a mirrored distortion curve, like above.
  */

  makeDistortionCurve(func) {
    const mirror = (func) => (item, i) => (
      (i < halfLength) ? -func(-item) : func(item)
    );

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
  }
}
