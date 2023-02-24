
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

 function assert_doesnt_throw(f, desc) {
 try {
 f();
 } catch (e) {
 assert_true(false, desc);
 return;
 }
 assert_true(true, desc);
 }

 test(function() {
 var ac = new AudioContext();

 assert_equals(ac.destination.channelCount, 2,
 "A DestinationNode should have two channels by default");

 assert_greater_than_equal(ac.destination.maxChannelCount, 2,
 "maxChannelCount should be >= 2");

 assert_throws_dom("IndexSizeError", function() {
 ac.destination.channelCount = ac.destination.maxChannelCount + 1
 }, `Setting the channelCount to something greater than
 the maxChannelCount should throw IndexSizeError`);

 assert_throws_dom("NotSupportedError", function() {
 ac.destination.channelCount = 0;
 }, "Setting the channelCount to 0 should throw NotSupportedError");

 assert_doesnt_throw(function() {
 ac.destination.channelCount = ac.destination.maxChannelCount;
 }, "Setting the channelCount to maxChannelCount should not throw");

 assert_doesnt_throw(function() {
 ac.destination.channelCount = 1;
 }, "Setting the channelCount to 1 should not throw");
 });

 