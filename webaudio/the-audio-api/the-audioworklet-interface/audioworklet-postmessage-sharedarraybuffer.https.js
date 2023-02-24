
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

 let audit = Audit.createTaskRunner();

 let context = new AudioContext();

 let filePath = 'processors/sharedarraybuffer-processor.js';

 audit.define(
 'Test postMessage from AudioWorkletProcessor to AudioWorkletNode',
 (task, should) => {
 let workletNode =
 new AudioWorkletNode(context, 'sharedarraybuffer-processor');

 // After it is created, the worklet will send a new
 // SharedArrayBuffer to the main thread.
 //
 // The worklet will then wait to receive a message from the main
 // thread.
 //
 // When it receives the message, it will check whether it is a
 // SharedArrayBuffer, and send this information back to the main
 // thread.

 workletNode.port.onmessage = (event) => {
 let data = event.data;
 switch (data.state) {
 case 'created':
 should(
 data.sab instanceof SharedArrayBuffer,
 'event.data.sab from worklet is an instance of SharedArrayBuffer')
 .beTrue();

 // Send a SharedArrayBuffer back to the worklet.
 let sab = new SharedArrayBuffer(8);
 workletNode.port.postMessage(sab);
 break;

 case 'received message':
 should(data.isSab, 'event.data from main thread is an instance of SharedArrayBuffer')
 .beTrue();
 task.done();
 break;

 default:
 should(false,
 `Got unexpected message from worklet: ${data.state}`)
 .beTrue();
 task.done();
 break;
 }
 };

 workletNode.port.onmessageerror = (event) => {
 should(false, 'Got messageerror from worklet').beTrue();
 task.done();
 };
 });

 context.audioWorklet.addModule(filePath).then(() => {
 audit.run();
 });
 