
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
 testInvalidConstructor(should, 'DelayNode', context);
 task.done();
 });

 audit.define('default constructor', (task, should) => {
 let prefix = 'node0';
 let node = testDefaultConstructor(should, 'DelayNode', context, {
 prefix: prefix,
 numberOfInputs: 1,
 numberOfOutputs: 1,
 channelCount: 2,
 channelCountMode: 'max',
 channelInterpretation: 'speakers'
 });

 testDefaultAttributes(
 should, node, prefix, [{name: 'delayTime', value: 0}]);

 task.done();
 });

 audit.define('test AudioNodeOptions', (task, should) => {
 testAudioNodeOptions(should, context, 'DelayNode');
 task.done();
 });

 audit.define('constructor options', (task, should) => {
 let node;
 let options = {
 delayTime: 0.5,
 maxDelayTime: 1.5,
 };

 should(
 () => {
 node = new DelayNode(context, options);
 },
 'node1 = new DelayNode(c, ' + JSON.stringify(options) + ')')
 .notThrow();

 should(node.delayTime.value, 'node1.delayTime.value')
 .beEqualTo(options.delayTime);
 should(node.delayTime.maxValue, 'node1.delayTime.maxValue')
 .beEqualTo(options.maxDelayTime);

 task.done();
 });

 audit.run();
 