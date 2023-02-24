
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

 let realtimeContext = new AudioContext();
 let offlineContext = new OfflineAudioContext(1, 1, 44100);

 // Test if AudioWorklet exists.
 audit.define('Test if AudioWorklet exists', (task, should) => {
 should(realtimeContext.audioWorklet instanceof AudioWorklet &&
 offlineContext.audioWorklet instanceof AudioWorklet,
 'BaseAudioContext.audioWorklet is an instance of AudioWorklet')
 .beTrue();
 task.done();
 });

 audit.run();
 