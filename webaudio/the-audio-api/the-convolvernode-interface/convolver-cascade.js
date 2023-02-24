
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

 // Arbitrary sample rate and reasonably short duration
 let sampleRate = 8000;
 let duration = 0.25;
 let renderFrames = duration * sampleRate;

 audit.define(
 {label: 'cascade-mono', description: 'Cascaded mono convolvers'},
 (task, should) => {
 // Cascade two convolvers with mono responses and verify that the
 // output is not silent.
 let context = new OfflineAudioContext(1, renderFrames, sampleRate);

 let b0 =
 new AudioBuffer({length: 5, sampleRate: context.sampleRate});
 b0.getChannelData(0)[1] = 1;
 let c0 = new ConvolverNode(
 context, {disableNormalization: true, buffer: b0});

 let b1 =
 new AudioBuffer({length: 5, sampleRate: context.sampleRate});
 b1.getChannelData(0)[2] = 1;

 let c1 = new ConvolverNode(
 context, {disableNormalization: true, buffer: b1});

 let src = new OscillatorNode(context);

 src.connect(c0).connect(c1).connect(context.destination);

 src.start();

 context.startRendering()
 .then(audioBuffer => {
 // Just verify the output is not silent
 let audio = audioBuffer.getChannelData(0);

 should(audio, 'Output of cascaded mono convolvers')
 .notBeConstantValueOf(0);
 })
 .then(() => task.done());
 });

 audit.run();
 