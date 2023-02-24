
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
await import(path.join(cwd, '/webaudio/resources/audio-param.js'));
await import(path.join(cwd, '/webaudio/resources/audit-util.js'));
await import(path.join(cwd, '/webaudio/resources/audit.js'));

 let sampleRate = 48000;
 let renderDuration = 0.5;

 let audit = Audit.createTaskRunner();

 audit.define(
 {label: 'cancelTime', description: 'Test Invalid Values'},
 (task, should) => {
 let context = new OfflineAudioContext({
 numberOfChannels: 1,
 length: 1,
 sampleRate: 8000
 });

 let src = new ConstantSourceNode(context);
 src.connect(context.destination);

 should(
 () => src.offset.cancelAndHoldAtTime(-1),
 'cancelAndHoldAtTime(-1)')
 .throw(RangeError);

 // These are TypeErrors because |cancelTime| is a
 // double, not unrestricted double.
 should(
 () => src.offset.cancelAndHoldAtTime(NaN),
 'cancelAndHoldAtTime(NaN)')
 .throw(TypeError);

 should(
 () => src.offset.cancelAndHoldAtTime(Infinity),
 'cancelAndHoldAtTime(Infinity)')
 .throw(TypeError);

 task.done();
 });

 // The first few tasks test the cancellation of each relevant automation
 // function. For the test, a simple linear ramp from 0 to 1 is used to
 // start things off. Then the automation to be tested is scheduled and
 // cancelled.

 audit.define(
 {label: 'linear', description: 'Cancel linearRampToValueAtTime'},
 function(task, should) {
 cancelTest(should, linearRampTest('linearRampToValueAtTime'), {
 valueThreshold: 8.3998e-5,
 curveThreshold: 5.9605e-5
 }).then(task.done.bind(task));
 });

 audit.define(
 {label: 'exponential', description: 'Cancel exponentialRampAtTime'},
 function(task, should) {
 // Cancel an exponential ramp. The thresholds are experimentally
 // determined.
 cancelTest(should, function(g, v0, t0, cancelTime) {
 // Initialize values to 0.
 g[0].gain.setValueAtTime(0, 0);
 g[1].gain.setValueAtTime(0, 0);
 // Schedule a short linear ramp to start things off.
 g[0].gain.linearRampToValueAtTime(v0, t0);
 g[1].gain.linearRampToValueAtTime(v0, t0);

 // After the linear ramp, schedule an exponential ramp to the end.
 // (This is the event that will be be cancelled.)
 let v1 = 0.001;
 let t1 = renderDuration;

 g[0].gain.exponentialRampToValueAtTime(v1, t1);
 g[1].gain.exponentialRampToValueAtTime(v1, t1);

 expectedConstant = Math.fround(
 v0 * Math.pow(v1 / v0, (cancelTime - t0) / (t1 - t0)));
 return {
 expectedConstant: expectedConstant,
 autoMessage: 'exponentialRampToValue(' + v1 + ', ' + t1 + ')',
 summary: 'exponentialRampToValueAtTime',
 };
 }, {
 valueThreshold: 1.8664e-6,
 curveThreshold: 5.9605e-8
 }).then(task.done.bind(task));
 });

 audit.define(
 {label: 'setTarget', description: 'Cancel setTargetAtTime'},
 function(task, should) {
 // Cancel a setTarget event.
 cancelTest(should, function(g, v0, t0, cancelTime) {
 // Initialize values to 0.
 g[0].gain.setValueAtTime(0, 0);
 g[1].gain.setValueAtTime(0, 0);
 // Schedule a short linear ramp to start things off.
 g[0].gain.linearRampToValueAtTime(v0, t0);
 g[1].gain.linearRampToValueAtTime(v0, t0);

 // At the end of the linear ramp, schedule a setTarget. (This is
 // the event that will be cancelled.)
 let v1 = 0;
 let t1 = t0;
 let timeConstant = 0.05;

 g[0].gain.setTargetAtTime(v1, t1, timeConstant);
 g[1].gain.setTargetAtTime(v1, t1, timeConstant);

 expectedConstant = Math.fround(
 v1 + (v0 - v1) * Math.exp(-(cancelTime - t0) / timeConstant));
 return {
 expectedConstant: expectedConstant,
 autoMessage: 'setTargetAtTime(' + v1 + ', ' + t1 + ', ' +
 timeConstant + ')',
 summary: 'setTargetAtTime',
 };
 }, {
 valueThreshold: 4.5267e-7, // 1.1317e-7,
 curveThreshold: 0
 }).then(task.done.bind(task));
 });

 audit.define(
 {label: 'setValueCurve', description: 'Cancel setValueCurveAtTime'},
 function(task, should) {
 // Cancel a setValueCurve event.
 cancelTest(should, function(g, v0, t0, cancelTime) {
 // Initialize values to 0.
 g[0].gain.setValueAtTime(0, 0);
 g[1].gain.setValueAtTime(0, 0);
 // Schedule a short linear ramp to start things off.
 g[0].gain.linearRampToValueAtTime(v0, t0);
 g[1].gain.linearRampToValueAtTime(v0, t0);

 // After the linear ramp, schedule a setValuesCurve. (This is the
 // event that will be cancelled.)
 let v1 = 0;
 let duration = renderDuration - t0;

 // For simplicity, a 2-point curve so we get a linear interpolated
 // result.
 let curve = Float32Array.from([v0, 0]);

 g[0].gain.setValueCurveAtTime(curve, t0, duration);
 g[1].gain.setValueCurveAtTime(curve, t0, duration);

 let index =
 Math.floor((curve.length - 1) / duration * (cancelTime - t0));

 let curvePointsPerFrame =
 (curve.length - 1) / duration / sampleRate;
 let virtualIndex =
 (cancelTime - t0) * sampleRate * curvePointsPerFrame;

 let delta = virtualIndex - index;
 expectedConstant = curve[0] + (curve[1] - curve[0]) * delta;
 return {
 expectedConstant: expectedConstant,
 autoMessage: 'setValueCurveAtTime([' + curve + '], ' + t0 +
 ', ' + duration + ')',
 summary: 'setValueCurveAtTime',
 };
 }, {
 valueThreshold: 9.5368e-9,
 curveThreshold: 0
 }).then(task.done.bind(task));
 });

 audit.define(
 {
 label: 'setValueCurve after end',
 description: 'Cancel setValueCurveAtTime after the end'
 },
 function(task, should) {
 cancelTest(should, function(g, v0, t0, cancelTime) {
 // Initialize values to 0.
 g[0].gain.setValueAtTime(0, 0);
 g[1].gain.setValueAtTime(0, 0);
 // Schedule a short linear ramp to start things off.
 g[0].gain.linearRampToValueAtTime(v0, t0);
 g[1].gain.linearRampToValueAtTime(v0, t0);

 // After the linear ramp, schedule a setValuesCurve. (This is the
 // event that will be cancelled.) Make sure the curve ends before
 // the cancellation time.
 let v1 = 0;
 let duration = cancelTime - t0 - 0.125;

 // For simplicity, a 2-point curve so we get a linear interpolated
 // result.
 let curve = Float32Array.from([v0, 0]);

 g[0].gain.setValueCurveAtTime(curve, t0, duration);
 g[1].gain.setValueCurveAtTime(curve, t0, duration);

 expectedConstant = curve[1];
 return {
 expectedConstant: expectedConstant,
 autoMessage: 'setValueCurveAtTime([' + curve + '], ' + t0 +
 ', ' + duration + ')',
 summary: 'setValueCurveAtTime',
 };
 }, {
 valueThreshold: 0,
 curveThreshold: 0
 }).then(task.done.bind(task));
 });

 // Special case where we schedule a setTarget and there is no earlier
 // automation event. This tests that we pick up the starting point
 // correctly from the last setting of the AudioParam value attribute.


 audit.define(
 {
 label: 'initial setTarget',
 description: 'Cancel with initial setTargetAtTime'
 },
 function(task, should) {
 cancelTest(should, function(g, v0, t0, cancelTime) {
 let v1 = 0;
 let timeConstant = 0.1;
 g[0].gain.value = 1;
 g[0].gain.setTargetAtTime(v1, t0, timeConstant);
 g[1].gain.value = 1;
 g[1].gain.setTargetAtTime(v1, t0, timeConstant);

 let expectedConstant = Math.fround(
 v1 + (v0 - v1) * Math.exp(-(cancelTime - t0) / timeConstant));

 return {
 expectedConstant: expectedConstant,
 autoMessage: 'setTargetAtTime(' + v1 + ', ' + t0 + ', ' +
 timeConstant + ')',
 summary: 'Initial setTargetAtTime',
 };
 }, {
 valueThreshold: 3.1210e-6,
 curveThreshold: 0
 }).then(task.done.bind(task));
 });

 // Test automations scheduled after the call to cancelAndHoldAtTime.
 // Very similar to the above tests, but we also schedule an event after
 // cancelAndHoldAtTime and verify that curve after cancellation has
 // the correct values.

 audit.define(
 {
 label: 'post cancel: Linear',
 description: 'LinearRamp after cancelling'
 },
 function(task, should) {
 // Run the cancel test using a linearRamp as the event to be
 // cancelled. Then schedule another linear ramp after the
 // cancellation.
 cancelTest(
 should,
 linearRampTest('Post cancellation linearRampToValueAtTime'),
 {valueThreshold: 8.3998e-5, curveThreshold: 5.9605e-8},
 function(g, cancelTime, expectedConstant) {
 // Schedule the linear ramp on g[0], and do the same for g[2],
 // using the starting point given by expectedConstant.
 let v2 = 2;
 let t2 = cancelTime + 0.125;
 g[0].gain.linearRampToValueAtTime(v2, t2);
 g[2].gain.setValueAtTime(expectedConstant, cancelTime);
 g[2].gain.linearRampToValueAtTime(v2, t2);
 return {
 constantEndTime: cancelTime,
 message: 'Post linearRamp(' + v2 + ', ' + t2 + ')'
 };
 })
 .then(task.done.bind(task));
 });

 audit.define(
 {
 label: 'post cancel: Exponential',
 description: 'ExponentialRamp after cancelling'
 },
 function(task, should) {
 // Run the cancel test using a linearRamp as the event to be
 // cancelled. Then schedule an exponential ramp after the
 // cancellation.
 cancelTest(
 should,
 linearRampTest('Post cancel exponentialRampToValueAtTime'),
 {valueThreshold: 8.3998e-5, curveThreshold: 5.9605e-8},
 function(g, cancelTime, expectedConstant) {
 // Schedule the exponential ramp on g[0], and do the same for
 // g[2], using the starting point given by expectedConstant.
 let v2 = 2;
 let t2 = cancelTime + 0.125;
 g[0].gain.exponentialRampToValueAtTime(v2, t2);
 g[2].gain.setValueAtTime(expectedConstant, cancelTime);
 g[2].gain.exponentialRampToValueAtTime(v2, t2);
 return {
 constantEndTime: cancelTime,
 message: 'Post exponentialRamp(' + v2 + ', ' + t2 + ')'
 };
 })
 .then(task.done.bind(task));
 });

 audit.define('post cancel: ValueCurve', function(task, should) {
 // Run the cancel test using a linearRamp as the event to be cancelled.
 // Then schedule a setValueCurve after the cancellation.
 cancelTest(
 should, linearRampTest('Post cancel setValueCurveAtTime'),
 {valueThreshold: 8.3998e-5, curveThreshold: 5.9605e-8},
 function(g, cancelTime, expectedConstant) {
 // Schedule the exponential ramp on g[0], and do the same for
 // g[2], using the starting point given by expectedConstant.
 let t2 = cancelTime + 0.125;
 let duration = 0.125;
 let curve = Float32Array.from([.125, 2]);
 g[0].gain.setValueCurveAtTime(curve, t2, duration);
 g[2].gain.setValueAtTime(expectedConstant, cancelTime);
 g[2].gain.setValueCurveAtTime(curve, t2, duration);
 return {
 constantEndTime: cancelTime,
 message: 'Post setValueCurve([' + curve + '], ' + t2 + ', ' +
 duration + ')',
 errorThreshold: 8.3998e-5
 };
 })
 .then(task.done.bind(task));
 });

 audit.define('post cancel: setTarget', function(task, should) {
 // Run the cancel test using a linearRamp as the event to be cancelled.
 // Then schedule a setTarget after the cancellation.
 cancelTest(
 should, linearRampTest('Post cancel setTargetAtTime'),
 {valueThreshold: 8.3998e-5, curveThreshold: 5.9605e-8},
 function(g, cancelTime, expectedConstant) {
 // Schedule the exponential ramp on g[0], and do the same for
 // g[2], using the starting point given by expectedConstant.
 let v2 = 0.125;
 let t2 = cancelTime + 0.125;
 let timeConstant = 0.1;
 g[0].gain.setTargetAtTime(v2, t2, timeConstant);
 g[2].gain.setValueAtTime(expectedConstant, cancelTime);
 g[2].gain.setTargetAtTime(v2, t2, timeConstant);
 return {
 constantEndTime: cancelTime + 0.125,
 message: 'Post setTargetAtTime(' + v2 + ', ' + t2 + ', ' +
 timeConstant + ')',
 errorThreshold: 8.4037e-5
 };
 })
 .then(task.done.bind(task));
 });

 audit.define('post cancel: setValue', function(task, should) {
 // Run the cancel test using a linearRamp as the event to be cancelled.
 // Then schedule a setTarget after the cancellation.
 cancelTest(
 should, linearRampTest('Post cancel setValueAtTime'),
 {valueThreshold: 8.3998e-5, curveThreshold: 5.9605e-8},
 function(g, cancelTime, expectedConstant) {
 // Schedule the exponential ramp on g[0], and do the same for
 // g[2], using the starting point given by expectedConstant.
 let v2 = 0.125;
 let t2 = cancelTime + 0.125;
 g[0].gain.setValueAtTime(v2, t2);
 g[2].gain.setValueAtTime(expectedConstant, cancelTime);
 g[2].gain.setValueAtTime(v2, t2);
 return {
 constantEndTime: cancelTime + 0.125,
 message: 'Post setValueAtTime(' + v2 + ', ' + t2 + ')'
 };
 })
 .then(task.done.bind(task));
 });

 audit.define('cancel future setTarget', (task, should) => {
 const context =
 new OfflineAudioContext(1, renderDuration * sampleRate, sampleRate);
 const src = new ConstantSourceNode(context);
 src.connect(context.destination);

 src.offset.setValueAtTime(0.5, 0);
 src.offset.setTargetAtTime(0, 0.75 * renderDuration, 0.1);
 // Now cancel the effect of the setTarget.
 src.offset.cancelAndHoldAtTime(0.5 * renderDuration);

 src.start();
 context.startRendering()
 .then(buffer => {
 let actual = buffer.getChannelData(0);
 // Because the setTarget was cancelled, the output should be a
 // constant.
 should(actual, 'After cancelling future setTarget event, output')
 .beConstantValueOf(0.5);
 })
 .then(task.done.bind(task));
 });

 audit.define('cancel setTarget now', (task, should) => {
 const context =
 new OfflineAudioContext(1, renderDuration * sampleRate, sampleRate);
 const src = new ConstantSourceNode(context);
 src.connect(context.destination);

 src.offset.setValueAtTime(0.5, 0);
 src.offset.setTargetAtTime(0, 0.5 * renderDuration, 0.1);
 // Now cancel the effect of the setTarget.
 src.offset.cancelAndHoldAtTime(0.5 * renderDuration);

 src.start();
 context.startRendering()
 .then(buffer => {
 let actual = buffer.getChannelData(0);
 // Because the setTarget was cancelled, the output should be a
 // constant.
 should(
 actual,
 'After cancelling setTarget event starting now, output')
 .beConstantValueOf(0.5);
 })
 .then(task.done.bind(task));
 });

 audit.define('cancel future setValueCurve', (task, should) => {
 const context =
 new OfflineAudioContext(1, renderDuration * sampleRate, sampleRate);
 const src = new ConstantSourceNode(context);
 src.connect(context.destination);

 src.offset.setValueAtTime(0.5, 0);
 src.offset.setValueCurveAtTime([-1, 1], 0.75 * renderDuration, 0.1);
 // Now cancel the effect of the setTarget.
 src.offset.cancelAndHoldAtTime(0.5 * renderDuration);

 src.start();
 context.startRendering()
 .then(buffer => {
 let actual = buffer.getChannelData(0);
 // Because the setTarget was cancelled, the output should be a
 // constant.
 should(
 actual, 'After cancelling future setValueCurve event, output')
 .beConstantValueOf(0.5);
 })
 .then(task.done.bind(task));
 });

 audit.define('cancel setValueCurve now', (task, should) => {
 const context =
 new OfflineAudioContext(1, renderDuration * sampleRate, sampleRate);
 const src = new ConstantSourceNode(context);
 src.connect(context.destination);

 src.offset.setValueAtTime(0.5, 0);
 src.offset.setValueCurveAtTime([-1, 1], 0.5 * renderDuration, 0.1);
 // Now cancel the effect of the setTarget.
 src.offset.cancelAndHoldAtTime(0.5 * renderDuration);

 src.start();
 context.startRendering()
 .then(buffer => {
 let actual = buffer.getChannelData(0);
 // Because the setTarget was cancelled, the output should be a
 // constant.
 should(
 actual,
 'After cancelling current setValueCurve event starting now, output')
 .beConstantValueOf(0.5);
 })
 .then(task.done.bind(task));
 });

 audit.define(
 {
 label: 'linear, cancel, linear, cancel, linear',
 description: 'Schedules 3 linear ramps, cancelling 2 of them, '
 + 'so that we end up with 2 cancel events next to each other'
 },
 (task, should) => {
 cancelTest2(
 should,
 linearRampTest('1st linearRamp'),
 {valueThreshold: 0, curveThreshold: 5.9605e-8},
 (g, cancelTime, expectedConstant, cancelTime2) => {
 // Ramp from first cancel time to the end will be cancelled at
 // second cancel time.
 const v1 = expectedConstant;
 const t1 = cancelTime;
 const v2 = 2;
 const t2 = renderDuration;
 g[0].gain.linearRampToValueAtTime(v2, t2);
 g[2].gain.setValueAtTime(v1, t1);
 g[2].gain.linearRampToValueAtTime(v2, t2);

 const expectedConstant2 =
 audioParamLinearRamp(cancelTime2, v1, t1, v2, t2);

 return {
 constantEndTime: cancelTime,
 message: `2nd linearRamp(${v2}, ${t2})`,
 expectedConstant2
 };
 },
 (g, cancelTime2, expectedConstant2) => {
 // Ramp from second cancel time to the end.
 const v3 = 0;
 const t3 = renderDuration;
 g[0].gain.linearRampToValueAtTime(v3, t3);
 g[3].gain.setValueAtTime(expectedConstant2, cancelTime2);
 g[3].gain.linearRampToValueAtTime(v3, t3);
 return {
 constantEndTime2: cancelTime2,
 message2: `3rd linearRamp(${v3}, ${t3})`,
 };
 })
 .then(() => task.done());
 });

 audit.run();

 // Common function for doing a linearRamp test. This just does a linear
 // ramp from 0 to v0 at from time 0 to t0. Then another linear ramp is
 // scheduled from v0 to 0 from time t0 to t1. This is the ramp that is to
 // be cancelled.
 function linearRampTest(message) {
 return function(g, v0, t0, cancelTime) {
 g[0].gain.setValueAtTime(0, 0);
 g[1].gain.setValueAtTime(0, 0);
 g[0].gain.linearRampToValueAtTime(v0, t0);
 g[1].gain.linearRampToValueAtTime(v0, t0);

 let v1 = 0;
 let t1 = renderDuration;
 g[0].gain.linearRampToValueAtTime(v1, t1);
 g[1].gain.linearRampToValueAtTime(v1, t1);

 expectedConstant =
 Math.fround(v0 + (v1 - v0) * (cancelTime - t0) / (t1 - t0));

 return {
 expectedConstant: expectedConstant,
 autoMessage:
 message + ': linearRampToValue(' + v1 + ', ' + t1 + ')',
 summary: message,
 };
 }
 }

 // Run the cancellation test. A set of automations is created and
 // canceled.
 //
 // |testerFunction| is a function that generates the automation to be
 // tested. It is given an array of 3 gain nodes, the value and time of an
 // initial linear ramp, and the time where the cancellation should occur.
 // The function must do the automations for the first two gain nodes. It
 // must return a dictionary with |expectedConstant| being the value at the
 // cancellation time, |autoMessage| for message to describe the test, and
 // |summary| for general summary message to be printed at the end of the
 // test.
 //
 // |thresholdOptions| is a property bag that specifies the error threshold
 // to use. |thresholdOptions.valueThreshold| is the error threshold for
 // comparing the actual constant output after cancelling to the expected
 // value. |thresholdOptions.curveThreshold| is the error threshold for
 // comparing the actual and expected automation curves before the
 // cancelation point.
 //
 // For cancellation tests, |postCancelTest| is a function that schedules
 // some automation after the cancellation. It takes 3 arguments: an array
 // of the gain nodes, the cancellation time, and the expected value at the
 // cancellation time. This function must return a dictionary consisting
 // of |constantEndtime| indicating when the held constant from
 // cancellation stops being constant, |message| giving a summary of what
 // automation is being used, and |errorThreshold| that is the error
 // threshold between the expected curve and the actual curve.
 //
 function cancelTest(
 should, testerFunction, thresholdOptions, postCancelTest) {
 // Create a context with three channels. Channel 0 is the test channel
 // containing the actual output that includes the cancellation of
 // events. Channel 1 is the expected data upto the cancellation so we
 // can verify the cancellation produced the correct result. Channel 2
 // is for verifying events inserted after the cancellation so we can
 // verify that automations are correctly generated after the
 // cancellation point.
 let context =
 new OfflineAudioContext(3, renderDuration * sampleRate, sampleRate);

 // Test source is a constant signal
 let src = context.createBufferSource();
 src.buffer = createConstantBuffer(context, 1, 1);
 src.loop = true;

 // We'll do the automation tests with three gain nodes. One (g0) will
 // have cancelAndHoldAtTime and the other (g1) will not. g1 is
 // used as the expected result for that automation up to the
 // cancellation point. They should be the same. The third node (g2) is
 // used for testing automations inserted after the cancellation point,
 // if any. g2 is the expected result from the cancellation point to the
 // end of the test.

 let g0 = context.createGain();
 let g1 = context.createGain();
 let g2 = context.createGain();
 let v0 = 1;
 let t0 = 0.01;

 let cancelTime = renderDuration / 2;

 // Test automation here. The tester function is responsible for setting
 // up the gain nodes with the desired automation for testing.
 autoResult = testerFunction([g0, g1, g2], v0, t0, cancelTime);
 let expectedConstant = autoResult.expectedConstant;
 let autoMessage = autoResult.autoMessage;
 let summaryMessage = autoResult.summary;

 // Cancel scheduled events somewhere in the middle of the test
 // automation.
 g0.gain.cancelAndHoldAtTime(cancelTime);

 let constantEndTime;
 if (postCancelTest) {
 postResult =
 postCancelTest([g0, g1, g2], cancelTime, expectedConstant);
 constantEndTime = postResult.constantEndTime;
 }

 // Connect everything together (with a merger to make a two-channel
 // result). Channel 0 is the test (with cancelAndHoldAtTime) and
 // channel 1 is the reference (without cancelAndHoldAtTime).
 // Channel 1 is used to verify that everything up to the cancellation
 // has the correct values.
 src.connect(g0);
 src.connect(g1);
 src.connect(g2);
 let merger = context.createChannelMerger(3);
 g0.connect(merger, 0, 0);
 g1.connect(merger, 0, 1);
 g2.connect(merger, 0, 2);
 merger.connect(context.destination);

 // Go!
 src.start();

 return context.startRendering().then(function(buffer) {
 let actual = buffer.getChannelData(0);
 let expected = buffer.getChannelData(1);

 // The actual output should be a constant from the cancel time to the
 // end. We use the last value of the actual output as the constant,
 // but we also want to compare that with what we thought it should
 // really be.

 let cancelFrame = Math.ceil(cancelTime * sampleRate);

 // Verify that the curves up to the cancel time are "identical". The
 // should be but round-off may make them differ slightly due to the
 // way cancelling is done.
 let endFrame = Math.floor(cancelTime * sampleRate);
 should(
 actual.slice(0, endFrame),
 autoMessage + ' up to time ' + cancelTime)
 .beCloseToArray(
 expected.slice(0, endFrame),
 {absoluteThreshold: thresholdOptions.curveThreshold});

 // Verify the output after the cancellation is a constant.
 let actualTail;
 let constantEndFrame;

 if (postCancelTest) {
 constantEndFrame = Math.ceil(constantEndTime * sampleRate);
 actualTail = actual.slice(cancelFrame, constantEndFrame);
 } else {
 actualTail = actual.slice(cancelFrame);
 }

 let actualConstant = actual[cancelFrame];

 should(
 actualTail,
 'Cancelling ' + autoMessage + ' at time ' + cancelTime)
 .beConstantValueOf(actualConstant);

 // Verify that the constant is the value we expect.
 should(
 actualConstant,
 'Expected value for cancelling ' + autoMessage + ' at time ' +
 cancelTime)
 .beCloseTo(
 expectedConstant,
 {threshold: thresholdOptions.valueThreshold});

 // Verify the curve after the constantEndTime matches our
 // expectations.
 if (postCancelTest) {
 let c2 = buffer.getChannelData(2);
 should(actual.slice(constantEndFrame), postResult.message)
 .beCloseToArray(
 c2.slice(constantEndFrame),
 {absoluteThreshold: postResult.errorThreshold || 0});
 }
 });
 }

 // Similar to cancelTest, but does 2 cancels.
 function cancelTest2(
 should, testerFunction, thresholdOptions,
 postCancelTest, postCancelTest2) {
 // Channel 0: Actual output that includes the cancellation of events.
 // Channel 1: Expected data up to the first cancellation.
 // Channel 2: Expected data from 1st cancellation to 2nd cancellation.
 // Channel 3: Expected data from 2nd cancellation to the end.
 const context =
 new OfflineAudioContext(4, renderDuration * sampleRate, sampleRate);

 const src = context.createConstantSource();

 // g0: Actual gain which will have cancelAndHoldAtTime called on it
 // twice.
 // g1: Expected gain from start to the 1st cancel.
 // g2: Expected gain from 1st cancel to the 2nd cancel.
 // g3: Expected gain from the 2nd cancel to the end.
 const g0 = context.createGain();
 const g1 = context.createGain();
 const g2 = context.createGain();
 const g3 = context.createGain();
 const v0 = 1;
 const t0 = 0.01;

 const cancelTime1 = renderDuration * 0.5;
 const cancelTime2 = renderDuration * 0.75;

 // Run testerFunction to generate the 1st ramp.
 const {
 expectedConstant, autoMessage, summaryMessage} =
 testerFunction([g0, g1, g2], v0, t0, cancelTime1);

 // 1st cancel, cancelling the 1st ramp.
 g0.gain.cancelAndHoldAtTime(cancelTime1);

 // Run postCancelTest to generate the 2nd ramp.
 const {
 constantEndTime, message, errorThreshold = 0, expectedConstant2} =
 postCancelTest(
 [g0, g1, g2], cancelTime1, expectedConstant, cancelTime2);

 // 2nd cancel, cancelling the 2nd ramp.
 g0.gain.cancelAndHoldAtTime(cancelTime2);

 // Run postCancelTest2 to generate the 3rd ramp.
 const {constantEndTime2, message2} =
 postCancelTest2([g0, g1, g2, g3], cancelTime2, expectedConstant2);

 // Connect everything together
 src.connect(g0);
 src.connect(g1);
 src.connect(g2);
 src.connect(g3);
 const merger = context.createChannelMerger(4);
 g0.connect(merger, 0, 0);
 g1.connect(merger, 0, 1);
 g2.connect(merger, 0, 2);
 g3.connect(merger, 0, 3);
 merger.connect(context.destination);

 // Go!
 src.start();

 return context.startRendering().then(function (buffer) {
 const actual = buffer.getChannelData(0);
 const expected1 = buffer.getChannelData(1);
 const expected2 = buffer.getChannelData(2);
 const expected3 = buffer.getChannelData(3);

 const cancelFrame1 = Math.ceil(cancelTime1 * sampleRate);
 const cancelFrame2 = Math.ceil(cancelTime2 * sampleRate);

 const constantEndFrame1 = Math.ceil(constantEndTime * sampleRate);
 const constantEndFrame2 = Math.ceil(constantEndTime2 * sampleRate);

 const actualTail1 = actual.slice(cancelFrame1, constantEndFrame1);
 const actualTail2 = actual.slice(cancelFrame2, constantEndFrame2);

 const actualConstant1 = actual[cancelFrame1];
 const actualConstant2 = actual[cancelFrame2];

 // Verify first section curve
 should(
 actual.slice(0, cancelFrame1),
 autoMessage + ' up to time ' + cancelTime1)
 .beCloseToArray(
 expected1.slice(0, cancelFrame1),
 {absoluteThreshold: thresholdOptions.curveThreshold});

 // Verify that a value was held after 1st cancel
 should(
 actualTail1,
 'Cancelling ' + autoMessage + ' at time ' + cancelTime1)
 .beConstantValueOf(actualConstant1);

 // Verify that held value after 1st cancel was correct
 should(
 actualConstant1,
 'Expected value for cancelling ' + autoMessage + ' at time ' +
 cancelTime1)
 .beCloseTo(
 expectedConstant,
 {threshold: thresholdOptions.valueThreshold});

 // Verify middle section curve
 should(actual.slice(constantEndFrame1, cancelFrame2), message)
 .beCloseToArray(
 expected2.slice(constantEndFrame1, cancelFrame2),
 {absoluteThreshold: errorThreshold});

 // Verify that a value was held after 2nd cancel
 should(
 actualTail2,
 'Cancelling ' + message + ' at time ' + cancelTime2)
 .beConstantValueOf(actualConstant2);

 // Verify that held value after 2nd cancel was correct
 should(
 actualConstant2,
 'Expected value for cancelling ' + message + ' at time ' +
 cancelTime2)
 .beCloseTo(
 expectedConstant2,
 {threshold: thresholdOptions.valueThreshold});

 // Verify end section curve
 should(actual.slice(constantEndFrame2), message2)
 .beCloseToArray(
 expected3.slice(constantEndFrame2),
 {absoluteThreshold: errorThreshold || 0});
 });
 }
 