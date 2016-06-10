import _ from 'lodash';

import { ctx, getCurrentTime } from './audio';
import { connect, Node } from './util';
import { createBufferSource, createGain } from './nodes';

// A SingleBufferSampler takes a buffer and
// a map of sample names to offsets in seconds
// e.g. { A: 0, S: 1.5, D: 10, F: 11 }
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
      sample.gain,
      sample.playbackRate,
      sample.fadeIn,
      sample.fadeOut
    );
  }

  playOffset = (
    offset,
    when,
    length,
    gain=1,
    playbackRate=1,
    fadeIn=0,
    fadeOut=0
  ) => {
    const source = createBufferSource(this.buffer, playbackRate);
    const envelope = this.createEnvelope(fadeIn, fadeOut, when, length);
    const gainNode = createGain(gain);
    connect(source, envelope, gainNode, this.output);
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

  // Initialize this.sampleMap with default values for each sample property
  setSampleMap(offsetMap) {
    this.sampleMap = _.mapValues(offsetMap, (value, key) => {
      return {
        offset:       value,
        name:         key,
        playbackRate: 1,
        gain:         1,
        length:       0.2,
        fadeIn:       0,
        fadeOut:      0
      };
    });
  }

  // Override `property` in each sample, if contained in `map`
  setSampleProperties(map, property) {
    _.forOwn(this.sampleMap, (value, key) => {
      if (map[key] !== undefined) {
        this.sampleMap[key][property] = map[key];
      }
    });
  }

  // Override gain values in this.sampleMap with a map of sample names to gains
  // e.g. { A: 0.5, S: 0.8, D: 1.2, F: 1.5 }
  setGains(map) {
    this.setSampleProperties(map, 'gain');
  }

  setLengths(map) {
    this.setSampleProperties(map, 'length');
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
