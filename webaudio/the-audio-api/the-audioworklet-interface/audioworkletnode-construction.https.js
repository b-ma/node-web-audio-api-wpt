
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

 let audit = Audit.createTaskRunner();

 let realtimeContext = new AudioContext();

 let filePath = 'processors/dummy-processor.js';

 // Test if an exception is thrown correctly when AWN constructor is
 // invoked before resolving |.addModule()| promise.
 audit.define(
 {label: 'construction-before-module-loading'},
 (task, should) => {
 should(() => new AudioWorkletNode(realtimeContext, 'dummy'),
 'Creating a node before loading a module should throw.')
 .throw(DOMException, 'InvalidStateError');

 task.done();
 });

 // Test the construction of AudioWorkletNode after the resolution of
 // |.addModule()|. Also the constructor must throw an exception when
 // a unregistered node name was given.
 audit.define(
 {label: 'construction-after-module-loading'},
 (task, should) => {
 realtimeContext.audioWorklet.addModule(filePath).then(() => {
 let dummyWorkletNode =
 new AudioWorkletNode(realtimeContext, 'dummy');
 should(dummyWorkletNode instanceof AudioWorkletNode,
 '"dummyWorkletNode" is an instance of AudioWorkletNode')
 .beTrue();
 should(() => new AudioWorkletNode(realtimeContext, 'foobar'),
 'Unregistered name "foobar" must throw an exception.')
 .throw();
 task.done();
 });
 });

 audit.run();
 