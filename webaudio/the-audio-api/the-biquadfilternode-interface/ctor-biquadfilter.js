
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

 audit.define('invalid constructor', (task, should) => {
 testInvalidConstructor(should, 'BiquadFilterNode', context);
 task.done();
 });

 audit.define('default constructor', (task, should) => {
 let prefix = 'node0';
 let node = testDefaultConstructor(should, 'BiquadFilterNode', context, {
 prefix: prefix,
 numberOfInputs: 1,
 numberOfOutputs: 1,
 channelCount: 2,
 channelCountMode: 'max',
 channelInterpretation: 'speakers'
 });

 testDefaultAttributes(should, node, prefix, [
 {name: 'type', value: 'lowpass'}, {name: 'Q', value: 1},
 {name: 'detune', value: 0}, {name: 'frequency', value: 350},
 {name: 'gain', value: 0.0}
 ]);

 task.done();
 });

 audit.define('test AudioNodeOptions', (task, should) => {
 testAudioNodeOptions(should, context, 'BiquadFilterNode');
 task.done();
 });

 audit.define('construct with options', (task, should) => {
 let node;
 let options = {
 type: 'highpass',
 frequency: 512,
 detune: 1,
 Q: 5,
 gain: 3,
 };

 should(
 () => {
 node = new BiquadFilterNode(context, options);
 },
 'node = new BiquadFilterNode(..., ' + JSON.stringify(options) + ')')
 .notThrow();

 // Test that attributes are set according to the option values.
 should(node.type, 'node.type').beEqualTo(options.type);
 should(node.frequency.value, 'node.frequency.value')
 .beEqualTo(options.frequency);
 should(node.detune.value, 'node.detuen.value')
 .beEqualTo(options.detune);
 should(node.Q.value, 'node.Q.value').beEqualTo(options.Q);
 should(node.gain.value, 'node.gain.value').beEqualTo(options.gain);

 task.done();
 });

 audit.run();
 