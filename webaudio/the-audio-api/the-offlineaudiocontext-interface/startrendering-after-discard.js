
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
  
let context;
let childDOMException;
setup(() => {
 const frame = document.createElement('iframe');
 document.body.appendChild(frame);
 context = new frame.contentWindow.OfflineAudioContext(
 {length: 1, sampleRate: 48000});
 childDOMException = frame.contentWindow.DOMException;
 frame.remove();
});

promise_test((t) => promise_rejects_dom(
 t, 'InvalidStateError', childDOMException, context.startRendering()),
 'startRendering()');
// decodeAudioData() is tested in
// offlineaudiocontext-detached-execution-context.html
