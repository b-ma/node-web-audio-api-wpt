
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

 let sampleRate = 48000;
 let testFrames = 100;

 // Global context that can be used by the individual tasks. It must be
 // defined by the initialize task.
 let context;

 let audit = Audit.createTaskRunner();

 audit.define('initialize', (task, should) => {
 should(() => {
 context = new OfflineAudioContext(1, testFrames, sampleRate);
 }, 'Initialize context for testing').notThrow();
 task.done();
 });

 audit.define('existence', (task, should) => {
 should(context.createBiquadFilter, 'context.createBiquadFilter')
 .exist();
 task.done();
 });

 audit.define('parameters', (task, should) => {
 // Create a really simple IIR filter. Doesn't much matter what.
 let coef = Float32Array.from([1]);

 let f = context.createBiquadFilter(coef, coef);

 should(f.numberOfInputs, 'numberOfInputs').beEqualTo(1);
 should(f.numberOfOutputs, 'numberOfOutputs').beEqualTo(1);
 should(f.channelCountMode, 'channelCountMode').beEqualTo('max');
 should(f.channelInterpretation, 'channelInterpretation')
 .beEqualTo('speakers');

 task.done();
 });

 audit.define('exceptions-createBiquadFilter', (task, should) => {
 should(function() {
 // Two args are required.
 context.createBiquadFilter();
 }, 'createBiquadFilter()').notThrow();

 task.done();
 });

 audit.define('exceptions-getFrequencyData', (task, should) => {
 // Create a really simple IIR filter. Doesn't much matter what.
 let coef = Float32Array.from([1]);

 let f = context.createBiquadFilter(coef, coef);

 should(
 function() {
 // frequencyHz can't be null.
 f.getFrequencyResponse(
 null, new Float32Array(1), new Float32Array(1));
 },
 'getFrequencyResponse(' +
 'null, ' +
 'new Float32Array(1), ' +
 'new Float32Array(1))')
 .throw(TypeError);

 should(
 function() {
 // magResponse can't be null.
 f.getFrequencyResponse(
 new Float32Array(1), null, new Float32Array(1));
 },
 'getFrequencyResponse(' +
 'new Float32Array(1), ' +
 'null, ' +
 'new Float32Array(1))')
 .throw(TypeError);

 should(
 function() {
 // phaseResponse can't be null.
 f.getFrequencyResponse(
 new Float32Array(1), new Float32Array(1), null);
 },
 'getFrequencyResponse(' +
 'new Float32Array(1), ' +
 'new Float32Array(1), ' +
 'null)')
 .throw(TypeError);

 should(
 function() {
 // magResponse array must the same length as frequencyHz
 f.getFrequencyResponse(
 new Float32Array(10), new Float32Array(1),
 new Float32Array(20));
 },
 'getFrequencyResponse(' +
 'new Float32Array(10), ' +
 'new Float32Array(1), ' +
 'new Float32Array(20))')
 .throw(DOMException, 'InvalidAccessError');

 should(
 function() {
 // phaseResponse array must be the same length as frequencyHz
 f.getFrequencyResponse(
 new Float32Array(10), new Float32Array(20),
 new Float32Array(1));
 },
 'getFrequencyResponse(' +
 'new Float32Array(10), ' +
 'new Float32Array(20), ' +
 'new Float32Array(1))')
 .throw(DOMException, 'InvalidAccessError');

 task.done();
 });

 audit.run();
 