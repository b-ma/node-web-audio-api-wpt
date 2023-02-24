
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
await import('../../resources/audit-util.js');
await import('../../resources/audit.js');

 // Arbitrary sample rate and render length.
 let sampleRate = 48000;
 let renderFrames = 128;

 let audit = Audit.createTaskRunner();

 audit.define('ref-distance-error', (task, should) => {
 testDistanceLimits(should, {name: 'refDistance', isZeroAllowed: true});
 task.done();
 });

 audit.define('max-distance-error', (task, should) => {
 testDistanceLimits(should, {name: 'maxDistance', isZeroAllowed: false});
 task.done();
 });

 function testDistanceLimits(should, options) {
 // Verify that exceptions are thrown for invalid values of refDistance.
 let context = new OfflineAudioContext(1, renderFrames, sampleRate);

 let attrName = options.name;
 let prefix = 'new PannerNode(c, {' + attrName + ': ';

 should(function() {
 let nodeOptions = {};
 nodeOptions[attrName] = -1;
 new PannerNode(context, nodeOptions);
 }, prefix + '-1})').throw(RangeError);

 if (options.isZeroAllowed) {
 should(function() {
 let nodeOptions = {};
 nodeOptions[attrName] = 0;
 new PannerNode(context, nodeOptions);
 }, prefix + '0})').notThrow();
 } else {
 should(function() {
 let nodeOptions = {};
 nodeOptions[attrName] = 0;
 new PannerNode(context, nodeOptions);
 }, prefix + '0})').throw(RangeError);
 }

 // The smallest representable positive single float.
 let leastPositiveDoubleFloat = 4.9406564584124654e-324;

 should(function() {
 let nodeOptions = {};
 nodeOptions[attrName] = leastPositiveDoubleFloat;
 new PannerNode(context, nodeOptions);
 }, prefix + leastPositiveDoubleFloat + '})').notThrow();

 prefix = 'panner.' + attrName + ' = ';
 panner = new PannerNode(context);
 should(function() {
 panner[attrName] = -1;
 }, prefix + '-1').throw(RangeError);

 if (options.isZeroAllowed) {
 should(function() {
 panner[attrName] = 0;
 }, prefix + '0').notThrow();
 } else {
 should(function() {
 panner[attrName] = 0;
 }, prefix + '0').throw(RangeError);
 }

 should(function() {
 panner[attrName] = leastPositiveDoubleFloat;
 }, prefix + leastPositiveDoubleFloat).notThrow();
 }

 audit.define('min-distance', async (task, should) => {
 // Test clamping of panner distance to refDistance for all of the
 // distance models. The actual distance is arbitrary as long as it's
 // less than refDistance. We test default and non-default values for
 // the panner's refDistance and maxDistance.
 // correctly.
 await runTest(should, {
 distance: 0.01,
 distanceModel: 'linear',
 });
 await runTest(should, {
 distance: 0.01,
 distanceModel: 'exponential',
 });
 await runTest(should, {
 distance: 0.01,
 distanceModel: 'inverse',
 });
 await runTest(should, {
 distance: 2,
 distanceModel: 'linear',
 maxDistance: 1000,
 refDistance: 10,
 });
 await runTest(should, {
 distance: 2,
 distanceModel: 'exponential',
 maxDistance: 1000,
 refDistance: 10,
 });
 await runTest(should, {
 distance: 2,
 distanceModel: 'inverse',
 maxDistance: 1000,
 refDistance: 10,
 });
 task.done();
 });

 audit.define('max-distance', async (task, should) => {
 // Like the "min-distance" task, but for clamping to the max
 // distance. The actual distance is again arbitrary as long as it is
 // greater than maxDistance.
 await runTest(should, {
 distance: 20000,
 distanceModel: 'linear',
 });
 await runTest(should, {
 distance: 21000,
 distanceModel: 'exponential',
 });
 await runTest(should, {
 distance: 23000,
 distanceModel: 'inverse',
 });
 await runTest(should, {
 distance: 5000,
 distanceModel: 'linear',
 maxDistance: 1000,
 refDistance: 10,
 });
 await runTest(should, {
 distance: 5000,
 distanceModel: 'exponential',
 maxDistance: 1000,
 refDistance: 10,
 });
 await runTest(should, {
 distance: 5000,
 distanceModel: 'inverse',
 maxDistance: 1000,
 refDistance: 10,
 });
 task.done();
 });

 function runTest(should, options) {
 let context = new OfflineAudioContext(2, renderFrames, sampleRate);
 let src = new OscillatorNode(context, {
 type: 'sawtooth',
 frequency: 20 * 440,
 });

 // Set panner options. Use a non-default rolloffFactor so that the
 // various distance models look distinctly different.
 let pannerOptions = {};
 Object.assign(pannerOptions, options, {rolloffFactor: 0.5});

 let pannerRef = new PannerNode(context, pannerOptions);
 let pannerTest = new PannerNode(context, pannerOptions);

 // Split the panner output so we can grab just one of the output
 // channels.
 let splitRef = new ChannelSplitterNode(context, {numberOfOutputs: 2});
 let splitTest = new ChannelSplitterNode(context, {numberOfOutputs: 2});

 // Merge the panner outputs back into one stereo stream for the
 // destination.
 let merger = new ChannelMergerNode(context, {numberOfInputs: 2});

 src.connect(pannerTest).connect(splitTest).connect(merger, 0, 0);
 src.connect(pannerRef).connect(splitRef).connect(merger, 0, 1);

 merger.connect(context.destination);

 // Move the panner some distance away. Arbitrarily select the x
 // direction. For the reference panner, manually clamp the distance.
 // All models clamp the distance to a minimum of refDistance. Only the
 // linear model also clamps to a maximum of maxDistance.
 let xRef = Math.max(options.distance, pannerRef.refDistance);

 if (pannerRef.distanceModel === 'linear') {
 xRef = Math.min(xRef, pannerRef.maxDistance);
 }

 let xTest = options.distance;

 pannerRef.positionZ.setValueAtTime(xRef, 0);
 pannerTest.positionZ.setValueAtTime(xTest, 0);

 src.start();

 return context.startRendering().then(function(resultBuffer) {
 let actual = resultBuffer.getChannelData(0);
 let expected = resultBuffer.getChannelData(1);

 should(
 xTest < pannerRef.refDistance || xTest > pannerRef.maxDistance,
 'Model: ' + options.distanceModel + ': Distance (' + xTest +
 ') is outside the range [' + pannerRef.refDistance + ', ' +
 pannerRef.maxDistance + ']')
 .beEqualTo(true);
 should(actual, 'Test panner output ' + JSON.stringify(options))
 .beEqualToArray(expected);
 });
 }

 audit.run();
 