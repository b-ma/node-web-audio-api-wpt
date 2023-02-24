
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

 audit.define('decoding-on-detached-iframe', (task, should) => {
 const iframe =
 document.createElementNS("http://www.w3.org/1999/xhtml", "iframe");
 document.body.appendChild(iframe);
 let context = new iframe.contentWindow.AudioContext();
 document.body.removeChild(iframe);

 should(context.decodeAudioData(new ArrayBuffer(1)),
 'decodeAudioData() upon a detached iframe')
 .beRejectedWith('InvalidStateError')
 .then(() => task.done());
 });

 audit.run();
 