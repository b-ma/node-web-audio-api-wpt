
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

 let filePath = 'processors/port-processor.js';

 // Creates an AudioWorkletNode and sets an EventHandler on MessagePort
 // object. The associated PortProcessor will post a message upon its
 // construction. Test if the message is received correctly.
 audit.define(
 'Test postMessage from AudioWorkletProcessor to AudioWorkletNode',
 (task, should) => {
 let porterWorkletNode =
 new AudioWorkletNode(context, 'port-processor');

 // Upon the creation of PortProcessor, it will post a message to the
 // node with 'created' status.
 porterWorkletNode.port.onmessage = (event) => {
 should(event.data.state,
 'The initial message from PortProcessor')
 .beEqualTo('created');
 task.done();
 };
 });

 // PortProcessor is supposed to echo the message back to the
 // AudioWorkletNode.
 audit.define(
 'Test postMessage from AudioWorkletNode to AudioWorkletProcessor',
 (task, should) => {
 let porterWorkletNode =
 new AudioWorkletNode(context, 'port-processor');

 porterWorkletNode.port.onmessage = (event) => {
 // Ignore if the delivered message has |state|. This is already
 // tested in the previous task.
 if (event.data.state)
 return;

 should(event.data.message,
 'The response from PortProcessor')
 .beEqualTo('hello');
 task.done();
 };

 porterWorkletNode.port.postMessage('hello');
 });

 context.audioWorklet.addModule(filePath).then(() => {
 audit.run();
 });
 