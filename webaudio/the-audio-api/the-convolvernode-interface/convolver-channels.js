
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
await import(path.join(cwd, '/webaudio/resources/audit-util.js'));
await import(path.join(cwd, '/webaudio/resources/audit.js'));

 let audit = Audit.createTaskRunner();

 audit.define('channel-count-test', (task, should) => {
 // Just need a context to create nodes on, so any allowed length and
 // rate is ok.
 let context = new OfflineAudioContext(1, 1, 48000);

 let success = true;

 for (let count = 1; count <= 32; ++count) {
 let convolver = context.createConvolver();
 let buffer = context.createBuffer(count, 1, context.sampleRate);
 let message = 'ConvolverNode with buffer of ' + count + ' channels';

 if (count == 1 || count == 2 || count == 4) {
 // These are the only valid channel counts for the buffer.
 should(() => convolver.buffer = buffer, message).notThrow();
 } else {
 should(() => convolver.buffer = buffer, message)
 .throw(DOMException, 'NotSupportedError');
 }
 }

 task.done();
 });

 audit.run();
 