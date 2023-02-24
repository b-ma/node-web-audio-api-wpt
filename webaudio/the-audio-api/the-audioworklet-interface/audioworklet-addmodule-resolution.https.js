
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
 let realtimeContext = new AudioContext();
 let offlineContext = new OfflineAudioContext(1, sampleRate, sampleRate);

 let filePath = 'processors/dummy-processor.js';

 // Test if the browser does not crash upon addModule() call after the
 // realtime context construction.
 audit.define(
 {label: 'module-loading-after-realtime-context-creation'},
 (task, should) => {
 let dummyWorkletNode =
 new AudioWorkletNode(realtimeContext, 'dummy');
 dummyWorkletNode.connect(realtimeContext.destination);
 should(dummyWorkletNode instanceof AudioWorkletNode,
 '"dummyWorkletNode" is an instance of AudioWorkletNode ' +
 'from realtime context')
 .beTrue();
 task.done();
 });

 // Test if the browser does not crash upon addModule() call after the
 // offline context construction.
 audit.define(
 {label: 'module-loading-after-offline-context-creation'},
 (task, should) => {
 let dummyWorkletNode =
 new AudioWorkletNode(offlineContext, 'dummy');
 dummyWorkletNode.connect(offlineContext.destination);
 should(dummyWorkletNode instanceof AudioWorkletNode,
 '"dummyWorkletNode" is an instance of AudioWorkletNode ' +
 'from offline context')
 .beTrue();
 task.done();
 });

 Promise.all([
 realtimeContext.audioWorklet.addModule(filePath),
 offlineContext.audioWorklet.addModule(filePath)
 ]).then(() => {
 audit.run();
 });
 });
 