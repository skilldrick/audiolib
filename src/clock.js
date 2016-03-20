import { getCurrentTime } from './audio';

class Clock {
  constructor() {
    this.beatLength = null;
    this.backgroundTimeoutTime = 1000;
    this.foregroundTimeoutTime = 100;
    this.timeoutTime = this.foregroundTimeoutTime;
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

    this.timeInBeats = this.timeInBeats || 0; // Fractional beat count
    this.beat = this.beat || 0;        // Integer beat count

    // Keeps timeInBeats up-to-date
    const timeoutFunc = (previousTime) => {
      const now = getCurrentTime();
      const diff = now - previousTime;
      const diffInBeats = diff / this.beatLength;
      previousTime = now;
      this.timeInBeats += diffInBeats; // Update timeInBeats based on diff
      this.tick(now, this.timeInBeats);

      this.timeout = setTimeout(timeoutFunc.bind(null, now), this.timeoutTime);
    };

    timeoutFunc(getCurrentTime());
  }

  pause() {
    this.playing = false;
    clearTimeout(this.timeout);
  }

  stop() {
    this.pause();

    // Reset current time
    this.timeInBeats = 0;
    this.beat = 0;
  }

  /*
  * tick is responsible for calling the callbacks for every beat once and only once.
  * It calls the callbacks ahead of time, potentially triggering multiple beats
  * in one go.
  *
  * The lookahead is kept as short as possible so we can react quickly to tempo changes,
  * but if it's too short we'll skip beats. The optimum lookahead time is a function of
  * the current timeout time and the beat length.
  */
  tick(now, timeInBeats) {
    this.checkIfBackgrounded();
    const thisBeat = this.beat;

    // Calculate number of beats to look ahead by based on timeout time and beat length
    const timeoutTimeInSeconds = this.timeoutTime / 1000;
    const lookahead = (timeoutTimeInSeconds / this.beatLength) * 2;
    // Math.max to ensure nextBeat can't be less than thisBeat
    const nextBeat = Math.max(thisBeat, Math.ceil(timeInBeats + lookahead));

    // call callbacks for all beats between thisBeat and nextBeat
    for (let i = thisBeat; i < nextBeat; i++) {
      this.callCallbacks(i, now, (i - timeInBeats) * this.beatLength);
    }

    this.beat = nextBeat;
  }

  callCallbacks(beat, now, timeUntilBeat) {
    // If timeUntilBeat is negative, we weren't able to keep up
    if (timeUntilBeat < 0) {
      console.warn("Clock skipped beats.");
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

  /*
  * This lets us know if the tab is backgrounded, and thus should
  * increase the timeout time.
  *
  * It's possible that changing tabs will cause us to miss a beat,
  * but after that things should get back on track.
  */
  checkIfBackgrounded() {
    if (document.hidden) {
      this.timeoutTime = this.backgroundTimeoutTime;
    } else {
      this.timeoutTime = this.foregroundTimeoutTime;
    }
  }
};

export default new Clock();
