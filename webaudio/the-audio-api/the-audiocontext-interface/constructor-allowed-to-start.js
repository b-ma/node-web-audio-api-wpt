
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
  
setup({ single_test: true });
test_driver.bless("audio playback", () => {
 const ctx = new AudioContext();
 // Immediately after the constructor the state is "suspended" because the
 // control message to start processing has just been sent, but the state
 // should change soon.
 assert_equals(ctx.state, "suspended", "initial state");
 ctx.onstatechange = () => {
 assert_equals(ctx.state, "running", "state after statechange event");
 // Now create another context and ensure it starts out in the "suspended"
 // state too, ensuring it's not synchronously "running".
 const ctx2 = new AudioContext();
 assert_equals(ctx2.state, "suspended", "initial state of 2nd context");
 done();
 };
});
