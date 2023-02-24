
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
await import('../../resources/audit-util.js');
await import('../../resources/audit.js');
await import('../../resources/start-stop-exceptions.js');

 let context = new AudioContext();

 let audit = Audit.createTaskRunner();

 audit.define('createConstantSource()', (task, should) => {
 let node;
 let prefix = 'Factory method: ';

 should(() => {
 node = context.createConstantSource();
 }, prefix + 'node = context.createConstantSource()').notThrow();
 should(
 node instanceof ConstantSourceNode,
 prefix + 'node instance of ConstantSourceNode')
 .beEqualTo(true);

 verifyNodeDefaults(should, node, prefix);

 task.done();
 });

 audit.define('new ConstantSourceNode()', (task, should) => {
 let node;
 let prefix = 'Constructor: ';

 should(() => {
 node = new ConstantSourceNode(context);
 }, prefix + 'node = new ConstantSourceNode()').notThrow();
 should(
 node instanceof ConstantSourceNode,
 prefix + 'node instance of ConstantSourceNode')
 .beEqualTo(true);


 verifyNodeDefaults(should, node, prefix);

 task.done();
 });

 audit.define('start/stop exceptions', (task, should) => {
 let node = new ConstantSourceNode(context);

 testStartStop(should, node);
 task.done();
 });

 function verifyNodeDefaults(should, node, prefix) {
 should(node.numberOfInputs, prefix + 'node.numberOfInputs')
 .beEqualTo(0);
 should(node.numberOfOutputs, prefix + 'node.numberOfOutputs')
 .beEqualTo(1);
 should(node.channelCount, prefix + 'node.channelCount').beEqualTo(2);
 should(node.channelCountMode, prefix + 'node.channelCountMode')
 .beEqualTo('max');
 should(
 node.channelInterpretation, prefix + 'node.channelInterpretation')
 .beEqualTo('speakers');

 should(node.offset.value, prefix + 'node.offset.value').beEqualTo(1);
 should(node.offset.defaultValue, prefix + 'node.offset.defaultValue')
 .beEqualTo(1);
 should(node.offset.minValue, prefix + 'node.offset.minValue')
 .beEqualTo(Math.fround(-3.4028235e38));
 should(node.offset.maxValue, prefix + 'node.offset.maxValue')
 .beEqualTo(Math.fround(3.4028235e38));
 }

 audit.run();
 