
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

 let audit = Audit.createTaskRunner();

 // Arbitrarily determined. Any numbers should work.
 let sampleRate = 16000;
 let renderLength = 1280;
 let context;
 let filePath = 'processors/invalid-param-array-processor.js';

 audit.define('Initializing AudioWorklet and Context', async (task) => {
 context = new OfflineAudioContext(1, renderLength, sampleRate);
 await context.audioWorklet.addModule(filePath);
 task.done();
 });

 audit.define('Verifying AudioParam in AudioWorkletNode',
 async (task, should) => {
 let buffer = context.createBuffer(1, 2, context.sampleRate);
 buffer.getChannelData(0)[0] = 1;

 let source = new AudioBufferSourceNode(context);
 source.buffer = buffer;
 source.loop = true;
 source.start();

 let workletNode1 =
 new AudioWorkletNode(context, 'invalid-param-array-1');
 let workletNode2 =
 new AudioWorkletNode(context, 'invalid-param-array-2');
 workletNode1.connect(workletNode2).connect(context.destination);

 // Manually invoke the param getter.
 source.connect(workletNode2.parameters.get('invalidParam'));

 const renderedBuffer = await context.startRendering();

 // |workletNode2| should be no-op after the parameter getter is
 // invoked. Therefore, the rendered result should be silent.
 should(renderedBuffer.getChannelData(0), 'The rendered buffer')
 .beConstantValueOf(0);
 task.done();
 }
 );

 audit.run();
 