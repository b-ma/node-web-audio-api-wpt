
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
await import('../../resources/audit-util.js');
await import('../../resources/audit.js');

 let audit = Audit.createTaskRunner();

 audit.define(
 {
 label: 'test',
 description:
 'Attributes and basic functionality of StereoPannerNode'
 },
 (task, should) => {

 let context = new AudioContext();
 let panner = context.createStereoPanner();

 should(panner.numberOfInputs, 'panner.numberOfInputs').beEqualTo(1);
 should(panner.numberOfOutputs, 'panner.numberOfOutputs')
 .beEqualTo(1);
 should(panner.pan.defaultValue, 'panner.pan.defaultValue')
 .beEqualTo(0.0);
 should(() => panner.pan.value = 1.0, 'panner.pan.value = 1.0')
 .notThrow();
 should(panner.pan.value, 'panner.pan.value').beEqualTo(1.0);

 should(() => panner.channelCount = 1, 'panner.channelCount = 1')
 .notThrow();
 should(() => panner.channelCount = 3, 'panner.channelCount = 3')
 .throw();
 should(
 () => panner.channelCountMode = 'explicit',
 'panner.channelCountMode = "explicit"')
 .notThrow();
 should(
 () => panner.channelCountMode = 'max',
 'panner.channelCountMode = "max"')
 .throw();

 task.done();
 });
 audit.run();
 