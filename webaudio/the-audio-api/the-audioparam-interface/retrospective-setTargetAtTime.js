
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
  await import(path.join(cwd, '/webaudio/resources/audit-util.js'));
await import(path.join(cwd, '/webaudio/resources/audit.js'));

 let audit = Audit.createTaskRunner();

 audit.define(
 {
 label: 'test',
 description: 'Test setTargetAtTime with start time in the past'
 },
 (task, should) => {
 // Use a sample rate that is a power of two to eliminate round-off
 // in computing the currentTime.
 let context = new OfflineAudioContext(2, 16384, 16384);
 let source = new ConstantSourceNode(context);

 // Suspend the context at this frame so we can synchronously set up
 // automations.
 const suspendFrame = 128;

 let test = new GainNode(context);
 let reference = new GainNode(context);

 source.connect(test);
 source.connect(reference);

 let merger = new ChannelMergerNode(
 context, {numberOfInputs: context.destination.channelCount});
 test.connect(merger, 0, 0);
 reference.connect(merger, 0, 1);

 merger.connect(context.destination);

 context.suspend(suspendFrame / context.sampleRate)
 .then(() => {
 // Call setTargetAtTime with a time in the past
 test.gain.setTargetAtTime(0.1, 0.5*context.currentTime, 0.1);
 reference.gain.setTargetAtTime(0.1, context.currentTime, 0.1);
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
 