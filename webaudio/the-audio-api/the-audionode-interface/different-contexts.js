
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

 // Different contexts to be used for testing.
 let c1;
 let c2;

 audit.define(
 {label: 'setup', description: 'Contexts for testing'},
 (task, should) => {
 should(() => {c1 = new AudioContext()}, 'c1 = new AudioContext()')
 .notThrow();
 should(() => {c2 = new AudioContext()}, 'c2 = new AudioContext()')
 .notThrow();
 task.done();
 });

 audit.define(
 {label: 'Test 1', description: 'Connect nodes between contexts'},
 (task, should) => {
 let g1;
 let g2;
 should(
 () => {g1 = new GainNode(c1)}, 'Test 1: g1 = new GainNode(c1)')
 .notThrow();
 should(
 () => {g2 = new GainNode(c2)}, 'Test 1: g2 = new GainNode(c2)')
 .notThrow();
 should(() => {g2.connect(g1)}, 'Test 1: g2.connect(g1)')
 .throw(DOMException, 'InvalidAccessError');
 task.done();
 });

 audit.define(
 {label: 'Test 2', description: 'Connect AudioParam between contexts'},
 (task, should) => {
 let g1;
 let g2;
 should(
 () => {g1 = new GainNode(c1)}, 'Test 2: g1 = new GainNode(c1)')
 .notThrow();
 should(
 () => {g2 = new GainNode(c2)}, 'Test 2: g2 = new GainNode(c2)')
 .notThrow();
 should(() => {g2.connect(g1.gain)}, 'Test 2: g2.connect(g1.gain)')
 .throw(DOMException, 'InvalidAccessError');
 task.done();
 });

 audit.define(
 {label: 'Test 3', description: 'Disconnect nodes between contexts'},
 (task, should) => {
 let g1;
 let g2;
 should(
 () => {g1 = new GainNode(c1)}, 'Test 3: g1 = new GainNode(c1)')
 .notThrow();
 should(
 () => {g2 = new GainNode(c2)}, 'Test 3: g2 = new GainNode(c2)')
 .notThrow();
 should(() => {g2.disconnect(g1)}, 'Test 3: g2.disconnect(g1)')
 .throw(DOMException, 'InvalidAccessError');
 task.done();
 });

 audit.define(
 {
 label: 'Test 4',
 description: 'Disconnect AudioParam between contexts'
 },
 (task, should) => {
 let g1;
 let g2;
 should(
 () => {g1 = new GainNode(c1)}, 'Test 4: g1 = new GainNode(c1)')
 .notThrow();
 should(
 () => {g2 = new GainNode(c2)}, 'Test 4: g2 = new GainNode(c2)')
 .notThrow();
 should(
 () => {g2.disconnect(g1.gain)}, 'Test 4: g2.connect(g1.gain)')
 .throw(DOMException, 'InvalidAccessError');
 task.done();
 });

 audit.run();
 