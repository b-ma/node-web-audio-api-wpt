
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

 // Arbitrary sample rate
 const sampleRate = 48000;

 // The offset to be applied by the worklet to its inputs.
 const offset = 1;

 // Location of the worklet's code
 const filePath = 'processors/add-offset.js';

 let audit = Audit.createTaskRunner();

 // Context to be used for the tests.
 let context;

 audit.define('Initialize worklet', (task, should) => {
 // Two channels for testing. Channel 0 is the output of the
 // AudioWorklet. Channel 1 is the oscillator so we can compare
 // the outputs.
 context = new OfflineAudioContext(
 {numberOfChannels: 2, length: sampleRate, sampleRate: sampleRate});

 // Load up the code for the worklet.
 should(
 context.audioWorklet.addModule(filePath),
 'Creation of AudioWorklet')
 .beResolved()
 .then(() => task.done());
 });

 audit.define(
 {label: 'test', description: 'Simple AudioWorklet I/O'},
 (task, should) => {
 let merger = new ChannelMergerNode(
 context, {numberOfChannels: context.destination.channelCount});
 merger.connect(context.destination);

 let src = new OscillatorNode(context);

 let worklet = new AudioWorkletNode(
 context, 'add-offset-processor',
 {processorOptions: {offset: offset}});

 src.connect(worklet).connect(merger, 0, 0);
 src.connect(merger, 0, 1);

 // Start and stop the source. The stop time is fairly arbitrary,
 // but use a render quantum boundary for simplicity.
 const stopFrame = RENDER_QUANTUM_FRAMES;
 src.start(0);
 src.stop(stopFrame / context.sampleRate);

 context.startRendering()
 .then(buffer => {
 let ch0 = buffer.getChannelData(0);
 let ch1 = buffer.getChannelData(1);

 let shifted = ch1.slice(0, stopFrame).map(x => x + offset);

 // The initial part of the output should be the oscillator
 // shifted by |offset|.
 should(
 ch0.slice(0, stopFrame),
 `AudioWorklet output[0:${stopFrame - 1}]`)
 .beCloseToArray(shifted, {absoluteThreshold: 0});

 // Output should be constant after the source has stopped.
 should(
 ch0.slice(stopFrame),
 `AudioWorklet output[${stopFrame}:]`)
 .beConstantValueOf(offset);
 })
 .then(() => task.done());
 });

 audit.run();
 