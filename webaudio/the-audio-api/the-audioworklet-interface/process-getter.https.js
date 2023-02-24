
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
  
const do_test = async (node_name) => {
 const context = new AudioContext();
 const filePath = `processors/${node_name}-processor.js`;
 await context.audioWorklet.addModule(filePath);
 const node = new AudioWorkletNode(context, node_name);
 const event = await new Promise((resolve) => {
 node.port.onmessage = resolve;
 });
 assert_equals(event.data.message, "done");
};

// Includes testing for https://github.com/WebAudio/web-audio-api/pull/2104
promise_test(async () => do_test('process-getter-test-prototype'),
 "'process' getter on prototype");

promise_test(async () => do_test('process-getter-test-instance'),
 "'process' getter on instance");
