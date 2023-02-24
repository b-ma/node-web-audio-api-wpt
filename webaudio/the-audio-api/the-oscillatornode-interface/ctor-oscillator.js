
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
 testInvalidConstructor(should, 'OscillatorNode', context);
 task.done();
 });

 audit.define('default constructor', (task, should) => {
 let prefix = 'node0';
 let node = testDefaultConstructor(should, 'OscillatorNode', context, {
 prefix: prefix,
 numberOfInputs: 0,
 numberOfOutputs: 1,
 channelCount: 2,
 channelCountMode: 'max',
 channelInterpretation: 'speakers'
 });

 testDefaultAttributes(
 should, node, prefix,
 [{name: 'type', value: 'sine'}, {name: 'frequency', value: 440}]);

 task.done();
 });

 audit.define('test AudioNodeOptions', (task, should) => {
 testAudioNodeOptions(should, context, 'OscillatorNode');
 task.done();
 });

 audit.define('constructor options', (task, should) => {
 let node;
 let options = {type: 'sawtooth', detune: 7, frequency: 918};

 should(
 () => {
 node = new OscillatorNode(context, options);
 },
 'node1 = new OscillatorNode(c, ' + JSON.stringify(options) + ')')
 .notThrow();

 should(node.type, 'node1.type').beEqualTo(options.type);
 should(node.detune.value, 'node1.detune.value')
 .beEqualTo(options.detune);
 should(node.frequency.value, 'node1.frequency.value')
 .beEqualTo(options.frequency);

 should(node.channelCount, 'node1.channelCount').beEqualTo(2);
 should(node.channelCountMode, 'node1.channelCountMode')
 .beEqualTo('max');
 should(node.channelInterpretation, 'node1.channelInterpretation')
 .beEqualTo('speakers');

 // Test that type and periodicWave options work as described.
 options = {
 type: 'sine',
 periodicWave: new PeriodicWave(context, {real: [1, 1]})
 };
 should(() => {
 node = new OscillatorNode(context, options);
 }, 'new OscillatorNode(c, ' + JSON.stringify(options) + ')').notThrow();

 options = {type: 'custom'};
 should(
 () => {
 node = new OscillatorNode(context, options);
 },
 'new OscillatorNode(c, ' + JSON.stringify(options) + ')')
 .throw(DOMException, 'InvalidStateError');

 options = {
 type: 'custom',
 periodicWave: new PeriodicWave(context, {real: [1, 1]})
 };
 should(() => {
 node = new OscillatorNode(context, options);
 }, 'new OscillatorNode(c, ' + JSON.stringify(options) + ')').notThrow();

 should(
 () => {
 node = new OscillatorNode(context, {periodicWave: null});
 },
 'new OscillatorNode(c, {periodicWave: null}')
 .throw(DOMException, 'TypeError');
 task.done();
 });

 audit.run();
 