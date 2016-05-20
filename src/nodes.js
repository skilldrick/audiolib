import { ctx } from './audio';

export const createFilter = (freq) => {
  const filter = ctx.createBiquadFilter();
  filter.frequency.value = freq;
  return filter;
};

export const createDelay = (maxDelayTime, delayTime) => {
  const delay = ctx.createDelay(maxDelayTime);
  delay.delayTime.value = delayTime;
  return delay;
};

export const createGain = (gain) => {
  const gainNode = ctx.createGain();
  if (gain !== undefined) {
    gainNode.gain.value = gain;
  }
  return gainNode;
};

export const createBufferSource = (buffer, playbackRate=1) => {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  return source;
};

export const createDynamicsCompressor = (options={}) => {
  const defaults = {
    threshold: -30,
    knee: 20,
    ratio: 8,
    attack: 0.01,
    release: 0.25
  };

  const finalOptions = Object.assign(defaults, options);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = finalOptions.threshold;
  compressor.knee.value = finalOptions.knee;
  compressor.ratio.value = finalOptions.ratio;
  compressor.attack.value = finalOptions.attack;
  compressor.release.value = finalOptions.release;
  return compressor;
};

export const createChannelSplitter = (channels=2) => {
  return ctx.createChannelSplitter(channels);
};

export const createChannelMerger = (channels=2) => {
  return ctx.createChannelMerger(channels);
};

// Normalize createOscillator arguments
const oscillatorOptions = (args) => {
  if (typeof args[0] == 'object') {
    return args[0];
  } else {
    const options = {};

    options.frequency = args[0];
    if (Array.isArray(args[1])) {
      options.realCoefficients = args[1];
    } else {
      options.type = args[1];
    }
    options.detune = args[2];
    return options;
  }
};

const createCoefficients = (options) => {
  // First element is always set to 0.
  const real = new Float32Array([0, ...options.realCoefficients]);

  // If imaginary coefficients are passed, use those, otherwise create empty array
  // Imaginary coefficients only affect the phase of the components, not the sound.
  // First element is always set to 0.
  const imag = options.imaginaryCoefficients ?
    new Float32Array([0, ...options.imaginaryCoefficients]) :
    new Float32Array(options.realCoefficients.length + 1);

  return [real, imag];
};

/*
* Parameters
*
* @param options
*   {
*     frequency              Oscillator frequency
*     type                   Type of the wave ('sine', 'square', 'sawtooth', 'triangle')
*     detune                 How much to detune the oscillator (in cents)
*     realCoefficients       Real coefficients for setPeriodicWave (ignoring DC offset)
*     imaginaryCoefficients  Imaginary coefficients for setPeriodicWave
*   }
*
* *or*
*
* @param frequency           Oscillator frequency
* @param coefficientsOrType  Either an array of the real coefficients of the
*                            components of the periodic wave  or the type of
*                            wave ('sine', 'square', 'sawtooth', 'triangle')
* @param detune              How much to detune the oscillator (in cents)
*
*
*/
export const createOscillator = (...args) => {
  const options = oscillatorOptions(args);
  console.log(options);

  const osc = ctx.createOscillator();
  osc.frequency.value = options.frequency;
  osc.detune.value = options.detune || 0;

  if (options.realCoefficients) {
    const [real, imag] = createCoefficients(options);
    const wave = ctx.createPeriodicWave(real, imag);
    osc.setPeriodicWave(wave);
  } else if (options.type) {
    osc.type = options.type;
  }

  return osc;
};
