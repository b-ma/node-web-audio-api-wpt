
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

 setup(() => {
 let sampleRate = 48000;
 let renderLength = 512;
 let context = new OfflineAudioContext(1, renderLength, sampleRate);

 let filePath = 'processors/timing-info-processor.js';

 audit.define(
 'Check the timing information from AudioWorkletProcessor',
 (task, should) => {
 let portWorkletNode =
 new AudioWorkletNode(context, 'timing-info-processor');
 portWorkletNode.connect(context.destination);

 // Suspend at render quantum boundary and check the timing
 // information between the main thread and the rendering thread.
 [0, 128, 256, 384].map((suspendFrame) => {
 context.suspend(suspendFrame/sampleRate).then(() => {
 portWorkletNode.port.onmessage = (event) => {
 should(event.data.currentFrame,
 'currentFrame from the processor at ' + suspendFrame)
 .beEqualTo(suspendFrame);
 should(event.data.currentTime,
 'currentTime from the processor at '
 + context.currentTime)
 .beEqualTo(context.currentTime);
 context.resume();
 };

 portWorkletNode.port.postMessage('query-timing-info');
 });
 });

 context.startRendering().then(() => {
 task.done();
 });
 });

 context.audioWorklet.addModule(filePath).then(() => {
 audit.run();
 });
 });
 