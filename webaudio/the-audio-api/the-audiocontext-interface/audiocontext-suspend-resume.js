
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

 let offlineContext;
 let osc;
 let p1;
 let p2;
 let p3;

 let sampleRate = 44100;
 let durationInSeconds = 1;

 let audit = Audit.createTaskRunner();

 // Task: test suspend().
 audit.define(
 {
 label: 'test-suspend',
 description: 'Test suspend() for offline context'
 },
 function(task, should) {
 // Test suspend/resume. Ideally this test is best with a online
 // AudioContext, but content shell doesn't really have a working
 // online AudioContext. Hence, use an OfflineAudioContext. Not all
 // possible scenarios can be easily checked with an offline context
 // instead of an online context.

 // Create an audio context with an oscillator.
 should(
 () => {
 offlineContext = new OfflineAudioContext(
 1, durationInSeconds * sampleRate, sampleRate);
 },
 'offlineContext = new OfflineAudioContext(1, ' +
 (durationInSeconds * sampleRate) + ', ' + sampleRate + ')')
 .notThrow();
 osc = offlineContext.createOscillator();
 osc.connect(offlineContext.destination);

 // Verify the state.
 should(offlineContext.state, 'offlineContext.state')
 .beEqualTo('suspended');

 // Multiple calls to suspend() should not be a problem. But we can't
 // test that on an offline context. Thus, check that suspend() on
 // an OfflineAudioContext rejects the promise.
 should(
 () => p1 = offlineContext.suspend(),
 'p1 = offlineContext.suspend()')
 .notThrow();
 should(p1 instanceof Promise, 'p1 instanceof Promise').beTrue();

 should(p1, 'p1').beRejected().then(task.done.bind(task));
 });


 // Task: test resume().
 audit.define(
 {
 label: 'test-resume',
 description: 'Test resume() for offline context'
 },
 function(task, should) {
 // Multiple calls to resume should not be a problem. But we can't
 // test that on an offline context. Thus, check that resume() on an
 // OfflineAudioContext rejects the promise.
 should(
 () => p2 = offlineContext.resume(),
 'p2 = offlineContext.resume()')
 .notThrow();
 should(p2 instanceof Promise, 'p2 instanceof Promise').beTrue();

 // Resume doesn't actually resume an offline context
 should(offlineContext.state, 'After resume, offlineContext.state')
 .beEqualTo('suspended');
 should(p2, 'p2').beRejected().then(task.done.bind(task));
 });

 // Task: test the state after context closed.
 audit.define(
 {
 label: 'test-after-close',
 description: 'Test state after context closed'
 },
 function(task, should) {
 // Render the offline context.
 osc.start();

 // Test suspend/resume in tested promise pattern. We don't care
 // about the actual result of the offline rendering.
 should(
 () => p3 = offlineContext.startRendering(),
 'p3 = offlineContext.startRendering()')
 .notThrow();

 p3.then(() => {
 should(offlineContext.state, 'After close, offlineContext.state')
 .beEqualTo('closed');

 // suspend() should be rejected on a closed context.
 should(offlineContext.suspend(), 'offlineContext.suspend()')
 .beRejected()
 .then(() => {
 // resume() should be rejected on closed context.
 should(offlineContext.resume(), 'offlineContext.resume()')
 .beRejected()
 .then(task.done.bind(task));
 })
 });
 });

 audit.define(
 {
 label: 'resume-running-context',
 description: 'Test resuming a running context'
 },
 (task, should) => {
 let context;
 should(() => context = new AudioContext(), 'Create online context')
 .notThrow();

 should(context.state, 'context.state').beEqualTo('suspended');
 should(context.resume(), 'context.resume')
 .beResolved()
 .then(() => {
 should(context.state, 'context.state after resume')
 .beEqualTo('running');
 })
 .then(() => task.done());
 });

 audit.run();
 