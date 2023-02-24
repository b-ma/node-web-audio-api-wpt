
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
 let sampleRate = 44100.0;
 let renderLengthSeconds = 0.125;
 let delayTimeSeconds = 0.1;

 function createSinWaveBuffer(context, lengthInSeconds, frequency) {
 let audioBuffer =
 context.createBuffer(1, lengthInSeconds * sampleRate, sampleRate);

 let n = audioBuffer.length;
 let data = audioBuffer.getChannelData(0);

 for (let i = 0; i < n; ++i) {
 data[i] = Math.sin(frequency * 2 * Math.PI * i / sampleRate);
 }

 return audioBuffer;
 }

 audit.define(
 {
 label: 'Test connections',
 description:
 'AudioNode connection order doesn\'t trigger assertion errors'
 },
 function(task, should) {
 // Create offline audio context.
 let context = new OfflineAudioContext(
 1, sampleRate * renderLengthSeconds, sampleRate);
 let toneBuffer =
 createSinWaveBuffer(context, renderLengthSeconds, 880);

 let bufferSource = context.createBufferSource();
 bufferSource.buffer = toneBuffer;
 bufferSource.connect(context.destination);

 let delay = context.createDelay();
 delay.delayTime.value = delayTimeSeconds;

 // We connect delay node to gain node before anything is connected
 // to delay node itself. We do this because we try to trigger the
 // ASSERT which might be fired due to AudioNode connection order,
 // especially when gain node and delay node is involved e.g.
 // https://bugs.webkit.org/show_bug.cgi?id=76685.

 should(() => {
 let gain = context.createGain();
 gain.connect(context.destination);
 delay.connect(gain);
 }, 'Connecting nodes').notThrow();

 bufferSource.start(0);

 let promise = context.startRendering();

 should(promise, 'OfflineContext startRendering()')
 .beResolved()
 .then(task.done.bind(task));
 });

 audit.run();
 