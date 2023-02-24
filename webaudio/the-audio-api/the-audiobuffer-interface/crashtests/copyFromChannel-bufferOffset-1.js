
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
  
 const a = new AudioBuffer({length: 0x51986, sampleRate: 44100});
 const b = new Float32Array(0x10);
 a.getChannelData(0); // to avoid zero data optimization
 a.copyFromChannel(b, 0, 0x1523c7cc)
