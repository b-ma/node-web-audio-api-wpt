
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
await import(path.join(cwd, '/webaudio/resources/audit.js'));
await import(path.join(cwd, '/webaudio/resources/audit-util.js'));

 let audit = Audit.createTaskRunner();
 let filePath = 'processors/param-size-processor.js';
 let context;

 // Use a power of two so there's no roundoff computing times from frames.
 let sampleRate = 16384;

 // Sets up AudioWorklet and OfflineAudioContext.
 audit.define('Initializing AudioWorklet and Context', (task, should) => {
 should(() => {
 context = new OfflineAudioContext(
 1, 10 * RENDER_QUANTUM_FRAMES, sampleRate);
 }, 'Creating offline context for testing').notThrow();

 should(
 context.audioWorklet.addModule(filePath), 'Creating test worklet')
 .beResolved()
 .then(() => {
 task.done();
 });
 });

 audit.define('Verify Size of AudioParam Arrays', (task, should) => {
 let node = new AudioWorkletNode(context, 'param-size');
 let nodeParam = node.parameters.get('param');

 node.connect(context.destination);

 let renderQuantumDuration = RENDER_QUANTUM_FRAMES / context.sampleRate;

 // Set up some automations, after one render quantum. We want the first
 // render not to have any automations, just to be sure we handle that
 // case correctly.
 context.suspend(renderQuantumDuration)
 .then(() => {
 let now = context.currentTime;

 // Establish the first automation event.
 nodeParam.setValueAtTime(1, now);
 // The second render should be constant
 nodeParam.setValueAtTime(0, now + renderQuantumDuration);
 // The third render and part of the fourth is a linear ramp
 nodeParam.linearRampToValueAtTime(
 1, now + 2.5 * renderQuantumDuration);
 // Everything afterwards should be constant.
 })
 .then(() => context.resume());

 context.startRendering()
 .then(renderedBuffer => {
 let data = renderedBuffer.getChannelData(0);

 // The very first render quantum should be constant, so the array
 // has length 1.
 should(
 data.slice(0, RENDER_QUANTUM_FRAMES),
 'Render quantum 0: array size')
 .beConstantValueOf(1);

 should(
 data.slice(RENDER_QUANTUM_FRAMES, 2 * RENDER_QUANTUM_FRAMES),
 'Render quantum 1: array size')
 .beConstantValueOf(1);

 should(
 data.slice(
 2 * RENDER_QUANTUM_FRAMES, 4 * RENDER_QUANTUM_FRAMES),
 'Render quantum 2-3: array size')
 .beConstantValueOf(RENDER_QUANTUM_FRAMES);

 should(
 data.slice(4 * RENDER_QUANTUM_FRAMES),
 'Remaining renders: array size')
 .beConstantValueOf(1);
 })
 .then(() => task.done());
 });

 audit.run();
 