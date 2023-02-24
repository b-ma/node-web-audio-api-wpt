
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

 let context = 0;
 let context2 = 0;
 let context3 = 0;

 audit.define(
 {label: 'test', description: 'Basic tests for AudioNode API.'},
 function(task, should) {

 context = new AudioContext();
 globalThis.audioNode = context.createBufferSource();

 // Check input and output numbers of AudioSourceNode.
 should(audioNode.numberOfInputs, 'AudioBufferSource.numberOfInputs')
 .beEqualTo(0);
 should(
 audioNode.numberOfOutputs, 'AudioBufferSource.numberOfOutputs')
 .beEqualTo(1);

 // Check input and output numbers of AudioDestinationNode
 should(
 context.destination.numberOfInputs,
 'AudioContext.destination.numberOfInputs')
 .beEqualTo(1);
 should(
 context.destination.numberOfOutputs,
 'AudioContext.destination.numberOfOutputs')
 .beEqualTo(0);

 // Try calling connect() method with illegal values.
 should(
 () => audioNode.connect(0, 0, 0), 'audioNode.connect(0, 0, 0)')
 .throw(TypeError);
 should(
 () => audioNode.connect(null, 0, 0),
 'audioNode.connect(null, 0, 0)')
 .throw(TypeError);
 should(
 () => audioNode.connect(context.destination, 5, 0),
 'audioNode.connect(context.destination, 5, 0)')
 .throw(DOMException, 'IndexSizeError');
 should(
 () => audioNode.connect(context.destination, 0, 5),
 'audioNode.connect(context.destination, 0, 5)')
 .throw(DOMException, 'IndexSizeError');

 should(
 () => audioNode.connect(context.destination, 0, 0),
 'audioNode.connect(context.destination, 0, 0)')
 .notThrow();

 // Create a new context and try to connect the other context's node
 // to this one.
 context2 = new AudioContext();
 should(
 () => globalThis.audioNode.connect(context2.destination),
 'Connecting a node to a different context')
 .throw(DOMException, 'InvalidAccessError');

 // 3-arg AudioContext doesn't create an offline context anymore.
 should(
 () => context3 = new AudioContext(1, 44100, 44100),
 'context3 = new AudioContext(1, 44100, 44100)')
 .throw(TypeError);

 // Ensure it is an EventTarget
 should(
 audioNode instanceof EventTarget, 'AudioNode is an EventTarget')
 .beTrue();

 task.done();
 });

 audit.run();
 