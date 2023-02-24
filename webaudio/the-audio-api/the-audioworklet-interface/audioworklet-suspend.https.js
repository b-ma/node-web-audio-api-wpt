
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
 const context = new AudioContext();
 const filePath = 'processors/dummy-processor.js';

 context.suspend();

 // Suspends the context right away and then activate worklet. The current
 // time must not advance since the context is suspended.
 audit.define(
 {label: 'load-worklet-and-suspend'},
 async (task, should) => {
 await context.audioWorklet.addModule(filePath);
 const suspendTime = context.currentTime;
 const dummy = new AudioWorkletNode(context, 'dummy');
 dummy.connect(context.destination);
 return task.timeout(() => {
 should(context.currentTime === suspendTime,
 'context.currentTime did not change after worklet started')
 .beTrue();
 should(context.state, 'context.state').beEqualTo('suspended');
 }, 500);
 });

 audit.run();
 