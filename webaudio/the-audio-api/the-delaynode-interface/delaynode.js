
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
await import(path.join(cwd, '/webaudio/resources/delay-testing.js'));

 let audit = Audit.createTaskRunner();

 audit.define(
 {
 label: 'test',
 description: 'Tests attribute and basic functionality of DelayNode'
 },
 function(task, should) {

 // Create offline audio context.
 let context = new OfflineAudioContext(
 1, sampleRate * renderLengthSeconds, sampleRate);
 let toneBuffer = createToneBuffer(
 context, 20, 20 * toneLengthSeconds, sampleRate); // 20Hz tone

 let bufferSource = context.createBufferSource();
 bufferSource.buffer = toneBuffer;

 let delay = context.createDelay();

 globalThis.delay = delay;
 should(delay.numberOfInputs, 'delay.numberOfInputs').beEqualTo(1);
 should(delay.numberOfOutputs, 'delay.numberOfOutputs').beEqualTo(1);
 should(delay.delayTime.defaultValue, 'delay.delayTime.defaultValue')
 .beEqualTo(0.0);
 should(delay.delayTime.value, 'delay.delayTime.value')
 .beEqualTo(0.0);

 delay.delayTime.value = delayTimeSeconds;
 should(
 delay.delayTime.value,
 'delay.delayTime.value = ' + delayTimeSeconds)
 .beEqualTo(delayTimeSeconds);

 bufferSource.connect(delay);
 delay.connect(context.destination);
 bufferSource.start(0);

 context.startRendering()
 .then(buffer => checkDelayedResult(buffer, toneBuffer, should))
 .then(task.done.bind(task));
 });

 audit.run();
 