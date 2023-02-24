
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

 setup({explicit_done: true});
 // Wait until the DOM is ready to be able to get a reference to the canvas
 // element.
 globalThis.addEventListener("load", function() {
 const ac = new AudioContext();
 const emptyStream = new MediaStream();

 test(function() {
 assert_throws_dom(
 "InvalidStateError",
 function() {
 ac.createMediaStreamSource(emptyStream);
 },
 `A MediaStreamAudioSourceNode can only be constructed via the factory
 method with a MediaStream that has at least one track of kind "audio"`
 );
 }, "MediaStreamAudioSourceNode created with factory method and MediaStream with no tracks");

 test(function() {
 assert_throws_dom(
 "InvalidStateError",
 function() {
 new MediaStreamAudioSourceNode(ac, { mediaStream: emptyStream });
 },
 `A MediaStreamAudioSourceNode can only be constructed via the constructor
 with a MediaStream that has at least one track of kind "audio"`
 );
 }, "MediaStreamAudioSourceNode created with constructor and MediaStream with no tracks");

 const canvas = document.querySelector("canvas");
 const ctx = canvas.getContext("2d");
 const videoOnlyStream = canvas.captureStream();

 test(function() {
 assert_throws_dom(
 "InvalidStateError",
 function() {
 ac.createMediaStreamSource(videoOnlyStream);
 },
 `A MediaStreamAudioSourceNode can only be constructed via the factory with a
 MediaStream that has at least one track of kind "audio"`
 );
 }, `MediaStreamAudioSourceNode created with the factory method and MediaStream with only a video track`);

 test(function() {
 assert_throws_dom(
 "InvalidStateError",
 function() {
 new MediaStreamAudioSourceNode(ac, {
 mediaStream: videoOnlyStream,
 });
 },
 `A MediaStreamAudioSourceNode can only be constructed via the factory with a
 MediaStream that has at least one track of kind "audio"`
 );
 }, `MediaStreamAudioSourceNode created with constructor and MediaStream with only a video track`);
 done();
 });
 