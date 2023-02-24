
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
 testInvalidConstructor(should, 'GainNode', context);
 task.done();
 });

 audit.define('default constructor', (task, should) => {
 let prefix = 'node0';
 let node = testDefaultConstructor(should, 'GainNode', context, {
 prefix: prefix,
 numberOfInputs: 1,
 numberOfOutputs: 1,
 channelCount: 2,
 channelCountMode: 'max',
 channelInterpretation: 'speakers'
 });

 testDefaultAttributes(should, node, prefix, [{name: 'gain', value: 1}]);

 task.done();
 });

 audit.define('test AudioNodeOptions', (task, should) => {
 testAudioNodeOptions(should, context, 'GainNode');
 task.done();
 });

 audit.define('constructor with options', (task, should) => {
 let node;
 let options = {
 gain: -2,
 };

 should(
 () => {
 node = new GainNode(context, options);
 },
 'node1 = new GainNode(c, ' + JSON.stringify(options) + ')')
 .notThrow();
 should(node instanceof GainNode, 'node1 instanceof GainNode')
 .beEqualTo(true);

 should(node.gain.value, 'node1.gain.value').beEqualTo(options.gain);

 should(node.channelCount, 'node1.channelCount').beEqualTo(2);
 should(node.channelCountMode, 'node1.channelCountMode')
 .beEqualTo('max');
 should(node.channelInterpretation, 'node1.channelInterpretation')
 .beEqualTo('speakers');

 task.done();
 });

 audit.run();
 