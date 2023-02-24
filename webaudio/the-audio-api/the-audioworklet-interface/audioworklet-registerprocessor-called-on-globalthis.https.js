
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
 const realtimeContext = new AudioContext();
 const filePath = 'processors/dummy-processor-globalthis.js';

 audit.define('registerprocessor-called-on-globalthis', (task, should) => {
 realtimeContext.audioWorklet.addModule(filePath).then(() => {
 const dummyWorkletNode = new AudioWorkletNode(realtimeContext, 'dummy-globalthis');
 should(dummyWorkletNode instanceof AudioWorkletNode,
 '"dummyWorkletNode" is an instance of AudioWorkletNode').beTrue();
 task.done();
 });
 });

 audit.run();
 