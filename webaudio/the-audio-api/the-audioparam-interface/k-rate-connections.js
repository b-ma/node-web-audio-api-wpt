
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

 let audit = Audit.createTaskRunner();

 // Must be power of two to eliminate round-off
 const sampleRate = 8192;

 // Arbitrary duration that doesn't need to be too long to verify k-rate
 // automations. Probably should be at least a few render quanta.
 const testDuration = 8 * RENDER_QUANTUM_FRAMES / sampleRate;

 // Test k-rate GainNode.gain is k-rate
 audit.define(
 {label: 'Gain', description: 'k-rate GainNode.gain'},
 (task, should) => {
 let context = new OfflineAudioContext({
 numberOfChannels: 2,
 sampleRate: sampleRate,
 length: testDuration * sampleRate
 });

 let merger = new ChannelMergerNode(
 context, {numberOfInputs: context.destination.channelCount});
 merger.connect(context.destination);

 let src = new ConstantSourceNode(context);

 createTestSubGraph(context, src, merger, 'GainNode', 'gain');

 src.start();
 context.startRendering()
 .then(buffer => {
 let actual = buffer.getChannelData(0);
 let expected = buffer.getChannelData(1);

 for (let k = 0; k < actual.length;
 k += RENDER_QUANTUM_FRAMES) {
 should(
 actual.slice(k, k + RENDER_QUANTUM_FRAMES),
 `gain[${k}:${k + RENDER_QUANTUM_FRAMES}]`)
 .beConstantValueOf(expected[k]);
 }
 })
 .then(() => task.done());
 });

 // Test k-rate StereoPannerNode.pan is k-rate
 audit.define(
 {label: 'StereoPanner', description: 'k-rate StereoPannerNode.pan'},
 (task, should) => {
 let context = new OfflineAudioContext({
 numberOfChannels: 2,
 sampleRate: sampleRate,
 length: testDuration * sampleRate
 });
 let merger = new ChannelMergerNode(
 context, {numberOfInputs: context.destination.channelCount});
 merger.connect(context.destination);

 let src = new ConstantSourceNode(context);

 createTestSubGraph(
 context, src, merger, 'StereoPannerNode', 'pan', {
 testModSetup: node => {
 node.offset.setValueAtTime(-1, 0);
 node.offset.linearRampToValueAtTime(1, testDuration);
 }
 });

 src.start();
 context.startRendering()
 .then(buffer => {
 let actual = buffer.getChannelData(0);
 let expected = buffer.getChannelData(1);

 for (let k = 0; k < actual.length; k += 128) {
 should(actual.slice(k, k + 128), `pan[${k}:${k + 128}]`)
 .beConstantValueOf(expected[k]);
 }
 })
 .then(() => task.done());
 });

 audit.run();

 function createTestSubGraph(
 context, src, merger, nodeName, paramName, options) {
 // The test node which has its AudioParam set up for k-rate autmoations.
 let tstNode = new globalThis[nodeName](context);

 if (options && options.setups) {
 options.setups(tstNode);
 }
 tstNode[paramName].automationRate = 'k-rate';

 // Modulating signal for the test node. Just a linear ramp. This is
 // connected to the AudioParam of the tstNode.
 let tstMod = new ConstantSourceNode(context);
 if (options && options.testModSetup) {
 options.testModSetup(tstMod);
 } else {
 tstMod.offset.linearRampToValueAtTime(context.length, testDuration);
 }

 tstMod.connect(tstNode[paramName]);
 src.connect(tstNode).connect(merger, 0, 0);

 // The ref node is the same type of node as the test node, but uses
 // a-rate automation. However, the modulating signal is k-rate. This
 // causes the input to the audio param to be constant over a render,
 // which is basically the same as making the audio param be k-rate.
 let refNode = new globalThis[nodeName](context);
 let refMod = new ConstantSourceNode(context);
 refMod.offset.automationRate = 'k-rate';
 if (options && options.testModSetup) {
 options.testModSetup(refMod);
 } else {
 refMod.offset.linearRampToValueAtTime(context.length, testDuration);
 }

 refMod.connect(refNode[paramName]);
 src.connect(refNode).connect(merger, 0, 1);

 tstMod.start();
 refMod.start();
 }
 