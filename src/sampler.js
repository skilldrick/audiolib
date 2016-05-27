import _ from 'lodash';

import { ctx, getCurrentTime } from './audio';
import { connect, Node } from './util';
import { createBufferSource, createGain } from './nodes';

// A SingleBufferSampler takes a buffer and a map of names to offsets
export class SingleBufferSampler extends Node {
  constructor(buffer, offsetMap) {
    super();
    this.buffer = buffer;
    this.setSampleMap(offsetMap);
  }

  play = (sampleName, when) => {
    const sample = this.sampleMap[sampleName];

    return this.playOffset(
      sample.offset,
      when,
      sample.length,
      sample.playbackRate,
      sample.fadeIn,
      sample.fadeOut
    );
  }

  playOffset = (offset, when, length, playbackRate=1, fadeIn=0, fadeOut=0) => {
    const source = createBufferSource(this.buffer, playbackRate);
    const envelope = this.createEnvelope(fadeIn, fadeOut, when, length);
    connect(source, envelope, this.output);
    source.start(when, offset, length);
    return source;
  }

  createEnvelope = (fadeIn, fadeOut, when, length) => {
    if (when === 0) {
      when = getCurrentTime();
    }

    const releaseEnd = when + length;
    const releaseStart = releaseEnd - fadeOut;
    const attackEnd = Math.min(when + fadeIn, releaseStart);

    const gain = createGain(0);
    gain.gain.setValueAtTime(0, when);

    gain.gain.linearRampToValueAtTime(1, attackEnd);
    gain.gain.setValueAtTime(1, releaseStart);
    gain.gain.linearRampToValueAtTime(0, releaseEnd);

    return gain;
  }

  setSampleMap(offsetMap) {
    this.sampleMap = _.mapValues(offsetMap, (value, key) => {
      return {
        offset: value,
        name: key,
        playbackRate: 1,
        length: 0.2,
        fadeIn: 0,
        fadeOut: 0
      };
    });
  }
}

// A MultiBufferSampler takes a map of names to buffers
export class MultiBufferSampler extends Node {
  constructor(bufferMap) {
    super();
    this.bufferMap = bufferMap;
  }

  play = (sampleName, when, playbackRate=1) => {
    const source = createBufferSource(this.bufferMap[sampleName], playbackRate);
    connect(source, this.output);
    source.start(when);
    return source;
  }
}
