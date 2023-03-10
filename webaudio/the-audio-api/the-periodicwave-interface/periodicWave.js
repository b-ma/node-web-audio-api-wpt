
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

 // real and imag are used in separate PeriodicWaves to make their peak values
 // easy to determine.
 const realMax = 99;
 var real = new Float32Array(realMax + 1);
 real[1] = 2.0; // fundamental
 real[realMax] = 3.0;
 const realPeak = real[1] + real[realMax];
 const realFundamental = 19.0;
 var imag = new Float32Array(4);
 imag[0] = 6.0; // should be ignored.
 imag[3] = 0.5;
 const imagPeak = imag[3];
 const imagFundamental = 551.0;

 const testLength = 4096;
 let context = new AudioContext();

 let audit = Audit.createTaskRunner();

 // Create with the factory method

 audit.define('create with factory method', (task, should) => {
 should(() => {
 context.createPeriodicWave(new Float32Array(4096), new Float32Array(4096));
 }, 'context.createPeriodicWave(new Float32Array(4096), ' +
 'new Float32Array(4096))').notThrow();
 task.done();
 });

 audit.define('different length with factory method', (task, should) => {
 should(() => {
 context.createPeriodicWave(new Float32Array(512), new Float32Array(4));
 }, 'context.createPeriodicWave(new Float32Array(512), ' +
 'new Float32Array(4))').throw(DOMException, "IndexSizeError");
 task.done();
 });

 audit.define('too small with factory method', (task, should) => {
 should(() => {
 context.createPeriodicWave(new Float32Array(1), new Float32Array(1));
 }, 'context.createPeriodicWave(new Float32Array(1), ' +
 'new Float32Array(1))').throw(DOMException, "IndexSizeError");
 task.done();
 });

 // Create with the constructor

 audit.define('create with constructor', (task, should) => {
 should(() => {
 new PeriodicWave(context, { real: new Float32Array(4096), imag: new Float32Array(4096) });
 }, 'new PeriodicWave(context, { real : new Float32Array(4096), ' +
 'imag : new Float32Array(4096) })').notThrow();
 task.done();
 });

 audit.define('different length with constructor', (task, should) => {
 should(() => {
 new PeriodicWave(context, { real: new Float32Array(4096), imag: new Float32Array(4) });
 }, 'new PeriodicWave(context, { real : new Float32Array(4096), ' +
 'imag : new Float32Array(4) })').throw(DOMException, "IndexSizeError");
 task.done();
 });

 audit.define('too small with constructor', (task, should) => {
 should(() => {
 new PeriodicWave(context, { real: new Float32Array(1), imag: new Float32Array(1) });
 }, 'new PeriodicWave(context, { real : new Float32Array(1), ' +
 'imag : new Float32Array(1) })').throw(DOMException, "IndexSizeError");
 task.done();
 });

 audit.define('output test', (task, should) => {
 let context = new OfflineAudioContext(2, 4096, 44100);
 // Create the expected output buffer
 let expectations = context.createBuffer(2, testLength, context.sampleRate);
 for (var i = 0; i < expectations.length; ++i) {

 expectations.getChannelData(0)[i] = 1.0 / realPeak *
 (real[1] * Math.cos(2 * Math.PI * realFundamental * i /
 context.sampleRate) +
 real[realMax] * Math.cos(2 * Math.PI * realMax * realFundamental * i /
 context.sampleRate));

 expectations.getChannelData(1)[i] = 1.0 / imagPeak *
 imag[3] * Math.sin(2 * Math.PI * 3 * imagFundamental * i /
 context.sampleRate);
 }

 // Create the real output buffer
 let merger = context.createChannelMerger();

 let osc1 = context.createOscillator();
 let osc2 = context.createOscillator();

 osc1.setPeriodicWave(context.createPeriodicWave(
 real, new Float32Array(real.length)));
 osc2.setPeriodicWave(context.createPeriodicWave(
 new Float32Array(imag.length), imag));
 osc1.frequency.value = realFundamental;
 osc2.frequency.value = imagFundamental;

 osc1.start();
 osc2.start();

 osc1.connect(merger, 0, 0);
 osc2.connect(merger, 0, 1);

 context.startRendering().then(reality => {
 should(reality, 'rendering PeriodicWave').beEqualToArray(expectations);
 task.done();
 });
 });

 audit.run();
 