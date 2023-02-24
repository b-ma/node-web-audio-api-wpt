
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

 audit.define(
 {label: 'test0', description: 'Test delay of 3 frames'},
 async (task, should) => {
 // Only need a few outputs samples. The sample rate is arbitrary.
 const context =
 new OfflineAudioContext(1, RENDER_QUANTUM_FRAMES, 8192);
 let src;
 let delay;

 should(
 () => {
 src = new ConstantSourceNode(context);
 delay = new DelayNode(context);
 },
 'Creating ConstantSourceNode(context) and DelayNode(context)')
 .notThrow();

 // The number of frames to delay for the DelayNode. Should be a
 // whole number, but is otherwise arbitrary.
 const delayFrames = 3;

 should(() => {
 delay.delayTime.value = delayFrames / context.sampleRate;
 }, `Setting delayTime to ${delayFrames} frames`).notThrow();

 src.connect(delay).connect(context.destination);

 src.start();

 let buffer = await context.startRendering();
 let output = buffer.getChannelData(0);

 // Verify output was delayed the correct number of frames.
 should(output.slice(0, delayFrames), `output[0:${delayFrames - 1}]`)
 .beConstantValueOf(0);
 should(
 output.slice(delayFrames),
 `output[${delayFrames}:${output.length - 1}]`)
 .beConstantValueOf(1);

 task.done();
 });

 audit.run();
 