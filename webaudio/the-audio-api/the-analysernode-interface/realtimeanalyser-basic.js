
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

 let context = 0;

 let audit = Audit.createTaskRunner();

 audit.define('Basic AnalyserNode test', function(task, should) {
 context = new AudioContext();
 let analyser = context.createAnalyser();

 should(analyser.numberOfInputs, 'Number of inputs for AnalyserNode')
 .beEqualTo(1);

 should(analyser.numberOfOutputs, 'Number of outputs for AnalyserNode')
 .beEqualTo(1);

 should(analyser.minDecibels, 'Default minDecibels value')
 .beEqualTo(-100);

 should(analyser.maxDecibels, 'Default maxDecibels value')
 .beEqualTo(-30);

 should(
 analyser.smoothingTimeConstant,
 'Default smoothingTimeConstant value')
 .beEqualTo(0.8);

 let expectedValue = -50 - (1 / 3);
 analyser.minDecibels = expectedValue;

 should(analyser.minDecibels, 'node.minDecibels = ' + expectedValue)
 .beEqualTo(expectedValue);

 expectedValue = -40 - (1 / 3);
 analyser.maxDecibels = expectedValue;

 should(analyser.maxDecibels, 'node.maxDecibels = ' + expectedValue)
 .beEqualTo(expectedValue);

 task.done();
 });

 audit.run();
 