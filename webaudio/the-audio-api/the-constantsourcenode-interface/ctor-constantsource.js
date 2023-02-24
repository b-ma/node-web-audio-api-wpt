
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
 testInvalidConstructor(should, 'ConstantSourceNode', context);
 task.done();
 });

 audit.define('default constructor', (task, should) => {
 let prefix = 'node0';
 let node =
 testDefaultConstructor(should, 'ConstantSourceNode', context, {
 prefix: prefix,
 numberOfInputs: 0,
 numberOfOutputs: 1,
 channelCount: 2,
 channelCountMode: 'max',
 channelInterpretation: 'speakers'
 });

 testDefaultAttributes(
 should, node, prefix, [{name: 'offset', value: 1}]);

 task.done();
 });

 audit.run();
 