
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
await import(path.join(cwd, '/webaudio/js/helpers.js'));

 registerProcessor("test-throw", class param extends AudioWorkletProcessor {
 constructor() {
 super()
 this.i = 0;
 this.port.onmessage = function(arg) {
 throw "asdasd";
 }
 }
 process(input, output, parameters) {
 this.i++;
 this.port.postMessage(this.i);
 return true;
 }
 });
 
 var latestIndexReceived = 0;
 var node = null;
 var ac = null;
 promise_setup(function() {
 ac = new AudioContext();
 var url = URLFromScriptsElements(["processor"]);
 return ac.audioWorklet.addModule(url).then(function() {
 node = new AudioWorkletNode(ac, "test-throw");
 node.port.onmessage = function(e) {
 latestIndexReceived = parseInt(e.data);
 };
 });
 });
 promise_test(async t => {
 var currentIndex = latestIndexReceived;
 await t.step_wait(() => {
 return latestIndexReceived > currentIndex;
 }, "Process is still being called");

 node.port.postMessage("asdasd"); // This throws on the processor side.
 node.onprocessorerror = function() {
 assert_true(false, "onprocessorerror must not be called.");
 };
 currentIndex = latestIndexReceived;
 await t.step_wait(() => {
 return latestIndexReceived > currentIndex + 2;
 }, "Process is still being called");
 }, `Throwing in an onmessage handler in the AudioWorkletGlobalScope shouldn't stop AudioWorkletProcessor`);
 