
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

 // Arbitrary numbers used to align the test with render quantum boundary.
 // The sample rate is a power of two to eliminate roundoff in computing
 // the suspend time needed for the test.
 let sampleRate = 16384;
 let renderLength = 8 * RENDER_QUANTUM_FRAMES;
 let context;

 let filePath = 'processors/input-length-processor.js';

 let testChannelValues = [1, 2, 3];

 // Creates a 3-channel buffer and play with BufferSourceNode. The source
 // goes through a bypass AudioWorkletNode (gain value of 1).
 audit.define(
 {
 label: 'test',
 description:
 'Input array length should be zero for disconnected input'
 },
 (task, should) => {
 context = new OfflineAudioContext({
 numberOfChannels: 1,
 length: renderLength,
 sampleRate: sampleRate
 });

 context.audioWorklet.addModule(filePath).then(() => {
 let sourceNode = new ConstantSourceNode(context);
 let workletNode =
 new AudioWorkletNode(context, 'input-length-processor');

 workletNode.connect(context.destination);

 // Connect the source now.
 let connectFrame = RENDER_QUANTUM_FRAMES;

 context.suspend(connectFrame / sampleRate)
 .then(() => {
 sourceNode.connect(workletNode);
 })
 .then(() => context.resume());
 ;

 // Then disconnect the source after a few renders
 let disconnectFrame = 3 * RENDER_QUANTUM_FRAMES;
 context.suspend(disconnectFrame / sampleRate)
 .then(() => {
 sourceNode.disconnect(workletNode);
 })
 .then(() => context.resume());

 sourceNode.start();
 context.startRendering()
 .then(resultBuffer => {
 let data = resultBuffer.getChannelData(0);

 should(
 data.slice(0, connectFrame),
 'Before connecting the source: Input array length')
 .beConstantValueOf(0);

 // Find where the output is no longer 0.
 let nonZeroIndex = data.findIndex(x => x > 0);
 should(nonZeroIndex, 'First non-zero output')
 .beEqualTo(connectFrame);

 should(
 data.slice(
 nonZeroIndex,
 nonZeroIndex + (disconnectFrame - connectFrame)),
 'While source is connected: Input array length')
 .beConstantValueOf(RENDER_QUANTUM_FRAMES);
 should(
 data.slice(disconnectFrame),
 'After disconnecting the source: Input array length')
 .beConstantValueOf(0);
 })
 .then(() => task.done());
 });
 });

 audit.run();
 