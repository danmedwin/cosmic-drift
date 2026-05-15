// Screenshot script using Chrome DevTools Protocol (Node 26 native WebSocket)
var http = require('http');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
var DEBUG_PORT = 9333;
var BASE_URL = 'http://localhost:8765';
var OUT_DIR = __dirname;

function delay(ms) {
  return new Promise(function(res) { setTimeout(res, ms); });
}

function httpGet(url) {
  return new Promise(function(resolve, reject) {
    http.get(url, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() { resolve(data); });
    }).on('error', reject);
  });
}

async function main() {
  // Kill any existing headless Chrome on this debug port
  try { child_process.execSync('pkill -f "remote-debugging-port=' + DEBUG_PORT + '"'); await delay(500); } catch(e) {}

  // Launch headless Chrome
  child_process.spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + DEBUG_PORT,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=430,932',
    '--user-data-dir=/tmp/cdp-screenshot-profile',
    'about:blank'
  ], { stdio: 'ignore', detached: true }).unref();

  await delay(2500);

  // Get tab list
  var tabsJson = await httpGet('http://localhost:' + DEBUG_PORT + '/json');
  var tabs = JSON.parse(tabsJson);
  var tab = tabs.find(function(t) { return t.type === 'page'; }) || tabs[0];
  console.log('Tab:', tab.title, tab.webSocketDebuggerUrl);

  // Connect via native WebSocket (Node 26+)
  var ws = new WebSocket(tab.webSocketDebuggerUrl);
  var msgId = 1;
  var pending = {};

  ws.onmessage = function(event) {
    var msg = JSON.parse(event.data);
    if (msg.id && pending[msg.id]) {
      var cb = pending[msg.id];
      delete pending[msg.id];
      cb(msg.result, msg.error);
    }
  };

  await new Promise(function(res, rej) {
    ws.onopen = res;
    ws.onerror = rej;
  });

  function cdp(method, params) {
    return new Promise(function(resolve, reject) {
      var id = msgId++;
      pending[id] = function(result, err) {
        if (err) reject(new Error(JSON.stringify(err))); else resolve(result);
      };
      ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    });
  }

  async function navigate(url) {
    await cdp('Page.navigate', { url: url });
    await delay(2000);
  }

  async function evalJs(expr) {
    var r = await cdp('Runtime.evaluate', { expression: expr });
    return r && r.result && r.result.value;
  }

  async function screenshot(filename) {
    var result = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    var outPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(result.data, 'base64'));
    console.log('Saved:', filename);
  }

  await cdp('Page.enable');

  // Helper: click div containing exact text
  function clickText(text) {
    return evalJs('(function(){ var divs = Array.from(document.querySelectorAll("div")); var el = divs.find(function(d){ return d.childNodes.length && Array.from(d.childNodes).some(function(n){ return n.nodeType===3 && n.textContent.trim()==="' + text + '"; }) && getComputedStyle(d).cursor==="pointer"; }); if(el) el.click(); return !!el; })()');
  }

  // ---- WORKSHOP SCREENS ----

  // Splash
  await navigate(BASE_URL + '/workshop.html');
  await screenshot('ws-splash.jpg');

  // Level Builder list
  await evalJs('(function(){ var divs = Array.from(document.querySelectorAll("div")); var tile = divs.find(function(d){ return d.textContent.includes("Level Builder") && getComputedStyle(d).cursor==="pointer" && d.children.length < 5; }); if(tile) tile.click(); })()');
  await delay(600);
  await screenshot('ws-builder-list.jpg');

  // Level Builder editor — click "+ New"
  await clickText('+ New');
  await delay(600);
  await screenshot('ws-builder-editor.jpg');

  // Back to splash
  await navigate(BASE_URL + '/workshop.html');
  await delay(400);

  // Block Designer list
  await evalJs('(function(){ var divs = Array.from(document.querySelectorAll("div")); var tile = divs.find(function(d){ return d.textContent.includes("Block Designer") && getComputedStyle(d).cursor==="pointer" && d.children.length < 5; }); if(tile) tile.click(); })()');
  await delay(600);
  await screenshot('ws-designer-list.jpg');

  // Block Designer editor — click first EDIT button
  await evalJs('(function(){ var divs = Array.from(document.querySelectorAll("div")); var btn = divs.find(function(d){ return d.textContent.trim()==="EDIT" && getComputedStyle(d).cursor==="pointer"; }); if(btn) btn.click(); })()');
  await delay(600);
  await screenshot('ws-designer-editor.jpg');

  // Back to splash
  await navigate(BASE_URL + '/workshop.html');
  await delay(400);

  // VFX Studio list
  await evalJs('(function(){ var divs = Array.from(document.querySelectorAll("div")); var tile = divs.find(function(d){ return d.textContent.includes("VFX Studio") && getComputedStyle(d).cursor==="pointer" && d.children.length < 5; }); if(tile) tile.click(); })()');
  await delay(600);
  await screenshot('ws-vfx-list.jpg');

  // VFX Studio editor — click first EDIT button
  await evalJs('(function(){ var divs = Array.from(document.querySelectorAll("div")); var btn = divs.find(function(d){ return d.textContent.trim()==="EDIT" && getComputedStyle(d).cursor==="pointer"; }); if(btn) btn.click(); })()');
  await delay(600);
  await screenshot('ws-vfx-editor.jpg');

  // Back to splash
  await navigate(BASE_URL + '/workshop.html');
  await delay(400);

  // UFO Customizer list
  await evalJs('(function(){ var divs = Array.from(document.querySelectorAll("div")); var tile = divs.find(function(d){ return d.textContent.includes("UFO") && getComputedStyle(d).cursor==="pointer" && d.children.length < 5; }); if(tile) tile.click(); })()');
  await delay(600);
  await screenshot('ws-ufo-list.jpg');

  // UFO editor — click first EDIT button
  await evalJs('(function(){ var divs = Array.from(document.querySelectorAll("div")); var btn = divs.find(function(d){ return d.textContent.trim()==="EDIT" && getComputedStyle(d).cursor==="pointer"; }); if(btn) btn.click(); })()');
  await delay(600);
  await screenshot('ws-ufo-editor.jpg');

  // ---- GAME SCREENS ----
  await navigate(BASE_URL + '/index.html');
  await delay(2500);
  await screenshot('game-splash.jpg');

  ws.close();
  try { child_process.execSync('pkill -f "remote-debugging-port=' + DEBUG_PORT + '"'); } catch(e) {}
  console.log('All done!');
}

main().catch(function(e) {
  console.error('ERROR:', e.message || e);
  try { child_process.execSync('pkill -f "remote-debugging-port=9333"'); } catch(x) {}
  process.exit(1);
});
