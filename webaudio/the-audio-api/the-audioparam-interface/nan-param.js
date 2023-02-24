
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

 // See
 // https://webaudio.github.io/web-audio-api/#computation-of-value.
 //
 // The computed value must replace NaN values in the output with
 // the default value of the param.
 audit.define('AudioParam NaN', async (task, should) => {
 // For testing, we only need a small number of frames; and
 // a low sample rate is perfectly fine. Use two channels.
 // The first channel is for the AudioParam output. The
 // second channel is for the AudioParam input.
 let context = new OfflineAudioContext(
 {numberOfChannels: 2, length: 256, sampleRate: 8192});
 let merger = new ChannelMergerNode(
 context, {numberOfInputs: context.destination.channelCount});
 merger.connect(context.destination);

 // A constant source with a huge value.
 let mod = new ConstantSourceNode(context, {offset: 1e30});

 // Gain nodes with a huge positive gain and huge negative
 // gain. Combined with the huge offset in |mod|, the
 // output of the gain nodes are +Infinity and -Infinity.
 let gainPos = new GainNode(context, {gain: 1e30});
 let gainNeg = new GainNode(context, {gain: -1e30});

 mod.connect(gainPos);
 mod.connect(gainNeg);

 // Connect these to the second merger channel. This is a
 // sanity check that the AudioParam input really is NaN.
 gainPos.connect(merger, 0, 1);
 gainNeg.connect(merger, 0, 1);

 // Source whose AudioParam is connected to the graph
 // that produces NaN values. Use a non-default value offset
 // just in case something is wrong we get default for some
 // other reason.
 let src = new ConstantSourceNode(context, {offset: 100});

 gainPos.connect(src.offset);
 gainNeg.connect(src.offset);

 // AudioParam output goes to channel 1 of the destination.
 src.connect(merger, 0, 0);

 // Let's go!
 mod.start();
 src.start();

 let buffer = await context.startRendering();

 let input = buffer.getChannelData(1);
 let output = buffer.getChannelData(0);

 // Have to test manually for NaN values in the input because
 // NaN fails all comparisons.
 let isNaN = true;
 for (let k = 0; k < input.length; ++k) {
 if (!Number.isNaN(input[k])) {
 isNaN = false;
 break;
 }
 }

 should(isNaN, 'AudioParam input contains only NaN').beTrue();

 // Output of the AudioParam should have all NaN values
 // replaced by the default.
 should(output, 'AudioParam output')
 .beConstantValueOf(src.offset.defaultValue);

 task.done();
 });

 audit.run();
 