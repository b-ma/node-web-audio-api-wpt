
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

 function binIndexForFrequency(frequency, analyser) {
 return (
 1 +
 Math.round(
 (frequency * analyser.fftSize) / analyser.context.sampleRate
 )
 );
 }

 const t = async_test(
 "MediaStreamAudioSourceNode captures the right track."
 );
 t.step(function() {
 const ac = new AudioContext();
 // Test that the right track is captured. Set up a MediaStream that has two
 // tracks, one with a tone at 100Hz and one with a tone at 1000Hz.
 const dest0 = ac.createMediaStreamDestination();
 const dest1 = ac.createMediaStreamDestination();
 const osc0 = ac.createOscillator();
 const osc1 = ac.createOscillator();
 osc0.frequency.value = 100;
 osc1.frequency.value = 1000;
 osc0.connect(dest0);
 osc1.connect(dest1);
 osc0.start(0);
 osc1.start(0);
 const track0 = dest0.stream.getAudioTracks()[0];
 const track0id = track0.id;
 const track1 = dest1.stream.getAudioTracks()[0];
 const track1id = track1.id;

 let ids = [track0id, track1id];
 ids.sort();
 let targetFrequency;
 let otherFrequency;
 if (ids[0] == track0id) {
 targetFrequency = 100;
 otherFrequency = 1000;
 } else {
 targetFrequency = 1000;
 otherFrequency = 100;
 }

 let twoTrackMediaStream = new MediaStream();
 twoTrackMediaStream.addTrack(track0);
 twoTrackMediaStream.addTrack(track1);

 const twoTrackSource = ac.createMediaStreamSource(twoTrackMediaStream);
 const analyser = ac.createAnalyser();
 // Don't do smoothing so that the frequency data changes quickly
 analyser.smoothingTimeConstant = 0;

 twoTrackSource.connect(analyser);

 const indexToCheckForHighEnergy = binIndexForFrequency(
 targetFrequency,
 analyser
 );
 const indexToCheckForLowEnergy = binIndexForFrequency(
 otherFrequency,
 analyser
 );
 let frequencyData = new Float32Array(1024);
 let checkCount = 0;
 let numberOfRemovals = 0;
 let stopped = false;
 function analyse() {
 analyser.getFloatFrequencyData(frequencyData);
 // there should be high energy in the right bin, higher than 40dbfs because
 // it's supposed to be a sine wave at 0dbfs
 if (frequencyData[indexToCheckForHighEnergy] > -40 && !stopped) {
 assert_true(true, "Correct track routed to the AudioContext.");
 checkCount++;
 }
 if (stopped && frequencyData[indexToCheckForHighEnergy] < -40) {
 assert_true(
 true,
 `After stopping the track, low energy is found in the
 same bin`
 );
 checkCount++;
 }
 if (checkCount > 5 && checkCount < 20) {
 twoTrackMediaStream.getAudioTracks().forEach(track => {
 if (track.id == ids[0]) {
 numberOfRemovals++;
 globalThis.removedTrack = track;
 twoTrackMediaStream.removeTrack(track);
 }
 });
 assert_true(
 numberOfRemovals == 1,
 `The mediastreamtrack can only be
 removed once from the mediastream`
 );
 } else if (checkCount >= 20 && checkCount < 30) {
 globalThis.removedTrack.stop();
 stopped = true;
 } else if (checkCount >= 30) {
 assert_true(
 numberOfRemovals == 1,
 `After removing the track from the
 mediastream, it's still routed to the graph.`
 );
 // After some time, consider that it worked.
 t.done();
 return;
 }

 t.step_timeout(analyse, 100);
 }
 t.step_timeout(analyse, 100);
 });
 