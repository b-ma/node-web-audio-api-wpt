
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
await import('retrospective-test.js');

 let audit = Audit.createTaskRunner();

 audit.define(
 {
 label: 'test',
 description: 'Test setValueAtTime with startTime in the past'
 },
 (task, should) => {
 let {context, source, test, reference} = setupRetrospectiveGraph();

 // Suspend the context at this frame so we can synchronously set up
 // automations.
 const suspendFrame = 128;

 // Use a ramp of slope 1 per frame to measure time.
 // The end value is the extent of exact precision in single
 // precision float.
 const rampEnd = context.length - suspendFrame;
 const rampEndSeconds = context.length / context.sampleRate;

 context.suspend(suspendFrame / context.sampleRate)
 .then(() => {
 // Call setValueAtTime with a time in the past
 test.gain.setValueAtTime(0.0, 0.5 * context.currentTime);
 test.gain.linearRampToValueAtTime(rampEnd, rampEndSeconds);

 reference.gain.setValueAtTime(0.0, context.currentTime);
 reference.gain.linearRampToValueAtTime(
 rampEnd, rampEndSeconds);
 })
 .then(() => context.resume());

 source.start();

 context.startRendering()
 .then(resultBuffer => {
 let testValue = resultBuffer.getChannelData(0);
 let referenceValue = resultBuffer.getChannelData(1);

 // Until the suspendFrame, both should be exactly equal to 1.
 should(
 testValue.slice(0, suspendFrame),
 `Test[0:${suspendFrame - 1}]`)
 .beConstantValueOf(1);
 should(
 referenceValue.slice(0, suspendFrame),
 `Reference[0:${suspendFrame - 1}]`)
 .beConstantValueOf(1);

 // After the suspendFrame, both should be equal (and not
 // constant)
 should(
 testValue.slice(suspendFrame), `Test[${suspendFrame}:]`)
 .beEqualToArray(referenceValue.slice(suspendFrame));
 })
 .then(() => task.done());
 });

 audit.run();
 