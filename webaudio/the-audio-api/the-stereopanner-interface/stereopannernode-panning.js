
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
await import('../../resources/stereopanner-testing.js');

 let audit = Audit.createTaskRunner();

 audit.define('mono-test', (task, should) => {
 StereoPannerTest
 .create(should, {numberOfInputChannels: 1, prefix: 'Mono: '})
 .run()
 .then(() => task.done());
 });

 audit.define('stereo-test', (task, should) => {
 StereoPannerTest
 .create(should, {numberOfInputChannels: 2, prefix: 'Stereo: '})
 .run()
 .then(() => task.done());
 });

 audit.run();
 