
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

 let audit = Audit.createTaskRunner();
 let context;
 let compressor;

 audit.define(
 {
 label: 'test',
 description: 'Basic tests for DynamicsCompressorNode API'
 },
 function(task, should) {

 context = new AudioContext();
 compressor = context.createDynamicsCompressor();

 should(compressor.threshold.value, 'compressor.threshold.value')
 .beEqualTo(-24);
 should(compressor.knee.value, 'compressor.knee.value')
 .beEqualTo(30);
 should(compressor.ratio.value, 'compressor.ratio.value')
 .beEqualTo(12);
 should(compressor.attack.value, 'compressor.attack.value')
 .beEqualTo(Math.fround(0.003));
 should(compressor.release.value, 'compressor.release.value')
 .beEqualTo(0.25);
 should(typeof compressor.reduction, 'typeof compressor.reduction')
 .beEqualTo('number');
 should(compressor.reduction, 'compressor.reduction').beEqualTo(0);

 task.done();
 });

 audit.run();
 