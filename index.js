import { AudioBuffer } from 'node-web-audio-api';

const audioBuffer = new AudioBuffer({
  nmuberOfChannels: 1,
  length: 100,
  sampleRate: 44100
});

try {
  audioBuffer.getChannelData(1);
} catch(err) {
  console.dir(err);
}
