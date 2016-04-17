import { ctx } from './audio';
import { connect, Node } from './util';
import { createBufferSource } from './nodes';

// A SingleBufferSampler takes a buffer and a map of names to offsets
export class SingleBufferSampler extends Node {
  constructor(buffer, offsetMap) {
    super();
    this.buffer = buffer;
    this.offsetMap = offsetMap;
  }

  play = (sampleName, when, length, playbackRate=1) => {
    const source = createBufferSource(this.buffer, playbackRate);
    connect(source, this.output);
    const offset = this.offsetMap[sampleName];
    source.start(when, offset, length);
    return source;
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
