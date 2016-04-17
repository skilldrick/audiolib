import clock from './clock';
import _ from 'lodash';

// A Scheduler is an abstraction around the clock.
// The processNote function is called for every note that should be
// played during the current beat, determined by the current loops.
export default class Scheduler {
  constructor(bpm, processNote) {
    this.setBpm(bpm);
    this.loops = [];
    this.processNote = processNote;
  }

  // Add a looping set of notes.
  addLoop(loopLength, notes) {
    this.loops.push({
      loopLength,
      partitionedNotes: this.partition(notes)
    });
  }

  clearLoops() {
    this.loops = [];
  }

  // Partition notes per beat
  partition(notes) {
    return _.groupBy(notes, (note) => Math.floor(note.beatOffset));
  }

  setBpm(bpm) {
    clock.setBpm(bpm);
  }

  start() {
    clock.onBeat((beat, when, length) => {
      this.loops.forEach(loop => {
        // Calculate beat within loop
        const loopBeat = beat % loop.loopLength;
        // Get notes to play this beat
        const notes = loop.partitionedNotes[loopBeat];

        notes && notes.forEach(note => {
          this.processNote(note, when(note.beatOffset - loopBeat), length(note.length));
        });
      });
    });

    clock.start();
  }

  stop() {
    clock.stop();
  }
}
