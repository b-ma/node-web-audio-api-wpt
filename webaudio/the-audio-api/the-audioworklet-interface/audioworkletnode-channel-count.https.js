
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
 let sampleRate = RENDER_QUANTUM_FRAMES * 100;
 let renderLength = RENDER_QUANTUM_FRAMES * 2;
 let context;

 let filePath = 'processors/gain-processor.js';

 let testChannelValues = [1, 2, 3];

 // Creates a 3-channel buffer and play with BufferSourceNode. The source
 // goes through a bypass AudioWorkletNode (gain value of 1).
 audit.define('setup-buffer-and-worklet', (task, should) => {
 context = new OfflineAudioContext(testChannelValues.length,
 renderLength,
 sampleRate);

 // Explicitly sets the destination channelCountMode and
 // channelInterpretation to make sure the result does no mixing.
 context.channeCountMode = 'explicit';
 context.channelInterpretation = 'discrete';

 context.audioWorklet.addModule(filePath).then(() => {
 let testBuffer = createConstantBuffer(context, 1, testChannelValues);
 let sourceNode = new AudioBufferSourceNode(context);
 let gainWorkletNode = new AudioWorkletNode(context, 'gain');

 gainWorkletNode.parameters.get('gain').value = 1.0;
 sourceNode.connect(gainWorkletNode).connect(context.destination);

 // Suspend the context at 128 sample frames and play the source with
 // the assigned buffer.
 context.suspend(RENDER_QUANTUM_FRAMES/sampleRate).then(() => {
 sourceNode.buffer = testBuffer;
 sourceNode.loop = true;
 sourceNode.start();
 context.resume();
 });
 task.done();
 });
 });

 // Verifies if the rendered buffer has all zero for the first half (before
 // 128 samples) and the expected values for the second half.
 audit.define('verify-rendered-buffer', (task, should) => {
 context.startRendering().then(renderedBuffer => {
 testChannelValues.forEach((value, index) => {
 let channelData = renderedBuffer.getChannelData(index);
 should(channelData.subarray(0, RENDER_QUANTUM_FRAMES),
 'First half of Channel #' + index)
 .beConstantValueOf(0);
 should(channelData.subarray(RENDER_QUANTUM_FRAMES, renderLength),
 'Second half of Channel #' + index)
 .beConstantValueOf(value);
 });
 task.done();
 });
 });

 audit.run();
 