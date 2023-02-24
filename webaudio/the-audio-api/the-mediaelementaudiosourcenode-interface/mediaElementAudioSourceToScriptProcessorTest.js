
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
await import(path.join(cwd, '/webaudio/js/buffer-loader.js'));

 var elementSourceTest = async_test(function(elementSourceTest) {

 var src = '/webaudio/resources/sin_440Hz_-6dBFS_1s.wav';
 var BUFFER_SIZE = 2048;
 var context = null;
 var actualBufferArrayC0 = new Float32Array(0);
 var actualBufferArrayC1 = new Float32Array(0);
 var audio = null, source = null, processor = null

 function loadExpectedBuffer(event) {
 bufferLoader = new BufferLoader(
 context,
 [src],
 elementSourceTest.step_func(bufferLoadCompleted)
 );
 bufferLoader.load();
 };

 function bufferLoadCompleted(buffer) {
 runTests(buffer);
 };

 function concatTypedArray(arr1, arr2) {
 var result = new Float32Array(arr1.length + arr2.length);
 result.set(arr1);
 result.set(arr2, arr1.length);
 return result;
 }

 // Create Audio context. The reference wav file is sampled at 44.1 kHz so
 // use the same rate for the context to remove extra resampling that might
 // be required.
 context = new AudioContext({sampleRate: 44100});

 // Create an audio element, and a media element source
 audio = document.createElement('audio');
 audio.src = src;
 source = context.createMediaElementSource(audio);

 function processListener (e) {
 actualBufferArrayC0 = concatTypedArray(actualBufferArrayC0, e.inputBuffer.getChannelData(0));
 actualBufferArrayC1 = concatTypedArray(actualBufferArrayC1, e.inputBuffer.getChannelData(1));
 }

 // Create a processor node to copy the input to the actual buffer
 processor = context.createScriptProcessor(BUFFER_SIZE);
 source.connect(processor);
 processor.connect(context.destination);
 let audioprocessListener = elementSourceTest.step_func(processListener);
 processor.addEventListener('audioprocess', audioprocessListener);

 context.addEventListener('statechange', elementSourceTest.step_func(() => {
 assert_equals(context.state, "running", "context.state");
 audio.play();
 }), {once: true});

 // When media playback ended, save the begin to compare with expected buffer
 audio.addEventListener("ended", elementSourceTest.step_func(function(e) {
 // Setting a timeout since we need audioProcess event to run for all samples
 globalThis.setTimeout(elementSourceTest.step_func(loadExpectedBuffer), 50);
 }));

 function runTests(expected) {
 source.disconnect();
 processor.disconnect();

 // firefox seems to process events after disconnect
 processor.removeEventListener('audioprocess', audioprocessListener)

 // Note: the expected result is from a mono source file.
 var expectedBuffer = expected[0];

 // Trim the actual elements because we don't have a fine-grained
 // control over the start and end time of recording the data.
 var actualTrimmedC0 = trimEmptyElements(actualBufferArrayC0);
 var actualTrimmedC1 = trimEmptyElements(actualBufferArrayC1);
 var expectedLength = trimEmptyElements(expectedBuffer.getChannelData(0)).length;

 // Test that there is some data.
 test(function() {
 assert_greater_than(actualTrimmedC0.length, 0,
 "processed data array (C0) length greater than 0");
 assert_greater_than(actualTrimmedC1.length, 0,
 "processed data array (C1) length greater than 0");
 }, "Channel 0 processed some data");

 // Test the actual contents of the 1st and second channel.
 test(function() {
 assert_array_approx_equals(
 actualTrimmedC0,
 trimEmptyElements(expectedBuffer.getChannelData(0)),
 1e-4,
 "comparing expected and rendered buffers (channel 0)");
 assert_array_approx_equals(
 actualTrimmedC1,
 trimEmptyElements(expectedBuffer.getChannelData(0)),
 1e-4,
 "comparing expected and rendered buffers (channel 1)");
 }, "All data processed correctly");

 elementSourceTest.done();
 };
 }, "Element Source tests completed");
 