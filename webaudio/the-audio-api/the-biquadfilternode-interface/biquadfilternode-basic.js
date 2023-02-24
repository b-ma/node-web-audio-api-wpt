
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

 audit.define(
 {label: 'test', description: 'Basic tests for BiquadFilterNode'},
 function(task, should) {

 let context = new AudioContext();
 let filter = context.createBiquadFilter();

 should(filter.numberOfInputs, 'Number of inputs').beEqualTo(1);

 should(filter.numberOfOutputs, 'Number of outputs').beEqualTo(1);

 should(filter.type, 'Default filter type').beEqualTo('lowpass');

 should(filter.frequency.value, 'Default frequency value')
 .beEqualTo(350);

 should(filter.Q.value, 'Default Q value').beEqualTo(1);

 should(filter.gain.value, 'Default gain value').beEqualTo(0);

 // Check that all legal filter types can be set.
 let filterTypeArray = [
 {type: 'lowpass'}, {type: 'highpass'}, {type: 'bandpass'},
 {type: 'lowshelf'}, {type: 'highshelf'}, {type: 'peaking'},
 {type: 'notch'}, {type: 'allpass'}
 ];

 for (let i = 0; i < filterTypeArray.length; ++i) {
 should(
 () => filter.type = filterTypeArray[i].type,
 'Setting filter.type to ' + filterTypeArray[i].type)
 .notThrow();
 should(filter.type, 'Filter type is')
 .beEqualTo(filterTypeArray[i].type);
 }


 // Check that numerical values are no longer supported
 filter.type = 99;
 should(filter.type, 'Setting filter.type to (invalid) 99')
 .notBeEqualTo(99);

 task.done();
 });

 audit.run();
 