
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
  
const get_node_and_message = (context) => {
 const node = new AudioWorkletNode(context, 'port-processor');
 return new Promise((resolve) => {
 node.port.onmessage = (event) => resolve({node: node, event: event});
 });
};
const ping_for_message = (node) => {
 return new Promise((resolve) => {
 node.port.onmessage = resolve;
 node.port.postMessage('ping');
 });
};
const modulePath = 'processors/port-processor.js';

promise_test(async () => {
 const realtime = new AudioContext();
 await realtime.audioWorklet.addModule(modulePath);
 await realtime.suspend();
 const currentTime = realtime.currentTime;
 let {node, event} = await get_node_and_message(realtime);
 assert_equals(event.data.timeStamp, currentTime, 'created message time');
 event = await ping_for_message(node);
 assert_equals(event.data.timeStamp, currentTime, 'pong time');
}, 'realtime suspended');

let offline;
promise_test(async () => {
 offline = new OfflineAudioContext({length: 128 + 1, sampleRate: 16384});
 await offline.audioWorklet.addModule(modulePath);
 assert_equals(offline.currentTime, 0, 'time before start');
 let {node, event} = await get_node_and_message(offline);
 assert_equals(event.data.timeStamp, 0, 'created time before start');
 event = await ping_for_message(node);
 assert_equals(event.data.timeStamp, 0, 'pong time before start');
}, 'offline before start');

promise_test(async () => {
 await offline.startRendering();
 const expected = 2 * 128 / offline.sampleRate;
 assert_equals(offline.currentTime, expected, 'time on complete');
 let {node, event} = await get_node_and_message(offline);
 assert_equals(event.data.timeStamp, expected, "created time on complete");
 event = await ping_for_message(node);
 assert_equals(event.data.timeStamp, expected, "pong time on complete");
}, 'offline on complete');
