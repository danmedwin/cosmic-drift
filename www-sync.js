// Populates www/ (the Capacitor webDir) from the built pages and their assets.
// Run after `npm run build`; `npm run ios:sync` does build + this + cap sync.
var fs = require("fs");
var path = require("path");

var root = __dirname;
var out = path.join(root, "www");
var files = [
  "index.html",
  "workshop.html",
  "privacy.html",
  "manifest.json",
  "Space_Fighter_Loop.mp3",
  "Cosmic_Drift_Explainer_Image.png",
  "icon-192.png",
  "apple-touch-icon.png",
  "favicon.png"
];
var dirs = ["vendor"];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (var i = 0; i < files.length; i++) {
  var src = path.join(root, files[i]);
  if (!fs.existsSync(src)) { console.error("www-sync: missing " + files[i]); process.exit(1); }
  fs.copyFileSync(src, path.join(out, files[i]));
}
for (var d = 0; d < dirs.length; d++) {
  fs.cpSync(path.join(root, dirs[d]), path.join(out, dirs[d]), { recursive: true });
}
// iCloud Drive sometimes resurrects a just-deleted file as "name 2.ext" while it syncs; drop those so they never ship.
(function sweep(dir) {
  var names = fs.readdirSync(dir);
  for (var n = 0; n < names.length; n++) {
    var full = path.join(dir, names[n]);
    if (fs.statSync(full).isDirectory()) { sweep(full); continue; }
    if (/ \d+\.[^.]+$/.test(names[n])) { fs.rmSync(full); console.warn("www-sync: removed iCloud duplicate " + path.relative(root, full)); }
  }
})(out);
console.log("www-sync: " + files.length + " files + " + dirs.join(", ") + " -> www/");
