
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

 // Sample rate should be power of 128 to observe the change of AudioParam
 // at the beginning of rendering quantum. (playbackRate is k-rate) This is
 // the minimum sample rate in the valid sample rate range.
 let sampleRate = 8192;

 // The render duration in seconds, and the length in samples.
 let renderDuration = 1.0;
 let renderLength = renderDuration * sampleRate;

 let context = new OfflineAudioContext(1, renderLength, sampleRate);
 let audit = Audit.createTaskRunner();


 // Task: Render the actual buffer and compare with the reference.
 audit.define('synthesize-verify', (task, should) => {
 let ramp = context.createBufferSource();
 let rampBuffer = createLinearRampBuffer(context, renderLength);
 ramp.buffer = rampBuffer;

 ramp.connect(context.destination);
 ramp.start();

 // Leave the playbackRate as 1 for the first half, then change it
 // to zero at the exact half. The zero playback rate should hold the
 // sample value of the buffer index at the moment. (sample-and-hold)
 ramp.playbackRate.setValueAtTime(1.0, 0.0);
 ramp.playbackRate.setValueAtTime(0.0, renderDuration / 2);

 context.startRendering()
 .then(function(renderedBuffer) {
 let data = renderedBuffer.getChannelData(0);
 let rampData = rampBuffer.getChannelData(0);
 let half = rampData.length / 2;
 let passed = true;
 let i;

 for (i = 1; i < rampData.length; i++) {
 if (i < half) {
 // Before the half position, the actual should match with the
 // original ramp data.
 if (data[i] !== rampData[i]) {
 passed = false;
 break;
 }
 } else {
 // From the half position, the actual value should not change.
 if (data[i] !== rampData[half]) {
 passed = false;
 break;
 }
 }
 }

 should(passed, 'The zero playbackRate')
 .message(
 'held the sample value correctly',
 'should hold the sample value. ' +
 'Expected ' + rampData[half] + ' but got ' + data[i] +
 ' at the index ' + i);
 })
 .then(() => task.done());
 });

 audit.define('subsample start with playback rate 0', (task, should) => {
 let context = new OfflineAudioContext(1, renderLength, sampleRate);
 let rampBuffer = new AudioBuffer(
 {length: renderLength, sampleRate: context.sampleRate});
 let data = new Float32Array(renderLength);
 let startValue = 5;
 for (let k = 0; k < data.length; ++k) {
 data[k] = k + startValue;
 }
 rampBuffer.copyToChannel(data, 0);

 let src = new AudioBufferSourceNode(
 context, {buffer: rampBuffer, playbackRate: 0});

 src.connect(context.destination);

 // Purposely start the source between frame boundaries
 let startFrame = 27.3;
 src.start(startFrame / context.sampleRate);

 context.startRendering()
 .then(audioBuffer => {
 let actualStartFrame = Math.ceil(startFrame);
 let audio = audioBuffer.getChannelData(0);

 should(
 audio.slice(0, actualStartFrame),
 `output[0:${actualStartFrame - 1}]`)
 .beConstantValueOf(0);
 should(
 audio.slice(actualStartFrame), `output[${actualStartFrame}:]`)
 .beConstantValueOf(startValue);
 })
 .then(() => task.done());
 });

 audit.run();
 