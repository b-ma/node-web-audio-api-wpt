
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
 const filePath = 'processors/zero-outputs-check-processor.js';
 const context = new AudioContext();

 // Test if the incoming arrays are frozen as expected.
 audit.define('check-zero-outputs', (task, should) => {
 context.audioWorklet.addModule(filePath).then(() => {
 const workletNode =
 new AudioWorkletNode(context, 'zero-outputs-check-processor');
 workletNode.port.onmessage = (message) => {
 const actual = message.data;
 if (actual.type === 'assertion') {
 should(actual.success, actual.message).beTrue();
 task.done();
 }
 };
 });
 });

 audit.run();
 