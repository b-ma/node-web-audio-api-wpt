
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
  
test(function(t) {
 var ac = new AudioContext();

 function check_args(arg1, arg2, err, desc) {
 test(function() {
 assert_throws_dom(err, function() {
 ac.createIIRFilter(arg1, arg2)
 })
 }, desc)
 }

 check_args([], [1.0], 'NotSupportedError',
 'feedforward coefficients can not be empty');

 check_args([1.0], [], 'NotSupportedError',
 'feedback coefficients can not be empty');

 var coeff = new Float32Array(21)
 coeff[0] = 1.0;

 check_args(coeff, [1.0], 'NotSupportedError',
 'more than 20 feedforward coefficients can not be used');

 check_args([1.0], coeff, 'NotSupportedError',
 'more than 20 feedback coefficients can not be used');

 check_args([0.0, 0.0], [1.0], 'InvalidStateError',
 'at least one feedforward coefficient must be non-zero');

 check_args([0.5, 0.5], [0.0], 'InvalidStateError',
 'the first feedback coefficient must be non-zero');

}, "IIRFilterNode coefficients are checked properly");

test(function(t) {
 var ac = new AudioContext();

 var frequencies = new Float32Array([-1.0, ac.sampleRate*0.5 - 1.0, ac.sampleRate]);
 var magResults = new Float32Array(3);
 var phaseResults = new Float32Array(3);

 var filter = ac.createIIRFilter([0.5, 0.5], [1.0]);
 filter.getFrequencyResponse(frequencies, magResults, phaseResults);

 assert_true(isNaN(magResults[0]), "Invalid input frequency should give NaN magnitude response");
 assert_true(!isNaN(magResults[1]), "Valid input frequency should not give NaN magnitude response");
 assert_true(isNaN(magResults[2]), "Invalid input frequency should give NaN magnitude response");
 assert_true(isNaN(phaseResults[0]), "Invalid input frequency should give NaN phase response");
 assert_true(!isNaN(phaseResults[1]), "Valid input frequency should not give NaN phase response");
 assert_true(isNaN(phaseResults[2]), "Invalid input frequency should give NaN phase response");

}, "IIRFilterNode getFrequencyResponse handles invalid frequencies properly");
