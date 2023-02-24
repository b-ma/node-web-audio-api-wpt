
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
  await import(path.join(cwd, '/common/get-host-info.sub.js'));

const dir = location.pathname.replace(/\/[^\/]*$/, '/');
const helper = dir + 'resources/not-fully-active-helper.sub.html?childsrc=';
const remote_helper = get_host_info().HTTP_NOTSAMESITE_ORIGIN + helper;
const blank_url = get_host_info().ORIGIN + '/common/blank.html';

const load_content = (frame, src) => {
 if (src == undefined) {
 frame.srcdoc = '';
 } else {
 frame.src = src;
 }
 return new Promise(resolve => frame.onload = () => resolve(frame));
};
const append_iframe = (src) => {
 const frame = document.createElement('iframe');
 document.body.appendChild(frame);
 return load_content(frame, src);
};
const remote_op = (win, op) => {
 win.postMessage(op, '*');
 return new Promise(resolve => globalThis.onmessage = e => {
 if (e.data == 'DONE ' + op) resolve();
 });
};
const test_constructor_throws = async (win, deactivate) => {
 const {AudioContext, DOMException} = win;
 await deactivate();
 assert_throws_dom("InvalidStateError", DOMException,
 () => new AudioContext());
};

promise_test(async () => {
 const frame = await append_iframe();
 return test_constructor_throws(frame.contentWindow, () => frame.remove());
}, "removed frame");
promise_test(async () => {
 const frame = await append_iframe();
 return test_constructor_throws(frame.contentWindow,
 () => load_content(frame));
}, "navigated frame");
promise_test(async () => {
 const frame = await append_iframe(helper + blank_url);
 const inner = frame.contentWindow.frames[0];
 return test_constructor_throws(inner, () => frame.remove());
}, "frame in removed frame");
promise_test(async () => {
 const frame = await append_iframe(helper + blank_url);
 const inner = frame.contentWindow.frames[0];
 return test_constructor_throws(inner, () => load_content(frame));
}, "frame in navigated frame");
promise_test(async () => {
 const frame = await append_iframe(remote_helper + blank_url);
 const inner = frame.contentWindow.frames[0];
 return test_constructor_throws(inner, () => frame.remove());
}, "frame in removed remote-site frame");
promise_test(async () => {
 const frame = await append_iframe(remote_helper + blank_url);
 const inner = frame.contentWindow.frames[0];
 return test_constructor_throws(inner, () => load_content(frame));
}, "frame in navigated remote-site frame");
promise_test(async () => {
 const outer = (await append_iframe(remote_helper + blank_url)).contentWindow;
 const inner = outer.frames[0];
 return test_constructor_throws(inner,
 () => remote_op(outer, 'REMOVE FRAME'));
}, "removed frame in remote-site frame");
promise_test(async () => {
 const outer = (await append_iframe(remote_helper + blank_url)).contentWindow;
 const inner = outer.frames[0];
 return test_constructor_throws(inner,
 () => remote_op(outer, 'NAVIGATE FRAME'));
}, "navigated frame in remote-site frame");
promise_test(async () => {
 const url = remote_helper + helper + blank_url;
 const outer = (await append_iframe(url)).contentWindow;
 const inner = outer.frames[0].frames[0];
 return test_constructor_throws(inner,
 () => remote_op(outer, 'REMOVE FRAME'));
}, "frame in removed remote-site frame in remote-site frame");
promise_test(async () => {
 const url = remote_helper + helper + blank_url;
 const outer = (await append_iframe(url)).contentWindow;
 const inner = outer.frames[0].frames[0];
 return test_constructor_throws(inner,
 () => remote_op(outer, 'NAVIGATE FRAME'));
}, "frame in navigated remote-site frame in remote-site frame");
