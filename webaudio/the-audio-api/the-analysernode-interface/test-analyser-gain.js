
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

promise_test(function() {
 // fftSize <= bufferSize so that the time domain data is full of input after
 // processing the buffer.
 const fftSize = 32;
 const bufferSize = 128;

 var context = new OfflineAudioContext(1, bufferSize, 48000);

 var analyser1 = context.createAnalyser();
 analyser1.fftSize = fftSize;
 analyser1.connect(context.destination);
 var analyser2 = context.createAnalyser();
 analyser2.fftSize = fftSize;

 var gain = context.createGain();
 gain.gain.value = 2.0;
 gain.connect(analyser1);
 gain.connect(analyser2);

 // Create a DC input to make getFloatTimeDomainData() output consistent at
 // any time.
 var buffer = context.createBuffer(1, 1, context.sampleRate);
 buffer.getChannelData(0)[0] = 1.0 / gain.gain.value;
 var source = context.createBufferSource();
 source.buffer = buffer;
 source.loop = true;
 source.connect(gain);
 source.start();

 return context.startRendering().then(function(buffer) {
 assert_equals(buffer.getChannelData(0)[0], 1.0, "analyser1 output");

 var data = new Float32Array(1);
 analyser1.getFloatTimeDomainData(data);
 assert_equals(data[0], 1.0, "analyser1 time domain data");
 analyser2.getFloatTimeDomainData(data);
 assert_equals(data[0], 1.0, "analyser2 time domain data");
 });
}, "Test effect of AnalyserNode on GainNode output");
 