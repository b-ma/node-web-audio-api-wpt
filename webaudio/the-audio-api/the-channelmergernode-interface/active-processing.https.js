
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

 // AudioProcessor that sends a message to its AudioWorkletNode whenver the
 // number of channels on its input changes.
 let filePath =
 '../the-audioworklet-interface/processors/active-processing.js';

 const audit = Audit.createTaskRunner();

 let context;

 audit.define('initialize', (task, should) => {
 // Create context and load the module
 context = new AudioContext();
 should(
 context.audioWorklet.addModule(filePath),
 'AudioWorklet module loading')
 .beResolved()
 .then(() => task.done());
 });

 audit.define('test', (task, should) => {
 const src = new OscillatorNode(context);

 // Number of inputs for the ChannelMergerNode. Pretty arbitrary, but
 // should not be 1.
 const numberOfInputs = 7;
 const merger =
 new ChannelMergerNode(context, {numberOfInputs: numberOfInputs});

 const testerNode =
 new AudioWorkletNode(context, 'active-processing-tester', {
 // Use as short a duration as possible to keep the test from
 // taking too much time.
 processorOptions: {testDuration: .5},
 });

 // Expected number of output channels from the merger node. We should
 // start with the number of inputs, because the source (oscillator) is
 // actively processing. When the source stops, the number of channels
 // should change to 1.
 const expectedValues = [numberOfInputs, 1];
 let index = 0;

 testerNode.port.onmessage = event => {
 let count = event.data.channelCount;
 let finished = event.data.finished;

 // If we're finished, end testing.
 if (finished) {
 // Verify that we got the expected number of changes.
 should(index, 'Number of distinct values')
 .beEqualTo(expectedValues.length);

 task.done();
 return;
 }

 if (index < expectedValues.length) {
 // Verify that the number of channels matches the expected number of
 // channels.
 should(count, `Test ${index}: Number of convolver output channels`)
 .beEqualTo(expectedValues[index]);
 }

 ++index;
 };

 // Create the graph and go
 src.connect(merger).connect(testerNode).connect(context.destination);
 src.start();

 // Stop the source after a short time so we can test that the channel
 // merger changes to not actively processing and thus produces a single
 // channel of silence.
 src.stop(context.currentTime + .1);
 });

 audit.run();
 