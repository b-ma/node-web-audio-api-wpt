
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
  
const get_node_and_reply = (context) => {
 const node = new AudioWorkletNode(context, 'port-processor');
 return new Promise((resolve) => {
 node.port.onmessage = (event) => resolve({node: node, reply: event.data});
 });
};
const ping_for_reply = (node) => {
 return new Promise((resolve) => {
 node.port.onmessage = (event) => resolve(event.data);
 node.port.postMessage('ping');
 });
};
const assert_consistent = (constructReply, pong, expectedPongTime, name) => {
 const blockSize = 128;
 assert_equals(pong.timeStamp, expectedPongTime, `${name} pong time`);
 assert_equals(pong.processCallCount * blockSize,
 pong.currentFrame - constructReply.currentFrame,
 `${name} processed frame count`);
};
const modulePath = '/webaudio/the-audio-api/' +
 'the-audioworklet-interface/processors/port-processor.js';

promise_test(async () => {
 const realtime = new AudioContext();
 await realtime.audioWorklet.addModule(modulePath);
 await realtime.suspend();
 const timeBeforeResume = realtime.currentTime;
 // Two AudioWorkletNodes are constructed.
 // node1 is constructed before and node2 after the resume() call.
 const construct1 = get_node_and_reply(realtime);
 const resume = realtime.resume();
 const construct2 = get_node_and_reply(realtime);
 const {node: node1, reply: constructReply1} = await construct1;
 assert_equals(constructReply1.timeStamp, timeBeforeResume,
 'construct time before resume');
 const {node: node2, reply: constructReply2} = await construct2;
 assert_greater_than_equal(constructReply2.timeStamp, timeBeforeResume,
 'construct time after resume');
 await resume;
 // Suspend the context to freeze time and check that the processing for each
 // node matches the elapsed time.
 await realtime.suspend();
 const timeAfterSuspend = realtime.currentTime;
 const pong1 = await ping_for_reply(node1);
 const pong2 = await ping_for_reply(node2);
 assert_consistent(constructReply1, pong1, timeAfterSuspend, 'node1');
 assert_consistent(constructReply2, pong2, timeAfterSuspend, 'node2');
 assert_equals(pong1.currentFrame, pong2.currentFrame, 'currentFrame matches');
});
