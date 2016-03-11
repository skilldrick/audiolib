import {getCurrentTime} from './audio';

class Clock {
  constructor() {
    this.beatLength = null;
    this.intervalTime = 100;
    this.callbacks = new Set();
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
    this.stop();

    let previousTime = getCurrentTime();
    this.timeInBeats = 0; // Fractional beat count
    this.beat = 0;        // Integer beat count

    // Keeps timeInBeats up-to-date
    const intervalFunc = () => {
      const now = getCurrentTime();
      const diff = now - previousTime;
      const diffInBeats = diff / this.beatLength;
      previousTime = now;
      this.timeInBeats += diffInBeats; // Update timeInBeats based on diff
      this.tick(now, this.timeInBeats);
    };

    intervalFunc(); // run intervalFunc immediately once before setInterval
    this.interval = setInterval(intervalFunc, this.intervalTime);
  }


  tick(now, timeInBeats) {
    const thisBeat = this.beat;
    const nextBeat = Math.ceil(timeInBeats) + 2; // Look ahead by 2 beats

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
      * callbacks are cllaed for every beat
      * beat: the next beat to enqueue
      * now: current time
      * timeUntilBeat: time delta between now and when beat is due
      * beatLength: length of one beat
      * */
      cb(beat, now, timeUntilBeat, this.beatLength);
    }
  }

  stop() {
    clearInterval(this.interval);
  }

};

module.exports = new Clock();
