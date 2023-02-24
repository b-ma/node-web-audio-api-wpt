
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
await import(path.join(cwd, '/webaudio/resources/merger-testing.js'));

 let audit = Audit.createTaskRunner();

 // Task: Check if an inactive input renders a silent mono channel in the
 // output.
 audit.define('silent-channel', (task, should) => {
 testMergerInput(should, {
 numberOfChannels: 6,

 // Create a mono source buffer filled with '1'.
 testBufferContent: [1],

 // Connect the output of source into the 4th input of merger.
 mergerInputIndex: 3,

 // All channels should contain 0, except channel 4 which should be 1.
 expected: [0, 0, 0, 1, 0, 0],
 }).then(() => task.done());
 });


 // Task: Check if a stereo input is being down-mixed to mono channel
 // correctly based on the mixing rule.
 audit.define('stereo-down-mixing', (task, should) => {
 testMergerInput(should, {
 numberOfChannels: 6,

 // Create a stereo buffer filled with '1' and '2' for left and right
 // channels respectively.
 testBufferContent: [1, 2],

 // Connect the output of source into the 1st input of merger.
 mergerInputIndex: undefined,

 // The result of summed and down-mixed stereo audio should be 1.5.
 // (= 1 * 0.5 + 2 * 0.5)
 expected: [1.5, 0, 0, 0, 0, 0],
 }).then(() => task.done());
 });


 // Task: Check if 3-channel input gets processed by the 'discrete' mixing
 // rule.
 audit.define('undefined-channel-layout', (task, should) => {
 testMergerInput(should, {
 numberOfChannels: 6,

 // Create a 3-channel buffer filled with '1', '2', and '3'
 // respectively.
 testBufferContent: [1, 2, 3],

 // Connect the output of source into the 1st input of merger.
 mergerInputIndex: undefined,

 // The result of summed stereo audio should be 1 because 3-channel is
 // not a canonical layout, so the input channel 2 and 3 should be
 // dropped by 'discrete' mixing rule.
 expected: [1, 0, 0, 0, 0, 0],
 }).then(() => task.done());
 });


 // Task: Merging two inputs into a single stereo stream.
 audit.define('merging-to-stereo', (task, should) => {

 // For this test, the number of channel should be 2.
 let context = new OfflineAudioContext(2, 128, 44100);
 let merger = context.createChannelMerger();
 let source1 = context.createBufferSource();
 let source2 = context.createBufferSource();

 // Create a DC offset buffer (mono) filled with 1 and assign it to BS
 // nodes.
 let positiveDCOffset = createConstantBuffer(context, 128, 1);
 let negativeDCOffset = createConstantBuffer(context, 128, -1);
 source1.buffer = positiveDCOffset;
 source2.buffer = negativeDCOffset;

 // Connect: BS#1 => merger_input#0, BS#2 => Inverter => merger_input#1
 source1.connect(merger, 0, 0);
 source2.connect(merger, 0, 1);
 merger.connect(context.destination);
 source1.start();
 source2.start();

 context.startRendering().then(function(buffer) {

 // Channel#0 = 1, Channel#1 = -1
 should(buffer.getChannelData(0), 'Channel #0').beConstantValueOf(1);
 should(buffer.getChannelData(1), 'Channel #1').beConstantValueOf(-1);

 task.done();
 });
 });


 audit.run();
 