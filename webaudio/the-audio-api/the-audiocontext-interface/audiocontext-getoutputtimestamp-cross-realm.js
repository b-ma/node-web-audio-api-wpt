
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

 audit.define("getoutputtimestamp-cross-realm", function(task, should) {
 const mainContext = new AudioContext();
 return task.timeout(() => {
 const iframe = document.createElement("iframe");
 document.body.append(iframe);
 const iframeContext = new iframe.contentWindow.AudioContext();

 should(mainContext.getOutputTimestamp().performanceTime, "mainContext's performanceTime")
 .beGreaterThan(iframeContext.getOutputTimestamp().performanceTime, "iframeContext's performanceTime");
 should(iframeContext.getOutputTimestamp.call(mainContext).performanceTime, "mainContext's performanceTime (via iframeContext's method)")
 .beCloseTo(mainContext.getOutputTimestamp().performanceTime, "mainContext's performanceTime", { threshold: 0.01 });
 }, 1000);
 });

 audit.run();
 