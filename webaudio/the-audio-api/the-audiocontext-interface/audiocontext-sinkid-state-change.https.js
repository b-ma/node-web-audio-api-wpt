
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
  
"use strict";

const audioContext = new AudioContext();
let outputDeviceList = null;
let firstDeviceId = null;

// Setup: Get permission via getUserMedia() and a list of audio output devices.
promise_setup(async t => {
 await navigator.mediaDevices.getUserMedia({ audio: true });
 const deviceList = await navigator.mediaDevices.enumerateDevices();
 outputDeviceList =
 deviceList.filter(({kind}) => kind === 'audiooutput');
 assert_greater_than(outputDeviceList.length, 1,
 'the system must have more than 1 device.');
 firstDeviceId = outputDeviceList[1].deviceId;
}, 'Get permission via getUserMedia() and a list of audio output devices.');

// Test the sink change when from a suspended context.
promise_test(async t => {
 let events = [];
 await audioContext.suspend();

 // Step 6. Set wasRunning to false if the [[rendering thread state]] on the
 // AudioContext is "suspended".
 assert_equals(audioContext.state, 'suspended');

 // Step 11.5. Fire an event named sinkchange at the associated AudioContext.
 audioContext.onsinkchange = t.step_func(() => {
 events.push('sinkchange');
 assert_equals(audioContext.sinkId, firstDeviceId);
 });

 await audioContext.setSinkId(firstDeviceId);
 assert_equals(events[0], 'sinkchange');
 t.done();
}, 'Calling setSinkId() on a suspended AudioContext should fire only sink ' +
 'change events.');

// Test the sink change when from a running context.
promise_test(async t => {
 let events = [];
 await audioContext.resume();

 // Step 9. If wasRunning is true:
 assert_equals(audioContext.state, 'running');

 // Step 9.2.1. Set the state attribute of the AudioContext to "suspended".
 // Fire an event named statechange at the associated AudioContext.
 audioContext.onstatechange = t.step_func(() => {
 events.push('statechange:suspended');
 assert_equals(audioContext.state, 'suspended');
 });

 // Step 11.5. Fire an event named sinkchange at the associated AudioContext.
 audioContext.onsinkchange = t.step_func(() => {
 events.push('sinkchange');
 assert_equals(audioContext.sinkId, firstDeviceId);
 });

 // Step 12.2. Set the state attribute of the AudioContext to "running".
 // Fire an event named statechange at the associated AudioContext.
 audioContext.onstatechange = t.step_func(() => {
 events.push('statechange:running');
 assert_equals(audioContext.state, 'running');
 });

 await audioContext.setSinkId(firstDeviceId);
 assert_equals(events.length, 3);
 assert_equals(events[0], 'statechange:suspended');
 assert_equals(events[1], 'sinkchange');
 assert_equals(events[2], 'statechange:running');
 t.done();
}, 'Calling setSinkId() on a running AudioContext should fire both state ' +
 'and sink change events.');
