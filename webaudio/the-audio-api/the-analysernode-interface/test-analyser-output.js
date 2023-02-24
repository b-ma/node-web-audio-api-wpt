
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
await import(path.join(cwd, '/webaudio/js/helpers.js'));

setup({ single_test: true });

var gTest = {
 length: 2048,
 numberOfChannels: 1,
 createGraph: function(context) {
 var source = context.createBufferSource();

 var analyser = context.createAnalyser();

 source.buffer = this.buffer;

 source.connect(analyser);

 source.start(0);
 return analyser;
 },
 createExpectedBuffers: function(context) {
 this.buffer = context.createBuffer(1, 2048, context.sampleRate);
 for (var i = 0; i < 2048; ++i) {
 this.buffer.getChannelData(0)[i] = Math.sin(
 440 * 2 * Math.PI * i / context.sampleRate
 );
 }

 return [this.buffer];
 }
};

runTest("AnalyserNode output");
 