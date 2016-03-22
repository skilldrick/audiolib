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

export const createOscillator = (frequency, coefficientsOrType) => {
  const osc = ctx.createOscillator();
  osc.frequency.value = frequency;

  if (Array.isArray(coefficientsOrType)) {
    // Create a periodic wave using an array of harmonic coefficients.
    // DC offset is always set to 0.
    // Imag values always set to 0 (they don't affect the tone, only the wave shape)
    const wave = ctx.createPeriodicWave(
      new Float32Array([0, ...coefficientsOrType]),
      new Float32Array(coefficientsOrType.length + 1)
    );

    osc.setPeriodicWave(wave);
  } else if (typeof coefficientsOrType == 'string') {
    // sine, square, sawtooth, triangle
    osc.type = coefficientsOrType;
  }

  return osc;
};
