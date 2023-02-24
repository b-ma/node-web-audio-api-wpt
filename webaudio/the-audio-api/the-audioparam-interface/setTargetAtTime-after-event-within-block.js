
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
 const bufferSize = 179;
 const valueStartOffset = 42;
 const targetStartOffset = 53;
 const sampleRate = 48000;
 const scheduledValue = -0.5;

 var context = new OfflineAudioContext(1, bufferSize, sampleRate);

 var gain = context.createGain();
 gain.gain.setValueAtTime(scheduledValue, valueStartOffset/sampleRate);
 gain.gain.setTargetAtTime(scheduledValue, targetStartOffset/sampleRate,
 128/sampleRate);
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
 for (; i < valueStartOffset; ++i) {
 // "Its default value is 1."
 assert_equals(output[i], 1.0, "default gain at sample " + i);
 }
 for (; i < buffer.length; ++i) {
 // "If the next event (having time T1) after this SetValue event is
 // not of type LinearRampToValue or ExponentialRampToValue, then, for
 // T0≤tT1: v(t)=V".
 // "Start exponentially approaching the target value at the given time
 // with a rate having the given time constant."
 // The target is the same value, and so the SetValue value continues.
 assert_equals(output[i], scheduledValue,
 "scheduled value at sample " + i);
 }
 });
});
