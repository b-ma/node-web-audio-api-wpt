
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
 testInvalidConstructor(should, 'ChannelSplitterNode', context);
 task.done();
 });

 audit.define('default constructor', (task, should) => {
 testDefaultConstructor(should, 'ChannelSplitterNode', context, {
 prefix: 'node0',
 numberOfInputs: 1,
 numberOfOutputs: 6,
 channelCount: 6,
 channelCountMode: 'explicit',
 channelInterpretation: 'discrete'
 });

 task.done();
 });

 audit.define('test AudioNodeOptions', (task, should) => {
 testAudioNodeOptions(should, context, 'ChannelSplitterNode', {
 channelCount: {
 value: 6,
 isFixed: true,
 exceptionType: 'InvalidStateError'
 },
 channelCountMode: {
 value: 'explicit',
 isFixed: true,
 exceptionType: 'InvalidStateError'
 },
 channelInterpretation: {
 value: 'discrete',
 isFixed: true,
 exceptionType: 'InvalidStateError'
 },
 });
 task.done();
 });

 audit.define('constructor options', (task, should) => {
 let node;
 let options = {
 numberOfInputs: 3,
 numberOfOutputs: 9,
 channelInterpretation: 'discrete'
 };

 should(
 () => {
 node = new ChannelSplitterNode(context, options);
 },
 'node1 = new ChannelSplitterNode(context, ' +
 JSON.stringify(options) + ')')
 .notThrow();

 should(node.numberOfInputs, 'node1.numberOfInputs').beEqualTo(1);
 should(node.numberOfOutputs, 'node1.numberOfOutputs')
 .beEqualTo(options.numberOfOutputs);
 should(node.channelInterpretation, 'node1.channelInterpretation')
 .beEqualTo(options.channelInterpretation);

 options = {numberOfOutputs: 99};
 should(
 () => {
 node = new ChannelSplitterNode(context, options);
 },
 'new ChannelSplitterNode(c, ' + JSON.stringify(options) + ')')
 .throw(DOMException, 'IndexSizeError');

 options = {channelCount: 3};
 should(
 () => {
 node = new ChannelSplitterNode(context, options);
 },
 'new ChannelSplitterNode(c, ' + JSON.stringify(options) + ')')
 .throw(DOMException, 'InvalidStateError');

 options = {channelCountMode: 'max'};
 should(
 () => {
 node = new ChannelSplitterNode(context, options);
 },
 'new ChannelSplitterNode(c, ' + JSON.stringify(options) + ')')
 .throw(DOMException, 'InvalidStateError');

 task.done();
 });

 audit.run();
 