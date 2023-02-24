
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
await import(path.join(cwd, '/webaudio/resources/audioparam-testing.js'));

 let sampleRate = 48000;
 let renderDuration = 0.5;

 let audit = Audit.createTaskRunner();

 audit.define('buffer-eq', (task, should) => {
 // Verify that successive calls to getChannelData return the same
 // buffer.
 let context = new AudioContext();
 let channelCount = 2;
 let frameLength = 1000;
 let buffer =
 context.createBuffer(channelCount, frameLength, context.sampleRate);

 for (let c = 0; c < channelCount; ++c) {
 let a = buffer.getChannelData(c);
 let b = buffer.getChannelData(c);

 let message = 'buffer.getChannelData(' + c + ')';
 should(a === b, message + ' === ' + message).beEqualTo(true);
 }

 task.done();
 });

 audit.define('buffer-not-eq', (task, should) => {
 let context = new AudioContext();
 let channelCount = 2;
 let frameLength = 1000;
 let buffer1 =
 context.createBuffer(channelCount, frameLength, context.sampleRate);
 let buffer2 =
 context.createBuffer(channelCount, frameLength, context.sampleRate);
 let success = true;

 for (let c = 0; c < channelCount; ++c) {
 let a = buffer1.getChannelData(c);
 let b = buffer2.getChannelData(c);

 let message = 'getChannelData(' + c + ')';
 should(a === b, 'buffer1.' + message + ' === buffer2.' + message)
 .beEqualTo(false) &&
 success;
 }

 task.done();
 });

 audit.run();
 