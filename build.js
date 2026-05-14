var fs = require("fs");
var babel = require("@babel/core");
var path = require("path");

var args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node build.js <input.jsx> <output.html> [title]");
  process.exit(1);
}

var inputFile = args[0];
var outputFile = args[1];
var pageTitle = args[2] || "Cosmic Drift";

var source = fs.readFileSync(inputFile, "utf8");

// Strip import line
source = source.replace(/^import\s+\{[^}]+\}\s+from\s+["']react["'];?\s*\n?/m, "");

// Replace "export default function" with "function" and capture the name
var compMatch = source.match(/export\s+default\s+function\s+(\w+)\s*\(/);
var componentName = compMatch ? compMatch[1] : "App";
source = source.replace(/export\s+default\s+function\s+/, "function ");

// Transform JSX
var result = babel.transformSync(source, {
  presets: [["@babel/preset-react", { pragma: "React.createElement", pragmaFrag: "React.Fragment" }]],
  plugins: [],
  filename: inputFile,
});

var compiled = result.code;

var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="default">\n<meta name="mobile-web-app-capable" content="yes">\n<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n<meta http-equiv="Pragma" content="no-cache">\n<meta http-equiv="Expires" content="0">\n<title>' + pageTitle + '</title>\n<style>\n  * { margin: 0; padding: 0; box-sizing: border-box; }\n  html, body { width: 100%; height: 100%; overflow: hidden; background: #0b0c1a; }\n  #root { width: 100%; height: 100%; }\n  #loading-screen {\n    position: fixed; inset: 0; background: #0b0c1a; display: flex;\n    flex-direction: column; align-items: center; justify-content: center;\n    font-family: "Quicksand", sans-serif; z-index: 9999;\n  }\n  #loading-screen .title { font-size: 32px; font-weight: 700; color: #c8b8ff;\n    letter-spacing: 6px; text-transform: uppercase; margin-bottom: 20px; }\n  #loading-screen .bar-track { width: 200px; height: 4px; background: rgba(200,184,255,0.15);\n    border-radius: 2px; overflow: hidden; }\n  #loading-screen .bar-fill { height: 100%; width: 30%; background: linear-gradient(90deg, #c8b8ff, #50c8ff);\n    border-radius: 2px; animation: loadSlide 1.2s ease-in-out infinite; }\n  @keyframes loadSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }\n</style>\n<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Exo+2:wght@400;600;700&display=swap" rel="stylesheet">\n<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>\n<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>\n</head>\n<body>\n<div id="loading-screen"><div class="title">Cosmic Drift</div><div class="bar-track"><div class="bar-fill"></div></div></div>\n<div id="root"></div>\n<script>\n// Storage shim: wraps localStorage with cd_ prefix\nwindow.storage = {\n  get: function(key) {\n    try { var val = localStorage.getItem("cd_" + key);\n      return Promise.resolve(val != null ? { key: key, value: val } : null);\n    } catch(e) { return Promise.resolve(null); }\n  },\n  set: function(key, value) {\n    try { localStorage.setItem("cd_" + key, value);\n      return Promise.resolve({ key: key, value: value });\n    } catch(e) { return Promise.resolve(null); }\n  },\n  delete: function(key) {\n    try { localStorage.removeItem("cd_" + key);\n      return Promise.resolve({ key: key, deleted: true });\n    } catch(e) { return Promise.resolve(null); }\n  },\n  list: function(prefix) {\n    try { var keys = []; var pfx = "cd_" + (prefix || "");\n      for (var i = 0; i < localStorage.length; i++) {\n        var k = localStorage.key(i);\n        if (k.indexOf(pfx) === 0) keys.push(k.substring(3));\n      }\n      return Promise.resolve({ keys: keys });\n    } catch(e) { return Promise.resolve({ keys: [] }); }\n  }\n};\n\nvar useState = React.useState, useRef = React.useRef, useCallback = React.useCallback, useEffect = React.useEffect, memo = React.memo;\n\n</script>\n<script>\n' + compiled + '\nvar root = ReactDOM.createRoot(document.getElementById("root"));\nroot.render(React.createElement(' + componentName + '));\nvar ls = document.getElementById("loading-screen"); if (ls) ls.remove();\n</script>\n</body>\n</html>';

fs.writeFileSync(outputFile, html, "utf8");
console.log("Built: " + outputFile + " (" + Math.round(html.length / 1024) + " KB)");
