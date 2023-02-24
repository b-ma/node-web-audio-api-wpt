
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
await import(path.join(cwd, '/webaudio/resources/audit.js'));

 const audit = Audit.createTaskRunner();
 const filePath = 'processors/array-check-processor.js';
 const context = new AudioContext();

 // Test if the incoming arrays are frozen as expected.
 audit.define('check-frozen-array', (task, should) => {
 context.audioWorklet.addModule(filePath).then(() => {
 const workletNode =
 new AudioWorkletNode(context, 'array-frozen-processor');
 workletNode.port.onmessage = (message) => {
 const actual = message.data;
 should(actual.isInputFrozen, '|inputs| is frozen').beTrue();
 should(actual.isOutputFrozen, '|outputs| is frozen').beTrue();
 task.done();
 };
 });
 });

 // The incoming arrays should not be transferred, but the associated
 // ArrayBuffers can be transferred. See the `array-transfer-processor`
 // definition for the details.
 audit.define('transfer-frozen-array', (task, should) => {
 const sourceNode = new ConstantSourceNode(context);
 const workletNode =
 new AudioWorkletNode(context, 'array-transfer-processor');
 workletNode.port.onmessage = (message) => {
 const actual = message.data;
 if (actual.type === 'assertion')
 should(actual.success, actual.message).beTrue();
 if (actual.done)
 task.done();
 };
 sourceNode.connect(workletNode);
 sourceNode.start();
 });

 audit.run();
 