
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
 const bufferSize = 200;
 const offset = 65;
 const sampleRate = 48000;
 const scheduledValue = -2.0;

 var context = new OfflineAudioContext(1, bufferSize, sampleRate);

 var gain = context.createGain();
 gain.gain.setValueAtTime(scheduledValue, offset/sampleRate);
 gain.connect(context.destination);

 // Apply unit DC signal to gain node.
 var source = context.createBufferSource();
 source.buffer =
 function() {
 var buffer = context.createBuffer(1, 1, context.sampleRate);
 buffer.getChannelData(0)[0] = 1.0;
 return buffer;
 }();
 source.loop = true;
 source.start();
 source.connect(gain);

 return context.startRendering().
 then(function(buffer) {
 assert_equals(buffer.length, bufferSize, "output buffer length");
 var output = buffer.getChannelData(0);
 var i = 0;
 for (; i < offset; ++i) {
 // "Its default value is 1."
 assert_equals(output[i], 1.0, "default gain at sample " + i);
 }
 for (; i < buffer.length; ++i) {
 // "If there are no more events after this SetValue event, then for
 // t≥T0, v(t)=V, where T0 is the startTime parameter and V is the
 // value parameter."
 assert_equals(output[i], scheduledValue,
 "scheduled value at sample " + i);
 }
 });
});
