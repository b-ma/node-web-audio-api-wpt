
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

 audit.define(
 {task: 'BiquadFilter-0', label: 'Biquad k-rate AudioParams (all)'},
 (task, should) => {
 // Arbitrary sample rate and duration.
 let sampleRate = 8000;
 let testDuration = 1;
 let context = new OfflineAudioContext({
 numberOfChannels: 3,
 sampleRate: sampleRate,
 length: testDuration * sampleRate
 });

 doTest(context, should, {
 nodeName: 'BiquadFilterNode',
 nodeOptions: {type: 'lowpass'},
 prefix: 'All k-rate params',
 // Set all AudioParams to k-rate
 rateSettings: [
 {name: 'Q', value: 'k-rate'},
 {name: 'detune', value: 'k-rate'},
 {name: 'frequency', value: 'k-rate'},
 {name: 'gain', value: 'k-rate'},
 ],
 // Automate just the frequency
 automations: [{
 name: 'frequency',
 methods: [
 {name: 'setValueAtTime', options: [350, 0]}, {
 name: 'linearRampToValueAtTime',
 options: [0, testDuration]
 }
 ]
 }]
 }).then(() => task.done());
 });

 // Define a test where we verify that a k-rate audio param produces
 // different results from an a-rate audio param for each of the audio
 // params of a biquad.
 //
 // Each entry gives the name of the AudioParam, an initial value to be
 // used with setValueAtTime, and a final value to be used with
 // linearRampToValueAtTime. (See |doTest| for details as well.)

 [{name: 'Q',
 initial: 1,
 final: 10
 },
 {name: 'detune',
 initial: 0,
 final: 1200
 },
 {name: 'frequency',
 initial: 350,
 final: 0
 },
 {name: 'gain',
 initial: 10,
 final: 0
 }].forEach(paramProperty => {
 audit.define('Biquad k-rate ' + paramProperty.name, (task, should) => {
 // Arbitrary sample rate and duration.
 let sampleRate = 8000;
 let testDuration = 1;
 let context = new OfflineAudioContext({
 numberOfChannels: 3,
 sampleRate: sampleRate,
 length: testDuration * sampleRate
 });

 doTest(context, should, {
 nodeName: 'BiquadFilterNode',
 nodeOptions: {type: 'peaking', Q: 1, gain: 10},
 prefix: `k-rate ${paramProperty.name}`,
 // Just set the frequency to k-rate
 rateSettings: [
 {name: paramProperty.name, value: 'k-rate'},
 ],
 // Automate just the given AudioParam
 automations: [{
 name: paramProperty.name,
 methods: [
 {name: 'setValueAtTime', options: [paramProperty.initial, 0]}, {
 name: 'linearRampToValueAtTime',
 options: [paramProperty.final, testDuration]
 }
 ]
 }]
 }).then(() => task.done());
 });
 });

 audit.run();
 