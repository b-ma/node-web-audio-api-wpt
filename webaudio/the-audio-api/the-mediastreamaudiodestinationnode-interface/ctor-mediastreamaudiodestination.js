
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

 let context = new AudioContext();

 let audit = Audit.createTaskRunner();

 audit.define('initialize', (task, should) => {
 // Need AudioContext, not OfflineAudioContext, for these tests.
 should(() => {
 context = new AudioContext();
 }, 'context = new AudioContext()').notThrow();
 task.done();
 });

 audit.define('invalid constructor', (task, should) => {
 testInvalidConstructor(
 should, 'MediaStreamAudioDestinationNode', context);
 task.done();
 });

 audit.define('default constructor', (task, should) => {
 let prefix = 'node0';
 let node = testDefaultConstructor(
 should, 'MediaStreamAudioDestinationNode', context, {
 prefix: prefix,
 numberOfInputs: 1,
 numberOfOutputs: 0,
 channelCount: 2,
 channelCountMode: 'explicit',
 channelInterpretation: 'speakers'
 });

 testDefaultAttributes(should, node, prefix, []);

 task.done();
 });

 audit.define('test AudioNodeOptions', (task, should) => {
 testAudioNodeOptions(
 should, context, 'MediaStreamAudioDestinationNode', {
 channelCount: {
 // An arbitrary but valid, non-default count for this node.
 value: 7
 }
 });
 task.done();
 });

 audit.run();
 