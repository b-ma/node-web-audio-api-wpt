
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

 let audit = Audit.createTaskRunner();

 let sampleRate = 48000;
 let renderLength = 48000 * 0.6;
 let context;

 let filePath = 'processors/gain-processor.js';

 // Sets up AudioWorklet and OfflineAudioContext.
 audit.define('Initializing AudioWorklet and Context', (task, should) => {
 context = new OfflineAudioContext(1, renderLength, sampleRate);
 context.audioWorklet.addModule(filePath).then(() => {
 task.done();
 });
 });

 // Verifies the functionality of AudioParam in AudioWorkletNode by
 // comparing (canceling out) values from GainNode and AudioWorkletNode
 // with simple gain computation code by AudioParam.
 audit.define(
 'Verifying AudioParam in AudioWorkletNode',
 (task, should) => {
 let constantSourceNode = new ConstantSourceNode(context);
 let gainNode = new GainNode(context);
 let inverterNode = new GainNode(context, {gain: -1});
 let gainWorkletNode = new AudioWorkletNode(context, 'gain');
 let gainWorkletParam = gainWorkletNode.parameters.get('gain');

 // Test default value and setter/getter functionality.
 should(gainWorkletParam.value,
 'Default gain value of gainWorkletNode')
 .beEqualTo(Math.fround(0.707));
 gainWorkletParam.value = 0.1;
 should(gainWorkletParam.value,
 'Value of gainWorkletParam after setter = 0.1')
 .beEqualTo(Math.fround(0.1));

 constantSourceNode.connect(gainNode)
 .connect(inverterNode)
 .connect(context.destination);
 constantSourceNode.connect(gainWorkletNode)
 .connect(context.destination);

 // With arbitrary times and values, test all possible AudioParam
 // automations.
 [gainNode.gain, gainWorkletParam].forEach((param) => {
 param.setValueAtTime(0, 0);
 param.linearRampToValueAtTime(1, 0.1);
 param.exponentialRampToValueAtTime(0.5, 0.2);
 param.setValueCurveAtTime([0, 2, 0.3], 0.2, 0.1);
 param.setTargetAtTime(0.01, 0.4, 0.5);
 });

 // Test if the setter works correctly in the middle of rendering.
 context.suspend(0.5).then(() => {
 gainNode.gain.value = 1.5;
 gainWorkletParam.value = 1.5;
 context.resume();
 });

 constantSourceNode.start();
 context.startRendering().then((renderedBuffer) => {
 should(renderedBuffer.getChannelData(0),
 'The rendered buffer')
 .beConstantValueOf(0);
 task.done();
 });
 });

 audit.run();
 