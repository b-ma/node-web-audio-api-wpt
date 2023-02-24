
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

 let renderQuantum = 128;

 let numberOfChannels = 2;
 let sampleRate = 44100;
 let renderDuration = 0.5;
 let disconnectTime = 0.5 * renderDuration;

 let audit = Audit.createTaskRunner();

 // Task: Check if the merger outputs a silent channel when an input is
 // disconnected.
 audit.define('silent-disconnect', (task, should) => {
 let context = new OfflineAudioContext(
 numberOfChannels, renderDuration * sampleRate, sampleRate);
 let merger = context.createChannelMerger();
 let source1 = context.createBufferSource();
 let source2 = context.createBufferSource();

 // Create and assign a constant buffer.
 let bufferDCOffset = createConstantBuffer(context, 1, 1);
 source1.buffer = source2.buffer = bufferDCOffset;
 source1.loop = source2.loop = true;

 // Connect the output of source into the 4th input of merger. The merger
 // should produce 6 channel output.
 source1.connect(merger, 0, 0);
 source2.connect(merger, 0, 1);
 merger.connect(context.destination);
 source1.start();
 source2.start();

 // Schedule the disconnection of |source2| at the half of render
 // duration.
 context.suspend(disconnectTime).then(function() {
 source2.disconnect();
 context.resume();
 });

 context.startRendering()
 .then(function(buffer) {
 // The entire first channel of the output should be 1.
 should(buffer.getChannelData(0), 'Channel #0')
 .beConstantValueOf(1);

 // Calculate the first zero index in the second channel.
 let channel1 = buffer.getChannelData(1);
 let disconnectIndex = disconnectTime * sampleRate;
 disconnectIndex = renderQuantum *
 Math.floor(
 (disconnectIndex + renderQuantum - 1) / renderQuantum);
 let firstZeroIndex = channel1.findIndex(function(element, index) {
 if (element === 0)
 return index;
 });

 // The second channel should contain 1, and 0 after the
 // disconnection.
 should(channel1, 'Channel #1').containValues([1, 0]);
 should(
 firstZeroIndex, 'The index of first zero in the channel #1')
 .beEqualTo(disconnectIndex);
 })
 .then(() => task.done());
 });

 audit.run();
 