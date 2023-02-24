
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

 // Task: Checking constraints in ChannelMergerNode.
 audit.define('exceptions-channels', (task, should) => {
 let context = new OfflineAudioContext(2, 128, 44100);
 let merger;

 should(function() {
 merger = context.createChannelMerger();
 }, 'context.createChannelMerger()').notThrow();

 should(function() {
 merger = context.createChannelMerger(0);
 }, 'context.createChannelMerger(0)').throw(DOMException, 'IndexSizeError');

 should(function() {
 merger = context.createChannelMerger(32);
 }, 'context.createChannelMerger(32)').notThrow();

 // Can't create a channel merger with 33 channels because the audio
 // context has a 32-channel-limit in Chrome.
 should(function() {
 merger = context.createChannelMerger(33);
 }, 'context.createChannelMerger(33)').throw(DOMException, 'IndexSizeError');

 task.done();
 });

 // Task: checking the channel-related properties have the correct value
 // and can't be changed.
 audit.define('exceptions-properties', (task, should) => {
 let context = new OfflineAudioContext(2, 128, 44100);
 let merger = context.createChannelMerger();

 should(merger.channelCount, 'merger.channelCount').beEqualTo(1);

 should(function() {
 merger.channelCount = 3;
 }, 'merger.channelCount = 3').throw(DOMException, 'InvalidStateError');

 should(merger.channelCountMode, 'merger.channelCountMode')
 .beEqualTo('explicit');

 should(function() {
 merger.channelCountMode = 'max';
 }, 'merger.channelCountMode = "max"').throw(DOMException, 'InvalidStateError');

 task.done();
 });

 audit.run();
 