
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
await import(path.join(cwd, '/common/get-host-info.sub.js'));

 const audit = Audit.createTaskRunner();

 setup(() => {
 const context = new AudioContext();
 context.suspend();

 const host_info = get_host_info();
 const audioElement = document.createElement('audio');
 audioElement.loop = true;
 const wav =
 host_info.HTTPS_ORIGIN + '/webaudio/resources/4ch-440.wav?' +
 'pipe=header(access-control-allow-origin,*)';
 audioElement.src =
 host_info.HTTPS_REMOTE_ORIGIN +
 '/fetch/api/resources/redirect.py?location=' +
 encodeURIComponent(wav);
 let source;
 let workletRecorder;

 audit.define(
 {label: 'setting-up-graph'},
 (task, should) => {
 source = new MediaElementAudioSourceNode(context, {
 mediaElement: audioElement
 });
 workletRecorder = new AudioWorkletNode(
 context, 'recorder-processor', {channelCount: 4});
 source.connect(workletRecorder).connect(context.destination);
 task.done();
 });

 // The recorded data from MESN must be non-zero. The source file contains
 // 4 channels of sine wave.
 audit.define(
 {label: 'start-playback-and-capture'},
 (task, should) => {
 workletRecorder.port.onmessage = (event) => {
 if (event.data.type === 'recordfinished') {
 for (let i = 0; i < event.data.recordBuffer.length; ++i) {
 const channelData = event.data.recordBuffer[i];
 should(channelData, `Recorded channel #${i}`)
 .beConstantValueOf(0);
 }
 }

 task.done();
 };

 context.resume();
 audioElement.play();
 });

 Promise.all([
 context.audioWorklet.addModule('/webaudio/js/worklet-recorder.js')
 ]).then(() => {
 audit.run();
 });
 });
 