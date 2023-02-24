
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

 // Arbitrary sample rate
 const sampleRate = 48000;
 let audit = Audit.createTaskRunner();

 audit.define(
 {
 label: 'test',
 description: 'ScriptProcessor with stopped input source'
 },
 (task, should) => {
 // Two channels for testing. Channel 0 is the output of the
 // scriptProcessor. Channel 1 is the oscillator so we can compare
 // the outputs.
 let context = new OfflineAudioContext({
 numberOfChannels: 2,
 length: sampleRate,
 sampleRate: sampleRate
 });

 let merger = new ChannelMergerNode(
 context, {numberOfChannels: context.destination.channelCount});
 merger.connect(context.destination);

 let src = new OscillatorNode(context);

 // Arbitrary buffer size for the ScriptProcessorNode. Don't use 0;
 // we need to know the actual size to know the latency of the node
 // (easily).
 const spnSize = 512;
 let spn = context.createScriptProcessor(spnSize, 1, 1);

 // Arrange for the ScriptProcessor to add |offset| to the input.
 const offset = 1;
 spn.onaudioprocess = (event) => {
 let input = event.inputBuffer.getChannelData(0);
 let output = event.outputBuffer.getChannelData(0);
 for (let k = 0; k < output.length; ++k) {
 output[k] = input[k] + offset;
 }
 };

 src.connect(spn).connect(merger, 0, 0);
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

 // SPN has a basic latency of 2*|spnSize| fraems, so the
 // beginning is silent.
 should(
 ch0.slice(0, 2 * spnSize - 1),
 `ScriptProcessor output[0:${2 * spnSize - 1}]`)
 .beConstantValueOf(0);

 // For the middle section (after adding latency), the output
 // should be the source shifted by |offset|.
 should(
 ch0.slice(2 * spnSize, 2 * spnSize + stopFrame),
 `ScriptProcessor output[${2 * spnSize}:${
 2 * spnSize + stopFrame - 1}]`)
 .beCloseToArray(shifted, {absoluteThreshold: 0});

 // Output should be constant after the source has stopped.
 // Include the latency introduced by the node.
 should(
 ch0.slice(2 * spnSize + stopFrame),
 `ScriptProcessor output[${2 * spnSize + stopFrame}:]`)
 .beConstantValueOf(offset);
 })
 .then(() => task.done());
 });

 audit.run();
 