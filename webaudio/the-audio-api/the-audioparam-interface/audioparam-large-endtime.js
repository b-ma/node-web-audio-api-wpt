
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
await import(path.join(cwd, '/webaudio/resources/audit-util.js'));
await import(path.join(cwd, '/webaudio/resources/audit.js'));

 let sampleRate = 48000;
 // Render for some small (but fairly arbitrary) time.
 let renderDuration = 0.125;
 // Any huge time value that won't fit in a size_t (2^64 on a 64-bit
 // machine).
 let largeTime = 1e300;

 let audit = Audit.createTaskRunner();

 // See crbug.com/582701. Create an audioparam with a huge end time and
 // verify that to automation is run. We don't care about the actual
 // results, just that it runs.

 // Test linear ramp with huge end time
 audit.define('linearRamp', (task, should) => {
 let graph = createGraph();
 graph.gain.gain.linearRampToValueAtTime(0.1, largeTime);

 graph.source.start();
 graph.context.startRendering()
 .then(function(buffer) {
 should(true, 'linearRampToValue(0.1, ' + largeTime + ')')
 .message('successfully rendered', 'unsuccessfully rendered');
 })
 .then(() => task.done());
 });

 // Test exponential ramp with huge end time
 audit.define('exponentialRamp', (task, should) => {
 let graph = createGraph();
 graph.gain.gain.exponentialRampToValueAtTime(.1, largeTime);

 graph.source.start();
 graph.context.startRendering()
 .then(function(buffer) {
 should(true, 'exponentialRampToValue(0.1, ' + largeTime + ')')
 .message('successfully rendered', 'unsuccessfully rendered');
 })
 .then(() => task.done());
 });

 audit.run();

 // Create the graph and return the context, the source, and the gain node.
 function createGraph() {
 let context =
 new OfflineAudioContext(1, renderDuration * sampleRate, sampleRate);
 let src = context.createBufferSource();
 src.buffer = createConstantBuffer(context, 1, 1);
 src.loop = true;
 let gain = context.createGain();
 src.connect(gain);
 gain.connect(context.destination);
 gain.gain.setValueAtTime(1, 0.1 / sampleRate);

 return {context: context, gain: gain, source: src};
 }
 