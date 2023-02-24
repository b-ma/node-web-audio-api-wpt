
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

 let sampleRate = 44100.0
 let lengthInSeconds = 2;
 let numberOfChannels = 4;

 let audit = Audit.createTaskRunner();

 audit.define('Basic tests for AudioBuffer', function(task, should) {
 let context = new AudioContext();
 let buffer = context.createBuffer(
 numberOfChannels, sampleRate * lengthInSeconds, sampleRate);

 // Just for printing out a message describing what "buffer" is in the
 // following tests.
 should(
 true,
 'buffer = context.createBuffer(' + numberOfChannels + ', ' +
 (sampleRate * lengthInSeconds) + ', ' + sampleRate + ')')
 .beTrue();

 should(buffer.sampleRate, 'buffer.sampleRate').beEqualTo(sampleRate);

 should(buffer.length, 'buffer.length')
 .beEqualTo(sampleRate * lengthInSeconds);

 should(buffer.duration, 'buffer.duration').beEqualTo(lengthInSeconds);

 should(buffer.numberOfChannels, 'buffer.numberOfChannels')
 .beEqualTo(numberOfChannels);

 for (let index = 0; index < buffer.numberOfChannels; ++index) {
 should(
 buffer.getChannelData(index) instanceof globalThis.Float32Array,
 'buffer.getChannelData(' + index +
 ') instanceof globalThis.Float32Array')
 .beTrue();
 }

 should(
 function() {
 buffer.getChannelData(buffer.numberOfChannels);
 },
 'buffer.getChannelData(' + buffer.numberOfChannels + ')')
 .throw(DOMException, 'IndexSizeError');

 let buffer2 = context.createBuffer(1, 1000, 24576);
 let expectedDuration = 1000 / 24576;

 should(
 buffer2.duration, 'context.createBuffer(1, 1000, 24576).duration')
 .beEqualTo(expectedDuration);

 task.done();
 });

 audit.run();
 