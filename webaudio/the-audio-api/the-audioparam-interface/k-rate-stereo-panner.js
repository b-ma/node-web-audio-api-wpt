
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
await import('automation-rate-testing.js');

 let audit = Audit.createTaskRunner();

 audit.define('Test k-rate StereoPannerNode', (task, should) => {
 // Arbitrary sample rate and duration.
 let sampleRate = 8000;
 let testDuration = 1;
 let context = new OfflineAudioContext({
 numberOfChannels: 3,
 sampleRate: sampleRate,
 length: testDuration * sampleRate
 });

 doTest(context, should, {
 nodeName: 'StereoPannerNode',
 nodeOptions: null,
 prefix: 'StereoPannerNode',
 // Set all AudioParams to k-rate.
 rateSettings: [{name: 'pan', value: 'k-rate'}],
 // Automate just the frequency.
 automations: [{
 name: 'pan',
 methods: [
 {name: 'setValueAtTime', options: [0, 0]}, {
 name: 'linearRampToValueAtTime',
 options: [.5, testDuration]
 }
 ]
 }]
 }).then(() => task.done());
 });

 audit.run();
 