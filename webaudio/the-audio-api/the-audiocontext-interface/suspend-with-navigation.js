
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
await import(path.join(cwd, '/common/utils.js'));
await import(path.join(cwd, '/common/dispatcher/dispatcher.js'));
await import(path.join(cwd, '/html/browsers/browsing-the-web/back-forward-cache/resources/helper.sub.js'));

'use strict';
runBfcacheTest({
 funcBeforeNavigation: async () => {
 globalThis.promise_event = (target, name) => {
 return new Promise(resolve => target[`on${name}`] = resolve);
 };
 globalThis.promise_source_ended = (audioCtx) => {
 const source = new ConstantSourceNode(audioCtx);
 source.start(0);
 source.stop(audioCtx.currentTime + 1/audioCtx.sampleRate);
 return promise_event(source, "ended");
 };

 globalThis.suspended_ctx = new AudioContext();
 // Perform the equivalent of test_driver.bless() to request a user gesture
 // for when the test is run from a browser. test_driver would need to be
 // able to postMessage() to the test context, which is not available due
 // to globalThis.open() being called with noopener (for back/forward cache).
 // Audio autoplay is expected to be allowed when run through webdriver
 // from `wpt run`.
 let button = document.createElement('button');
 button.innerHTML = 'This test requires user interaction.' +
 'Please click here to allow AudioContext.';
 document.body.appendChild(button);
 button.addEventListener('click', () => {
 document.body.removeChild(button);
 suspended_ctx.resume();
 }, {once: true});
 // Wait for user gesture, if required.
 await suspended_ctx.resume();
 await suspended_ctx.suspend();
 globalThis.ended_promise = promise_source_ended(suspended_ctx);
 },
 funcAfterAssertion: async (pageA) => {
 const state = await pageA.execute_script(() => suspended_ctx.state);
 assert_equals(state, 'suspended', 'state after back()');
 const first_ended = await pageA.execute_script(async () => {
 // Wait for an ended event from a running AudioContext to provide enough
 // time to check that the ended event has not yet been dispatched from
 // the suspended ctx.
 const running_ctx = new AudioContext();
 await running_ctx.resume();
 return Promise.race([
 ended_promise.then(() => 'suspended_ctx'),
 promise_source_ended(running_ctx).then(() => 'running_ctx'),
 ]);
 });
 assert_equals(first_ended, 'running_ctx',
 'AudioContext of first ended event');
 await pageA.execute_script(() => {
 globalThis.suspended_ctx.resume();
 return ended_promise;
 });
 },
}, 'suspend() with navigation');
