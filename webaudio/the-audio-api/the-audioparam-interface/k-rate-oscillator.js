
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

 // Arbitrary sample rate and duration.
 let sampleRate = 8000;

 // Only new a few render quanta to verify things are working.
 let testDuration = 4 * 128 / sampleRate;

 [{name: 'detune', initial: 0, final: 1200}, {
 name: 'frequency',
 initial: 440,
 final: sampleRate / 2
 }].forEach(paramProperty => {
 audit.define(
 'Oscillator k-rate ' + paramProperty.name, (task, should) => {
 let context = new OfflineAudioContext({
 numberOfChannels: 3,
 sampleRate: sampleRate,
 length: testDuration * sampleRate
 });

 let merger = new ChannelMergerNode(
 context, {numberOfInputs: context.destination.channelCount});
 merger.connect(context.destination);
 let inverter = new GainNode(context, {gain: -1});
 inverter.connect(merger, 0, 2);

 let kRateNode = new OscillatorNode(context);
 let aRateNode = new OscillatorNode(context);

 kRateNode.connect(merger, 0, 0);
 aRateNode.connect(merger, 0, 1);

 kRateNode.connect(merger, 0, 2);
 aRateNode.connect(inverter);

 // Set the rate
 kRateNode[paramProperty.name].automationRate = 'k-rate';

 // Automate the offset
 kRateNode[paramProperty.name].setValueAtTime(
 paramProperty.initial, 0);
 kRateNode[paramProperty.name].linearRampToValueAtTime(
 paramProperty.final, testDuration);

 aRateNode[paramProperty.name].setValueAtTime(
 paramProperty.initial, 0);
 aRateNode[paramProperty.name].linearRampToValueAtTime(
 paramProperty.final, testDuration);

 kRateNode.start();
 aRateNode.start();

 context.startRendering()
 .then(audioBuffer => {
 let kRateOut = audioBuffer.getChannelData(0);
 let aRateOut = audioBuffer.getChannelData(1);
 let diff = audioBuffer.getChannelData(2);

 // Verify that the outputs are different.
 should(
 diff,
 'k-rate ' + paramProperty.name +
 ': Difference between a-rate and k-rate outputs')
 .notBeConstantValueOf(0);

 })
 .then(() => task.done());
 });
 });


 audit.run();
 