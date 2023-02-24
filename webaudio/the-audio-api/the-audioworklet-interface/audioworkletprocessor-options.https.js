
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

 const audit = Audit.createTaskRunner();
 const context = new AudioContext();

 let filePath = 'processors/option-test-processor.js';

 // Create a OptionTestProcessor and feed |processorData| to it. The
 // processor should echo the received data to the node's |onmessage|
 // handler.
 audit.define('valid-processor-data', (task, should) => {
 context.audioWorklet.addModule(filePath).then(() => {
 let processorOptions = {
 description: 'foo',
 payload: [0, 1, 2, 3]
 };

 let optionTestNode =
 new AudioWorkletNode(context, 'option-test-processor', {
 processorOptions: processorOptions
 });

 optionTestNode.port.onmessage = (event) => {
 should(event.data.processorOptions.description,
 '|description| field in processorOptions from processor("' +
 event.data.processorOptions.description + '")')
 .beEqualTo(processorOptions.description,
 'the field in node constructor options ("' +
 processorOptions.description + '")');
 should(event.data.processorOptions.payload,
 '|payload| array in processorOptions from processor([' +
 event.data.processorOptions.payload + '])')
 .beEqualToArray([0, 1, 2, 3],
 'the array in node constructor options ([' +
 event.data.processorOptions.payload + '])');
 task.done();
 };
 });
 });


 // Passing empty option dictionary should work without a problem.
 audit.define('empty-option', (task, should) => {
 context.audioWorklet.addModule(filePath).then(() => {
 let optionTestNode =
 new AudioWorkletNode(context, 'option-test-processor');

 optionTestNode.port.onmessage = (event) => {
 should(Object.keys(event.data).length,
 'Number of properties in data from processor')
 .beEqualTo(2);
 should(event.data.numberOfInputs,
 '|numberOfInputs| field in data from processor')
 .beEqualTo(1);
 should(event.data.numberOfOutputs,
 '|numberOfOutputs| field in data from processor')
 .beEqualToArray(1);
 task.done();
 };
 });
 });


 audit.run();
 