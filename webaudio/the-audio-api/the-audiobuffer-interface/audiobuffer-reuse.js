
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

function render_audio_context() {
 let sampleRate = 44100;
 let context = new OfflineAudioContext(
 2, sampleRate * 0.1, sampleRate);
 let buf = context.createBuffer(1, 0.1 * sampleRate, context.sampleRate);
 let data = buf.getChannelData(0);
 data[0] = 0.5;
 data[1] = 0.25;
 let b1 = context.createBufferSource();
 b1.buffer = buf;
 b1.start();
 let b2 = context.createBufferSource();
 b2.buffer = buf;
 b2.start();
 let merger = context.createChannelMerger(2);
 b1.connect(merger, 0, 0);
 b2.connect(merger, 0, 1);
 merger.connect(context.destination);
 return context.startRendering();
}
promise_test(function() {
 return render_audio_context()
 .then(function(buffer) {
 assert_equals(buffer.getChannelData(0)[0], 0.5);
 assert_equals(buffer.getChannelData(1)[0], 0.5);
 assert_equals(buffer.getChannelData(0)[1], 0.25);
 assert_equals(buffer.getChannelData(1)[1], 0.25);
 });
}, "AudioBuffer can be reused between AudioBufferSourceNodes");
