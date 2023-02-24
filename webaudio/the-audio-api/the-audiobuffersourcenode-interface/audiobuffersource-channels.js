
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
 let context;
 let source;

 audit.define(
 {
 label: 'validate .buffer',
 description:
 'Validatation of AudioBuffer in .buffer attribute setter'
 },
 function(task, should) {
 context = new AudioContext();
 source = context.createBufferSource();

 // Make sure we can't set to something which isn't an AudioBuffer.
 should(function() {
 source.buffer = 57;
 }, 'source.buffer = 57').throw(TypeError);

 // It's ok to set the buffer to null.
 should(function() {
 source.buffer = null;
 }, 'source.buffer = null').notThrow();

 // Set the buffer to a valid AudioBuffer
 let buffer =
 new AudioBuffer({length: 128, sampleRate: context.sampleRate});

 should(function() {
 source.buffer = buffer;
 }, 'source.buffer = buffer').notThrow();

 // The buffer has been set; we can't set it again.
 should(function() {
 source.buffer =
 new AudioBuffer({length: 128, sampleRate: context.sampleRate})
 }, 'source.buffer = new buffer').throw(DOMException, 'InvalidStateError');

 // The buffer has been set; it's ok to set it to null.
 should(function() {
 source.buffer = null;
 }, 'source.buffer = null again').notThrow();

 // The buffer was already set (and set to null). Can't set it
 // again.
 should(function() {
 source.buffer = buffer;
 }, 'source.buffer = buffer again').throw(DOMException, 'InvalidStateError');

 // But setting to null is ok.
 should(function() {
 }, 'source.buffer = null after setting to null').notThrow();

 // Check that mono buffer can be set.
 should(function() {
 let monoBuffer =
 context.createBuffer(1, 1024, context.sampleRate);
 let testSource = context.createBufferSource();
 testSource.buffer = monoBuffer;
 }, 'Setting source with mono buffer').notThrow();

 // Check that stereo buffer can be set.
 should(function() {
 let stereoBuffer =
 context.createBuffer(2, 1024, context.sampleRate);
 let testSource = context.createBufferSource();
 testSource.buffer = stereoBuffer;
 }, 'Setting source with stereo buffer').notThrow();

 // Check buffers with more than two channels.
 for (let i = 3; i < 10; ++i) {
 should(function() {
 let buffer = context.createBuffer(i, 1024, context.sampleRate);
 let testSource = context.createBufferSource();
 testSource.buffer = buffer;
 }, 'Setting source with ' + i + ' channels buffer').notThrow();
 }
 task.done();
 });

 audit.run();
 