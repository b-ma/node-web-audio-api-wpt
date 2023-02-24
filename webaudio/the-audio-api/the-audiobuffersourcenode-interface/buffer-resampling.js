
  import * as WebAudio from 'node-web-audio-api';

  for (let name in WebAudio) {
    if (name !== 'default' && name !== 'load' && name !== 'mediaDevices') {
      globalThis[name] = WebAudio[name];
    }
  }

  // console.log(WebAudio);
  // process.exit()

  import * as url from 'node:url';
  import path from 'node:path';
  const __filename = url.fileURLToPath(import.meta.url);
  process.testName = path.basename(__filename, '.js');

  const cwd = process.cwd();

  // import scripts from test
  await import(path.join(cwd, '/resources/testharness.js'));
await import(path.join(cwd, 'testharnessreport.js'));
await import(path.join(cwd, '/webaudio/resources/audit-util.js'));
await import(path.join(cwd, '/webaudio/resources/audit.js'));

 let audit = Audit.createTaskRunner();

 const sampleRate = 48000;

 // For testing we only need a few render quanta.
 const renderSamples = 512

 // Sample rate for our buffers. This is the lowest sample rate that is
 // required to be supported.
 const bufferRate = 8000;

 // Number of samples in each AudioBuffer; this is fairly arbitrary but
 // should be less than a render quantum.
 const bufferLength = 30;

 // Frequency of the sine wave for testing.
 const frequency = 440;

 audit.define(
 {
 label: 'interpolate',
 description: 'Interpolation of AudioBuffers to context sample rate'
 },
 (task, should) => {
 // The first channel is for the interpolated signal, and the second
 // channel is for the reference signal from an oscillator.
 let context = new OfflineAudioContext({
 numberOfChannels: 2,
 length: renderSamples,
 sampleRate: sampleRate
 });

 let merger = new ChannelMergerNode(
 context, {numberOfChannels: context.destination.channelCount});
 merger.connect(context.destination);

 // Create a set of AudioBuffers which are samples from a pure sine
 // wave with frequency |frequency|.
 const nBuffers = Math.floor(context.length / bufferLength);
 const omega = 2 * Math.PI * frequency / bufferRate;

 let frameNumber = 0;
 let startTime = 0;

 for (let k = 0; k < nBuffers; ++k) {
 // let buffer = context.createBuffer(1, bufferLength,
 // bufferRate);
 let buffer = new AudioBuffer(
 {length: bufferLength, sampleRate: bufferRate});
 let data = buffer.getChannelData(0);
 for (let n = 0; n < bufferLength; ++n) {
 data[n] = Math.sin(omega * frameNumber);
 ++frameNumber;
 }
 // Create a source using this buffer and start it at the end of
 // the previous buffer.
 let src = new AudioBufferSourceNode(context, {buffer: buffer});

 src.connect(merger, 0, 0);
 src.start(startTime);
 startTime += buffer.duration;
 }

 // Create the reference sine signal using an oscillator.
 let osc = new OscillatorNode(
 context, {type: 'sine', frequency: frequency});
 osc.connect(merger, 0, 1);
 osc.start(0);

 context.startRendering()
 .then(audioBuffer => {
 let actual = audioBuffer.getChannelData(0);
 let expected = audioBuffer.getChannelData(1);

 should(actual, 'Interpolated sine wave')
 .beCloseToArray(expected, {absoluteThreshold: 9.0348e-2});

 // Compute SNR between them.
 let snr = 10 * Math.log10(computeSNR(actual, expected));

 should(snr, `SNR (${snr.toPrecision(4)} dB)`)
 .beGreaterThanOrEqualTo(37.17);
 })
 .then(() => task.done());
 });

 audit.run();
 