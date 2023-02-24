
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

 setup(() => {
 let sampleRate = 48000;
 let renderLength = 512;
 let context = new OfflineAudioContext(1, renderLength, sampleRate);

 let filePath = 'processors/one-pole-processor.js';

 // Without rendering the context, attempt to access |sampleRate| in the
 // global scope as soon as it is created.
 audit.define(
 'Query |sampleRate| upon AudioWorkletGlobalScope construction',
 (task, should) => {
 let onePoleFilterNode =
 new AudioWorkletNode(context, 'one-pole-filter');
 let frequencyParam = onePoleFilterNode.parameters.get('frequency');

 should(frequencyParam.maxValue,
 'frequencyParam.maxValue')
 .beEqualTo(0.5 * context.sampleRate);

 task.done();
 });

 context.audioWorklet.addModule(filePath).then(() => {
 audit.run();
 });
 });
 