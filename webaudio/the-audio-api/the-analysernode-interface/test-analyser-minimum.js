
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

 setup({ single_test: true });
 var ac = new AudioContext();
 var analyser = ac.createAnalyser();
 var constant = ac.createConstantSource();
 var sp = ac.createScriptProcessor(2048, 1, 1);

 constant.offset.value = 0.0;

 constant.connect(analyser).connect(ac.destination);

 constant.connect(sp).connect(ac.destination);

 var buf = new Float32Array(analyser.frequencyBinCount);
 var iteration_count = 10;
 sp.onaudioprocess = function() {
 analyser.getFloatFrequencyData(buf);
 var correct = true;
 for (var i = 0; i < buf.length; i++) {
 correct &= buf[i] == -Infinity;
 }
 assert_true(!!correct, "silent input process -Infinity in decibel bins");
 if (!iteration_count--) {
 sp.onaudioprocess = null;
 constant.stop();
 ac.close();
 done();
 }
 };

 constant.start();
 