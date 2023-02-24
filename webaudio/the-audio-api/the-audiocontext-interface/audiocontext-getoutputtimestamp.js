
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

 audit.define('getoutputtimestamp-initial-values', function(task, should) {
 let context = new AudioContext;
 let timestamp = context.getOutputTimestamp();

 should(timestamp.contextTime, 'timestamp.contextTime').exist();
 should(timestamp.performanceTime, 'timestamp.performanceTime').exist();

 should(timestamp.contextTime, 'timestamp.contextTime')
 .beGreaterThanOrEqualTo(0);
 should(timestamp.performanceTime, 'timestamp.performanceTime')
 .beGreaterThanOrEqualTo(0);

 task.done();
 });

 audit.run();
 