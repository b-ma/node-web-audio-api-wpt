
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

promise_test(function() {
 // sampleRate is a power of two so that time can be represented exactly
 // in double currentTime.
 var context = new OfflineAudioContext(1, 1, 65536);
 return context.startRendering().
 then(function(buffer) {
 assert_equals(buffer.length, 1, "buffer length");
 assert_equals(context.currentTime, 128 / context.sampleRate,
 "currentTime at completion");
 });
});
