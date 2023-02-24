
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
await import(path.join(cwd, '/webaudio/resources/audionodeoptions.js'));

 let context;

 let audit = Audit.createTaskRunner();

 audit.define('initialize', (task, should) => {
 context = initializeContext(should);
 task.done();
 });

 audit.define('invalid constructor', (task, should) => {
 testInvalidConstructor(should, 'StereoPannerNode', context);
 task.done();
 });

 audit.define('default constructor', (task, should) => {
 let prefix = 'node0';
 let node = testDefaultConstructor(should, 'StereoPannerNode', context, {
 prefix: prefix,
 numberOfInputs: 1,
 numberOfOutputs: 1,
 channelCount: 2,
 channelCountMode: 'clamped-max',
 channelInterpretation: 'speakers'
 });

 testDefaultAttributes(should, node, prefix, [{name: 'pan', value: 0}]);

 task.done();
 });

 audit.define('test AudioNodeOptions', (task, should) => {
 // Can't use testAudioNodeOptions because the constraints for this node
 // are not supported there.
 let node;

 // An array of tests.
 [{
 // Test that we can set the channel count to 1 or 2 and that other
 // channel counts throw an error.
 attribute: 'channelCount',
 tests: [
 {value: 1}, {value: 2}, {value: 0, error: 'NotSupportedError'},
 {value: 3, error: 'NotSupportedError'},
 {value: 99, error: 'NotSupportedError'}
 ]
 },
 {
 // Test channelCountMode. A mode of "max" is illegal, but others are
 // ok. But also throw an error of unknown values.
 attribute: 'channelCountMode',
 tests: [
 {value: 'clamped-max'}, {value: 'explicit'},
 {value: 'max', error: 'NotSupportedError'},
 {value: 'foobar', error: TypeError}
 ]
 },
 {
 // Test channelInterpretation can be set for valid values and an
 // error is thrown for others.
 attribute: 'channelInterpretation',
 tests: [
 {value: 'speakers'}, {value: 'discrete'},
 {value: 'foobar', error: TypeError}
 ]
 }].forEach(entry => {
 entry.tests.forEach(testItem => {
 let options = {};
 options[entry.attribute] = testItem.value;

 const testFunction = () => {
 node = new StereoPannerNode(context, options);
 };
 const testDescription =
 `new StereoPannerNode(c, ${JSON.stringify(options)})`;

 if (testItem.error) {
 testItem.error === TypeError
 ? should(testFunction, testDescription).throw(TypeError)
 : should(testFunction, testDescription)
 .throw(DOMException, 'NotSupportedError');
 } else {
 should(testFunction, testDescription).notThrow();
 should(node[entry.attribute], `node.${entry.attribute}`)
 .beEqualTo(options[entry.attribute]);
 }
 });
 });

 task.done();
 });

 audit.define('constructor with options', (task, should) => {
 let node;
 let options = {
 pan: 0.75,
 };

 should(
 () => {
 node = new StereoPannerNode(context, options);
 },
 'node1 = new StereoPannerNode(, ' + JSON.stringify(options) + ')')
 .notThrow();
 should(
 node instanceof StereoPannerNode,
 'node1 instanceof StereoPannerNode')
 .beEqualTo(true);

 should(node.pan.value, 'node1.pan.value').beEqualTo(options.pan);

 task.done();
 });

 audit.run();
 