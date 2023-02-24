
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

 let sampleRate = 44100.0;
 let lengthInSampleFrames = 512;

 let context = 0;
 let sourceBuffer;
 let sourceNode;
 let channelSplitter;
 let channelMerger;

 function createStereoBufferWithDCOffset(length, sampleRate, offset) {
 let buffer = context.createBuffer(2, length, sampleRate);
 let n = buffer.length;
 let channelL = buffer.getChannelData(0);
 let channelR = buffer.getChannelData(1);

 for (let i = 0; i < n; ++i) {
 channelL[i] = offset;
 channelR[i] = -1.0 * offset;
 }

 return buffer;
 }

 // checkResult() checks that the rendered buffer is stereo and that the
 // left channel is all -1 and right channel all +1. In other words, we've
 // reversed the order of the two channels.
 function checkResult(buffer, should) {
 let success = true;

 if (buffer.numberOfChannels == 2) {
 let bufferDataL = buffer.getChannelData(0);
 let bufferDataR = buffer.getChannelData(1);

 success = should(bufferDataL, 'Left channel').beConstantValueOf(-1) &&
 success;
 success = should(bufferDataR, 'Right channel').beConstantValueOf(1) &&
 success;
 } else {
 success = false;
 }

 should(success, 'Left and right channels were exchanged')
 .message('correctly', 'incorrectly');
 }

 audit.define(
 {
 label: 'construction',
 description: 'Construction of ChannelSplitterNode'
 },
 function(task, should) {

 // Create stereo offline audio context.
 context =
 new OfflineAudioContext(2, lengthInSampleFrames, sampleRate);

 let splitternode;
 should(() => {
 let splitternode = context.createChannelSplitter(0);
 }, 'createChannelSplitter(0)').throw(DOMException, 'IndexSizeError');

 should(() => {
 splitternode = context.createChannelSplitter(33);
 }, 'createChannelSplitter(33)').throw(DOMException, 'IndexSizeError');

 should(() => {
 splitternode = context.createChannelSplitter(32);
 }, 'splitternode = context.createChannelSplitter(32)').notThrow();

 should(splitternode.numberOfOutputs, 'splitternode.numberOfOutputs')
 .beEqualTo(32);
 should(splitternode.numberOfInputs, 'splitternode.numberOfInputs')
 .beEqualTo(1)

 should(() => {
 splitternode = context.createChannelSplitter();
 }, 'splitternode = context.createChannelSplitter()').notThrow();

 should(splitternode.numberOfOutputs, 'splitternode.numberOfOutputs')
 .beEqualTo(6);

 task.done();
 });

 audit.define(
 {
 label: 'functionality',
 description: 'Functionality of ChannelSplitterNode'
 },
 function(task, should) {

 // Create a stereo buffer, with all +1 values in left channel, all
 // -1 in right channel.
 sourceBuffer = createStereoBufferWithDCOffset(
 lengthInSampleFrames, sampleRate, 1);

 sourceNode = context.createBufferSource();
 sourceNode.buffer = sourceBuffer;

 // Create a channel splitter and connect it so that it split the
 // stereo stream into two mono streams.
 channelSplitter = context.createChannelSplitter(2);
 sourceNode.connect(channelSplitter);

 // Create a channel merger to merge the output of channel splitter.
 channelMerger = context.createChannelMerger();
 channelMerger.connect(context.destination);

 // When merging, exchange channel layout: left->right, right->left
 channelSplitter.connect(channelMerger, 0, 1);
 channelSplitter.connect(channelMerger, 1, 0);

 sourceNode.start(0);

 context.startRendering()
 .then(buffer => checkResult(buffer, should))
 .then(task.done.bind(task));
 });

 audit.run();
 