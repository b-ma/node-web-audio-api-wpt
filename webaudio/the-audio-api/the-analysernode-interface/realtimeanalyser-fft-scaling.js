
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

 // The number of analysers. We have analysers from size for each of the
 // possible sizes of 2^5 to 2^15 for a total of 11.
 let numberOfAnalysers = 11;
 let sampleRate = 44100;
 let nyquistFrequency = sampleRate / 2;

 // Frequency of the sine wave test signal. Should be high enough so that
 // we get at least one full cycle for the 32-point FFT. This should also
 // be such that the frequency should be exactly in one of the FFT bins for
 // each of the possible FFT sizes.
 let oscFrequency = nyquistFrequency / 16;

 // The actual peak values from each analyser. Useful for examining the
 // actual peak values.
 let peakValue = new Array(numberOfAnalysers);

 // For a 0dBFS sine wave, we would expect the FFT magnitude to be 0dB as
 // well, but the analyzer node applies a Blackman globalThis (to smooth the
 // estimate). This reduces the energy of the signal so the FFT peak is
 // less than 0dB. The threshold value given here was determined
 // experimentally.
 //
 // See https://code.google.com/p/chromium/issues/detail?id=341596.
 let peakThreshold = [
 -14.43, -13.56, -13.56, -13.56, -13.56, -13.56, -13.56, -13.56, -13.56,
 -13.56, -13.56
 ];

 function checkResult(order, analyser, should) {
 return function() {
 let index = order - 5;
 let fftSize = 1 << order;
 let fftData = new Float32Array(fftSize);
 analyser.getFloatFrequencyData(fftData);

 // Compute the frequency bin that should contain the peak.
 let expectedBin =
 analyser.frequencyBinCount * (oscFrequency / nyquistFrequency);

 // Find the actual bin by finding the bin containing the peak.
 let actualBin = 0;
 peakValue[index] = -1000;
 for (k = 0; k < analyser.frequencyBinCount; ++k) {
 if (fftData[k] > peakValue[index]) {
 actualBin = k;
 peakValue[index] = fftData[k];
 }
 }

 should(actualBin, (1 << order) + '-point FFT peak position')
 .beEqualTo(expectedBin);

 should(
 peakValue[index], (1 << order) + '-point FFT peak value in dBFS')
 .beGreaterThanOrEqualTo(peakThreshold[index]);
 }
 }

 audit.define(
 {
 label: 'FFT scaling tests',
 description: 'Test Scaling of FFT in AnalyserNode'
 },
 async function(task, should) {
 let tests = [];
 for (let k = 5; k <= 15; ++k)
 await runTest(k, should);
 task.done();
 });

 function runTest(order, should) {
 let context = new OfflineAudioContext(1, 1 << order, sampleRate);
 // Use a sine wave oscillator as the reference source signal.
 let osc = context.createOscillator();
 osc.type = 'sine';
 osc.frequency.value = oscFrequency;
 osc.connect(context.destination);

 let analyser = context.createAnalyser();
 // No smoothing to simplify the analysis of the result.
 analyser.smoothingTimeConstant = 0;
 analyser.fftSize = 1 << order;
 osc.connect(analyser);

 osc.start();
 return context.startRendering().then(() => {
 checkResult(order, analyser, should)();
 });
 }

 audit.run();
 