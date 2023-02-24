
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

test(function(t) {
 var context = new OfflineAudioContext(1, 1, 44100);
 var g1 = context.createGain();
 var g2 = context.createGain();
 var rv = g1.connect(g2);
 assert_equals(rv, g2);
 var rv = g1.connect(g2);
 assert_equals(rv, g2);
}, "connect should return the node connected to.");
