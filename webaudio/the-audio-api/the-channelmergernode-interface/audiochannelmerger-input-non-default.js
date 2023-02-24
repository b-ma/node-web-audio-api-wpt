
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
 numberOfChannels: 7,

 // Create a mono source buffer filled with '1'.
 testBufferContent: [1],

 // Connect the output of source into the 7th input of merger.
 mergerInputIndex: 6,

 // 7th channel should be '1'.
 expected: [0, 0, 0, 0, 0, 0, 1],
 }).then(() => task.done());
 });


 // Task: Check if a stereo input is being down-mixed to mono channel
 // correctly based on the mixing rule.
 audit.define('stereo-down-mixing', (task, should) => {
 testMergerInput(should, {
 numberOfChannels: 7,

 // Create a stereo buffer filled with '1' and '2' for left and right
 // channels respectively.
 testBufferContent: [1, 2],

 // Connect the output of source into the 7th input of merger.
 mergerInputIndex: 6,

 // The result of summed and down-mixed stereo audio should be 1.5.
 // (= 1 * 0.5 + 2 * 0.5)
 expected: [0, 0, 0, 0, 0, 0, 1.5],
 }).then(() => task.done());
 });


 // Task: Check if 3-channel input gets processed by the 'discrete' mixing
 // rule.
 audit.define('undefined-channel-layout', (task, should) => {
 testMergerInput(should, {
 numberOfChannels: 7,

 // Create a 3-channel buffer filled with '1', '2', and '3'
 // respectively.
 testBufferContent: [1, 2, 3],

 // Connect the output of source into the 7th input of merger.
 mergerInputIndex: 6,

 // The result of summed stereo audio should be 1 because 3-channel is
 // not a canonical layout, so the input channel 2 and 3 should be
 // dropped by 'discrete' mixing rule.
 expected: [0, 0, 0, 0, 0, 0, 1],
 }).then(() => task.done());
 });

 audit.run();
 