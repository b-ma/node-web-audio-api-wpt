
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

 const audit = Audit.createTaskRunner();
 const context = new AudioContext();

 setup(function () {
 context.audioWorklet.addModule(
 'processors/channel-count-processor.js').then(() => audit.run());

 // Test if the output channe count dynamically changes if the input
 // and output is 1.
 audit.define(
 {label: 'Dynamically change the channel count to if unspecified.'},
 (task, should) => {
 // Use arbitrary parameters for the test.
 const buffer = new AudioBuffer({
 numberOfChannels: 17,
 length: 1,
 sampleRate: context.sampleRate,
 });
 const source = new AudioBufferSourceNode(context);
 source.buffer = buffer;

 const node = new AudioWorkletNode(context, 'channel-count', {
 numberOfInputs: 1,
 numberOfOutputs: 1,
 });

 node.port.onmessage = (message) => {
 const expected = message.data;
 should(expected.outputChannel,
 'The expected output channel count').beEqualTo(17);
 task.done();
 };

 // We need to make an actual connection becasue the channel count
 // change happen when the rendering starts. It is to test if the
 // channel count adapts to the upstream node correctly.
 source.connect(node).connect(context.destination);
 source.start();
 });

 // Test if outputChannelCount is honored as expected even if the input
 // and output is 1.
 audit.define(
 {label: 'Givien outputChannelCount must be honored.'},
 (task, should) => {
 const node = new AudioWorkletNode(
 context, 'channel-count', {
 numberOfInputs: 1,
 numberOfOutputs: 1,
 outputChannelCount: [2],
 });

 node.port.onmessage = (message) => {
 const expected = message.data;
 should(expected.outputChannel,
 'The expected output channel count').beEqualTo(2);
 task.done();
 };

 // We need to make an actual connection becasue the channel count
 // change might happen when the rendering starts. It is to test
 // if the specified channel count is kept correctly.
 node.connect(context.destination);
 });
 });
 