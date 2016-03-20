export const ctx = new (window.AudioContext || window.webkitAudioContext)();

export const createSource = (buffer) => {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  return source;
};

export const getCurrentTime = () => ctx.currentTime;
