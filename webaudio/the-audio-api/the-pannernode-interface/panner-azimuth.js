
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
await import('../../resources/audit.js');

 const audit = Audit.createTaskRunner();

 // Fairly arbitrary sample rate
 const sampleRate = 16000;

 audit.define('Azimuth calculation', (task, should) => {
 // Two channels for the context so we can see each channel of the
 // panner node.
 let context = new OfflineAudioContext(2, sampleRate, sampleRate);

 let src = new ConstantSourceNode(context);
 let panner = new PannerNode(context);

 src.connect(panner).connect(context.destination);

 // The source is still pointed directly at the listener, but is now
 // directly above. The audio should be the same in both the left and
 // right channels.
 panner.positionY.value = 1;

 src.start();

 context.startRendering()
 .then(audioBuffer => {
 // The left and right channels should contain the same signal.
 let c0 = audioBuffer.getChannelData(0);
 let c1 = audioBuffer.getChannelData(1);

 let expected = Math.fround(Math.SQRT1_2);

 should(c0, 'Left channel').beConstantValueOf(expected);
 should(c1, 'Righteft channel').beConstantValueOf(expected);
 })
 .then(() => task.done());
 });

 audit.run();
 