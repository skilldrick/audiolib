import {getCurrentTime} from './audio';

class Clock {
  constructor() {
    this.beatLength = null;
    this.timeoutTime = 50;
    this.callbacks = new Set();
    this.playing = false;
  }

  addCallback(cb) {
    this.callbacks.add(cb);
  }

  removeCallback(cb) {
    this.callbacks.remove(cb);
  }

  setBpm(bpm) {
    this.beatLength = 60 / bpm;
  }

  start() {
    if (this.playing) return;
    this.playing = true;

    let previousTime = getCurrentTime();
    this.timeInBeats = 0; // Fractional beat count
    this.beat = 0;        // Integer beat count

    // Keeps timeInBeats up-to-date
    const timeoutFunc = () => {
      const now = getCurrentTime();
      const diff = now - previousTime;
      const diffInBeats = diff / this.beatLength;
      previousTime = now;
      this.timeInBeats += diffInBeats; // Update timeInBeats based on diff
      this.tick(now, this.timeInBeats);

      if (this.playing) {
        setTimeout(timeoutFunc, this.timeoutTime);
      }
    };

    timeoutFunc();
  }


  tick(now, timeInBeats) {
    const thisBeat = this.beat;
    const nextBeat = Math.ceil(timeInBeats) + 1; // Look ahead by 1 beat

    // call callbacks for all beats between thisBeat and nextBeat
    for (let i = thisBeat; i < nextBeat; i++) {
      this.callCallbacks(i, now, (i - timeInBeats) * this.beatLength);
    }

    this.beat = nextBeat;
  }

  callCallbacks(beat, now, timeUntilBeat) {
    // If timeUntilBeat is negative, we weren't able to keep up
    if (timeUntilBeat < 0) {
      console.error("Clock can't keep up, did you change tabs?");
      return;
    }

    for (let cb of this.callbacks) {
      /*
      * callbacks are called for every beat
      * beat: the next beat to enqueue
      * now: current time
      * timeUntilBeat: time delta between now and when beat is due
      * beatLength: length of one beat
      * */
      cb(beat, now, timeUntilBeat, this.beatLength);
    }
  }

  stop() {
    this.playing = false;
  }

};

module.exports = new Clock();
