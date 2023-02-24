
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

 // Arbitrary sample rate.
 const sampleRate = 16000;

 // Number of frames to render. Just need to have at least 2 render
 // quanta.
 const lengthInFrames = 10 * RENDER_QUANTUM_FRAMES;

 let audit = Audit.createTaskRunner();

 // Buffer to use for the impulse response of a ConvolverNode.
 let impulseBuffer;

 // This sets up a worker to receive one channel of an AudioBuffer.
 function setUpWorkerForTest() {
 impulseBuffer = new AudioBuffer({
 numberOfChannels: 2,
 length: 2 * RENDER_QUANTUM_FRAMES,
 sampleRate: sampleRate
 });

 // Just fill the buffer with a constant value; the contents shouldn't
 // matter for this test since we're transferring one of the channels.
 impulseBuffer.getChannelData(0).fill(1);
 impulseBuffer.getChannelData(1).fill(2);

 // We're going to transfer channel 0 to the worker, making it
 // unavailable for the convolver
 let data = impulseBuffer.getChannelData(0).buffer;

 let string = [
 'onmessage = function(e) {', ' postMessage(\'done\');', '};'
 ].join('\n');

 let blobURL = URL.createObjectURL(new Blob([string]));
 let worker = new Worker(blobURL);
 worker.onmessage = workerReply;
 worker.postMessage(data, [data]);
 }

 function workerReply() {
 // Worker has received the message. Run the test.
 audit.run();
 }

 audit.define(
 {
 label: 'Test Convolver with transferred buffer',
 description: 'Output should be all zeroes'
 },
 async (task, should) => {
 // Two channels so we can capture the output of the convolver with a
 // stereo convolver.
 let context = new OfflineAudioContext({
 numberOfChannels: 2,
 length: lengthInFrames,
 sampleRate: sampleRate
 });

 // Use a simple constant source so we easily check that the
 // convolver output is correct.
 let source = new ConstantSourceNode(context);

 // Create the convolver with the desired impulse response and
 // disable normalization so we can easily check the output.
 let conv = new ConvolverNode(
 context, {disableNormalization: true, buffer: impulseBuffer});

 source.connect(conv).connect(context.destination);

 source.start();

 let renderedBuffer = await context.startRendering();

 // Get the actual data
 let c0 = renderedBuffer.getChannelData(0);
 let c1 = renderedBuffer.getChannelData(1);

 // Since one channel was transferred, we must behave as if all were
 // transferred. Hence, the output should be all zeroes for both
 // channels.
 should(c0, `Convolver channel 0 output[0:${c0.length - 1}]`)
 .beConstantValueOf(0);

 should(c1, `Convolver channel 1 output[0:${c1.length - 1}]`)
 .beConstantValueOf(0);

 task.done();
 });

 setUpWorkerForTest();
 