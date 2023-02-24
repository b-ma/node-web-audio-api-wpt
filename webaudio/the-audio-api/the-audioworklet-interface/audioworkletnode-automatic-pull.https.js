
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

 const audit = Audit.createTaskRunner();

 // Arbitrary sample rate. Anything should work.
 const sampleRate = 48000;
 const renderLength = RENDER_QUANTUM_FRAMES * 2;
 const channelCount = 1;
 const filePath = 'processors/zero-output-processor.js';

 const sourceOffset = 0.5;

 // Connect a constant source node to the zero-output AudioWorkletNode.
 // Then verify if it captures the data correctly.
 audit.define('setup-worklet', (task, should) => {
 const context =
 new OfflineAudioContext(channelCount, renderLength, sampleRate);

 context.audioWorklet.addModule(filePath).then(() => {
 let testSource =
 new ConstantSourceNode(context, { offset: sourceOffset });
 let zeroOutputWorkletNode =
 new AudioWorkletNode(context, 'zero-output-processor', {
 numberOfInputs: 1,
 numberOfOutputs: 0,
 processorOptions: {
 bufferLength: renderLength,
 channeCount: channelCount
 }
 });

 // Start the source and stop at the first render quantum.
 testSource.connect(zeroOutputWorkletNode);
 testSource.start();
 testSource.stop(RENDER_QUANTUM_FRAMES/sampleRate);

 zeroOutputWorkletNode.port.onmessage = (event) => {
 // The |capturedBuffer| can be multichannel. Iterate through it.
 for (let i = 0; i < event.data.capturedBuffer.length; ++i) {
 let buffer = event.data.capturedBuffer[i];
 // Split the captured buffer in half for the easier test.
 should(buffer.subarray(0, RENDER_QUANTUM_FRAMES),
 'The first half of the captured buffer')
 .beConstantValueOf(sourceOffset);
 should(buffer.subarray(RENDER_QUANTUM_FRAMES, renderLength),
 'The second half of the captured buffer')
 .beConstantValueOf(0);
 }
 task.done();
 };

 // Starts the rendering, but we don't need the rendered buffer from
 // the context.
 context.startRendering();
 });
 });

 audit.run();
 