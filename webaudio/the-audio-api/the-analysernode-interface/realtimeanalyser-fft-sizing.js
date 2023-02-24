
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

 function doTest(fftSize, illegal, should) {
 let c = new OfflineAudioContext(1, 1000, 44100);
 let a = c.createAnalyser();
 let message = 'Setting fftSize to ' + fftSize;
 let tester = function() {
 a.fftSize = fftSize;
 };

 if (illegal) {
 should(tester, message).throw(DOMException, 'IndexSizeError');
 } else {
 should(tester, message).notThrow();
 }
 }

 audit.define(
 {
 label: 'FFT size test',
 description: 'Test that re-sizing the FFT arrays does not fail.'
 },
 function(task, should) {
 doTest(-1, true, should);
 doTest(0, true, should);
 doTest(1, true, should);
 for (let i = 2; i <= 0x20000; i *= 2) {
 if (i >= 32 && i <= 32768)
 doTest(i, false, should);
 else
 doTest(i, true, should);
 doTest(i + 1, true, should);
 }

 task.done();
 });

 audit.run();
 