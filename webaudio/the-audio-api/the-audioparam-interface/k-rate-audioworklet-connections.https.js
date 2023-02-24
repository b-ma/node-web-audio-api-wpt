
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

 const audit = Audit.createTaskRunner();

 // Use the worklet gain node to test k-rate parameters.
 const filePath =
 '../the-audioworklet-interface/processors/gain-processor.js';

 // Context for testing
 let context;

 audit.define('Create Test Worklet', (task, should) => {
 // Arbitrary sample rate and duration.
 const sampleRate = 8000;

 // Only new a few render quanta to verify things are working.
 const testDuration = 4 * 128 / sampleRate;

 context = new OfflineAudioContext({
 numberOfChannels: 3,
 sampleRate: sampleRate,
 length: testDuration * sampleRate
 });

 should(
 context.audioWorklet.addModule(filePath),
 'Construction of AudioWorklet')
 .beResolved()
 .then(() => task.done());
 });

 audit.define('AudioWorklet k-rate AudioParam', async (task, should) => {
 let src = new ConstantSourceNode(context);
 let kRateNode = new AudioWorkletNode(context, 'gain');
 src.connect(kRateNode).connect(context.destination);

 let kRateParam = kRateNode.parameters.get('gain');
 kRateParam.automationRate = 'k-rate';
 kRateParam.value = 0;

 let mod = new ConstantSourceNode(context);
 mod.offset.setValueAtTime(0, 0);
 mod.offset.linearRampToValueAtTime(
 10, context.length / context.sampleRate);
 mod.connect(kRateParam);

 mod.start();
 src.start();

 const audioBuffer = await context.startRendering();
 let output = audioBuffer.getChannelData(0);

 // Verify that the output isn't constantly zero.
 should(output, 'output').notBeConstantValueOf(0);
 // Verify that the output from the worklet is step-wise
 // constant.
 for (let k = 0; k < output.length; k += 128) {
 should(output.slice(k, k + 128), ` k-rate output [${k}: ${k + 127}]`)
 .beConstantValueOf(output[k]);
 }
 task.done();
 });

 audit.run();
 