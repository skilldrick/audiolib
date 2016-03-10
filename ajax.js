const getData = (filename, cb) => {
  const request = new XMLHttpRequest();
  request.open('GET', filename, true);
  request.responseType = 'arraybuffer';
  request.onload = () => {
    cb(request.response);
  };
  request.send();
}

const getAudioBuffer = (ctx, filename) => {
  return new Promise(resolve => {
    getData(filename, (audioData) => {
      ctx.decodeAudioData(audioData, resolve);
    });
  });
};

module.exports = {getAudioBuffer};
