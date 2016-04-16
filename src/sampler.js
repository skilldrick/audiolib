import { ctx } from './audio';
import { connect, Node } from './util';
import { createBufferSource } from './nodes';

export default class Sampler extends Node {
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
