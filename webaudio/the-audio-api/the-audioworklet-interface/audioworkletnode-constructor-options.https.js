
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
await import(path.join(cwd, '/webaudio/resources/audit.js'));

 const sampleRate = 48000;

 const audit = Audit.createTaskRunner();
 let context;

 let filePath = 'processors/dummy-processor.js';

 // Load script file and create a OfflineAudiocontext.
 audit.define('setup', (task, should) => {
 context = new OfflineAudioContext(1, 1, sampleRate);
 context.audioWorklet.addModule(filePath).then(() => {
 task.done();
 });
 });

 // Test AudioWorkletNode construction without AudioWorkletNodeOptions.
 audit.define('without-audio-node-options', (task, should) => {
 let testNode;
 should(
 () => testNode = new AudioWorkletNode(context, 'dummy'),
 'Creating AudioWOrkletNode without options')
 .notThrow();
 should(testNode instanceof AudioWorkletNode,
 'testNode is instance of AudioWorkletNode').beEqualTo(true);
 should(testNode.numberOfInputs,
 'testNode.numberOfInputs (default)').beEqualTo(1);
 should(testNode.numberOfOutputs,
 'testNode.numberOfOutputs (default)').beEqualTo(1);
 should(testNode.channelCount,
 'testNode.channelCount (default)').beEqualTo(2);
 should(testNode.channelCountMode,
 'testNode.channelCountMode (default)').beEqualTo('max');
 should(testNode.channelInterpretation,
 'testNode.channelInterpretation (default)')
 .beEqualTo('speakers');
 task.done();
 });

 // Test AudioWorkletNode constructor with AudioNodeOptions.
 audit.define('audio-node-options', (task, should) => {
 const options = {
 numberOfInputs: 7,
 numberOfOutputs: 18,
 channelCount: 4,
 channelCountMode: 'clamped-max',
 channelInterpretation: 'discrete'
 };
 const optionsString = JSON.stringify(options);

 let testNode;
 should(
 () => testNode = new AudioWorkletNode(context, 'dummy', options),
 'Creating AudioWOrkletNode with options: ' + optionsString)
 .notThrow();
 should(testNode.numberOfInputs,
 'testNode.numberOfInputs').beEqualTo(options.numberOfInputs);
 should(testNode.numberOfOutputs,
 'testNode.numberOfOutputs').beEqualTo(options.numberOfOutputs);
 should(testNode.channelCount,
 'testNode.channelCount').beEqualTo(options.channelCount);
 should(testNode.channelCountMode,
 'testNode.channelCountMode').beEqualTo(options.channelCountMode);
 should(testNode.channelInterpretation,
 'testNode.channelInterpretation')
 .beEqualTo(options.channelInterpretation);

 task.done();
 });

 // Test AudioWorkletNode.channelCount.
 audit.define('channel-count', (task, should) => {
 const options1 = {channelCount: 17};
 let testNode = new AudioWorkletNode(context, 'dummy', options1);
 should(testNode.channelCount, 'testNode.channelCount')
 .beEqualTo(options1.channelCount);

 const options2 = {channelCount: 0};
 should(
 () => new AudioWorkletNode(context, 'dummy', options2),
 'Creating AudioWorkletNode with channelCount 0')
 .throw(DOMException, 'NotSupportedError');

 const options3 = {channelCount: 33};
 should(
 () => new AudioWorkletNode(context, 'dummy', options3),
 'Creating AudioWorkletNode with channelCount 33')
 .throw(DOMException, 'NotSupportedError');

 task.done();
 });

 // Test AudioWorkletNode.channelCountMode.
 audit.define('channel-count-mode', (task, should) => {
 const channelCountModes = ['max', 'clamped-max', 'explicit'];
 channelCountModes.forEach((mode) => {
 const options = {channelCountMode: mode};
 let testNode = new AudioWorkletNode(context, 'dummy', options);
 should(testNode.channelCountMode,
 'testNode.channelCountMode (set via options.' + mode + ')')
 .beEqualTo(options.channelCountMode);
 });

 const options1 = {channelCountMode: 'foobar'};
 should(
 () => new AudioWorkletNode(context, 'dummy', options1),
 'Creating AudioWorkletNode with channelCountMode "foobar"')
 .throw(TypeError);

 task.done();
 });

 // Test AudioWorkletNode.channelInterpretation.
 audit.define('channel-interpretation', (task, should) => {
 const channelInterpretations = ['speakers', 'discrete'];
 channelInterpretations.forEach((interpretation) => {
 const options = {channelInterpretation: interpretation};
 let testNode = new AudioWorkletNode(context, 'dummy', options);
 should(
 testNode.channelInterpretation,
 'testNode.channelInterpretation (set via options.' +
 interpretation + ')')
 .beEqualTo(options.channelInterpretation);
 });

 const options1 = {channelInterpretation: 'foobar'};
 should(
 () => new AudioWorkletNode(context, 'dummy', options1),
 'Creating AudioWorkletNode with channelInterpretation "foobar"')
 .throw(TypeError);

 task.done();
 });

 audit.run();
 