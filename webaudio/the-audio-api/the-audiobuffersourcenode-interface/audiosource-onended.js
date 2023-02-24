
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

 let sampleRate = 44100;
 let renderLengthSeconds = 1;
 let renderLengthFrames = renderLengthSeconds * sampleRate;

 // Length of the source buffer. Anything less than the render length is
 // fine.
 let sourceBufferLengthFrames = renderLengthFrames / 8;
 // When to stop the oscillator. Anything less than the render time is
 // fine.
 let stopTime = renderLengthSeconds / 8;

 let audit = Audit.createTaskRunner();

 audit.define('absn-set-onended', (task, should) => {
 // Test that the onended event for an AudioBufferSourceNode is fired
 // when it is set directly.
 let context =
 new OfflineAudioContext(1, renderLengthFrames, sampleRate);
 let buffer = context.createBuffer(
 1, sourceBufferLengthFrames, context.sampleRate);
 let source = context.createBufferSource();
 source.buffer = buffer;
 source.connect(context.destination);
 source.onended = function(e) {
 should(
 true, 'AudioBufferSource.onended called when ended set directly')
 .beEqualTo(true);
 };
 source.start();
 context.startRendering().then(() => task.done());
 });

 audit.define('absn-add-listener', (task, should) => {
 // Test that the onended event for an AudioBufferSourceNode is fired
 // when addEventListener is used to set the handler.
 let context =
 new OfflineAudioContext(1, renderLengthFrames, sampleRate);
 let buffer = context.createBuffer(
 1, sourceBufferLengthFrames, context.sampleRate);
 let source = context.createBufferSource();
 source.buffer = buffer;
 source.connect(context.destination);
 source.addEventListener('ended', function(e) {
 should(
 true,
 'AudioBufferSource.onended called when using addEventListener')
 .beEqualTo(true);
 });
 source.start();
 context.startRendering().then(() => task.done());
 });

 audit.define('osc-set-onended', (task, should) => {
 // Test that the onended event for an OscillatorNode is fired when it is
 // set directly.
 let context =
 new OfflineAudioContext(1, renderLengthFrames, sampleRate);
 let source = context.createOscillator();
 source.connect(context.destination);
 source.onended = function(e) {
 should(true, 'Oscillator.onended called when ended set directly')
 .beEqualTo(true);
 };
 source.start();
 source.stop(stopTime);
 context.startRendering().then(() => task.done());
 });

 audit.define('osc-add-listener', (task, should) => {
 // Test that the onended event for an OscillatorNode is fired when
 // addEventListener is used to set the handler.
 let context =
 new OfflineAudioContext(1, renderLengthFrames, sampleRate);
 let source = context.createOscillator();
 source.connect(context.destination);
 source.addEventListener('ended', function(e) {
 should(true, 'Oscillator.onended called when using addEventListener')
 .beEqualTo(true);
 });
 source.start();
 source.stop(stopTime);
 context.startRendering().then(() => task.done());
 });

 audit.run();
 