
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
await import(path.join(cwd, '/webaudio/resources/mix-testing.js'));

 let audit = Audit.createTaskRunner();
 let context;
 let expectedAudio;

 audit.define('initialize', (task, should) => {
 // Create offline audio context
 let sampleRate = 44100.0;
 should(() => {
 context = new OfflineAudioContext(
 6, sampleRate * toneLengthSeconds, sampleRate);
 }, 'Creating context for testing').notThrow();
 should(
 Audit
 .loadFileFromUrl('resources/audiobuffersource-multi-channels-expected.wav')
 .then(arrayBuffer => {
 context.decodeAudioData(arrayBuffer).then(audioBuffer => {
 expectedAudio = audioBuffer;
 task.done();
 }).catch(error => {
 assert_unreached("Could not decode audio data due to " + error.message);
 })
 })
 , 'Fetching expected audio').beResolved();
 });

 audit.define(
 {label: 'test', description: 'AudioBufferSource with 5.1 buffer'},
 (task, should) => {
 let toneBuffer =
 createToneBuffer(context, 440, toneLengthSeconds, 6);

 let source = context.createBufferSource();
 source.buffer = toneBuffer;

 source.connect(context.destination);
 source.start(0);

 context.startRendering()
 .then(renderedAudio => {
 // Compute a threshold based on the maximum error, |maxUlp|,
 // in ULP. This is experimentally determined. Assuming that
 // the reference file is a 16-bit wav file, the max values in
 // the wave file are +/- 32768.
 let maxUlp = 1;
 let threshold = maxUlp / 32768;
 for (let k = 0; k < renderedAudio.numberOfChannels; ++k) {
 should(
 renderedAudio.getChannelData(k),
 'Rendered audio for channel ' + k)
 .beCloseToArray(
 expectedAudio.getChannelData(k),
 {absoluteThreshold: threshold});
 }
 })
 .then(() => task.done());
 });

 audit.run();
 