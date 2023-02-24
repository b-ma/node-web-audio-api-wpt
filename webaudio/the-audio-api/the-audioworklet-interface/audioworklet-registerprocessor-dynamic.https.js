
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

 const t = async_test('Dynamic registration in AudioWorkletGlobalScope');

 const realtimeContext = new AudioContext();
 const filePath = 'processors/dynamic-register-processor.js';

 // Test if registering an AudioWorkletProcessor dynamically (after the
 // initial module script loading) works correctly. In the construction of
 // nodeB (along with ProcessorB), it registers ProcessorA's definition.
 realtimeContext.audioWorklet.addModule(filePath).then(() => {
 const nodeB = new AudioWorkletNode(realtimeContext, 'ProcessorB');
 assert_true(nodeB instanceof AudioWorkletNode,
 'nodeB should be instance of AudioWorkletNode');
 nodeB.port.postMessage({});
 nodeB.port.onmessage = () => {
 const nodeA = new AudioWorkletNode(realtimeContext, 'ProcessorA');
 t.step(() => {
 assert_true(nodeA instanceof AudioWorkletNode,
 'nodeA should be instance of AudioWorkletNode');
 });
 t.done();
 };
 });
 