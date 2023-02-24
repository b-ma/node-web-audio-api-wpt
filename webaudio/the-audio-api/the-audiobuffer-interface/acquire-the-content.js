
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

const SAMPLERATE = 8000;
const LENGTH = 128;

var tests = {
 "AudioBufferSourceNode setter set with non-null buffer": function(oac) {
 var buf = oac.createBuffer(1, LENGTH, SAMPLERATE)
 var bs = new AudioBufferSourceNode(oac);
 var channelData = buf.getChannelData(0);
 for (var i = 0; i < channelData.length; i++) {
 channelData[i] = 1.0;
 }
 bs.buffer = buf;
 bs.start(); // This acquires the content since buf is not null
 for (var i = 0; i < channelData.length; i++) {
 channelData[i] = 0.5;
 }
 allSamplesAtOne(buf, "reading back");
 bs.connect(oac.destination);
 return oac.startRendering();
 },
 "AudioBufferSourceNode buffer setter set with null" : (oac) => {
 var buf = oac.createBuffer(1, LENGTH, SAMPLERATE)
 var bs = new AudioBufferSourceNode(oac);
 var channelData = buf.getChannelData(0);
 for (var i = 0; i < channelData.length; i++) {
 channelData[i] = 1.0;
 }
 bs.buffer = null;
 bs.start(); // This does not acquire the content
 bs.buffer = buf; // This does
 for (var i = 0; i < channelData.length; i++) {
 channelData[i] = 0.5;
 }
 allSamplesAtOne(buf, "reading back");
 bs.connect(oac.destination);
 return oac.startRendering();
 },
 "ConvolverNode": (oac) => {
 var buf = oac.createBuffer(1, LENGTH, SAMPLERATE)
 var impulse = oac.createBuffer(1, 1, SAMPLERATE)
 var bs = new AudioBufferSourceNode(oac);
 var convolver = new ConvolverNode(oac, {disableNormalization: true});

 impulse.getChannelData(0)[0] = 1.0; // unit impulse function
 convolver.buffer = impulse; // This does acquire the content
 impulse.getChannelData(0)[0] = 0.5;

 var channelData = buf.getChannelData(0);
 for (var i = 0; i < channelData.length; i++) {
 channelData[i] = 1.0;
 }
 bs.buffer = buf;
 bs.start();

 bs.connect(convolver).connect(oac.destination);
 return oac.startRendering();
 }
};

function allSamplesAtOne(audiobuffer, location) {
 var buf = audiobuffer.getChannelData(0);
 for (var i = 0; i < buf.length; i++) {
 // The convolver can introduce a slight numerical error.
 if (Math.abs(buf[i] - 1.0) > 0.0001) {
 assert_true(false, `Invalid value at index ${i}, expecte close to 1.0, found ${buf[i]} when ${location}`)
 return Promise.reject();
 }
 }
 assert_true(true, `Buffer unmodified when ${location}.`);
 return Promise.resolve();
}

for (const test of Object.keys(tests)) {
 promise_test(async function(t) {
 var buf = await tests[test](new OfflineAudioContext(1, LENGTH, SAMPLERATE));
 return allSamplesAtOne(buf, "rendering");
 }, test);
};
