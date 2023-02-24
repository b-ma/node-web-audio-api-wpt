
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

 let sampleRate = 44100.0;
 // Number of frames that the source will run; fairly arbitrary
 let numberOfFrames = 32;
 // Number of frames to render; arbitrary, but should be larger than
 // numberOfFrames;
 let renderFrames = 16 * numberOfFrames;

 let context = new OfflineAudioContext(1, renderFrames, sampleRate);
 let src = new ConstantSourceNode(context);
 src.connect(context.destination);

 let tester = async_test('ConstantSourceNode onended event fired');

 src.onended = function() {
 tester.step(function() {
 assert_true(true, 'ConstantSourceNode.onended fired');
 });
 tester.done();
 };

 src.start();
 src.stop(numberOfFrames / context.sampleRate);

 context.startRendering();
 