
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
await import(path.join(cwd, '/webaudio/resources/start-stop-exceptions.js'));

 let sampleRate = 44100;
 let renderLengthSeconds = 0.25;

 let oscTypes = ['sine', 'square', 'sawtooth', 'triangle', 'custom'];

 let audit = Audit.createTaskRunner();

 audit.define('start/stop exceptions', (task, should) => {
 // We're not going to render anything, so make it simple
 let context = new OfflineAudioContext(1, 1, sampleRate);
 let node = new AudioBufferSourceNode(context);

 testStartStop(should, node, [
 {args: [0, -1], errorType: RangeError},
 {args: [0, 0, -1], errorType: RangeError}
 ]);
 task.done();
 });

 audit.run();
 