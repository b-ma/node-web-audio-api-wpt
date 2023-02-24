
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

 promise_test(async () => {
 const context = new AudioContext();

 let filePath = 'processors/promise-processor.js';

 await context.audioWorklet.addModule(filePath);
 await context.suspend();
 let node1 = new AudioWorkletNode(context, 'promise-processor');
 let node2 = new AudioWorkletNode(context, 'promise-processor');

 // Connecting to the destination is not strictly necessary in theory,
 // but see
 // https://bugs.chromium.org/p/chromium/issues/detail?id=1045926
 // for why it is in practice.
 node1.connect(node2).connect(context.destination);

 await context.resume();

 // The second node is the one that is going to receive the message,
 // per spec: it is the second that will be processed, each time.
 const e = await new Promise((resolve) => {
 node2.port.onmessage = resolve;
 });
 context.close();
 assert_equals(e.data, "ok",
 `Microtask checkpoints are performed
 in between render quantum`);
 }, "test");
 