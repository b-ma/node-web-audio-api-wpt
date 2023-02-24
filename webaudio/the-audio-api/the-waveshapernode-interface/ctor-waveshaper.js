
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
await import(path.join(cwd, '/webaudio/resources/audionodeoptions.js'));

 let context;

 let audit = Audit.createTaskRunner();

 audit.define('initialize', (task, should) => {
 context = initializeContext(should);
 task.done();
 });

 audit.define('incorrect construction', (task, should) => {
 testInvalidConstructor(should, 'WaveShaperNode', context);
 task.done();
 });

 audit.define('valid default construction', (task, should) => {
 let prefix = 'node0';
 let node = testDefaultConstructor(should, 'WaveShaperNode', context, {
 prefix: prefix,
 numberOfInputs: 1,
 numberOfOutputs: 1,
 channelCount: 2,
 channelCountMode: 'max',
 channelInterpretation: 'speakers'
 });

 testDefaultAttributes(should, node, prefix, [
 {name: 'curve', value: null}, {name: 'oversample', value: 'none'}
 ]);

 task.done();
 });

 audit.define('test AudioNodeOptions', (task, should) => {
 testAudioNodeOptions(should, context, 'WaveShaperNode');
 task.done();
 });

 audit.define('valid non-default', (task, should) => {
 // Construct an WaveShaperNode with options
 let options = {curve: Float32Array.from([1, 2, 3]), oversample: '4x'};
 let node;

 let message =
 'node1 = new WaveShaperNode(, ' + JSON.stringify(options) + ')';
 should(() => {
 node = new WaveShaperNode(context, options);
 }, message).notThrow();
 should(node.curve, 'node1.curve').beEqualToArray(options.curve);
 should(node.oversample, 'node1.oversample')
 .beEqualTo(options.oversample);

 task.done();
 });

 audit.run();
 