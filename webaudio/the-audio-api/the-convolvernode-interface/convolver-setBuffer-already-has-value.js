
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
await import(path.join(cwd, '/webaudio/resources/audit.js'));

 let audit = Audit.createTaskRunner();

 audit.define('test', (task, should) => {
 let context = new AudioContext();
 let audioBuffer = new AudioBuffer(
 {numberOfChannels: 1, length: 1, sampleRate: context.sampleRate});
 let convolver = context.createConvolver();
 should(() => {
 convolver.buffer = null;
 }, 'Set buffer to null before set non-null').notThrow();

 should(() => {
 convolver.buffer = audioBuffer;
 }, 'Set buffer first normally').notThrow();

 should(() => {
 convolver.buffer = audioBuffer;
 }, 'Set buffer a second time').notThrow();

 should(() => {
 convolver.buffer = null;
 }, 'Set buffer to null').notThrow();

 should(() => {
 convolver.buffer = null;
 }, 'Set buffer to null again, to make sure').notThrow();

 should(() => {
 convolver.buffer = audioBuffer;
 }, 'Set buffer to non-null to verify it is set')
 .notThrow();

 task.done();
 });

 audit.run();
 