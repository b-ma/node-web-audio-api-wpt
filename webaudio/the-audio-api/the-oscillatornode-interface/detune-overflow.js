
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
await import(path.join(cwd, '/webaudio/resources/audit.js'));
await import(path.join(cwd, '/webaudio/resources/audit-util.js'));

 const sampleRate = 44100;
 const renderLengthFrames = RENDER_QUANTUM_FRAMES;

 let audit = Audit.createTaskRunner();

 audit.define('detune overflow', async (task, should) => {
 let context =
 new OfflineAudioContext(1, renderLengthFrames, sampleRate);

 // This value of frequency and detune results in a computed frequency of
 // 440*2^(153600/1200) = 1.497e41. The frequency needs to be clamped to
 // Nyquist. But a sine wave at Nyquist frequency is all zeroes. Verify
 // the output is 0.
 let osc = new OscillatorNode(context, {frequency: 440, detune: 153600});

 osc.connect(context.destination);

 let buffer = await context.startRendering();
 let output = buffer.getChannelData(0);
 should(output, 'Osc freq and detune outside nominal range')
 .beConstantValueOf(0);

 task.done();
 });

 audit.run();
 