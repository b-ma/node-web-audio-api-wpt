
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

 const filePath = 'processors/error-processor.js';
 const sampleRate = 48000;
 const renderLength = sampleRate * 0.1;
 const context = new OfflineAudioContext(1, renderLength, sampleRate);

 // Test |onprocessorerror| called upon failure of processor constructor.
 audit.define('constructor-error', (task, should) => {
 const constructorErrorWorkletNode =
 new AudioWorkletNode(context, 'constructor-error');
 constructorErrorWorkletNode.onprocessorerror = (error) => {
 should(error instanceof ErrorEvent,
 `onprocessorerror argument should be an ErrorEvent when
 the constructor of AudioWorkletProcessor has an error.`)
 .beTrue();

 // Without 'processorerror' event callback, this test will be
 // timed out.
 task.done();
 };
 });

 // Test |onprocessorerror| called upon failure of process() method.
 audit.define('process-error', (task, should) => {
 const processErrorWorkletNode =
 new AudioWorkletNode(context, 'process-error');
 processErrorWorkletNode.onprocessorerror = (error) => {
 should(error instanceof ErrorEvent,
 `onprocessorerror argument should be an ErrorEvent when
 the process method of the AudioWorkletProcessor method
 has an error.`)
 .beTrue();

 // Without 'processorerror' event callback, this test will be
 // timed out.
 task.done();
 };

 context.startRendering();
 });

 // 'error-processor.js' contains 2 class definitions represents an error
 // in the constructor and an error in the process method respectively.
 context.audioWorklet.addModule(filePath).then(() => audit.run());
 