import { useState, useRef, useEffect } from "react";

/* ============================================================
   COSMIC WORKSHOP v5.0
   Creative suite for Cosmic Drift: Level Builder + Block Designer
   + VFX Studio + UFO Customizer + Hangar (ship designer).
   Shares storage with the game via window.storage.
   Created by Dan Medwin and Claude (Opus 4.6), 2026
   ============================================================ */

// ═══════════════════════════════════════════════════════════════
// SHARED CONSTANTS (duplicated from game for independence)
// ═══════════════════════════════════════════════════════════════

var COLS = 8, ROWS = 6, GAP = 5, START_PLASMA = 10;

var BLOCK_COLORS = {
  1: { bg: "linear-gradient(135deg,#7b5ea7,#9f7fd0)", border: "#6b4e97", shadow: "0 0 10px rgba(159,127,208,0.4)", particle: "#9f7fd0" },
  2: { bg: "linear-gradient(135deg,#e0457b,#ff6b9d)", border: "#c03868", shadow: "0 0 12px rgba(224,69,123,0.5)", particle: "#ff6b9d" },
  3: { bg: "linear-gradient(135deg,#9a7020,#b8862a)", border: "#7a5a18", shadow: "0 0 10px rgba(180,130,40,0.5)", particle: "#b8862a" },
  4: { bg: "linear-gradient(135deg,#2090a0,#30c0d0)", border: "#1a7888", shadow: "0 0 12px rgba(48,192,208,0.4)", particle: "#30c0d0" },
  5: { bg: "linear-gradient(135deg,#3060b0,#4080d8)", border: "#2850a0", shadow: "0 0 12px rgba(80,200,255,0.4)", particle: "#4080d8" },
  6: { bg: "linear-gradient(135deg,#8844cc,#aa66ee)", border: "#6633aa", shadow: "0 0 12px rgba(136,68,204,0.5)", particle: "#aa66ee" },
  7: { bg: "#888", border: "#666", shadow: "none", particle: "#888" },
  8: { bg: "linear-gradient(135deg,#2a8a2a,#40b840)", border: "#1a6a1a", shadow: "0 0 10px rgba(64,184,64,0.4)", particle: "#40b840" },
  9: { bg: "linear-gradient(135deg,#b8862a,#d4a843)", border: "#9a7020", shadow: "0 0 12px rgba(212,168,67,0.5)", particle: "#d4a843" },
  10: { bg: "linear-gradient(135deg,#4060a0,#5080c0)", border: "#3050a0", shadow: "0 0 12px rgba(80,128,220,0.5)", particle: "#5080c0" },
  11: { bg: "linear-gradient(135deg,#b8862a,#d4a843)", border: "#9a7020", shadow: "0 0 12px rgba(212,168,67,0.5)", particle: "#d4a843" },
  12: { bg: "linear-gradient(135deg,#b8862a,#d4a843)", border: "#9a7020", shadow: "0 0 12px rgba(212,168,67,0.5)", particle: "#d4a843" },
  13: { bg: "linear-gradient(135deg,#b8862a,#d4a843)", border: "#9a7020", shadow: "0 0 12px rgba(212,168,67,0.5)", particle: "#d4a843" },
  14: { bg: "linear-gradient(135deg,#b8862a,#d4a843)", border: "#9a7020", shadow: "0 0 12px rgba(212,168,67,0.5)", particle: "#d4a843" },
  15: { bg: "linear-gradient(135deg,#b8862a,#d4a843)", border: "#9a7020", shadow: "0 0 12px rgba(212,168,67,0.5)", particle: "#d4a843" },
  16: { bg: "linear-gradient(135deg,#b8862a,#d4a843)", border: "#9a7020", shadow: "0 0 12px rgba(212,168,67,0.5)", particle: "#d4a843" },
};

var BLOCK_LABELS = { 1: "Standard", 2: "Cross Shot", 3: "Lightning", 4: "Extra Core", 5: "Plasma Cell", 6: "Drone Strike", 7: "Indestructible", 8: "Acid Barrel", 9: "Treasure Crate", 10: "Force Field", 11: "Drone Crate", 12: "Lightning Crate", 13: "Cross Crate", 14: "Split Crate", 15: "Hammer Crate", 16: "Core Crate", 17: "UFO" };
var WIN_EXEMPT = { 7: true, 8: true, 9: true, 11: true, 12: true, 13: true, 14: true, 15: true, 16: true, 17: true };
function isCrate(t) { return t === 9 || (t >= 11 && t <= 16); }
var CRATE_VARIANTS = [{ type: 9, name: "Random", color: "rgba(212,168,67,0.8)" }, { type: 11, name: "Drone", color: "rgba(136,68,204,0.8)" }, { type: 12, name: "Zap", color: "rgba(180,130,40,0.8)" }, { type: 13, name: "Cross", color: "rgba(224,69,123,0.8)" }, { type: 14, name: "Split", color: "rgba(80,200,255,0.8)" }, { type: 15, name: "Hammer", color: "rgba(160,160,180,0.8)" }, { type: 16, name: "Core", color: "rgba(80,200,255,0.8)" }];

var BUILDER_TOUR_STEPS = [
  { title: "The Grid", desc: "Select a block type from the palette, then tap or drag across cells to place them. Tap a filled cell with the same block type to remove it." },
  { title: "Block Palette", desc: "Choose from 10 block types. The selected type highlights in blue. Tap it again to deselect." },
  { title: "Crate Variants", desc: "Tap the Crate icon in the palette to pick a reward type: Random, Drone, Lightning, Cross, Split, or Hammer." },
  { title: "Ship Position", desc: "Tap one of the eight columns below the grid to set where the player's ship starts." },
  { title: "Starting Plasma", desc: "Use the +/- buttons to set how much plasma the player starts with (1 to 20)." },
  { title: "Save & Play", desc: "Name your level, then Save it. Your levels are always in My Levels. Open the game to play them." }
];

// ── Style constants (match game HUD) ──
var PNL = "linear-gradient(180deg, #3d3d4a 0%, #2a2a35 100%)";
var PNLB = "2px solid #505058";
var SCRN = "linear-gradient(180deg, #0a0a14 0%, #12121e 100%)";
var SCRNB = "2px solid #3a3a45";
var SCRNS = "inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)";

// ── Animation CSS (subset needed for Workshop) ──
var ANIM_CSS = "@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&family=Exo+2:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');\n@keyframes starDrift{0%{transform:translateY(-50%)}100%{transform:translateY(0)}}\n@keyframes introFadeIn{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}\n@keyframes pulse{0%{opacity:0.6}50%{opacity:1}100%{opacity:0.6}}\n@keyframes ufoWarpOut{0%{transform:scale(1);opacity:1}100%{transform:scale(2.2);opacity:0}}\n@keyframes ufoWarpIn{0%{transform:scale(0.05);opacity:0}60%{transform:scale(1.08);opacity:0.9}100%{transform:scale(1);opacity:1}}\n@keyframes ufoLightSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}\n@keyframes splashFloat{0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)}}\n@keyframes splashGlow{0%{opacity:0.4}50%{opacity:0.8}100%{opacity:0.4}}@keyframes cdSplashEnterFromGame{0%{transform:scale(0.95);filter:brightness(0.5)}100%{transform:scale(1);filter:brightness(1)}}@keyframes cdSplashExitShrink{0%{transform:scale(1);filter:brightness(1)}30%{transform:scale(0.93);filter:brightness(0.55)}100%{transform:scale(0.93);filter:brightness(0.55)}}\n* { box-sizing: border-box; }\ninput[type=range] { -webkit-appearance: none; appearance: none; background: rgba(255,255,255,0.1); border-radius: 4px; height: 6px; outline: none; }\ninput[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 32px; height: 32px; border-radius: 50%; background: #4488ff; border: 3px solid #88bbff; cursor: pointer; box-shadow: 0 0 8px rgba(68,136,255,0.4); }\ninput[type=range]::-moz-range-thumb { width: 32px; height: 32px; border-radius: 50%; background: #4488ff; border: 3px solid #88bbff; cursor: pointer; box-shadow: 0 0 8px rgba(68,136,255,0.4); }@keyframes vfxOozeDrip{0%{transform:scaleY(0);opacity:0}100%{transform:scaleY(1);opacity:0.85}}@keyframes vfxOozeWave{0%{transform:translateY(0)}100%{transform:translateY(50%)}}@keyframes vfxBurst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0);opacity:0}}@keyframes vfxRing{0%{transform:scale(0.1);opacity:1}100%{transform:scale(2.2);opacity:0}}@keyframes vfxFlash{0%{transform:scale(0.2);opacity:1}100%{transform:scale(1.8);opacity:0}}@keyframes vfxPop{0%{transform:scale(1);filter:brightness(1)}30%{transform:scale(1.2);filter:brightness(1.8)}100%{transform:scale(0);opacity:0}}@keyframes vfxBubble{0%{transform:translateY(0) scale(0.5);opacity:0}15%{opacity:0.55}85%{opacity:0.55}100%{transform:translateY(88px) scale(1);opacity:0}}@keyframes vfxSpark{0%{transform:translate(0,0) scale(1);opacity:1}35%{transform:translate(calc(var(--sx)*0.45),calc(var(--sy)*0.25 - 7px));opacity:0.9}100%{transform:translate(var(--sx),var(--sy)) scale(0.3);opacity:0}}@keyframes vfxBurnBlock{0%{opacity:1;filter:brightness(1)}10%{opacity:1;filter:brightness(2.3)}55%{opacity:0;filter:brightness(1)}100%{opacity:0;filter:brightness(1)}}@keyframes vfxShatter{0%{transform:translate(0,0) scale(1);opacity:0}15%{opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0);opacity:0}}@keyframes vfxDroneShard{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0.2);opacity:0}}@keyframes plasmaZip{0%{transform:translate(0,0) scale(1);opacity:1}80%{opacity:1}100%{transform:translate(var(--endX),var(--endY)) scale(0.5);opacity:0}}@keyframes plasmaFlash{0%{transform:scale(0.5);opacity:1}16%{transform:scale(1.5);opacity:0}100%{transform:scale(1.5);opacity:0}}@keyframes vfxLightningBolt{0%{opacity:0;filter:brightness(1)}8%{opacity:1;filter:brightness(2.5)}50%{opacity:0.7;filter:brightness(1.3)}70%{opacity:0;filter:brightness(1)}100%{opacity:0}}";

// ═══════════════════════════════════════════════════════════════
// SHARED VISUAL COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Stars() { var items = []; for (var h = 0; h < 2; h++) { for (var i = 0; i < 50; i++) items.push(React.createElement("div", { key: h + "_" + i, style: { position: "absolute", width: i % 7 === 0 ? 3 : i % 4 === 0 ? 2 : 1, height: i % 7 === 0 ? 3 : i % 4 === 0 ? 2 : 1, borderRadius: "50%", background: i % 9 === 0 ? "#ffa8ff" : i % 6 === 0 ? "#a8c8ff" : "rgba(255,255,255,0.5)", left: ((i * 37 + 13) % 100) + "%", top: (((i * 53 + 7) % 100) / 2 + h * 50) + "%", opacity: 0.2 + (i % 5) * 0.15 } })); } return React.createElement("div", { style: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 } }, React.createElement("div", { style: { position: "absolute", left: 0, right: 0, top: 0, height: "200%", animation: "starDrift 40s linear infinite" } }, items)); }

function CoreIcon(props) { var s = props.size, mode = props.mode || "lit"; var isLit = mode === "lit" || mode === "extra"; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24" }, React.createElement("defs", null, React.createElement("linearGradient", { id: "cgLit", x1: "0", y1: "0", x2: "1", y2: "1" }, React.createElement("stop", { offset: "0%", stopColor: "#30c0d0" }), React.createElement("stop", { offset: "100%", stopColor: "#2090a0" }))), React.createElement("polygon", { points: "12,2 21,7 21,17 12,22 3,17 3,7", fill: isLit ? "url(#cgLit)" : "none", stroke: isLit ? "#50e8f0" : "rgba(80,200,255,0.2)", strokeWidth: "1.5" }), isLit && React.createElement("circle", { cx: "12", cy: "12", r: "4", fill: "rgba(255,255,255,0.8)" })); }
function CrossShotIcon(props) { return React.createElement("svg", { width: props.size, height: props.size, viewBox: "0 0 24 24" }, React.createElement("line", { x1: "12", y1: "2", x2: "12", y2: "22", stroke: "#fff", strokeWidth: "3", strokeLinecap: "round" }), React.createElement("line", { x1: "2", y1: "12", x2: "22", y2: "12", stroke: "#fff", strokeWidth: "3", strokeLinecap: "round" }), React.createElement("circle", { cx: "12", cy: "12", r: "3", fill: "#fff", opacity: "0.6" })); }
function LightningIcon(props) { return React.createElement("svg", { width: props.size, height: props.size, viewBox: "0 0 24 24" }, React.createElement("path", { d: "M13 2L4 14h6l-2 8 9-12h-6l2-8z", fill: "#ffe066", stroke: "#d4a830", strokeWidth: "0.5" })); }
function PlasmaIcon(props) { var g = "pg" + props.size; return React.createElement("svg", { width: props.size, height: props.size, viewBox: "0 0 24 24" }, React.createElement("defs", null, React.createElement("radialGradient", { id: g }, React.createElement("stop", { offset: "0%", stopColor: "#fff", stopOpacity: "0.9" }), React.createElement("stop", { offset: "30%", stopColor: "#80ddff", stopOpacity: "0.8" }), React.createElement("stop", { offset: "60%", stopColor: "#50c8ff", stopOpacity: "0.6" }), React.createElement("stop", { offset: "100%", stopColor: "#2060ff", stopOpacity: "0" }))), React.createElement("circle", { cx: "12", cy: "12", r: "10", fill: "url(#" + g + ")" }), React.createElement("circle", { cx: "12", cy: "12", r: "5", fill: "rgba(255,255,255,0.7)" })); }
function DroneIcon(props) { var s = props.size; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24" }, React.createElement("path", { d: "M12 6L8 10h3v4H8l4 4 4-4h-3v-4h3z", fill: "#e8e8ff", stroke: "rgba(255,255,255,0.6)", strokeWidth: "0.5" }), React.createElement("line", { x1: "5", y1: "8", x2: "8", y2: "10", stroke: "#d0d0ff", strokeWidth: "1.5", strokeLinecap: "round" }), React.createElement("line", { x1: "19", y1: "8", x2: "16", y2: "10", stroke: "#d0d0ff", strokeWidth: "1.5", strokeLinecap: "round" }), React.createElement("circle", { cx: "5", cy: "7.5", r: "1.5", fill: "#80ffee", opacity: "0.9" }), React.createElement("circle", { cx: "19", cy: "7.5", r: "1.5", fill: "#80ffee", opacity: "0.9" })); }
// Block Designer drone icon (drone_ic path), used for the Drone Crate corner badge.
function BDDroneIcon(props) { var s = props.size, c = props.color || "#e8e8ff"; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 100 100" }, React.createElement("path", { d: "M 62,34 L 62,66 A 12,12 0 1,1 38,66 L 38,34 A 12,12 0 1,1 62,34 Z M 42.5,35.0 L 39.5,39.0 L 18.5,24.0 L 21.5,20.0 Z M 21,32 A 10,10 0 1,1 21.01,32 Z M 60.5,39.0 L 57.5,35.0 L 78.5,20.0 L 81.5,24.0 Z M 79,32 A 10,10 0 1,1 79.01,32 Z M 39.6,60.9 L 42.4,65.1 L 21.4,79.1 L 18.6,74.9 Z M 21,84 A 10,10 0 1,1 21.01,84 Z M 57.6,65.1 L 60.4,60.9 L 81.4,74.9 L 78.6,79.1 Z M 79,84 A 10,10 0 1,1 79.01,84 Z", fill: c, fillRule: "nonzero" })); }
// Block Designer cross icon (cross path), used for the Cross Crate corner badge.
function BDCrossIcon(props) { var s = props.size, c = props.color || "#ffffff"; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 100 100" }, React.createElement("path", { d: "M 44,28 L 50,14 L 56,28 L 52,28 L 52,48 L 72,48 L 72,44 L 86,50 L 72,56 L 72,52 L 52,52 L 52,72 L 56,72 L 50,86 L 44,72 L 48,72 L 48,52 L 28,52 L 28,56 L 14,50 L 28,44 L 28,48 L 48,48 L 48,28 Z", fill: c })); }
// Shared Split (angle-bounce) icon, used for the Split Crate corner badge.
function SplitIcon(props) { var s = props.size; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24" }, React.createElement("path", { d: "M4 4L12 20", stroke: "#80ddff", strokeWidth: "2.5", strokeLinecap: "round" }), React.createElement("path", { d: "M12 20L20 4", stroke: "#80ddff", strokeWidth: "2.5", strokeLinecap: "round", strokeDasharray: "3 2" }), React.createElement("circle", { cx: "12", cy: "20", r: "3.5", fill: "#80ddff", opacity: "0.5" }), React.createElement("circle", { cx: "4", cy: "4", r: "3", fill: "#50c8ff" }), React.createElement("circle", { cx: "20", cy: "4", r: "3", fill: "#50c8ff" })); }
function AcidBarrelIcon(props) { var s = props.size; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24" }, React.createElement("rect", { x: "6", y: "3", width: "12", height: "18", rx: "3", fill: "#0a3a0a", stroke: "#40b840", strokeWidth: "1.2" }), React.createElement("rect", { x: "7", y: "5", width: "10", height: "3", rx: "1", fill: "#40b840", opacity: "0.4" }), React.createElement("rect", { x: "7", y: "16", width: "10", height: "3", rx: "1", fill: "#40b840", opacity: "0.4" }), React.createElement("line", { x1: "6", y1: "10", x2: "18", y2: "10", stroke: "#40b840", strokeWidth: "0.5", opacity: "0.5" }), React.createElement("line", { x1: "6", y1: "14", x2: "18", y2: "14", stroke: "#40b840", strokeWidth: "0.5", opacity: "0.5" }), React.createElement("circle", { cx: "12", cy: "12", r: "2.5", fill: "#80ff80", opacity: "0.7" }), React.createElement("circle", { cx: "12", cy: "12", r: "1", fill: "#fff", opacity: "0.9" }), React.createElement("rect", { x: "5", y: "2.5", width: "14", height: "1", rx: "0.5", fill: "#50cc50", opacity: "0.6" }), React.createElement("rect", { x: "5", y: "20.5", width: "14", height: "1", rx: "0.5", fill: "#50cc50", opacity: "0.6" })); }
function TreasureCrateIcon(props) { var s = props.size; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24" }, React.createElement("rect", { x: "2", y: "7", width: "20", height: "14", rx: "1", fill: "#4a4a5a", stroke: "#707088", strokeWidth: "1" }), React.createElement("rect", { x: "2", y: "7", width: "20", height: "4", fill: "#5a5a6a", rx: "1" }), React.createElement("line", { x1: "2", y1: "11", x2: "22", y2: "11", stroke: "#707088", strokeWidth: "0.8" }), React.createElement("rect", { x: "4", y: "8.5", width: "3", height: "2", rx: "0.5", fill: "#606070", stroke: "#808098", strokeWidth: "0.3" }), React.createElement("rect", { x: "17", y: "8.5", width: "3", height: "2", rx: "0.5", fill: "#606070", stroke: "#808098", strokeWidth: "0.3" }), React.createElement("rect", { x: "9", y: "13", width: "6", height: "4", rx: "1", fill: "#2a2a3a", stroke: "#ffe066", strokeWidth: "0.8" }), React.createElement("circle", { cx: "12", cy: "15", r: "1.2", fill: "#ffe066", opacity: "0.9" }), React.createElement("line", { x1: "4", y1: "17", x2: "8", y2: "17", stroke: "#606070", strokeWidth: "0.5" }), React.createElement("line", { x1: "16", y1: "17", x2: "20", y2: "17", stroke: "#606070", strokeWidth: "0.5" }), React.createElement("rect", { x: "4", y: "13", width: "3", height: "1", rx: "0.3", fill: "#606070", opacity: "0.5" }), React.createElement("rect", { x: "17", y: "13", width: "3", height: "1", rx: "0.3", fill: "#606070", opacity: "0.5" })); }
function DiamondPlateBlock(props) { var ps = Math.max(8, props.size * 0.22), h = ps / 2; return React.createElement("div", { style: { width: props.size, height: props.size, borderRadius: 6, overflow: "hidden", border: "2px solid #555", position: "relative", boxSizing: "border-box" } }, React.createElement("svg", { width: props.size, height: props.size, style: { position: "absolute", top: -2, left: -2 } }, React.createElement("defs", null, React.createElement("pattern", { id: "dpat", x: "0", y: "0", width: ps, height: ps, patternUnits: "userSpaceOnUse" }, React.createElement("rect", { width: ps, height: ps, fill: "#707580" }), React.createElement("path", { d: "M" + h + " 1L" + (ps - 1) + " " + h + "L" + h + " " + (ps - 1) + "L1 " + h + "Z", fill: "#888a90", stroke: "#606368", strokeWidth: "0.5" }))), React.createElement("rect", { width: props.size, height: props.size, fill: "url(#dpat)" }))); }

var UFO_DEFAULT_DESIGN = { hullColor: "#b86020", domeColor: "#44ffee", lightColor: "#4488ff", lightSpeed: 8, particleCount: 3, particleSize: 1.0, glowOpacity: 0.0, showAlien: false };
var PLASMA_DEFAULT_DESIGN = { shape: "circle", color: "#50c8ff", colorMode: "radial", colorOpacity: 1.0, glowColor: "#80ddff", glowSize: 8, splitEnabled: false, splitDistance: 30, flashEnabled: true, flashColor: "#ffffff", flashSize: 24, flashOpacity: 0.9, sourceOffsetX: 50, sourceOffsetY: 0, speed: 1.0 };
var PLASMA_SHAPE_LABELS = { circle: "Ball", blast: "Blast", torpedo: "Torpedo" };
function ufoAdjustColor(hex, factor) {
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.min(255, Math.round(r * factor)); g = Math.min(255, Math.round(g * factor)); b = Math.min(255, Math.round(b * factor));
  return "#" + ("0"+r.toString(16)).slice(-2) + ("0"+g.toString(16)).slice(-2) + ("0"+b.toString(16)).slice(-2);
}
function UFOBlockSvg(props) {
  var size = props.size || 48;
  var animPhase = props.animPhase || "idle";
  var uid = props.uid || "0";
  var d = Object.assign({}, UFO_DEFAULT_DESIGN, props.design || {});
  var hullLight = ufoAdjustColor(d.hullColor, 1.5);
  var hullDark = ufoAdjustColor(d.hullColor, 0.4);
  var lightDark = ufoAdjustColor(d.lightColor, 0.55);
  var lightBright = ufoAdjustColor(d.lightColor, 1.6);
  var pCount = Math.round(d.particleCount || 3);
  var pSize = d.particleSize || 1.0;
  var glowOp = d.glowOpacity || 0;
  var showAlien = !!d.showAlien;
  var hx = 70, hy = 80;
  var dRx = 22, dRy = 23, dY = hy - 16;
  var gStyle = {};
  if (animPhase === "warpOut") { gStyle = { animation: "ufoWarpOut 0.5s ease-in forwards", transformOrigin: hx + "px " + hy + "px" }; }
  else if (animPhase === "warpIn") { gStyle = { animation: "ufoWarpIn 0.6s ease-out forwards", transformOrigin: hx + "px " + hy + "px" }; }
  var stealthColors = [d.lightColor, lightDark, lightBright];
  var lights = [];
  for (var li = 0; li < pCount; li++) {
    var la = (li / pCount) * Math.PI * 2;
    var orbitR = 40 + (li * 11 % 5) * 3;
    var orbitY = 6.5 + (li * 7 % 4) * 1.5;
    var speedFac = 0.65 + (li * 13 % 7) * 0.1;
    lights.push({
      x: hx + orbitR * Math.cos(la), y: hy + orbitY * Math.sin(la),
      c: stealthColors[li % 3],
      dur: (d.lightSpeed * speedFac).toFixed(2),
      pulse: (1.8 + li * 0.4 % 1.8).toFixed(2)
    });
  }
  return React.createElement("svg", { viewBox: "20 25 100 100", width: size, height: size, style: { display: "block", overflow: "visible" } },
    React.createElement("defs", null,
      React.createElement("radialGradient", { id: "ufo-h-" + uid, cx: "50%", cy: "26%" },
        React.createElement("stop", { offset: "0%", stopColor: hullLight }),
        React.createElement("stop", { offset: "55%", stopColor: d.hullColor }),
        React.createElement("stop", { offset: "100%", stopColor: hullDark })),
      React.createElement("radialGradient", { id: "ufo-d-" + uid, cx: "33%", cy: "25%" },
        React.createElement("stop", { offset: "0%", stopColor: "#ffffff", stopOpacity: "0.92" }),
        React.createElement("stop", { offset: "38%", stopColor: d.domeColor, stopOpacity: "0.55" }),
        React.createElement("stop", { offset: "100%", stopColor: hullDark, stopOpacity: "0.22" })),
      glowOp > 0 ? React.createElement("radialGradient", { id: "ufo-g-" + uid, cx: "50%", cy: "40%" },
        React.createElement("stop", { offset: "0%", stopColor: d.hullColor, stopOpacity: glowOp }),
        React.createElement("stop", { offset: "45%", stopColor: d.hullColor, stopOpacity: glowOp * 0.5 }),
        React.createElement("stop", { offset: "100%", stopColor: d.hullColor, stopOpacity: 0 })) : null,
      React.createElement("clipPath", { id: "ufo-dc-" + uid },
        React.createElement("rect", { x: hx - dRx - 3, y: 0, width: dRx * 2 + 6, height: hy }))),
    React.createElement("g", { style: gStyle },
      glowOp > 0 ? React.createElement("ellipse", { cx: hx, cy: hy + 15, rx: 72, ry: 35, fill: "url(#ufo-g-" + uid + ")" }) : null,
      React.createElement("ellipse", { cx: hx, cy: hy, rx: 48, ry: 14, fill: "url(#ufo-h-" + uid + ")" }),
      React.createElement("ellipse", { cx: hx, cy: hy - 1, rx: 46.5, ry: 10, fill: "url(#ufo-h-" + uid + ")" }),
      lights.map(function(lp, li2) {
        return React.createElement("g", { key: li2, style: { animation: "ufoLightSpin " + lp.dur + "s linear infinite", transformOrigin: hx + "px " + hy + "px" } },
          React.createElement("circle", { cx: lp.x, cy: lp.y, r: 3.5 * pSize, fill: lp.c, style: { animation: "pulse " + lp.pulse + "s ease-in-out infinite" } }));
      }),
      showAlien ? React.createElement("g", { clipPath: "url(#ufo-dc-" + uid + ")" },
        React.createElement("ellipse", { cx: hx, cy: hy - 10, rx: 5, ry: 5.5, fill: "#70b870", opacity: "0.9" }),
        React.createElement("ellipse", { cx: hx, cy: hy - 22, rx: 9, ry: 9, fill: "#70b870", opacity: "0.9" }),
        React.createElement("ellipse", { cx: hx - 4, cy: hy - 23, rx: 3.5, ry: 2.5, fill: "#152215", opacity: "0.95", transform: "rotate(-15," + (hx - 4) + "," + (hy - 23) + ")" }),
        React.createElement("ellipse", { cx: hx + 4, cy: hy - 23, rx: 3.5, ry: 2.5, fill: "#152215", opacity: "0.95", transform: "rotate(15," + (hx + 4) + "," + (hy - 23) + ")" })) : null,
      React.createElement("ellipse", { cx: hx, cy: dY, rx: dRx, ry: dRy, fill: "url(#ufo-d-" + uid + ")", clipPath: "url(#ufo-dc-" + uid + ")" }),
      React.createElement("ellipse", { cx: hx - dRx * 0.22, cy: dY - dRy * 0.28, rx: dRx * 0.27, ry: dRy * 0.22, fill: "white", opacity: "0.25", transform: "rotate(-20," + (hx - dRx * 0.22) + "," + (dY - dRy * 0.28) + ")", clipPath: "url(#ufo-dc-" + uid + ")" })));
}

var SHIP_HULLS = ["red5", "fireflight", "saucer", "startrack", "falcor", "birdofplay", "vespa", "mytie", "callbox", "artie2"];
var SHIP_HULL_LABELS = { red5: "Red 5", arrow: "Default", fireflight: "Fireflight", saucer: "Saucer", startrack: "Star Track", falcor: "Millenia Falcor", birdofplay: "Bird of Play", vespa: "Stinger-II", mytie: "My Tie", ironeye: "Hex Fighter", callbox: "Police Box", artie2: "Artie-2", none: "None" };
var SHIP_PART_TYPES = ["circle", "rect", "triangle", "trapezoid", "line", "arrow"];
var SHIP_PART_LABELS = { circle: "Oval", rect: "Rect", triangle: "Triangle", trapezoid: "Trapezoid", line: "Line", arrow: "Arrow" };
// Normalized 6-point swept-arrow polygon (centered, range [-0.5, 0.5]).
// Derived from Cosmic-drift-default-ship.svg: front tip, right wing tip, right
// inner notch, back tail, left inner notch, left wing tip.
var ARROW_POINTS = [[0, -0.5], [0.5, 0.269], [0.207, 0.170], [0, 0.5], [-0.207, 0.170], [-0.5, 0.269]];
// Each hull preset is a parts array (no baked hull SVG). Selecting a hull in
// the editor loads its parts; existing saved designs with empty `parts` are
// migrated on load by populating from the named hull preset.
var HULL_PRESETS = {
  // Default ship — single swept-arrow polygon from Cosmic-drift-default-ship.svg.
  // SVG layer was named "Triangle"; we preserve the name on the part.
  arrow: [
    { type: "arrow", name: "Triangle", x: 20, y: 20, w: 24, h: 36, rot: 0, color: "#efb6ed", opacity: 1, bw: 1, bc: "#a45ba3", bo: 1 }
  ],
  // Fireflight: layer names match fireflight.svg.
  fireflight: [
    { type: "trapezoid", name: "Wing-Left", x: 12, y: 22, w: 8, h: 6, tw: 5, tofs: -1, rot: -90, color: "#3a2e1f", color2: "#b89a6e", fillMode: "linear", gradAngle: 270, opacity: 1 },
    { type: "trapezoid", name: "Wing-Right", x: 28, y: 22, w: 8, h: 6, tw: 5, tofs: 1, rot: 90, color: "#3a2e1f", color2: "#b89a6e", fillMode: "linear", gradAngle: 270, opacity: 1 },
    { type: "rect", name: "Thruster-Pod-L", x: 6, y: 22, w: 5, h: 10, cr: 2.3, rot: 0, color: "#2a2014", color2: "#a08458", fillMode: "linear", gradAngle: 0, opacity: 1 },
    { type: "rect", name: "Thruster-Pod-R", x: 34, y: 22.02, w: 5, h: 10, cr: 2.3, rot: 0, color: "#2a2014", color2: "#a08458", fillMode: "linear", gradAngle: 180, opacity: 1 },
    { type: "circle", name: "Thruster-Glow-L", x: 6, y: 26, w: 3, h: 2, rot: 0, color: "#ffd070", color2: "#7a2010", fillMode: "radial", opacity: 0.95, glowEnabled: true, glowColor: "#ff6040", glowIntensity: 1 },
    { type: "circle", name: "Thruster-Glow-R", x: 34.01, y: 26, w: 3, h: 2, rot: 0, color: "#ffd070", color2: "#7a2010", fillMode: "radial", opacity: 0.95, glowEnabled: true, glowColor: "#ff6040", glowIntensity: 1 },
    { type: "rect", name: "Body-Main", x: 20, y: 17, w: 10, h: 16, cr: 3.5, rot: 0, color: "#3a2e1f", color2: "#c4a878", fillMode: "linear", gradAngle: 180, opacity: 1 },
    { type: "circle", name: "Engine-Bulb", x: 20.2, y: 30.75, w: 14, h: 10.5, rot: 0, color: "#b6996d", color2: "#3a2e1f", fillMode: "radial", gradStop: 0.25, opacity: 1 },
    { type: "circle", name: "Engine-Glow-Core", x: 20.39, y: 32.47, w: 9, h: 6.5, rot: 0, color: "#fff4a0", color2: "#a02810", fillMode: "radial", gradStop: 0.25, opacity: 0.95, glowEnabled: true, glowColor: "#ff6040", glowIntensity: 1 },
    { type: "rect", name: "Neck", x: 20.6, y: 10.14, w: 1.5, h: 4, cr: 0.6, rot: 0, color: "#2a2014", color2: "#a08458", fillMode: "linear", gradAngle: 180, opacity: 1 },
    { type: "rect", name: "Neck-copy", x: 19.11, y: 10.2, w: 1.5, h: 4, cr: 0.6, rot: 180, color: "#2a2014", color2: "#a08458", fillMode: "linear", gradAngle: 180, opacity: 1 },
    { type: "circle", name: "Cockpit-Head", x: 19.91, y: 6.74, w: 8.5, h: 7, rot: 0, color: "#b6986d", color2: "#3a2e1f", fillMode: "radial", gradStop: 0.2, opacity: 1 },
    { type: "rect", name: "Cockpit-Glass", x: 20, y: 5.2, w: 5.5, h: 2, cr: 1, rot: 0, color: "#80ddff", color2: "#0f2a3a", fillMode: "linear", gradAngle: 90, opacity: 0.9 }
  ],
  // Saucer: shallow UFO disc + centered dome (per Dan's UFO-default JSON).
  saucer: [
    { type: "rect",      x: 19.75, y: 12.43, w: 1,     h: 3.5,  cr: 0.5,  rot: 0,  color: "#ffffff", color2: "#222a3a", fillMode: "linear", gradAngle: 270, opacity: 0.9 },
    { type: "circle",    x: 19.76, y: 18.15, w: 15,    h: 9.5,  rot: 0,  color: "#c9effd", color2: "#222a3a", fillMode: "radial", gradStop: 0,    opacity: 0.55 },
    { type: "circle",    x: 19.59, y: 22.14, w: 27.46, h: 7,    rot: 0,  color: "#80ddff", color2: "#1b263b", fillMode: "radial", opacity: 0.9 },
    { type: "rect",      x: 19.64, y: 22.33, w: 1.28,  h: 30,   cr: 0.5,  rot: 90, color: "#80ddff", color2: "#222a3a", fillMode: "linear", gradAngle: 195, opacity: 0.9 },
    { type: "trapezoid", x: 19.84, y: 33.31, w: 8,     h: 10,   tw: 4, tofs: 0, rot: 0,  color: "#80ddff", color2: "#222a3a", fillMode: "linear", gradAngle: 90, opacity: 0.45 },
    { type: "circle",    x: 19.88, y: 28.15, w: 5.5,   h: 2,    rot: 0,  color: "#80ddff", color2: "#222a3a", fillMode: "radial", gradStop: 0.45, opacity: 0.9 },
    { type: "circle",    x: 19.96, y: 22.26, w: 1.5,   h: 1.5,  rot: 0,  color: "#fff7e5", color2: "#c9a54f", fillMode: "radial", opacity: 0.95 },
    { type: "circle",    x: 34.17, y: 22.41, w: 1,     h: 1,    rot: 0,  color: "#fff7e5", color2: "#c9a54f", fillMode: "radial", opacity: 0.95 },
    { type: "circle",    x: 5.10,  y: 22.40, w: 1,     h: 1,    rot: 0,  color: "#fff7e5", color2: "#c9a54f", fillMode: "radial", opacity: 0.95 }
  ],
  // Star Track: layer names match star-track.svg. Render order puts arms
  // and body at the back so the saucer + dome sit on top.
  startrack: [
    { "type": "rect", "name": "Pylon-Left", "x": 13.89, "y": 27, "w": 10, "h": 1.6, "cr": 0.6, "rot": -38, "color": "#2a2f3a", "color2": "#9aa3b2", "fillMode": "linear", "gradAngle": 270, "opacity": 1 },
    { "type": "rect", "name": "Pylon-Right", "x": 25.81, "y": 26.95, "w": 10, "h": 1.6, "cr": 0.6, "rot": 38, "color": "#2a2f3a", "color2": "#9aa3b2", "fillMode": "linear", "gradAngle": 255, "opacity": 1 },
    { "type": "rect", "name": "Secondary-Hull", "x": 20.032038643533127, "y": 26.516758675078865, "w": 5.6, "h": 13, "cr": 2.6, "rot": 0, "color": "#1a1e28", "color2": "#b0b8c4", "fillMode": "linear", "gradAngle": 0, "opacity": 1 },
    { "type": "rect", "name": "Neck", "x": 20, "y": 17.47, "w": 2.6, "h": 10, "cr": 0.6, "rot": 0, "color": "#3a4150", "color2": "#cfd6df", "fillMode": "linear", "gradAngle": 0, "opacity": 1 },
    { "type": "circle", "name": "Saucer", "x": 19.69, "y": 12.97, "w": 22, "h": 8, "rot": 0, "color": "#2a2f3a", "color2": "#dde3ec", "fillMode": "radial", "gradStop": 0.75, "opacity": 1, "groupId": "g1779514987121", "gsx": 1, "gsy": 1, "gcx": 19.69, "gcy": 12.969999999999999, "groupName": "Saucer" },
    { "type": "circle", "name": "Bridge", "x": 19.93, "y": 11.01, "w": 6.5, "h": 3.5, "rot": 0, "color": "#cfd6df", "color2": "#3a4150", "fillMode": "radial", "opacity": 1, "groupId": "g1779514987121", "gsx": 1, "gsy": 1, "gcx": 19.69, "gcy": 12.969999999999999, "groupName": "Saucer" },
    { "type": "circle", "name": "Bridge-Lamp", "x": 19.92, "y": 10, "w": 1.4, "h": 1, "rot": 0, "color": "#e9f6ff", "color2": "#4a7a8e", "fillMode": "radial", "opacity": 0.95, "glowEnabled": true, "glowIntensity": 1, "groupId": "g1779514987121", "gsx": 1, "gsy": 1, "gcx": 19.69, "gcy": 12.969999999999999, "groupName": "Saucer" },
    { "type": "rect", "name": "Nacelle-Left", "x": 9, "y": 25, "w": 3, "h": 20, "cr": 1.5, "rot": 0, "color": "#15181f", "color2": "#6a7484", "fillMode": "linear", "gradAngle": 0, "opacity": 1 },
    { "type": "rect", "name": "Nacelle-Right", "x": 31, "y": 25, "w": 3, "h": 20, "cr": 1.5, "rot": 0, "color": "#15181f", "color2": "#6a7484", "fillMode": "linear", "gradAngle": 180, "opacity": 1 },
    { "type": "rect", "name": "Warp-Glow-Left", "x": 8.571339714225138, "y": 27, "w": 1.4, "h": 14, "cr": 0.7, "rot": 0, "color": "#80ddff", "color2": "#1a4a5e", "fillMode": "linear", "gradAngle": 0, "opacity": 0.9, "glowEnabled": true, "glowIntensity": 1 },
    { "type": "rect", "name": "Warp-Glow-Right", "x": 31.779909828008247, "y": 26.591876971608833, "w": 1.4, "h": 14, "cr": 0.7, "rot": 0, "color": "#80ddff", "color2": "#1a4a5e", "fillMode": "linear", "gradAngle": 180, "opacity": 0.9, "glowEnabled": true, "glowIntensity": 1 },
    { "type": "circle", "name": "Bussard-Left", "x": 9.054712145110411, "y": 15.70920741324921, "w": 2.6, "h": 1.5, "rot": 0, "color": "#ff7a50", "color2": "#7a1d0e", "fillMode": "radial", "opacity": 0.95, "glowEnabled": true, "glowColor": "#ff6040", "glowIntensity": 1, "bw": 0.1 },
    { "type": "circle", "name": "Bussard-Right", "x": 30.802421135646682, "y": 15.919666617409913, "w": 2.6, "h": 1.5, "rot": 0, "color": "#ff7a50", "color2": "#7a1d0e", "fillMode": "radial", "opacity": 0.95, "glowEnabled": true, "glowColor": "#ff6040", "glowIntensity": 1, "bw": 0.1 }
  ],
  // Millenia Falcor: layer names match Millenia Falcor.svg. Mandibles are
  // approximated as rotated isoceles triangles (the SVG quadrilaterals taper
  // to ~16% width at the top, so the triangle silhouette matches closely).
  falcor: [
    { type: "triangle", name: "Left-Mandible", x: 15.94, y: 9.37, w: 7.5, h: 14, rot: 12, color: "#0d0d0d", color2: "#919191", fillMode: "linear", gradAngle: 255, opacity: 1 },
    { type: "triangle", name: "Right-Mandible", x: 24.02, y: 9.12, w: 7.5, h: 14, rot: -12, color: "#0c0d0d", color2: "#8c9097", fillMode: "linear", gradAngle: 285, opacity: 1 },
    { type: "circle", name: "Engine glow", x: 20.223077902240327, y: 36.5, w: 11.5, h: 3, rot: 0, color: "#80ddff", opacity: 1, bw: 0, bc: "#000000", bo: 1, glowEnabled: true, glowIntensity: 2.5 },
    { type: "circle", name: "Saucer", x: 20.18, y: 25.36, w: 27, h: 27, rot: 0, color: "#4d4d4d", color2: "#303030", fillMode: "radial", gradStop: 0.4, opacity: 1, bw: 0, glowEnabled: false },
    { type: "rect", x: 10.65, y: 25, w: 9, h: 4, cr: 0.75, rot: 0, color: "#222a3a", color2: "#6f7276", fillMode: "linear", gradAngle: 270, opacity: 1, bw: 0, bc: "#747677", bo: 1 },
    { type: "rect", name: "Cockpit", x: 31.96, y: 16.89, w: 3.5, h: 8, cr: 1, rot: 0, color: "#7c7e83", color2: "#222a3a", fillMode: "linear", opacity: 1 },
    { type: "circle", x: 31.908032077393077, y: 13.575267311608961, w: 3.5, h: 1.5, rot: 0, color: "#80ddff", color2: "#487c8e", fillMode: "radial", opacity: 0.9, bw: 0, bc: "#000000", bo: 1 },
    { type: "rect", x: 28.32, y: 23.14, w: 10.5, h: 3.5, cr: 0.75, rot: 150, color: "#222a3a", color2: "#62656a", fillMode: "linear", gradAngle: 105, opacity: 1, bw: 0, bc: "#747677", bo: 1 },
    { type: "rect", x: 28.88, y: 25, w: 9, h: 4, cr: 0.75, rot: 0, color: "#222a3a", color2: "#6f7276", fillMode: "linear", gradAngle: 270, opacity: 1, bw: 0, bc: "#747677", bo: 1 },
    { type: "circle", x: 20, y: 25, w: 11, h: 11, rot: 0, color: "#6b6b6b", color2: "#283140", fillMode: "radial", gradStop: 0.65, opacity: 1, bw: 0, bc: "#000000", bo: 0.2 },
    { type: "rect", x: 20, y: 13.55, w: 7.5, h: 4.1, cr: 0.75, rot: 90, color: "#8c8c8c", color2: "#222a3a", fillMode: "linear", gradAngle: 0, opacity: 1, bw: 0, bc: "#747677", bo: 1 },
    { type: "circle", x: 20.05, y: 32.56, w: 3, h: 3, rot: 0, color: "#4f4f4f", opacity: 1, bw: 0.2, bc: "#b0b0b0", bo: 1 },
    { type: "circle", x: 23.57, y: 31.86, w: 3, h: 3, rot: 0, color: "#4f4f4f", opacity: 1, bw: 0.2, bc: "#b0b0b0", bo: 1 },
    { type: "circle", x: 25.31, y: 35.16, w: 3, h: 3, rot: 0, color: "#4f4f4f", opacity: 1, bw: 0.2, bc: "#b0b0b0", bo: 1 },
    { type: "circle", x: 16.45, y: 31.7, w: 3, h: 3, rot: 0, color: "#4f4f4f", opacity: 1, bw: 0.2, bc: "#b0b0b0", bo: 1 },
    { type: "circle", x: 15, y: 34.95, w: 3, h: 3, rot: 0, color: "#4f4f4f", opacity: 1, bw: 0.2, bc: "#b0b0b0", bo: 1 },
    { type: "circle", x: 20.06, y: 36.21, w: 3, h: 3, rot: 0, color: "#4f4f4f", opacity: 1, bw: 0.2, bc: "#b0b0b0", bo: 1 }
  ],
  // Bird of Play: layer names match bird-of-play.svg. Right-triangle wing
  // fins are rendered as degenerate trapezoids (tw=0) with tofs at the edge
  // to put the apex at the correct corner (180° rot flips to the bottom).
  birdofplay: [
    { type: "trapezoid", name: "Wing-Upper-L", x: 7.27, y: 20.07, w: 10.18, h: 6.74, tw: 0, tofs: -5.09, rot: 0, color: "#1f2a22", color2: "#8a9a82", fillMode: "linear", gradAngle: 195, opacity: 1 },
    { type: "trapezoid", name: "Wing-Lower-L", x: 7.27, y: 28.67, w: 10.18, h: 10.6, tw: 0, tofs: -5.09, rot: 180, color: "#1a241d", color2: "#6d7e68", fillMode: "linear", gradAngle: 0, opacity: 1 },
    { type: "trapezoid", name: "Wing-Upper-R", x: 32.73, y: 20.07, w: 10.18, h: 6.74, tw: 0, tofs: 5.09, rot: 0, color: "#1f2a22", color2: "#8a9a82", fillMode: "linear", gradAngle: 345, opacity: 1 },
    { type: "trapezoid", name: "Wing-Lower-R", x: 32.75004837067209, y: 28.69068482688391, w: 10.18, h: 10.6, tw: 0, tofs: 5.09, rot: 180, color: "#1a241d", color2: "#6d7e68", fillMode: "linear", gradAngle: 180, opacity: 1 },
    { type: "rect", name: "Cannon-Stalk-L", x: 2.18, y: 15.01, w: 1.24, h: 14.38, cr: 0.62, rot: 0, color: "#0f1612", color2: "#5a6a55", fillMode: "linear", gradAngle: 0, opacity: 1 },
    { type: "rect", name: "Cannon-Stalk-R", x: 37.82, y: 15.03, w: 1.24, h: 14.38, cr: 0.62, rot: 0, color: "#0f1612", color2: "#5a6a55", fillMode: "linear", gradAngle: 180, opacity: 1 },
    { type: "rect", name: "Body-Main", x: 20, y: 28.46, w: 15.41, h: 14.45, cr: 2.61, rot: 0, color: "#1a241d", color2: "#a8b8a0", fillMode: "linear", gradAngle: 270, opacity: 1 },
    { type: "circle", name: "Body-Saucer", x: 20, y: 22.1, w: 9.22, h: 12.73, rot: 0, color: "#91a08a", color2: "#1a251e", fillMode: "radial", gradStop: 0.2, opacity: 1 },
    { type: "circle", name: "Engine-Glow", x: 20.17, y: 34.19, w: 9, h: 3, rot: 0, color: "#ff9050", color2: "#5a1808", fillMode: "radial", gradStop: 0.4, opacity: 0.9, glowEnabled: true, glowColor: "#ff6040", glowIntensity: 1 },
    { type: "rect", name: "Neck", x: 19.97, y: 14.87, w: 2.13, h: 16.03, cr: 1.03, rot: 0, color: "#15201a", color2: "#7a8a72", fillMode: "linear", gradAngle: 180, opacity: 1 },
    { type: "circle", name: "Head", x: 20, y: 7.72, w: 4.54, h: 6.81, rot: 0, color: "#c0d0b8", color2: "#222a3a", fillMode: "radial", gradStop: 0, opacity: 1 },
    { type: "rect", name: "Cockpit-Slit", x: 20, y: 7.4, w: 2.2, h: 0.9, cr: 0.45, rot: 0, color: "#ffb050", color2: "#5a2010", fillMode: "linear", gradAngle: 180, opacity: 0.95, glowEnabled: true, glowColor: "#ff6040", glowIntensity: 1 },
    { type: "circle", name: "Cannon-Cap-L", x: 2.22, y: 7.76, w: 2.27, h: 3.51, rot: 0, color: "#a0c8a0", color2: "#222a3a", fillMode: "radial", opacity: 1 },
    { type: "circle", name: "Cannon-Cap-R", x: 37.5, y: 8.42, w: 2.27, h: 3.51, rot: 0, color: "#a0c8a0", color2: "#222a3a", fillMode: "radial", opacity: 1 },
    { type: "circle", name: "Disruptor-L", x: 2.19, y: 7.71, w: 1.4, h: 2, rot: 0, color: "#23e13c", color2: "#31880c", fillMode: "radial", opacity: 0.95, glowEnabled: true, glowColor: "#80ff80", glowIntensity: 1 },
    { type: "circle", name: "Disruptor-R", x: 37.46, y: 8.36, w: 1.4, h: 2, rot: 0, color: "#23e13c", color2: "#31880c", fillMode: "radial", opacity: 0.95, glowEnabled: true, glowColor: "#80ff80", glowIntensity: 1 }
  ],
  vespa: [
    { type: "triangle", name: "Main-Hull", x: 20, y: 22, w: 14, h: 30, rot: 0, color: "#1a1e28", color2: "#7a8294", fillMode: "linear", gradAngle: 120, opacity: 1 },
    { type: "rect", name: "Engine-Left", x: 12.09, y: 37.47, w: 4.6, h: 2.6, cr: 0.6, rot: -8, color: "#06080c", color2: "#1a1e28", fillMode: "linear", gradAngle: 0, opacity: 1 },
    { type: "circle", name: "Glow-Left", x: 12.59, y: 37.75, w: 3.2, h: 1.8, rot: -8, color: "#ffb070", color2: "#7a1d0e", fillMode: "radial", opacity: 0.95, glowEnabled: true, glowColor: "#ff6040", glowIntensity: 1 },
    { type: "rect", name: "Nacelle-Left", x: 11, y: 27.05, w: 4, h: 20, cr: 1.2, rot: -8, color: "#0f1218", color2: "#5a6478", fillMode: "linear", gradAngle: 0, opacity: 1 },
    { type: "rect", name: "Spine", x: 19.96, y: 27.45, w: 2.4, h: 11.5, cr: 0.5, rot: 0, color: "#0a0c12", color2: "#424752", fillMode: "linear", gradAngle: 0, opacity: 1 },
    { type: "triangle", name: "Fin-Left", x: 7.12, y: 32.98, w: 8, h: 5, rot: -90, color: "#15181f", color2: "#4a5160", fillMode: "linear", gradAngle: 255, opacity: 1 },
    { type: "triangle", name: "Fin-Right", x: 33.01, y: 34, w: 8, h: 5, rot: 90, color: "#15181f", color2: "#4a5160", fillMode: "linear", gradAngle: 255, opacity: 1 },
    { type: "rect", name: "Canopy", x: 20, y: 17, w: 3.6, h: 11, cr: 1.6, rot: 0, color: "#3d6878", color2: "#0a1218", fillMode: "linear", gradAngle: 180, opacity: 0.95 },
    { type: "circle", name: "Canopy-Glint", x: 20, y: 12.7, w: 2.4, h: 1.2, rot: 0, color: "#cdeeff", color2: "#4a7a8e", fillMode: "radial", opacity: 0.9, glowEnabled: true, glowIntensity: 1 },
    { type: "rect", name: "Engine-Right", x: 28.02, y: 37.48, w: 4.6, h: 2.6, cr: 0.6, rot: 8, color: "#06080c", color2: "#1a1e28", fillMode: "linear", gradAngle: 0, opacity: 1 },
    { type: "circle", name: "Glow-Right", x: 27.52, y: 37.51, w: 3.2, h: 1.8, rot: 8, color: "#ffb070", color2: "#7a1d0e", fillMode: "radial", opacity: 0.95, glowEnabled: true, glowColor: "#ff6040", glowIntensity: 1 },
    { type: "rect", name: "Nacelle-Right", x: 28.86, y: 26.86, w: 4, h: 20, cr: 1.2, rot: 8, color: "#0f1218", color2: "#5a6478", fillMode: "linear", gradAngle: 180, opacity: 1 }
  ],
  mytie: [
    { "type": "trapezoid", "x": 34.75399071462951, "y": 19.910117903962114, "w": 30, "h": 3.5, "rot": 90, "color": "#222a3a", "opacity": 1, "bw": 0.5, "bc": "#969696", "bo": 1, "tw": 24, "tofs": 0, "name": "Left wing (outer)" },
    { "type": "trapezoid", "x": 31.75399071462951, "y": 19.94163050900413, "w": 30, "h": 2.5, "rot": 270, "color": "#222a3a", "opacity": 1, "bw": 0.5, "bc": "#969696", "bo": 1, "tw": 19.75, "tofs": 0, "name": "Left wing (inner)" },
    { "type": "line", "x": 33.50399071462951, "y": 20.941630509004124, "w": 23, "h": 0.5, "rot": 255, "color": "#969696", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "name": "Left wing (cross)" },
    { "type": "line", "x": 33.553990714629506, "y": 18.941630509004142, "w": 22.8, "h": 0.5, "rot": 285, "color": "#969696", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "name": "Left wing (cross) copy" },
    { "type": "circle", "x": 33.25399071462951, "y": 19.941630509004128, "w": 2.5, "h": 6.5, "rot": 180, "color": "#222a3a", "opacity": 1, "bw": 0.1, "bc": "#a8a8a8", "bo": 1, "fillMode": "radial", "color2": "#969696", "gradStop": 0 },
    { "type": "trapezoid", "x": 31.09557422303287, "y": 21.126274679172184, "w": 2.5, "h": 4, "rot": 270, "color": "#a0a8b8", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": 0.5, "fillMode": "linear", "color2": "#222a3a" },
    { "type": "trapezoid", "x": 31.09557422303287, "y": 18.756986338836064, "w": 2.5, "h": 4, "rot": 270, "color": "#a0a8b8", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": -0.5, "fillMode": "linear", "color2": "#222a3a", "gradAngle": 180 },
    { "type": "circle", "x": 20.015099789915965, "y": 19.998323856588588, "w": 12, "h": 12, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#ffffff", "gradAngle": 45, "groupId": "g1779486074553", "gsx": 1, "gsy": 1, "gcx": 20.015099789915965, "gcy": 19.9729769990956 },
    { "type": "trapezoid", "x": 19.774870885854344, "y": 14.690692991742658, "w": 8.666666666666664, "h": 2, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 4.5, "tofs": 0, "fillMode": "linear", "color2": "#ffffff", "gradAngle": 330, "groupId": "g1779486074553", "gsx": 1, "gsy": 1, "gcx": 20.015099789915965, "gcy": 19.9729769990956 },
    { "type": "trapezoid", "x": 20.208311449579835, "y": 25.75526100644854, "w": 5.5, "h": 1, "rot": 180, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 3.5, "tofs": 0, "fillMode": "linear", "color2": "#bdbfc4", "gradAngle": 90, "groupId": "g1779486074553", "gsx": 1, "gsy": 1, "gcx": 20.015099789915965, "gcy": 19.9729769990956 },
    { "type": "circle", "x": 19.983587184873947, "y": 19.998323856588588, "w": 7, "h": 7, "rot": 0, "color": "#a0a8b8", "opacity": 0.35, "bw": 0.1, "bc": "#7a7a7a", "bo": 1, "groupId": "g1779486074553", "gsx": 1, "gsy": 1, "gcx": 20.015099789915965, "gcy": 19.9729769990956 },
    { "type": "rect", "x": 19.28702731092437, "y": 19.998323856588588, "w": 1, "h": 4.5, "rot": 0, "color": "#242424", "opacity": 0.9, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0, "groupId": "g1779486074553", "gsx": 1, "gsy": 1, "gcx": 20.015099789915965, "gcy": 19.9729769990956 },
    { "type": "rect", "x": 20.627166491596636, "y": 19.998323856588588, "w": 1, "h": 4.5, "rot": 0, "color": "#242424", "opacity": 0.9, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0, "groupId": "g1779486074553", "gsx": 1, "gsy": 1, "gcx": 20.015099789915965, "gcy": 19.9729769990956 },
    { "type": "rect", "x": 22.1672137605042, "y": 19.998323856588588, "w": 1, "h": 2.5, "rot": 0, "color": "#242424", "opacity": 0.9, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0, "groupId": "g1779486074553", "gsx": 1, "gsy": 1, "gcx": 20.015099789915965, "gcy": 19.9729769990956 },
    { "type": "rect", "x": 17.859375000000004, "y": 19.998323856588588, "w": 1, "h": 2.5, "rot": 0, "color": "#242424", "opacity": 0.9, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0, "groupId": "g1779486074553", "gsx": 1, "gsy": 1, "gcx": 20.015099789915965, "gcy": 19.9729769990956 },
    { "type": "trapezoid", "x": 27.253990714629495, "y": 18.756986338836064, "w": 2.5, "h": 4, "rot": 90, "color": "#a0a8b8", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": 0.5, "fillMode": "linear", "color2": "#222a3a" },
    { "type": "trapezoid", "x": 27.253990714629488, "y": 21.1262746791722, "w": 2.5, "h": 4, "rot": 90, "color": "#a0a8b8", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": -0.5, "fillMode": "linear", "color2": "#222a3a", "gradAngle": 180 },
    { "type": "trapezoid", "x": 5.246009285370503, "y": 20.015756302521005, "w": 30, "h": 3.5, "rot": 270, "color": "#222a3a", "opacity": 1, "bw": 0.5, "bc": "#969696", "bo": 1, "tw": 24, "tofs": 0, "name": "Left wing (outer) copy", "groupId": "g1779488839708", "gsx": 1, "gsy": 1, "gcx": 6.746009285370503, "gcy": 19.98424369747899 },
    { "type": "trapezoid", "x": 8.246009285370503, "y": 19.98424369747899, "w": 30, "h": 2.5, "rot": 90, "color": "#222a3a", "opacity": 1, "bw": 0.5, "bc": "#969696", "bo": 1, "tw": 19.75, "tofs": 0, "name": "Left wing (inner) copy", "groupId": "g1779488839708", "gsx": 1, "gsy": 1, "gcx": 6.746009285370503, "gcy": 19.98424369747899 },
    { "type": "line", "x": 6.496009285370503, "y": 18.98424369747899, "w": 23, "h": 0.5, "rot": 75, "color": "#969696", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "name": "Left wing (cross) copy", "groupId": "g1779488839708", "gsx": 1, "gsy": 1, "gcx": 6.746009285370503, "gcy": 19.98424369747899 },
    { "type": "line", "x": 6.446009285370503, "y": 20.98424369747899, "w": 22.8, "h": 0.5, "rot": 105, "color": "#969696", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "name": "Left wing (cross) copy copy", "groupId": "g1779488839708", "gsx": 1, "gsy": 1, "gcx": 6.746009285370503, "gcy": 19.98424369747899 },
    { "type": "circle", "x": 6.746009285370503, "y": 19.98424369747899, "w": 2.5, "h": 6.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0.1, "bc": "#a8a8a8", "bo": 1, "fillMode": "radial", "color2": "#969696", "gradStop": 0, "groupId": "g1779488839708", "gsx": 1, "gsy": 1, "gcx": 6.746009285370503, "gcy": 19.98424369747899 },
    { "type": "trapezoid", "x": 8.90442577696714, "y": 18.79959952731093, "w": 2.5, "h": 4, "rot": 90, "color": "#a0a8b8", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": 0.5, "fillMode": "linear", "color2": "#222a3a", "groupId": "g1779488839708", "gsx": 1, "gsy": 1, "gcx": 6.746009285370503, "gcy": 19.98424369747899 },
    { "type": "trapezoid", "x": 8.90442577696714, "y": 21.168887867647054, "w": 2.5, "h": 4, "rot": 90, "color": "#a0a8b8", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": -0.5, "fillMode": "linear", "color2": "#222a3a", "gradAngle": 180, "groupId": "g1779488839708", "gsx": 1, "gsy": 1, "gcx": 6.746009285370503, "gcy": 19.98424369747899 },
    { "type": "trapezoid", "x": 12.746009285370503, "y": 21.168887867647047, "w": 2.5, "h": 4, "rot": 270, "color": "#a0a8b8", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": 0.5, "fillMode": "linear", "color2": "#222a3a", "groupId": "g1779488839708", "gsx": 1, "gsy": 1, "gcx": 6.746009285370503, "gcy": 19.98424369747899 },
    { "type": "trapezoid", "x": 12.746009285370503, "y": 18.79959952731093, "w": 2.5, "h": 4, "rot": 270, "color": "#a0a8b8", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": -0.5, "fillMode": "linear", "color2": "#222a3a", "gradAngle": 180, "groupId": "g1779488839708", "gsx": 1, "gsy": 1, "gcx": 6.746009285370503, "gcy": 19.98424369747899 }
  ],
  ironeye: [
    { type: "rect",      name: "Strut-Left",    x: 12,    y: 22.5,  w: 8,     h: 1.5,  cr: 0.3,  rot: 0,   color: "#0a0c12", color2: "#4a5060", fillMode: "linear", gradAngle: 270, opacity: 1 },
    { type: "trapezoid", name: "Wing-R-Upper",  x: 29.82, y: 18.11, w: 12.5,  h: 9,    tw: 5, tofs: 0, rot: 0,   color: "#0a0c12", color2: "#383e4a", fillMode: "linear", gradAngle: 90,  opacity: 1, bw: 0.5, bc: "#a0a8b8" },
    { type: "trapezoid", name: "Wing-R-Lower",  x: 29.80, y: 27.17, w: 12.5,  h: 9,    tw: 5, tofs: 0, rot: 180, color: "#0a0c12", color2: "#383e4a", fillMode: "linear", gradAngle: 90,  opacity: 1, bw: 0.5, bc: "#a0a8b8" },
    { type: "line",                             x: 29.5,  y: 22.5,  w: 19,    h: 0.5,  rot: 105, color: "#a0a8b8", opacity: 1 },
    { type: "line",                             x: 29.83, y: 22.69, w: 19,    h: 0.5,  rot: 75,  color: "#a0a8b8", opacity: 1 },
    { type: "rect",      name: "Strut-Right",   x: 27,    y: 22.5,  w: 6.5,   h: 2.5,  cr: 1,    rot: 0,   color: "#0a0c12", color2: "#4a5060", fillMode: "linear", gradAngle: 270, opacity: 1 },
    { type: "circle",    name: "Cockpit-Ball",  x: 20.08, y: 22.60, w: 16,    h: 16,   rot: 0,   color: "#6a7080", color2: "#222a3a", fillMode: "radial", gradStop: 0.15, opacity: 1 },
    { type: "circle",    name: "Cockpit-Frame", x: 20,    y: 22.53, w: 7,     h: 7,    rot: 0,   color: "#000000", color2: "#a0a8b8", fillMode: "radial", gradStop: 0.8,  opacity: 1 },
    { type: "circle",    name: "Pilot-Glow",    x: 19.98, y: 22.45, w: 2.4,   h: 2.4,  rot: 0,   color: "#ff5040", color2: "#5a0808", fillMode: "radial", gradStop: 0.4,  opacity: 0.95 },
    { type: "trapezoid", name: "Wing-L-Upper",  x: 8.5,   y: 17.92, w: 12.5,  h: 9,    tw: 5, tofs: 0, rot: 0,   color: "#222a3a", color2: "#383e4a", fillMode: "linear", gradAngle: 90,  opacity: 1, bw: 0.5, bc: "#a0a8b8" },
    { type: "trapezoid", name: "Wing-L-Lower",  x: 8.5,   y: 26.91, w: 12.5,  h: 9,    tw: 5, tofs: 0, rot: 180, color: "#0a0c12", color2: "#383e4a", fillMode: "linear", gradAngle: 90,  opacity: 1, bw: 0.5, bc: "#a0a8b8" },
    { type: "line",                             x: 8.5,   y: 22.48, w: 19,    h: 0.5,  rot: 105, color: "#a0a8b8", opacity: 1 },
    { type: "line",                             x: 8.5,   y: 22.46, w: 19,    h: 0.5,  rot: 75,  color: "#a0a8b8", opacity: 1 }
  ],
  callbox: [
    { type: "rect", name: "Roof", x: 20, y: 14, w: 17, h: 2, cr: 0.4, rot: 0, color: "#0f2244", color2: "#1a3a6a", fillMode: "linear", gradAngle: 180, opacity: 1 },
    { type: "rect", name: "Sign-Panel", x: 20, y: 16.5, w: 15, h: 2.2, cr: 0.3, rot: 0, color: "#d8c878", color2: "#7a6428", fillMode: "linear", gradAngle: 90, opacity: 1 },
    { type: "rect", name: "Body", x: 20, y: 29.5, w: 14, h: 22, cr: 0.4, rot: 0, color: "#2a5a9a", color2: "#0f2244", fillMode: "linear", gradAngle: 0, opacity: 1 },
    { type: "rect", name: "Door-Divide", x: 20, y: 29.5, w: 0.5, h: 22.5, cr: 0, rot: 0, color: "#0a1830", color2: "#1a3a6a", fillMode: "linear", gradAngle: 0, opacity: 1 },
    { type: "rect", name: "Lamp-Base", x: 20, y: 12.4, w: 3, h: 1.2, cr: 0.2, rot: 0, color: "#1a2a3a", color2: "#4a5a6a", fillMode: "linear", gradAngle: 180, opacity: 1 },
    { type: "circle", name: "Lamp", x: 19.871858465608465, y: 10, w: 3.4, h: 4, rot: 0, color: "#fff8a0", color2: "#3a2a08", fillMode: "radial", gradStop: 0.2, opacity: 1 },
    { type: "rect", x: 16.311590608465607, y: 29.5, w: 5, h: 19, rot: 0, color: "#80ddff", opacity: 0, bw: 0.2, bc: "#000000", bo: 1, cr: 0 },
    { type: "rect", x: 23.358132845188287, y: 29.5, w: 5, h: 19, rot: 0, color: "#80ddff", opacity: 0, bw: 0.2, bc: "#000000", bo: 1, cr: 0 },
    { type: "rect", x: 16.27799985056784, y: 27, w: 3.1, h: 3.5, rot: 0, color: "#80ddff", opacity: 0.35, bw: 0.2, bc: "#000000", bo: 1, cr: 0 },
    { type: "rect", x: 23.3, y: 27, w: 3.1, h: 3.5, rot: 0, color: "#222a3a", opacity: 0.25, bw: 0.2, bc: "#000000", bo: 1, cr: 0 },
    { type: "rect", x: 23.3, y: 31.5, w: 3.1, h: 3.5, rot: 0, color: "#222a3a", opacity: 0.25, bw: 0.2, bc: "#000000", bo: 1, cr: 0 },
    { type: "rect", x: 23.3, y: 36, w: 3.1, h: 3.5, rot: 0, color: "#222a3a", opacity: 0.25, bw: 0.2, bc: "#000000", bo: 1, cr: 0 },
    { type: "rect", x: 16.2919904363419, y: 31.5, w: 3.1, h: 3.5, rot: 0, color: "#222a3a", opacity: 0.25, bw: 0.2, bc: "#000000", bo: 1, cr: 0 },
    { type: "rect", x: 16.27510460251046, y: 36, w: 3.1, h: 3.5, rot: 0, color: "#222a3a", opacity: 0.25, bw: 0.2, bc: "#000000", bo: 1, cr: 0 },
    { type: "rect", name: "Window", x: 16.25, y: 22.5, w: 3.5, h: 3.5, cr: 0.2, rot: 0, color: "#a8c8dc", color2: "#1a3a4a", fillMode: "linear", gradAngle: 90, opacity: 1 },
    { type: "rect", name: "Window copy", x: 23.3, y: 22.5, w: 3.5, h: 3.5, cr: 0.2, rot: 0, color: "#a8c8dc", color2: "#1a3a4a", fillMode: "linear", gradAngle: 90, opacity: 1 }
  ],
  red5: [
    { "type": "rect", "x": 36.0081506844661, "y": 25.3445597173879, "w": 1.5, "h": 7.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.5, "fillMode": "linear", "color2": "#8a8f99", "name": "lower left cannon mount", "groupName": "Right wings", "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 36.0081506844661, "gcy": 25.3445597173879, "hidden": 0, "gradAngle": 180 },
    { "type": "trapezoid", "x": 29.92718101289965, "y": 28.133910289965772, "w": 6.5, "h": 12, "rot": 90, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 4, "tofs": -2.25, "fillMode": "linear", "color2": "#5c5e60", "gradAngle": 225, "name": "Left wing lower", "groupName": "Right wings", "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 29.92718101289965, "gcy": 28.133910289965772, "hidden": 0 },
    { "type": "trapezoid", "x": 31.466201088532138, "y": 30.07869274187569, "w": 9.5, "h": 12, "rot": 90, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 6, "tofs": -0.25, "fillMode": "linear", "color2": "#a0a8b8", "gradAngle": 270, "name": "Left wing upper", "groupName": "Right wings", "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 31.466201088532138, "gcy": 30.07869274187569, "hidden": 0 },
    { "type": "rect", "x": 37.54996863052419, "y": 28.86076822361197, "w": 1.5, "h": 10, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.5, "fillMode": "linear", "color2": "#a0a8b8", "name": "top left cannon mount", "groupName": "Right wings", "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 37.54996863052419, "gcy": 28.86076822361197, "hidden": 0, "gradAngle": 180 },
    { "type": "line", "x": 37.511994294605806, "y": 17.994322634364114, "w": 12, "h": 1, "rot": 90, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#a0a8b8", "gradAngle": 90, "groupName": "Right wings", "name": "top left cannon", "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 37.511994294605806, "gcy": 17.994322634364114, "hidden": 0 },
    { "type": "line", "x": 35.967582987551864, "y": 15.698614646812253, "w": 12, "h": 1, "rot": 90, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#828487", "gradAngle": 90, "groupName": "Right wings", "name": "lower left cannon", "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 35.967582987551864, "gcy": 15.698614646812253, "hidden": 0 },
    { "type": "arrow", "x": 36.121952800829874, "y": 9.225196597019714, "w": 2.5, "h": 3.3333333333333326, "rot": 180, "color": "#909298", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#222a3a", "groupName": "Right wings", "name": "Lower right tip", "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 36.121952800829874, "gcy": 9.225196597019714, "hidden": 0, "gradAngle": 180 },
    { "type": "arrow", "x": 37.50998443983403, "y": 11.357328339758302, "w": 2.5, "h": 3.3333333333333326, "rot": 180, "color": "#a0a8b8", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#222a3a", "groupName": "Right wings", "name": "Lower left tip", "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 37.50998443983403, "gcy": 11.357328339758302, "hidden": 0, "gradAngle": 180 },
    { "type": "trapezoid", "x": 33.40740435356201, "y": 28.634636465257827, "w": 5, "h": 3, "rot": 90, "color": "#ff8aaa", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 4.5, "tofs": 0, "fillMode": "linear", "color2": "#6f3e4b", "gradAngle": 315, "groupName": "Right wings", "hidden": 0, "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 33.40740435356201, "gcy": 28.634636465257827 },
    { "type": "trapezoid", "x": 31.2094327176781, "y": 33.12061931486204, "w": 1.5, "h": 1, "rot": 90, "color": "#ff8aaa", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": -0.25, "fillMode": "linear", "color2": "#a05a6d", "gradAngle": 0, "groupName": "Right wings", "hidden": 0, "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 31.2094327176781, "gcy": 33.12061931486204 },
    { "type": "trapezoid", "x": 29.66325857519789, "y": 33.34711997449264, "w": 1.5, "h": 1, "rot": 90, "color": "#ff8aaa", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": -0.25, "fillMode": "linear", "color2": "#a05a6d", "gradAngle": 0, "groupName": "Right wings", "hidden": 0, "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 29.66325857519789, "gcy": 33.34711997449264 },
    { "type": "trapezoid", "x": 28.17562664907652, "y": 33.602891742302674, "w": 1.5, "h": 1, "rot": 90, "color": "#ff8aaa", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": -0.25, "fillMode": "linear", "color2": "#a05a6d", "gradAngle": 0, "groupName": "Right wings", "hidden": 0, "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 28.17562664907652, "gcy": 33.602891742302674 },
    { "type": "line", "x": 31.094574538258577, "y": 31.0983567818805, "w": 7.5, "h": 1, "rot": 350, "color": "#ff8aaa", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#834959", "gradAngle": 0, "groupName": "Right wings", "hidden": 0, "groupId": "g1779509640527_6688", "gsx": 1, "gsy": 1, "gcx": 31.094574538258577, "gcy": 31.0983567818805 },
    { "type": "rect", "x": 3.9918493155338974, "y": 25.339497622355502, "w": 1.5, "h": 7.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.5, "fillMode": "linear", "color2": "#8a8f99", "name": "lower left cannon mount", "groupName": "Left wings", "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976, "hidden": 0 },
    { "type": "trapezoid", "x": 10.072818987100352, "y": 28.128848194933376, "w": 6.5, "h": 12, "rot": 270, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 4, "tofs": 2.25, "fillMode": "linear", "color2": "#5c5e60", "gradAngle": 315, "name": "Left wing lower", "groupName": "Left wings", "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976, "hidden": 0 },
    { "type": "trapezoid", "x": 8.533798911467864, "y": 30.073630646843295, "w": 9.5, "h": 12, "rot": 270, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 6, "tofs": 0.25, "fillMode": "linear", "color2": "#a0a8b8", "gradAngle": 270, "name": "Left wing upper", "groupName": "Left wings", "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976, "hidden": 0 },
    { "type": "rect", "x": 2.4500313694758056, "y": 28.855706128579573, "w": 1.5, "h": 10, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.5, "fillMode": "linear", "color2": "#a0a8b8", "name": "top left cannon mount", "groupName": "Left wings", "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976, "hidden": 0 },
    { "type": "line", "x": 2.4880057053941913, "y": 17.989260539331717, "w": 12, "h": 1, "rot": 270, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#a0a8b8", "gradAngle": 90, "groupName": "Left wings", "name": "top left cannon", "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976, "hidden": 0 },
    { "type": "line", "x": 4.032417012448132, "y": 15.693552551779856, "w": 12, "h": 1, "rot": 270, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#828487", "gradAngle": 90, "groupName": "Left wings", "name": "lower left cannon", "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976, "hidden": 0 },
    { "type": "arrow", "x": 3.8780471991701244, "y": 9.220134501987317, "w": 2.5, "h": 3.3333333333333326, "rot": 180, "color": "#909298", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#222a3a", "groupName": "Left wings", "name": "Lower right tip", "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976, "hidden": 0 },
    { "type": "arrow", "x": 2.4900155601659737, "y": 11.352266244725906, "w": 2.5, "h": 3.3333333333333326, "rot": 180, "color": "#a0a8b8", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#222a3a", "groupName": "Left wings", "name": "Lower left tip", "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976, "hidden": 0 },
    { "type": "trapezoid", "x": 6.592595646437993, "y": 28.62957437022543, "w": 5, "h": 3, "rot": 270, "color": "#ff8aaa", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 4.5, "tofs": 0, "fillMode": "linear", "color2": "#6f3e4b", "gradAngle": 225, "groupName": "Left wings", "hidden": 0, "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976 },
    { "type": "trapezoid", "x": 8.790567282321899, "y": 33.11555721982964, "w": 1.5, "h": 1, "rot": 270, "color": "#ff8aaa", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": 0.25, "fillMode": "linear", "color2": "#a05a6d", "gradAngle": 180, "groupName": "Left wings", "hidden": 0, "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976 },
    { "type": "trapezoid", "x": 10.33674142480211, "y": 33.34205787946025, "w": 1.5, "h": 1, "rot": 270, "color": "#ff8aaa", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": 0.25, "fillMode": "linear", "color2": "#a05a6d", "gradAngle": 180, "groupName": "Left wings", "hidden": 0, "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976 },
    { "type": "trapezoid", "x": 11.824373350923482, "y": 33.59782964727028, "w": 1.5, "h": 1, "rot": 270, "color": "#ff8aaa", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": 0.25, "fillMode": "linear", "color2": "#a05a6d", "gradAngle": 180, "groupName": "Left wings", "hidden": 0, "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976 },
    { "type": "line", "x": 8.905425461741423, "y": 31.093294686848104, "w": 7.5, "h": 1, "rot": 10, "color": "#ff8aaa", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#834959", "gradAngle": 180, "groupName": "Left wings", "hidden": 0, "groupId": "g1779510579958_36123", "gsx": 1, "gsy": 1, "gcx": 4.905412346247271, "gcy": 21.813549241081976 },
    { "type": "rect", "x": 16.521001825652515, "y": 26.174681220547065, "w": 2.75, "h": 5.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.75, "fillMode": "linear", "color2": "#a0a8b8", "name": "Lower left engine", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 19.635118910805353, "gcy": 20 },
    { "type": "rect", "x": 22.852197240499677, "y": 26.285489080809064, "w": 2.75, "h": 5.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.75, "fillMode": "linear", "color2": "#a0a8b8", "name": "Lower right engine", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 19.635118910805353, "gcy": 20 },
    { "type": "trapezoid", "x": 20, "y": 21.492717022192764, "w": 6, "h": 30, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 4, "tofs": 0, "fillMode": "linear", "color2": "#a0a8b8", "name": "Cockpit", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 19.782921670305676, "gcy": 21.043063094222127 },
    { "type": "trapezoid", "x": 20, "y": 4.5913796859482305, "w": 4, "h": 4, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.5, "tofs": 0, "fillMode": "linear", "color2": "#a0a8b8", "gradAngle": 15, "name": "Nose", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 19.782921670305676, "gcy": 21.043063094222127 },
    { "type": "rect", "x": 18.45515848504116, "y": 35.11555721982964, "w": 1.5, "h": 5.625, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.75, "fillMode": "linear", "color2": "#a0a8b8", "name": "Lower left booser", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 19.635118910805353, "gcy": 20 },
    { "type": "rect", "x": 22, "y": 35.11555721982964, "w": 1.5, "h": 5.625, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.75, "fillMode": "linear", "color2": "#a0a8b8", "name": "Lower right booser", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 20.385118910805353, "gcy": 20 },
    { "type": "rect", "x": 20, "y": 34.15862031405177, "w": 5.5, "h": 6.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.75, "fillMode": "linear", "color2": "#a0a8b8", "groupName": "Main body", "name": "Body", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 19.782921670305676, "gcy": 21.043063094222127 },
    { "type": "rect", "x": 16.75, "y": 34.64957205024139, "w": 2, "h": 7.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.75, "fillMode": "linear", "color2": "#a0a8b8", "name": "Upper left booser", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 19.635118910805353, "gcy": 20 },
    { "type": "rect", "x": 16.13419778635121, "y": 28.130653146946276, "w": 3.5, "h": 7, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.75, "fillMode": "linear", "color2": "#a0a8b8", "groupName": "Main body", "name": "upper left engine", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 19.635118910805353, "gcy": 20 },
    { "type": "rect", "x": 23.647516375545855, "y": 34.701683408273894, "w": 2, "h": 7.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.75, "fillMode": "linear", "color2": "#a0a8b8", "name": "back right thruster", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 20.49907887554585, "gcy": 20 },
    { "type": "rect", "x": 24, "y": 28.0585513078833, "w": 3.5, "h": 7, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.75, "fillMode": "linear", "color2": "#a0a8b8", "groupName": "Main body", "name": "upper right engine", "groupId": "g1779505918943", "gsx": 1, "gsy": 1, "gcx": 20.49907887554585, "gcy": 20 },
    { "type": "line", "x": 22.02497300215983, "y": 14.524973002159827, "w": 13.5, "h": 0.5, "rot": 87.5, "color": "#d699a9", "opacity": 0.9, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#91737b", "name": "right hull line", "groupName": "Glass", "groupId": "g1779497666013", "hidden": 0, "gcx": 22.02497300215983, "gcy": 14.955253856590208 },
    { "type": "line", "x": 18.02497300215983, "y": 14.544716257645623, "w": 13.5, "h": 0.5, "rot": 92.5, "color": "#814b5a", "opacity": 0.9, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#42292f", "name": "left hull line", "groupName": "Glass", "groupId": "g1779497666013", "hidden": 0, "gcx": 17.807377355721833, "gcy": 14.544716257645623 },
    { "type": "trapezoid", "x": 20.02497300215983, "y": 15.942735150856125, "w": 3.5, "h": 16, "rot": 0, "color": "#80ddff", "opacity": 0.9, "bw": 0.2, "bc": "#000000", "bo": 1, "tw": 1.75, "tofs": 0, "groupId": "g1779497666013", "gsx": 1, "gsy": 1, "gcx": 20.24702165121091, "gcy": 16.934376799327737, "groupName": "Glass", "fillMode": "linear", "color2": "#6da6ba", "gradAngle": 75, "hidden": 0 },
    { "type": "trapezoid", "x": 20.02497300215983, "y": 24.92601844779935, "w": 3.5, "h": 2, "rot": 180, "color": "#80ddff", "opacity": 0.9, "bw": 0.2, "bc": "#000000", "bo": 1, "tw": 1.75, "tofs": 0, "groupId": "g1779497666013", "gsx": 1, "gsy": 1, "gcx": 20.24702165121091, "gcy": 16.934376799327737, "groupName": "Glass", "fillMode": "linear", "color2": "#6da6ba", "gradAngle": 75, "hidden": 0 },
    { "type": "rect", "x": 20, "y": 31.069860587625815, "w": 3.5, "h": 3.5, "rot": 0, "color": "#a0a8b8", "opacity": 1, "bw": 0.2, "bc": "#000000", "bo": 1, "cr": 1.25, "fillMode": "linear", "color2": "#ffffff", "groupId": "g1779497652995", "gsx": 1, "gsy": 1, "gcx": 20.094923392688095, "gcy": 30.95451533653411, "groupName": "Droid", "glowEnabled": true, "glowColor": "#000000", "glowIntensity": 2 },
    { "type": "circle", "x": 20, "y": 30.089170085442404, "w": 4, "h": 4, "rot": 0, "color": "#80ddff", "opacity": 1, "bw": 0.1, "bc": "#828282", "bo": 1, "fillMode": "radial", "color2": "#222a3a", "groupId": "g1779497652995", "gsx": 1, "gsy": 1, "gcx": 20.094923392688095, "gcy": 30.95451533653411, "groupName": "Droid" },
    { "type": "circle", "x": 16.94186354325788, "y": 38.263797996806, "w": 2, "h": 1, "rot": 0, "color": "#e0b000", "opacity": 0.9, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "radial", "color2": "#ff0000", "gradStop": 0.4, "glowEnabled": true, "glowColor": "#ffd060", "glowIntensity": 1.5, "name": "Upper left flame", "groupId": "g1779504353518", "gsx": 1, "gsy": 1, "gcx": 19.99706637966949, "gcy": 38.20426633453687, "groupName": "Jet flames", "hidden": 0 },
    { "type": "circle", "x": 23.9162291808216, "y": 38.22949720524927, "w": 2, "h": 1, "rot": 0, "color": "#e0b000", "opacity": 0.9, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "radial", "color2": "#ff0000", "gradStop": 0.4, "glowEnabled": true, "glowColor": "#ffd060", "glowIntensity": 1.5, "name": "Upper right flame", "groupId": "g1779504353518", "gsx": 1, "gsy": 1, "gcx": 20.86102634440999, "gcy": 38.20426633453687, "groupName": "Jet flames", "hidden": 0 },
    { "type": "circle", "x": 22.149647184418836, "y": 38.01346818150257, "w": 1, "h": 0.5, "rot": 0, "color": "#e0b000", "opacity": 0.9, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "radial", "color2": "#ff0000", "gradStop": 0.4, "glowEnabled": true, "glowColor": "#ffd060", "glowIntensity": 1.5, "name": "lower right flame", "groupId": "g1779504353518", "gsx": 1, "gsy": 1, "gcx": 20.74706637966949, "gcy": 38.20426633453687, "groupName": "Jet flames", "hidden": 0 },
    { "type": "circle", "x": 18.663994150118047, "y": 37.894734672267745, "w": 1, "h": 0.5, "rot": 0, "color": "#e0b000", "opacity": 0.9, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "radial", "color2": "#ff0000", "gradStop": 0.4, "glowEnabled": true, "glowColor": "#ffd060", "glowIntensity": 1.5, "name": "Lower left flame", "groupId": "g1779504353518", "gsx": 1, "gsy": 1, "gcx": 19.99706637966949, "gcy": 38.20426633453687, "groupName": "Jet flames", "hidden": 0 }
  ],
  artie2: [
    { "type": "trapezoid", "x": 18.795857405462186, "y": 38.328387605042, "w": 2, "h": 2.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1, "tofs": 0, "fillMode": "linear", "color2": "#707070" },
    { "type": "trapezoid", "x": 21.054785976890756, "y": 38.328387605042, "w": 2, "h": 2.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1, "tofs": 0, "fillMode": "linear", "color2": "#707070" },
    { "type": "rect", "x": 20.103728991596636, "y": 9.521336659663866, "w": 3, "h": 6, "rot": 0, "color": "#ffffff", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 1.25, "fillMode": "linear", "color2": "#222a3a", "name": "Capsul" },
    { "type": "rect", "x": 20, "y": 34.5, "w": 5, "h": 6, "rot": 0, "color": "#ffffff", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0.75, "fillMode": "linear", "color2": "#222a3a" },
    { "type": "rect", "x": 20, "y": 25, "w": 5, "h": 15, "rot": 0, "color": "#cb7111", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0, "fillMode": "linear", "color2": "#6a3d03" },
    { "type": "trapezoid", "x": 20, "y": 14.6, "w": 5, "h": 6, "rot": 0, "color": "#ca7111", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 2.5, "tofs": 0, "fillMode": "linear", "color2": "#6b3d03" },
    { "type": "rect", "x": 24.045401610086714, "y": 31.183626575630257, "w": 2.5, "h": 14, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0, "fillMode": "linear", "color2": "#ffffff", "groupId": "g1779513674906", "gsx": 1, "gsy": 1, "gcx": 24.021008403361343, "gcy": 30.872439600840337, "groupName": "Left Booster" },
    { "type": "trapezoid", "x": 23.989659926470587, "y": 39.043723739495796, "w": 2.5, "h": 1.875, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.25, "tofs": 0, "fillMode": "linear", "color2": "#ffffff", "groupId": "g1779513674906", "gsx": 1, "gsy": 1, "gcx": 24.021008403361343, "gcy": 30.872439600840337, "groupName": "Left Booster" },
    { "type": "triangle", "x": 24.0523568802521, "y": 23.01365546218488, "w": 2.5, "h": 2.5, "rot": 0, "color": "#222a3a", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#ffffff", "groupId": "g1779513674906", "gsx": 1, "gsy": 1, "gcx": 24.021008403361343, "gcy": 30.872439600840337, "groupName": "Left Booster" },
    { "type": "rect", "x": 16.167874036557304, "y": 31.183626575630257, "w": 2.5, "h": 14, "rot": 0, "color": "#ffffff", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "cr": 0, "fillMode": "linear", "color2": "#222a3a", "groupId": "g1779513686997_40786", "gsx": 1, "gsy": 1, "gcx": 16.143480829831933, "gcy": 30.872439600840337, "groupName": "Right Booster" },
    { "type": "trapezoid", "x": 16.112132352941178, "y": 39.043723739495796, "w": 2.5, "h": 1.875, "rot": 0, "color": "#ffffff", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "tw": 1.25, "tofs": 0, "fillMode": "linear", "color2": "#222a3a", "groupId": "g1779513686997_40786", "gsx": 1, "gsy": 1, "gcx": 16.143480829831933, "gcy": 30.872439600840337, "groupName": "Right Booster" },
    { "type": "triangle", "x": 16.17482930672269, "y": 23.01365546218488, "w": 2.5, "h": 2.5, "rot": 0, "color": "#ffffff", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#222a3a", "groupId": "g1779513686997_40786", "gsx": 1, "gsy": 1, "gcx": 16.143480829831933, "gcy": 30.872439600840337, "groupName": "Right Booster" },
    { "type": "triangle", "x": 20, "y": 4.059480042016807, "w": 2, "h": 5.5, "rot": 0, "color": "#ffffff", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#222a3a" },
    { "type": "line", "x": 20, "y": 26, "w": 5, "h": 1, "rot": 0, "color": "#f3a309", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#503607" },
    { "type": "line", "x": 20, "y": 18, "w": 5, "h": 1, "rot": 0, "color": "#f3a309", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#503607" },
    { "type": "line", "x": 20, "y": 33, "w": 5, "h": 1, "rot": 0, "color": "#f3a309", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#503607" },
    { "type": "line", "x": 20, "y": 23, "w": 5, "h": 1, "rot": 0, "color": "#f3a309", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#503607" },
    { "type": "line", "x": 20, "y": 29.991071428571434, "w": 11, "h": 0.5, "rot": 90, "color": "#f3a309", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1, "fillMode": "linear", "color2": "#503607", "gradAngle": 270, "name": "Pipe", "hidden": 2 },
    { "type": "circle", "x": 20, "y": 9.5, "w": 1.5, "h": 1.5, "rot": 0, "color": "#002c71", "opacity": 1, "bw": 0, "bc": "#000000", "bo": 1 }
  ],
  none: []
};
function shipHullPresetParts(hullId) {
  var preset = HULL_PRESETS[hullId] || HULL_PRESETS.none;
  return JSON.parse(JSON.stringify(preset));
}
// Backfills parts for any stored design whose array is empty but `hull` is a
// known preset. Returns a new object; doesn't mutate input.
function shipMigrateDesign(d) {
  if (!d || typeof d !== "object") return d;
  if ((!Array.isArray(d.parts) || d.parts.length === 0) && d.hull && HULL_PRESETS[d.hull]) {
    return Object.assign({}, d, { parts: shipHullPresetParts(d.hull) });
  }
  return d;
}
function shipRenderPart(part, key, isSelected, gxform) {
  var x = typeof part.x === "number" ? part.x : 20;
  var y = typeof part.y === "number" ? part.y : 20;
  var w = typeof part.w === "number" ? part.w : 8;
  var h = typeof part.h === "number" ? part.h : 8;
  if (gxform) { x = x * gxform.gsx + gxform.tx; y = y * gxform.gsy + gxform.ty; w = w * gxform.gsx; h = h * gxform.gsy; }
  var rot = part.rot || 0;
  var color = part.color || "#80ddff";
  var op = typeof part.opacity === "number" ? part.opacity : 1;
  var bw = typeof part.bw === "number" ? part.bw : 0;
  var bc = part.bc || "#000000";
  var bo = typeof part.bo === "number" ? part.bo : 1;
  var cr = typeof part.cr === "number" ? part.cr : 0;
  var t = "rotate(" + rot + " " + x + " " + y + ")";
  var strokeProps = bw > 0 ? { stroke: bc, strokeWidth: bw, strokeOpacity: bo } : {};
  // Gradient fill: optional linear or radial gradient. ID must be document-
  // unique (SVG urls resolve globally), so we include the caller's key (which
  // already namespaces by the parent SVG's uid + part index).
  var fillMode = part.fillMode || "solid";
  var color2 = part.color2 || color;
  var gradAngle = typeof part.gradAngle === "number" ? part.gradAngle : 0;
  // gradStop pushes the inner stop outward, making the center color hold its
  // solid value until that offset before fading to color2. Used by radial.
  var gradStop = typeof part.gradStop === "number" ? part.gradStop : 0;
  var fillRef = color;
  var defsEl = null;
  if (fillMode === "linear" || fillMode === "radial") {
    var gradId = "shipgrad-" + key;
    var stops = [React.createElement("stop", { key: "s0", offset: "0%", stopColor: color })];
    if (fillMode === "radial" && gradStop > 0) {
      stops.push(React.createElement("stop", { key: "smid", offset: (gradStop * 100) + "%", stopColor: color }));
    }
    stops.push(React.createElement("stop", { key: "s1", offset: "100%", stopColor: color2 }));
    if (fillMode === "linear") {
      defsEl = React.createElement("defs", { key: "d" },
        React.createElement("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "1", y2: "0", gradientTransform: "rotate(" + gradAngle + " 0.5 0.5)" }, stops));
    } else {
      defsEl = React.createElement("defs", { key: "d" },
        React.createElement("radialGradient", { id: gradId, cx: "0.5", cy: "0.5", r: "0.5" }, stops));
    }
    fillRef = "url(#" + gradId + ")";
  }
  var inner = null;
  if (part.type === "circle") {
    inner = React.createElement("ellipse", Object.assign({ cx: x, cy: y, rx: w / 2, ry: h / 2, fill: fillRef, fillOpacity: op, transform: t }, strokeProps));
  } else if (part.type === "rect") {
    inner = React.createElement("rect", Object.assign({ x: x - w / 2, y: y - h / 2, width: w, height: h, rx: cr, ry: cr, fill: fillRef, fillOpacity: op, transform: t }, strokeProps));
  } else if (part.type === "triangle") {
    var p1 = x + "," + (y - h / 2);
    var p2 = (x - w / 2) + "," + (y + h / 2);
    var p3 = (x + w / 2) + "," + (y + h / 2);
    inner = React.createElement("polygon", Object.assign({ points: p1 + " " + p2 + " " + p3, fill: fillRef, fillOpacity: op, transform: t }, strokeProps));
  } else if (part.type === "line") {
    inner = React.createElement("rect", Object.assign({ x: x - w / 2, y: y - Math.max(0.4, h) / 2, width: w, height: Math.max(0.4, h), fill: fillRef, fillOpacity: op, transform: t }, strokeProps));
  } else if (part.type === "trapezoid") {
    var tw = typeof part.tw === "number" ? part.tw : w * 0.5;
    var tofs = typeof part.tofs === "number" ? part.tofs : 0;
    if (gxform) { if (typeof part.tw === "number") tw = tw * gxform.gsx; if (typeof part.tofs === "number") tofs = tofs * gxform.gsx; }
    var blX = x - w / 2, brX = x + w / 2, bY = y + h / 2;
    var tlX = x - tw / 2 + tofs, trX = x + tw / 2 + tofs, tY = y - h / 2;
    var pts = tlX + "," + tY + " " + trX + "," + tY + " " + brX + "," + bY + " " + blX + "," + bY;
    inner = React.createElement("polygon", Object.assign({ points: pts, fill: fillRef, fillOpacity: op, transform: t }, strokeProps));
  } else if (part.type === "arrow") {
    var apts = ARROW_POINTS.map(function(p){ return (x + p[0] * w) + "," + (y + p[1] * h); }).join(" ");
    inner = React.createElement("polygon", Object.assign({ points: apts, fill: fillRef, fillOpacity: op, transform: t }, strokeProps));
  } else {
    return null;
  }
  // Per-part glow: wrap the shape (but not the selection bbox or gradient
  // defs) in a <g> with a CSS drop-shadow filter so the halo follows the
  // part's actual silhouette.
  var shapeNode = part.glowEnabled
    ? React.createElement("g", { style: { filter: "drop-shadow(0 0 " + (part.glowIntensity || 4) + "px " + (part.glowColor || "#80ddff") + ")" } }, inner)
    : inner;
  if (isSelected) {
    var bbw = w + 2, bbh = h + 2;
    return React.createElement("g", { key: key },
      defsEl,
      shapeNode,
      React.createElement("rect", { x: x - bbw / 2, y: y - bbh / 2, width: bbw, height: bbh, fill: "none", stroke: "#ffd060", strokeWidth: 0.6, strokeDasharray: "1.2 0.8", transform: t, pointerEvents: "none" }));
  }
  return React.createElement("g", { key: key }, defsEl, shapeNode);
}
// Monotonic counter for auto-generated SVG uids so gradient ID references
// (`url(#shipgrad-...)`) stay unique across all on-screen ShipDesignSvg instances.
var shipSvgUidCounter = 0;
function ShipDesignSvg(props) {
  var size = props.size || 40;
  var svgRef = props.svgRef || null;
  var svgStyle = props.style || {};
  var d = props.design || SHIP_DEFAULT_DESIGN;
  var parts = Array.isArray(d.parts) ? d.parts : [];
  var selIdx = typeof props.selectedIdx === "number" ? props.selectedIdx : -1;
  var selSet = Array.isArray(props.selectedIndices) ? props.selectedIndices : null;
  var idRef = useRef(null);
  if (idRef.current === null) idRef.current = "auto" + (++shipSvgUidCounter);
  var uid = props.uid || idRef.current;
  // Detect group selection: all selected parts have a groupId
  var isGroupSel = false;
  if (selSet && selSet.length >= 2) {
    isGroupSel = true;
    for (var ci = 0; ci < selSet.length; ci++) {
      var cp = parts[selSet[ci]];
      if (!cp || !cp.groupId) { isGroupSel = false; break; }
    }
  }
  var els = [];
  for (var pi = 0; pi < parts.length; pi++) {
    var p = parts[pi];
    if (p && p.hidden === 1) continue; // invisible — skip rendering
    var isSel = selSet ? selSet.indexOf(pi) >= 0 : (pi === selIdx);
    // Suppress individual selection boxes when the whole selection is a group
    var drawBox = isSel && !isGroupSel;
    // Build per-part group transform when the part has a non-unity group scale
    var gxform = null;
    if (p && p.groupId && p.gsx != null) {
      var pgsx = p.gsx !== undefined ? p.gsx : 1;
      var pgsy = p.gsy !== undefined ? p.gsy : 1;
      if (pgsx !== 1 || pgsy !== 1) {
        var pgcx = p.gcx !== undefined ? p.gcx : 20;
        var pgcy = p.gcy !== undefined ? p.gcy : 20;
        gxform = { gsx: pgsx, gsy: pgsy, tx: pgcx * (1 - pgsx), ty: pgcy * (1 - pgsy) };
      }
    }
    if (p && p.hidden === 2) {
      var ghostEl = shipRenderPart(p, uid + "-p" + pi, drawBox, gxform);
      if (ghostEl) els.push(React.createElement("g", { key: uid + "-p" + pi, opacity: 0.25 }, ghostEl));
    } else {
      var el = shipRenderPart(p, uid + "-p" + pi, drawBox, gxform);
      if (el) els.push(el);
    }
  }
  // Draw a single dashed bbox around the whole group selection
  if (isGroupSel && selSet.length > 0) {
    var gp0 = parts[selSet[0]];
    var bgsx = gp0 && gp0.gsx != null ? gp0.gsx : 1;
    var bgsy = gp0 && gp0.gsy != null ? gp0.gsy : 1;
    var bgcx = gp0 && gp0.gcx != null ? gp0.gcx : 20;
    var bgcy = gp0 && gp0.gcy != null ? gp0.gcy : 20;
    var minX = 99999, maxX = -99999, minY = 99999, maxY = -99999;
    for (var si = 0; si < selSet.length; si++) {
      var sp = parts[selSet[si]]; if (!sp) continue;
      var shw = sp.w / 2, shh = sp.h / 2;
      var srot = (sp.rot || 0) * Math.PI / 180;
      var cosR = Math.cos(srot), sinR = Math.sin(srot);
      var dxs = [-shw, shw, shw, -shw];
      var dys = [-shh, -shh, shh, shh];
      for (var cki = 0; cki < 4; cki++) {
        var rx = sp.x + dxs[cki] * cosR - dys[cki] * sinR;
        var ry = sp.y + dxs[cki] * sinR + dys[cki] * cosR;
        if (rx < minX) minX = rx;
        if (rx > maxX) maxX = rx;
        if (ry < minY) minY = ry;
        if (ry > maxY) maxY = ry;
      }
    }
    // Apply group scale transform to bbox corners
    var vminX = bgcx + (minX - bgcx) * bgsx - 1;
    var vmaxX = bgcx + (maxX - bgcx) * bgsx + 1;
    var vminY = bgcy + (minY - bgcy) * bgsy - 1;
    var vmaxY = bgcy + (maxY - bgcy) * bgsy + 1;
    els.push(React.createElement("rect", { key: uid + "-grpsel", x: vminX, y: vminY, width: vmaxX - vminX, height: vmaxY - vminY, fill: "none", stroke: "#ffd060", strokeWidth: 0.6, strokeDasharray: "1.5 1", pointerEvents: "none" }));
  }
  return React.createElement("svg", { ref: svgRef, viewBox: "0 0 40 40", width: String(size), height: String(size), style: Object.assign({ display: "block" }, svgStyle) },
    React.createElement("g", null, els));
}
// Bakes a part's group scale transform (gsx/gsy) into its geometry so the
// part can be returned to an ungrouped state with correct visual coordinates.
function shipBakeGroupTransform(p) {
  var gsx = (p.gsx != null) ? p.gsx : 1;
  var gsy = (p.gsy != null) ? p.gsy : 1;
  var out = Object.assign({}, p);
  if (gsx !== 1 || gsy !== 1) {
    var gcx = (p.gcx != null) ? p.gcx : p.x;
    var gcy = (p.gcy != null) ? p.gcy : p.y;
    out.x = p.x * gsx + gcx * (1 - gsx);
    out.y = p.y * gsy + gcy * (1 - gsy);
    out.w = Math.max(0.5, p.w * gsx);
    out.h = Math.max(0.5, p.h * gsy);
    if (typeof p.tw === "number") out.tw = p.tw * gsx;
    if (typeof p.tofs === "number") out.tofs = p.tofs * gsx;
    if (typeof p.cr === "number") out.cr = p.cr * gsx;
  }
  delete out.gsx; delete out.gsy; delete out.gcx; delete out.gcy;
  return out;
}
// Mini shape glyph next to each "+ TYPE" add-part button.
function shipPartIcon(type) {
  var props = { width: "14", height: "10", viewBox: "0 0 24 18" };
  if (type === "circle") return React.createElement("svg", props, React.createElement("ellipse", { cx: 12, cy: 9, rx: 10, ry: 7, fill: "currentColor" }));
  if (type === "rect")   return React.createElement("svg", props, React.createElement("rect", { x: 3, y: 3, width: 18, height: 12, rx: 2, fill: "currentColor" }));
  if (type === "triangle") return React.createElement("svg", props, React.createElement("polygon", { points: "12,2 22,16 2,16", fill: "currentColor" }));
  if (type === "trapezoid") return React.createElement("svg", props, React.createElement("polygon", { points: "6,4 18,4 22,16 2,16", fill: "currentColor" }));
  if (type === "line")   return React.createElement("svg", props, React.createElement("rect", { x: 1, y: 7, width: 22, height: 4, fill: "currentColor" }));
  if (type === "arrow")  return React.createElement("svg", props, React.createElement("polygon", { points: "12,1 22,14 17,12 12,18 7,12 2,14", fill: "currentColor" }));
  return null;
}
function shipTrashSvg(size, color) {
  return React.createElement("svg", { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M3 6h18" }),
    React.createElement("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }),
    React.createElement("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }),
    React.createElement("path", { d: "M10 11v6" }),
    React.createElement("path", { d: "M14 11v6" }));
}
// Classic "two stacked rectangles" duplicate icon.
function shipCopySvg(size, color) {
  return React.createElement("svg", { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: "9", y: "9", width: "12", height: "12", rx: "2" }),
    React.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" }));
}
// Eye icon: state 0=visible (dim), 1=hidden (slashed red), 2=ghost (dashed blue)
function shipEyeSvg(size, hidden) {
  var s = String(size || 12);
  if (hidden === 1) {
    return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "rgba(255,120,100,0.75)", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
      React.createElement("path", { d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" }),
      React.createElement("path", { d: "M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" }),
      React.createElement("path", { d: "M14.12 14.12a3 3 0 1 1-4.24-4.24" }),
      React.createElement("line", { x1: "1", y1: "1", x2: "23", y2: "23" }));
  }
  if (hidden === 2) {
    return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "rgba(128,200,255,0.65)", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "3 1.5" },
      React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
      React.createElement("circle", { cx: "12", cy: "12", r: "3" }));
  }
  return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "rgba(180,200,220,0.4)", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
    React.createElement("circle", { cx: "12", cy: "12", r: "3" }));
}
function shipLockSvg(size, locked) {
  var color = locked ? "#ff8aaa" : "rgba(180,200,220,0.65)";
  return React.createElement("svg", { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: 4, y: 11, width: 16, height: 10, rx: 2 }),
    locked
      ? React.createElement("path", { d: "M8 11V7a4 4 0 0 1 8 0v4" })
      : React.createElement("path", { d: "M8 11V7a4 4 0 0 1 7.5-2" }));
}

// Corner power-icon badge for crate variant blocks (types 11-16).
function crateBadgeIcon(type, baseSize) {
  var sz = Math.max(9, baseSize * (type === 12 || type === 16 ? 0.26 : 0.24));
  if (type === 11) return React.createElement(BDDroneIcon, { size: sz });
  if (type === 12) return React.createElement(LightningIcon, { size: sz });
  if (type === 13) return React.createElement(BDCrossIcon, { size: sz });
  if (type === 14) return React.createElement(SplitIcon, { size: sz });
  if (type === 15) return React.createElement("svg", { width: sz, height: sz, viewBox: "0 0 24 24" }, React.createElement("rect", { x: "6", y: "2", width: "12", height: "8", rx: "2", fill: "#7a7a88" }), React.createElement("rect", { x: "10", y: "8", width: "4", height: "12", rx: "1", fill: "#9a9aaa" }));
  if (type === 16) return React.createElement(CoreIcon, { size: sz, mode: "lit" });
  return null;
}

function BlockContent(props) {
  var type = props.type, size = props.size, is = Math.max(18, size * 0.55), sl = props.shieldLevel || 0;
  if (type === 17) return React.createElement(UFOBlockSvg, { size: size, animPhase: props.animPhase });
  if (type === 7) return React.createElement(DiamondPlateBlock, { size: size });
  var bc = BLOCK_COLORS[type];
  if (!bc) return null;
  var iconEl = null;
  if (type === 2) iconEl = React.createElement(CrossShotIcon, { size: is });
  else if (type === 3) iconEl = React.createElement(LightningIcon, { size: is });
  else if (type === 4) iconEl = React.createElement(CoreIcon, { size: is, mode: "lit" });
  else if (type === 5) iconEl = React.createElement(PlasmaIcon, { size: is });
  else if (type === 6) iconEl = React.createElement(DroneIcon, { size: Math.max(24, size * 0.8) });
  else if (type === 8) iconEl = React.createElement(AcidBarrelIcon, { size: Math.max(22, size * 0.75) });
  else if (type === 9) iconEl = React.createElement(TreasureCrateIcon, { size: Math.max(24, size * 0.8) });
  else if (isCrate(type) && type !== 9) {
    var cvMatch = null;
    for (var ci = 0; ci < CRATE_VARIANTS.length; ci++) { if (CRATE_VARIANTS[ci].type === type) { cvMatch = CRATE_VARIANTS[ci]; break; } }
    iconEl = React.createElement("div", { style: { position: "relative", width: Math.max(24, size * 0.8), height: Math.max(24, size * 0.8) } },
      React.createElement(TreasureCrateIcon, { size: Math.max(24, size * 0.8) }),
      React.createElement("div", { style: { position: "absolute", bottom: -2, right: -2, width: Math.max(10, size * 0.3), height: Math.max(10, size * 0.3), borderRadius: "50%", background: "rgba(10,10,20,0.8)", border: "1px solid " + (cvMatch ? cvMatch.color : "rgba(255,255,255,0.3)"), display: "flex", alignItems: "center", justifyContent: "center" } }, crateBadgeIcon(type, size)));
  }
  else if (type === 10 && sl > 0) {
    iconEl = React.createElement("svg", { width: is, height: is, viewBox: "0 0 24 24" }, React.createElement("rect", { x: "3", y: "8", width: "18", height: "12", rx: "1.5", fill: "#2a3a5a", stroke: "rgba(130,180,255,0.6)", strokeWidth: "1" }), React.createElement("rect", { x: "3", y: "8", width: "18", height: "4", fill: "#3a4a6a", rx: "1.5" }), React.createElement("line", { x1: "3", y1: "12", x2: "21", y2: "12", stroke: "rgba(130,180,255,0.4)", strokeWidth: "0.8" }), React.createElement("rect", { x: "9", y: "13", width: "6", height: "4", rx: "1", fill: "rgba(130,180,255,0.15)", stroke: "rgba(130,180,255,0.5)", strokeWidth: "0.7" }), React.createElement("circle", { cx: "12", cy: "15", r: "1", fill: "rgba(180,220,255,0.8)" }), React.createElement("rect", { x: "5", y: "9", width: "3", height: "2", rx: "0.5", fill: "rgba(130,180,255,0.2)" }), React.createElement("rect", { x: "16", y: "9", width: "3", height: "2", rx: "0.5", fill: "rgba(130,180,255,0.2)" }));
  }
  else if (type === 10 && sl === 0) {
    iconEl = React.createElement("svg", { width: is, height: is, viewBox: "0 0 24 24" }, React.createElement("rect", { x: "3", y: "12", width: "18", height: "9", rx: "1.5", fill: "#2a3a5a", stroke: "rgba(130,180,255,0.4)", strokeWidth: "1" }), React.createElement("line", { x1: "3", y1: "15", x2: "21", y2: "15", stroke: "rgba(130,180,255,0.3)", strokeWidth: "0.5" }), React.createElement("path", { d: "M4 12 L4 7 Q12 3 20 7 L20 12", fill: "none", stroke: "rgba(130,180,255,0.5)", strokeWidth: "1" }), React.createElement("rect", { x: "9", y: "16", width: "6", height: "3", rx: "1", fill: "rgba(130,180,255,0.1)", stroke: "rgba(130,180,255,0.3)", strokeWidth: "0.5" }));
  }

  var blockEl = React.createElement("div", { style: { width: size, height: size, background: bc.bg, border: "2px solid " + bc.border, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: bc.shadow, boxSizing: "border-box", position: "relative" } }, iconEl);

  if (type === 10 && sl > 0) {
    return React.createElement("div", { style: { position: "relative" } }, blockEl,
      React.createElement("div", { style: { position: "absolute", inset: sl === 2 ? -4 : -2, borderRadius: 10, border: sl === 2 ? "2px solid rgba(130,180,255,0.7)" : "1px solid rgba(130,180,255,0.35)", boxShadow: sl === 2 ? "0 0 16px rgba(130,180,255,0.5), 0 0 30px rgba(130,180,255,0.25), inset 0 0 10px rgba(130,180,255,0.3)" : "0 0 8px rgba(130,180,255,0.2), inset 0 0 4px rgba(130,180,255,0.1)", pointerEvents: "none", transition: "all 0.3s" } }));
  }
  return blockEl;
}

function PlasmaContainer(props) {
  var pct = Math.min(1, Math.max(0, props.current / props.max));
  var glowColor = pct > 0.5 ? "rgba(48,192,208,0.5)" : pct > 0.25 ? "rgba(255,170,50,0.4)" : "rgba(255,68,85,0.4)";
  var glowSize = Math.round(4 + pct * 8);
  var fillH = 18 * pct;
  return React.createElement("div", { style: { filter: "drop-shadow(0 0 " + glowSize + "px " + glowColor + ")", transition: "filter 0.5s" } },
    React.createElement("svg", { width: "32", height: "28", viewBox: "0 0 32 28" },
      React.createElement("defs", null,
        React.createElement("clipPath", { id: "hexClipW" },
          React.createElement("polygon", { points: "16,1 29,7.5 29,20.5 16,27 3,20.5 3,7.5" }))),
      React.createElement("polygon", { points: "16,1 29,7.5 29,20.5 16,27 3,20.5 3,7.5", fill: "rgba(48,192,208,0.06)", stroke: "rgba(48,192,208," + (0.25 + pct * 0.35) + ")", strokeWidth: "1.2" }),
      React.createElement("rect", { x: "3", y: 25 - fillH, width: "26", height: fillH + 2, fill: "#30c0d0", opacity: 0.3 + pct * 0.3, clipPath: "url(#hexClipW)", style: { transition: "y 0.6s ease-in-out, height 0.6s ease-in-out, opacity 0.6s" } }),
      React.createElement("text", { x: "16", y: "17.5", textAnchor: "middle", fill: "#fff", fontSize: "10", fontWeight: "700", fontFamily: "Quicksand,sans-serif" }, props.current)));
}

// ── Shared top bar component ──
function WorkshopTopBar(props) {
  return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: WS.brushed, backgroundBlendMode: "overlay", borderBottom: PNLB, boxShadow: "0 3px 6px rgba(0,0,0,0.4)", position: "relative", zIndex: 2 } },
    WsRivet({ top: 4, left: 4 }),
    WsRivet({ top: 4, right: 4 }),
    React.createElement("div", { onClick: props.onBack, style: { padding: "6px 10px", borderRadius: 4, background: PNL, border: PNLB, color: "rgba(200,210,220,0.8)", fontSize: 10, fontWeight: 700, letterSpacing: 1, cursor: "pointer", textTransform: "uppercase", boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 4 } },
      React.createElement("svg", { width: "8", height: "8", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M15 18l-6-6 6-6", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" })),
      " " + (props.backLabel || "Back")),
    React.createElement("div", { style: { flex: 1, fontSize: 14, fontWeight: 700, color: props.color || "#80ddff", letterSpacing: 2, textTransform: "uppercase", textAlign: "center", fontFamily: props.fontFamily || "'Quicksand',sans-serif" } }, props.title),
    props.rightContent || React.createElement("div", { style: { width: 52 } }));
}


// ═══════════════════════════════════════════════════════════════
// BLOCK DESIGNER PANEL
// (Integrated from BlockDesigner v4.5 with back navigation)
// ═══════════════════════════════════════════════════════════════

// ── Shape Definitions (SVG) ──
function squarePath() { return "M 4,4 L 96,4 L 96,96 L 4,96 Z"; }
function circlePath() { return null; }
function octagonPath() { return "M 30,4 L 70,4 L 96,30 L 96,70 L 70,96 L 30,96 L 4,70 L 4,30 Z"; }
var ASTEROID_VERTS = [[50,3],[62,8],[78,5],[85,18],[97,28],[92,42],[98,58],[88,68],[90,82],[76,88],[65,97],[50,90],[35,97],[24,88],[10,82],[12,68],[2,58],[8,42],[3,28],[15,18],[22,5],[38,8]];
function asteroidPath() { return "M 50,3 L 62,8 L 78,5 L 85,18 L 97,28 L 92,42 L 98,58 L 88,68 L 90,82 L 76,88 L 65,97 L 50,90 L 35,97 L 24,88 L 10,82 L 12,68 L 2,58 L 8,42 L 3,28 L 15,18 L 22,5 L 38,8 Z"; }
// Builds a transformed asteroid silhouette path: scale to radius r around its
// own center (50,50), rotate by rotationDeg, then translate so its center sits
// at (cx, cy). Used by the Craters pattern.
function craterPath(cx, cy, r, rotationDeg) {
  var s = r / 50, rad = (rotationDeg || 0) * Math.PI / 180, co = Math.cos(rad), si = Math.sin(rad);
  var d = "";
  for (var i = 0; i < ASTEROID_VERTS.length; i++) {
    var lx = (ASTEROID_VERTS[i][0] - 50) * s, ly = (ASTEROID_VERTS[i][1] - 50) * s;
    var rx = co * lx - si * ly, ry = si * lx + co * ly;
    d += (i === 0 ? "M " : "L ") + (cx + rx).toFixed(2) + "," + (cy + ry).toFixed(2) + " ";
  }
  return d + "Z";
}
function starPath() { var points = []; for (var i = 0; i < 10; i++) { var angle = (Math.PI / 2) * -1 + (Math.PI / 5) * i; var r = i % 2 === 0 ? 48 : 20; points.push((50 + r * Math.cos(angle)).toFixed(1) + "," + (50 + r * Math.sin(angle)).toFixed(1)); } return "M " + points.join(" L ") + " Z"; }
function hexagonPath() { var points = []; for (var i = 0; i < 6; i++) { var angle = (Math.PI / 3) * i - Math.PI / 6; points.push((50 + 48 * Math.cos(angle)).toFixed(1) + "," + (50 + 48 * Math.sin(angle)).toFixed(1)); } return "M " + points.join(" L ") + " Z"; }
function crossShapePath() { return "M 34,4 L 66,4 L 66,34 L 96,34 L 96,66 L 66,66 L 66,96 L 34,96 L 34,66 L 4,66 L 4,34 L 34,34 Z"; }
function shieldPath() { return "M 50,4 L 92,20 L 88,60 Q 80,85 50,97 Q 20,85 12,60 L 8,20 Z"; }

var SHAPES = [
  { id: "square", label: "Square", icon: "\u25A0" },
  { id: "circle", label: "Circle", icon: "\u25CF" },
  { id: "octagon", label: "Octagon", icon: "\u2B23" },
  { id: "hexagon", label: "Hexagon", icon: "\u2B21" },
  { id: "star", label: "Star", icon: "\u2605" },
  { id: "asteroid", label: "Asteroid", icon: "\u2604" },
  { id: "cross_shape", label: "Cross", icon: "\u271A" },
  { id: "shield", label: "Shield", icon: "\u26CA" },
  { id: "none", label: "None", icon: "\u2205" },
];

function getShapePath(shapeId) {
  switch (shapeId) {
    case "square": return squarePath();
    case "circle": return circlePath();
    case "octagon": return octagonPath();
    case "hexagon": return hexagonPath();
    case "star": return starPath();
    case "asteroid": return asteroidPath();
    case "cross_shape": return crossShapePath();
    case "shield": return shieldPath();
    default: return squarePath();
  }
}

var PATTERNS = [
  { id: "none", label: "None" },
  { id: "lines", label: "Lines" },
  { id: "crosshatch", label: "Crosshatch" },
  { id: "chevrons", label: "Chevrons" },
  { id: "rings", label: "Rings" },
  { id: "circles", label: "Circles" },
  { id: "squares", label: "Squares" },
  { id: "craters", label: "Craters" },
];

var PATTERN_CAPS = {
  lines:      { lineWidth: true,  filled: false, spacing: true,  ringSpacing: false },
  crosshatch: { lineWidth: true,  filled: false, spacing: false, ringSpacing: false },
  chevrons:   { lineWidth: true,  filled: false, spacing: true,  ringSpacing: false },
  rings:      { lineWidth: true,  filled: false, spacing: false, ringSpacing: true  },
  circles:    { lineWidth: true,  filled: true,  spacing: true,  ringSpacing: false },
  squares:    { lineWidth: true,  filled: true,  spacing: true,  ringSpacing: false },
  craters:    { lineWidth: true,  filled: true,  spacing: true,  ringSpacing: false },
};

var CORNER_SHAPES = { square: true };

var BD_ICONS = [
  { id: "none", label: "None", path: null },
  { id: "cross", label: "Cross", path: "M 44,28 L 50,14 L 56,28 L 52,28 L 52,48 L 72,48 L 72,44 L 86,50 L 72,56 L 72,52 L 52,52 L 52,72 L 56,72 L 50,86 L 44,72 L 48,72 L 48,52 L 28,52 L 28,56 L 14,50 L 28,44 L 28,48 L 48,48 L 48,28 Z" },
  { id: "bolt", label: "Bolt", path: "M 55,15 L 30,52 L 46,52 L 38,85 L 72,42 L 54,42 Z" },
  { id: "dot", label: "Dot", path: "M 50,28 A 22,22 0 1,1 49.99,28 Z" },
  { id: "drone_ic", label: "Drone", fillRule: "nonzero", path: "M 62,34 L 62,66 A 12,12 0 1,1 38,66 L 38,34 A 12,12 0 1,1 62,34 Z M 42.5,35.0 L 39.5,39.0 L 18.5,24.0 L 21.5,20.0 Z M 21,32 A 10,10 0 1,1 21.01,32 Z M 60.5,39.0 L 57.5,35.0 L 78.5,20.0 L 81.5,24.0 Z M 79,32 A 10,10 0 1,1 79.01,32 Z M 39.6,60.9 L 42.4,65.1 L 21.4,79.1 L 18.6,74.9 Z M 21,84 A 10,10 0 1,1 21.01,84 Z M 57.6,65.1 L 60.4,60.9 L 81.4,74.9 L 78.6,79.1 Z M 79,84 A 10,10 0 1,1 79.01,84 Z" },
  { id: "barrel", label: "Barrel", scale: 0.125, path: "M 399.384155 78.750061 C 457.310333 78.750061 509.848022 87.72522 546.4729 101.46582 C 564.793701 108.336182 579.073181 116.452576 587.930481 124.299561 C 596.787842 132.146545 599.768311 138.730591 599.768311 144.42218 C 599.768311 150.113708 596.787842 156.697815 587.930481 164.544739 C 579.073181 172.391724 564.793701 180.508118 546.4729 187.378479 C 509.848022 201.169617 457.310333 210.094299 399.384155 210.094299 C 341.457977 210.094299 288.920288 201.169617 252.379654 187.378479 C 234.025131 180.508118 219.711945 172.391724 210.787308 164.544739 C 202.030991 156.697815 199 150.113708 199 144.42218 C 199 138.730591 202.030991 132.146545 210.787308 124.299561 C 219.711945 116.452576 234.025131 108.336182 252.379654 101.46582 C 288.920288 87.72522 341.457977 78.750061 399.384155 78.750061 Z M 289.930634 125.899231 C 267.610779 125.899231 249.517014 131.930481 249.517014 139.370422 C 249.517014 146.810425 267.610779 152.841675 289.930634 152.841675 C 312.250458 152.841675 330.344238 146.810425 330.344238 139.370422 C 330.344238 131.930481 312.250458 125.899231 289.930634 125.899231 Z M 599.768311 193.844604 L 599.768311 333.018982 C 599.768311 336.38678 597.697144 340.764923 588.199951 346.826965 C 578.719543 352.889008 563.143494 358.95105 543.896484 363.834351 C 505.402527 373.432587 452.258636 378.484283 399.384155 378.484283 C 346.509674 378.484283 293.298431 373.432587 254.905502 363.834351 C 235.70903 358.95105 220.048752 352.889008 210.618912 346.826965 C 201.020706 340.764923 199 336.38678 199 333.018982 L 199 193.844604 C 210.787308 202.348328 225.100464 209.589111 241.602676 215.819519 C 283.026642 231.311401 338.258575 240.40448 399.384155 240.40448 C 460.509766 240.40448 515.741699 231.311401 557.115112 215.819519 C 573.684692 209.589111 588.048401 202.348328 599.768311 193.844604 Z M 599.768311 375.116486 L 599.768311 516.564148 C 599.768311 519.931946 597.697144 524.310059 588.199951 530.372192 C 578.719543 536.434143 563.143494 542.496216 543.896484 547.379517 C 505.402527 556.977783 452.258636 562.029419 399.384155 562.029419 C 346.509674 562.029419 293.298431 556.977783 254.905502 547.379517 C 235.70903 542.496216 220.048752 536.434143 210.618912 530.372192 C 201.020706 524.310059 199 519.931946 199 516.564148 L 199 375.116486 C 212.302811 382.862427 228.636642 388.419312 247.496338 393.134216 C 289.930634 403.742798 344.489014 408.794495 399.384155 408.794495 C 454.279327 408.794495 508.90506 403.742798 551.238342 393.134216 C 570.064331 388.419312 586.448669 382.694031 599.768311 375.116486 Z M 599.768311 558.661621 L 599.768311 656.327881 C 599.768311 664.747375 596.063721 671.988159 586.532837 680.239258 C 577.002014 688.322021 561.779541 696.236328 542.768311 702.635132 C 504.762665 715.264404 451.921844 722 399.384155 722 C 346.846466 722 293.971985 715.264404 255.915833 702.635132 C 237.056152 696.236328 221.732651 688.322021 212.302811 680.239258 C 202.70462 671.988159 199 664.747375 199 656.327881 L 199 558.661621 C 212.302811 566.407593 228.636642 571.964478 247.496338 576.679443 C 289.930634 587.287964 344.489014 592.339661 399.384155 592.339661 C 454.279327 592.339661 508.90506 587.287964 551.238342 576.679443 C 570.064331 571.964478 586.448669 566.239197 599.768311 558.661621 Z" },
  { id: "crate_ic", label: "Crate", path: "M 22,24 L 78,24 L 78,78 L 22,78 Z M 22,38 L 78,38 L 78,42 L 22,42 Z M 40,48 L 60,48 L 60,66 L 40,66 Z M 48,55 A 3,3 0 1,0 52,55 A 3,3 0 1,0 48,55 Z" },
  { id: "console_open", label: "Open", path: "M 22,44 L 78,44 L 78,80 L 22,80 Z M 28,38 L 72,38 L 68,22 L 32,22 Z M 38,52 L 62,52 L 62,68 L 38,68 Z M 47,58 A 4,4 0 1,0 53,58 A 4,4 0 1,0 47,58 Z" },
  { id: "skull", label: "Skull", path: "M 50,18 Q 78,18 78,45 Q 78,60 68,68 L 70,82 L 58,78 L 55,82 L 50,78 L 45,82 L 42,78 L 30,82 L 32,68 Q 22,60 22,45 Q 22,18 50,18 Z M 38,42 A 6,6 0 1,1 37.99,42 Z M 62,42 A 6,6 0 1,1 61.99,42 Z" },
  { id: "flame", label: "Flame", path: "M 50,15 Q 65,30 65,45 Q 72,35 72,50 Q 72,68 60,78 Q 55,82 50,84 Q 45,82 40,78 Q 28,68 28,50 Q 28,35 35,45 Q 35,30 50,15 Z" },
  { id: "shield_ic", label: "Shield", path: "M 50,18 L 78,30 L 75,58 Q 68,76 50,85 Q 32,76 25,58 L 22,30 Z" },
  { id: "gear", label: "Gear", path: "M 50,10 L 61,24 L 78,22 L 76,39 L 90,50 L 76,61 L 78,78 L 61,76 L 50,90 L 39,76 L 22,78 L 24,61 L 10,50 L 24,39 L 22,22 L 39,24 Z M 50,38 A 12,12 0 1,0 50.01,38 Z" },
  { id: "ring", label: "Ring", path: "M 50,24 A 26,26 0 1,1 49.99,24 Z M 50,36 A 14,14 0 1,0 50.01,36 Z" },
  { id: "hex_core", label: "Hex Core", path: "M 50,16 L 79.4,33 L 79.4,67 L 50,84 L 20.6,67 L 20.6,33 Z M 50,29 L 68.2,39.5 L 68.2,60.5 L 50,71 L 31.8,60.5 L 31.8,39.5 Z M 50,43 A 7,7 0 1,1 49.99,43 Z" },
];

var BD_BLOCK_TYPES = [
  { id: "regular", label: "Regular" }, { id: "cross_shot", label: "Cross Shot" },
  { id: "lightning", label: "Lightning" }, { id: "plasma", label: "Plasma" },
  { id: "crate", label: "Crate" }, { id: "drone", label: "Drone" },
  { id: "indestructible", label: "Indestructible" }, { id: "acid_barrel", label: "Acid Barrel" },
  { id: "force_field", label: "Force Field" }, { id: "core", label: "Extra Core" },
];

var BD_COLOR_PRESETS = [
  "#ff4444", "#ff8800", "#ffcc00", "#44dd44",
  "#00cccc", "#4488ff", "#8844ff", "#ff44cc",
  "#ffffff", "#aaaaaa", "#555555", "#222222",
];

function bdDefaultDesign() {
  return {
    name: "", shape: "square", shapeRotation: 0, cornerRadius: 6,
    color: "#4488ff", borderColor: "#88bbff", borderWidth: 2, fillOpacity: 1, borderOpacity: 1,
    glowEnabled: false, glowColor: "#88bbff", glowIntensity: 6,
    pattern: "none", patternColor: "#ffffff", patternOpacity: 0.3,
    patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, patternSpacing: 10, patternRingSpacing: 6,
    icon: "none", iconColor: "#ffffff", iconOpacity: 0.8, iconRotation: 0,
    iconGlow: false, iconGlowColor: "#ffffff", iconGlowIntensity: 6,
    assignedTo: "regular", phases: null,
  };
}

var PHASE_PROPS = ["glowEnabled", "glowColor", "glowIntensity", "borderColor", "borderWidth", "icon", "iconColor", "iconOpacity", "iconGlow", "iconGlowColor", "iconGlowIntensity"];

function getDesignForPhase(design, phase) {
  if (!phase || phase === 1 || !design.phases) return design;
  var phaseOverrides = design.phases[phase];
  if (!phaseOverrides) return design;
  var merged = {};
  Object.keys(design).forEach(function(k) { merged[k] = design[k]; });
  Object.keys(phaseOverrides).forEach(function(k) { merged[k] = phaseOverrides[k]; });
  return merged;
}

function bdDefaultPhases() {
  return {
    2: { glowEnabled: false, borderWidth: 1, borderColor: "rgba(130,180,255,0.35)" },
    3: { glowEnabled: false, borderWidth: 0, borderColor: "transparent", icon: "console_open" }
  };
}

var BD_STORAGE_KEY = "cosmic-drift-block-designs";
// VFX Studio: saved-designs model, mirroring the Block Designer.
//   cosmic-drift-vfx-designs -> array of VFX design objects
//   cosmic-drift-vfx-active  -> { effectType: designId } active map
var VFX_STORAGE_KEY = "cosmic-drift-vfx-designs";
var VFX_ACTIVE_KEY = "cosmic-drift-vfx-active";
var UFO_STORAGE_KEY  = "cosmic-drift-ufo-design";
var UFO_DESIGNS_KEY  = "cosmic-drift-ufo-designs";
var UFO_ACTIVE_KEY   = "cosmic-drift-ufo-active";
var SHIP_DESIGNS_KEY   = "cosmic-drift-ship-designs";
var SHIP_ACTIVE_KEY    = "cosmic-drift-ship-active";
var PLASMA_DESIGNS_KEY = "cosmic-drift-plasma-designs";
var PLASMA_ACTIVE_KEY  = "cosmic-drift-plasma-active";
var SHIP_DEFAULT_DESIGN = { hull: "arrow", parts: [] };
function shipLoadDesigns() {
  return window.storage.get(SHIP_DESIGNS_KEY).then(function(result) {
    if (!result || !result.value) return [];
    var parsed = JSON.parse(result.value);
    return Array.isArray(parsed) ? parsed : [];
  }).catch(function() { return []; });
}
function shipSaveDesigns(designs) {
  return window.storage.set(SHIP_DESIGNS_KEY, JSON.stringify(designs)).catch(function() {});
}
function shipLoadActiveId() {
  return window.storage.get(SHIP_ACTIVE_KEY).then(function(result) {
    return result && result.value ? result.value : null;
  }).catch(function() { return null; });
}
function shipSaveActiveId(id) {
  return window.storage.set(SHIP_ACTIVE_KEY, id || "").catch(function() {});
}

function ufoLoadDesigns() {
  return window.storage.get(UFO_DESIGNS_KEY).then(function(result) {
    if (!result || !result.value) return [];
    var parsed = JSON.parse(result.value);
    return Array.isArray(parsed) ? parsed : [];
  }).catch(function() { return []; });
}
function ufoSaveDesigns(designs) {
  return window.storage.set(UFO_DESIGNS_KEY, JSON.stringify(designs)).catch(function() {});
}
function ufoLoadActiveId() {
  return window.storage.get(UFO_ACTIVE_KEY).then(function(result) {
    return result && result.value ? result.value : null;
  }).catch(function() { return null; });
}
function ufoSaveActiveId(id) {
  return window.storage.set(UFO_ACTIVE_KEY, id || "").catch(function() {});
}
function plasmaLoadDesigns() {
  return window.storage.get(PLASMA_DESIGNS_KEY).then(function(result) {
    if (!result || !result.value) return [];
    var parsed = JSON.parse(result.value);
    return Array.isArray(parsed) ? parsed : [];
  }).catch(function() { return []; });
}
function plasmaSaveDesigns(designs) {
  return window.storage.set(PLASMA_DESIGNS_KEY, JSON.stringify(designs)).catch(function() {});
}
function plasmaLoadActiveId() {
  return window.storage.get(PLASMA_ACTIVE_KEY).then(function(result) {
    return result && result.value ? result.value : null;
  }).catch(function() { return null; });
}
function plasmaSaveActiveIdToStorage(id) {
  return window.storage.set(PLASMA_ACTIVE_KEY, id || "").catch(function() {});
}

// Effect type registry: drives the type-picker buttons, sorting, the editor.
var VFX_EFFECT_TYPES = [
  { id: "acid_ooze",     label: "Acid Ooze",     color: "#35a035" },
  { id: "burn",          label: "Burn",          color: "#ff6633" },
  { id: "block_destroy", label: "Block Destroy", color: "#80ddff" },
  { id: "drone_explode", label: "Drone Explode", color: "#ffe066" },
  { id: "lightning",     label: "Lightning",     color: "#ffe066" }
];
function vfxTypeInfo(id) {
  for (var i = 0; i < VFX_EFFECT_TYPES.length; i++) { if (VFX_EFFECT_TYPES[i].id === id) return VFX_EFFECT_TYPES[i]; }
  return VFX_EFFECT_TYPES[0];
}

// Per-effect parameter defaults: the starting point for a brand-new design.
var VFX_DEFAULTS = {
  acid_ooze:     { color1: "#1a6a1a", color2: "#35a035", width: 1.0, waveSize: 1.0, freq: 5, speed: 1.0, splash: 1.0 },
  burn:          { emberColor: "#ff6633", emberOpacity: 1.0, sparkColor: "#ffffff", sparkOpacity: 0.85, speed: 1.0, spread: 1.0, density: 1.0, emberSize: 1.0 },
  block_destroy: { burstColor: "#c8b8ff", burstOpacity: 1.0, accentColor: "#80ddff", accentOpacity: 1.0, speed: 1.0, spread: 1.0, count: 1.0, particleSize: 1.0 },
  drone_explode: { coreColor: "#ffe066", coreOpacity: 1.0, blastColor: "#ff6633", blastOpacity: 1.0, speed: 1.0, spread: 1.0, count: 1.0, particleSize: 1.0 },
  lightning:     { glowColor: "#ffe066", boltColor: "#ffe066", coreColor: "#fffde0", thickness: 1.0, jaggedness: 1.0, speed: 1.0 }
};

// Factory presets: the built-in look per effect type (Defaults tab + fallback
// when no custom design is active). Acid Ooze uses the in-game-matching values.
var VFX_FACTORY_PRESETS = [
  { id: "factory_acid_ooze",     name: "Default Acid Ooze",     effectType: "acid_ooze",     isFactory: true, color1: "#1a6a1a", color2: "#35a035", width: 1.3, waveSize: 0.8, freq: 8, speed: 0.5, splash: 1.8 },
  { id: "factory_burn",          name: "Default Burn",          effectType: "burn",          isFactory: true, emberColor: "#ff6633", emberOpacity: 1.0, sparkColor: "#ffffff", sparkOpacity: 0.85, speed: 1.0, spread: 1.0, density: 1.0, emberSize: 1.0 },
  { id: "factory_block_destroy", name: "Default Block Destroy", effectType: "block_destroy", isFactory: true, burstColor: "#c8b8ff", burstOpacity: 1.0, accentColor: "#80ddff", accentOpacity: 1.0, speed: 1.0, spread: 1.0, count: 1.0, particleSize: 1.0 },
  { id: "factory_drone_explode", name: "Default Drone Explode", effectType: "drone_explode", isFactory: true, coreColor: "#ffe066", coreOpacity: 1.0, blastColor: "#ff6633", blastOpacity: 1.0, speed: 1.0, spread: 1.0, count: 1.0, particleSize: 1.0 },
  { id: "factory_lightning",     name: "Default Lightning",     effectType: "lightning",     isFactory: true, glowColor: "#ffe066", boltColor: "#ffe066", coreColor: "#fffde0", thickness: 1.0, jaggedness: 1.0, speed: 1.0 }
];
function vfxFactoryFor(effectType) {
  for (var i = 0; i < VFX_FACTORY_PRESETS.length; i++) { if (VFX_FACTORY_PRESETS[i].effectType === effectType) return VFX_FACTORY_PRESETS[i]; }
  return null;
}

// A fresh, unsaved design for the given effect type.
// A fresh, unsaved design. effectType null = not yet chosen (the editor shows
// the "pick an effect" empty state until the user picks a type).
function vfxDefaultDesign(effectType) {
  var d = { name: "", effectType: effectType || null };
  var params = VFX_DEFAULTS[effectType] || {};
  Object.keys(params).forEach(function(k) { d[k] = params[k]; });
  return d;
}

function vfxLoadDesigns() {
  return window.storage.get(VFX_STORAGE_KEY).then(function(result) {
    if (!result) return [];
    var parsed = JSON.parse(result.value);
    return Array.isArray(parsed) ? parsed : [];
  }).catch(function() { return []; });
}
function vfxSaveDesigns(designs) {
  return window.storage.set(VFX_STORAGE_KEY, JSON.stringify(designs)).catch(function(e) { console.error("Save failed:", e); });
}
function vfxLoadActive() {
  return window.storage.get(VFX_ACTIVE_KEY).then(function(result) {
    return result ? JSON.parse(result.value) : {};
  }).catch(function() { return {}; });
}
function vfxSaveActive(map) {
  return window.storage.set(VFX_ACTIVE_KEY, JSON.stringify(map)).catch(function(e) { console.error("Save failed:", e); });
}

// Resolves the design for an effect type: the active custom design if set,
// otherwise the factory preset.
function vfxResolveActive(effectType, activeMap, savedDesigns) {
  var id = activeMap[effectType];
  if (id) {
    for (var i = 0; i < savedDesigns.length; i++) {
      if (savedDesigns[i].id === id && savedDesigns[i].effectType === effectType) return savedDesigns[i];
    }
  }
  return vfxFactoryFor(effectType);
}
// Ported from the game's makeOozePath: a wavy vertical ooze column.
// freq = whole number of wave cycles down the column. Rounded to an integer so
// the wave tiles seamlessly when the column scrolls by h.
function vfxMakeOozePath(h, ampMul, widthMul, freq) {
  var cycles = Math.max(2, Math.round(freq || 5));
  var period = h / cycles;
  var hw = 11 * (widthMul || 1);
  var amp = 1.6 * (ampMul || 1);
  var rPhase = 0.15, cx = 30, step = 3;
  var totalH = 2 * h;
  var lx = cx - hw, rx = cx + hw;
  var leftPts = [], rightPts = [];
  for (var y = 0; y <= totalH; y += step) {
    var lWave = amp * Math.sin(y * 2 * Math.PI / period);
    leftPts.push((lx + lWave).toFixed(1) + "," + y);
  }
  for (var y2 = totalH; y2 >= 0; y2 -= step) {
    var rWave = amp * Math.sin(y2 * 2 * Math.PI / period + Math.PI * rPhase);
    rightPts.push((rx + rWave).toFixed(1) + "," + y2);
  }
  return { path: "M " + leftPts.join(" L ") + " L " + rightPts.join(" L ") + " Z", svgH: totalH };
}
// 0..1 opacity -> 2-char hex suffix, for baking opacity into a hex color.
function vfxAlphaHex(o) {
  var n = Math.round(Math.max(0, Math.min(1, o == null ? 1 : o)) * 255);
  var h = n.toString(16);
  return h.length < 2 ? "0" + h : h;
}

function bdLoadDesigns() {
  return window.storage.get(BD_STORAGE_KEY).then(function(result) {
    return result ? JSON.parse(result.value) : [];
  }).catch(function() { return []; });
}

function bdSaveDesigns(designs) {
  return window.storage.set(BD_STORAGE_KEY, JSON.stringify(designs)).catch(function(e) {
    console.error("Save failed:", e);
  });
}

// Active block designs: explicit, opt-in map of { blockTypeId: designId }.
// A numeric grid block with no active design just keeps its hardcoded icon.
var BD_ACTIVE_KEY = "cosmic-drift-active-blocks";

function bdLoadActive() {
  return window.storage.get(BD_ACTIVE_KEY).then(function(result) {
    return result ? JSON.parse(result.value) : {};
  }).catch(function() { return {}; });
}

function bdSaveActive(map) {
  return window.storage.set(BD_ACTIVE_KEY, JSON.stringify(map)).catch(function(e) {
    console.error("Save failed:", e);
  });
}

// ══ SETS ══
var SETS_STORAGE_KEY = "cosmic-drift-sets";
var SETS_ACTIVE_KEY  = "cosmic-drift-sets-active";
function setsLoadAll() {
  return window.storage.get(SETS_STORAGE_KEY).then(function(result) {
    if (!result || !result.value) return [];
    try { var p = JSON.parse(result.value); return Array.isArray(p) ? p : []; } catch(e) { return []; }
  }).catch(function() { return []; });
}
function setsSaveAll(arr) {
  return window.storage.set(SETS_STORAGE_KEY, JSON.stringify(arr)).catch(function() {});
}
function setsLoadActiveId() {
  return window.storage.get(SETS_ACTIVE_KEY).then(function(result) {
    return result && result.value ? result.value : null;
  }).catch(function() { return null; });
}
function setsSaveActiveId(id) {
  return window.storage.set(SETS_ACTIVE_KEY, id || "").catch(function() {});
}

// Numeric grid block type -> Block Designer string id. Crate variants 11-16
// resolve to "crate". Type 17 (UFO) has no design-system equivalent.
var BLOCK_TYPE_TO_BD = { 1: "regular", 2: "cross_shot", 3: "lightning", 4: "core", 5: "plasma", 6: "drone", 7: "indestructible", 8: "acid_barrel", 9: "crate", 10: "force_field" };

// Resolves the design for a numeric block type: the active custom design if
// one is set, otherwise the factory preset for that type. Returns null only
// for type 17 (UFO), which keeps its bespoke hardcoded rendering.
function bdResolveActiveDesign(blockType, activeMap, savedDesigns) {
  var bdId = BLOCK_TYPE_TO_BD[blockType];
  if (!bdId && blockType >= 11 && blockType <= 16) bdId = "crate";
  if (!bdId) return null;
  var designId = activeMap[bdId];
  if (designId) {
    for (var i = 0; i < savedDesigns.length; i++) {
      if (savedDesigns[i].id === designId) {
        if (savedDesigns[i].assignedTo === bdId) return savedDesigns[i];
        break;
      }
    }
  }
  for (var j = 0; j < BD_FACTORY_PRESETS.length; j++) {
    if (BD_FACTORY_PRESETS[j].assignedTo === bdId) return BD_FACTORY_PRESETS[j];
  }
  return null;
}

var BD_FACTORY_PRESETS = [
  { id: "factory_regular", name: "Regular", assignedTo: "regular", isFactory: true, shape: "square", shapeRotation: 0, cornerRadius: 6, color: "#7b5ea7", borderColor: "#6b4e97", borderWidth: 2, glowEnabled: true, glowColor: "#9f7fd0", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "none", iconColor: "#fff", iconOpacity: 0.8, iconGlow: false, iconGlowColor: "#fff", iconGlowIntensity: 4 },
  { id: "factory_cross_shot", name: "Cross Shot", assignedTo: "cross_shot", isFactory: true, shape: "square", shapeRotation: 0, cornerRadius: 6, color: "#e0457b", borderColor: "#c03868", borderWidth: 2, glowEnabled: true, glowColor: "#ff6b9d", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "cross", iconColor: "#ffffff", iconOpacity: 0.85, iconGlow: false, iconGlowColor: "#fff", iconGlowIntensity: 4 },
  { id: "factory_lightning", name: "Lightning", assignedTo: "lightning", isFactory: true, shape: "square", shapeRotation: 0, cornerRadius: 6, color: "#9a7020", borderColor: "#7a5a18", borderWidth: 2, glowEnabled: true, glowColor: "#b8862a", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "bolt", iconColor: "#ffe066", iconOpacity: 0.9, iconGlow: false, iconGlowColor: "#ffe066", iconGlowIntensity: 4 },
  { id: "factory_plasma", name: "Plasma", assignedTo: "plasma", isFactory: true, shape: "square", shapeRotation: 0, cornerRadius: 6, color: "#3060b0", borderColor: "#2850a0", borderWidth: 2, glowEnabled: true, glowColor: "#4080d8", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "dot", iconColor: "#80ddff", iconOpacity: 0.85, iconGlow: true, iconGlowColor: "#50c8ff", iconGlowIntensity: 5 },
  { id: "factory_crate", name: "Crate", assignedTo: "crate", isFactory: true, shape: "square", shapeRotation: 0, cornerRadius: 6, color: "#b8862a", borderColor: "#9a7020", borderWidth: 2, glowEnabled: true, glowColor: "#d4a843", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "crate_ic", iconColor: "#4a4a5a", iconOpacity: 0.75, iconGlow: false, iconGlowColor: "#fff", iconGlowIntensity: 4 },
  { id: "factory_drone", name: "Drone", assignedTo: "drone", isFactory: true, shape: "square", shapeRotation: 0, cornerRadius: 6, color: "#8844cc", borderColor: "#6633aa", borderWidth: 2, glowEnabled: true, glowColor: "#aa66ee", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "drone_ic", iconColor: "#e8e8ff", iconOpacity: 0.75, iconGlow: false, iconGlowColor: "#80ffee", iconGlowIntensity: 3 },
  { id: "factory_indestructible", name: "Indestructible", assignedTo: "indestructible", isFactory: true, shape: "square", shapeRotation: 0, cornerRadius: 6, color: "#707580", borderColor: "#555555", borderWidth: 3, glowEnabled: false, glowColor: "#888", glowIntensity: 4, pattern: "squares", patternColor: "#323232", patternOpacity: 0.8, patternScale: 2.6, patternRotation: 45, patternFilled: true, patternLineWidth: 2, icon: "none", iconColor: "#fff", iconOpacity: 0.8, iconGlow: false, iconGlowColor: "#fff", iconGlowIntensity: 4 },
  { id: "factory_acid_barrel", name: "Acid Barrel", assignedTo: "acid_barrel", isFactory: true, shape: "square", shapeRotation: 0, cornerRadius: 6, color: "#2a8a2a", borderColor: "#1a6a1a", borderWidth: 2, glowEnabled: true, glowColor: "#40b840", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "barrel", iconColor: "#80ff80", iconOpacity: 0.75, iconGlow: false, iconGlowColor: "#80ff80", iconGlowIntensity: 3 },
  { id: "factory_force_field", name: "Force Field", assignedTo: "force_field", isFactory: true, shape: "square", shapeRotation: 0, cornerRadius: 6, color: "#4060a0", borderColor: "#3050a0", borderWidth: 2, glowEnabled: true, glowColor: "#82b4ff", glowIntensity: 5, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "crate_ic", iconColor: "#82b4ff", iconOpacity: 0.75, iconGlow: false, iconGlowColor: "#82b4ff", iconGlowIntensity: 4, phases: { 2: { glowEnabled: false, borderWidth: 1, borderColor: "rgba(130,180,255,0.35)" }, 3: { glowEnabled: false, borderWidth: 0, borderColor: "transparent", icon: "console_open" } } },
  { id: "factory_core", name: "Extra Core", assignedTo: "core", isFactory: true, shape: "square", shapeRotation: 0, cornerRadius: 6, color: "#2090a0", borderColor: "#1a7888", borderWidth: 2, glowEnabled: true, glowColor: "#30c0d0", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "hex_core", iconColor: "#50e8f0", iconOpacity: 0.9, iconGlow: true, iconGlowColor: "#50e8f0", iconGlowIntensity: 4 },
];

// ── Open Space — pre-loaded set + block design collection ──
// Both seeded into storage on first Workshop launch. Users can edit or delete freely.
var OPEN_SPACE_SET = {
  id: "preset_openspace",
  name: "Open Space",
  savedAt: "2026-05-22T18:43:51.139Z",
  shipDesignId: null,
  plasmaDesignId: null,
  levelIds: [],
  blockDesignIds: ["mpev6urtrgwfsw","mpev7n6nloz04b","mpev7whpsrc8js","mpev82o5ap3qhn","mpev88kduh1ae4","mpev8reoqahqiy","mpev8v0ub1z3ce","mpev9x9m11artw","mpev3ctjt1g4qy"],
  blockActive: { lightning: "mpev6urtrgwfsw", plasma: "mpev7n6nloz04b", crate: "mpev7whpsrc8js", drone: "mpev82o5ap3qhn", acid_barrel: "mpev88kduh1ae4", force_field: "mpev8reoqahqiy", core: "mpev8v0ub1z3ce", regular: "mpev9x9m11artw", cross_shot: "mpev3ctjt1g4qy" }
};
var OPEN_SPACE_BLOCK_DESIGNS = [
  { id: "mpev6urtrgwfsw", name: "OS Lightning", assignedTo: "lightning", isFactory: false, shape: "none", shapeRotation: 0, cornerRadius: 6, color: "#9a7020", borderColor: "#7a5a18", borderWidth: 2, glowEnabled: true, glowColor: "#b8862a", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "bolt", iconColor: "#ffe066", iconOpacity: 0.9, iconGlow: false, iconGlowColor: "#ffe066", iconGlowIntensity: 4, createdAt: "2026-05-21T02:21:22.889Z", modifiedAt: "2026-05-21T02:21:22.889Z" },
  { id: "mpev7n6nloz04b", name: "OS Plasma", assignedTo: "plasma", isFactory: false, shape: "none", shapeRotation: 0, cornerRadius: 6, color: "#3060b0", borderColor: "#2850a0", borderWidth: 2, glowEnabled: true, glowColor: "#4080d8", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "dot", iconColor: "#80ddff", iconOpacity: 0.85, iconGlow: true, iconGlowColor: "#50c8ff", iconGlowIntensity: 5, createdAt: "2026-05-21T02:21:59.711Z", modifiedAt: "2026-05-21T02:21:59.711Z" },
  { id: "mpev7whpsrc8js", name: "OS Crate", assignedTo: "crate", isFactory: false, shape: "none", shapeRotation: 0, cornerRadius: 6, color: "#b8862a", borderColor: "#9a7020", borderWidth: 2, glowEnabled: true, glowColor: "#d4a843", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "crate_ic", iconColor: "#ffe224", iconOpacity: 0.75, iconGlow: false, iconGlowColor: "#fff", iconGlowIntensity: 4, createdAt: "2026-05-21T02:22:11.773Z", modifiedAt: "2026-05-21T02:22:11.773Z" },
  { id: "mpev82o5ap3qhn", name: "OS Drone", assignedTo: "drone", isFactory: false, shape: "none", shapeRotation: 0, cornerRadius: 6, color: "#8844cc", borderColor: "#6633aa", borderWidth: 2, glowEnabled: true, glowColor: "#aa66ee", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "drone_ic", iconColor: "#e8e8ff", iconOpacity: 0.75, iconGlow: false, iconGlowColor: "#80ffee", iconGlowIntensity: 3, createdAt: "2026-05-21T02:22:19.781Z", modifiedAt: "2026-05-21T02:22:19.781Z" },
  { id: "mpev88kduh1ae4", name: "OS Acid Barrel", assignedTo: "acid_barrel", isFactory: false, shape: "none", shapeRotation: 0, cornerRadius: 6, color: "#2a8a2a", borderColor: "#1a6a1a", borderWidth: 2, glowEnabled: true, glowColor: "#40b840", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "barrel", iconColor: "#80ff80", iconOpacity: 0.75, iconGlow: false, iconGlowColor: "#80ff80", iconGlowIntensity: 3, createdAt: "2026-05-21T02:22:27.421Z", modifiedAt: "2026-05-21T02:22:27.421Z" },
  { id: "mpev8reoqahqiy", name: "OS Force Field", assignedTo: "force_field", isFactory: false, shape: "none", shapeRotation: 0, cornerRadius: 6, color: "#4060a0", borderColor: "#3050a0", borderWidth: 2, glowEnabled: true, glowColor: "#82b4ff", glowIntensity: 5, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "crate_ic", iconColor: "#3385ff", iconOpacity: 0.75, iconGlow: false, iconGlowColor: "#82b4ff", iconGlowIntensity: 4, phases: { 2: { glowEnabled: false, borderWidth: 1, borderColor: "rgba(130,180,255,0.35)" }, 3: { glowEnabled: false, borderWidth: 0, borderColor: "transparent", icon: "console_open" } }, createdAt: "2026-05-21T02:22:51.840Z", modifiedAt: "2026-05-21T02:22:51.840Z" },
  { id: "mpev8v0ub1z3ce", name: "OS Extra Core", assignedTo: "core", isFactory: false, shape: "none", shapeRotation: 0, cornerRadius: 6, color: "#2090a0", borderColor: "#1a7888", borderWidth: 2, glowEnabled: true, glowColor: "#30c0d0", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "hex_core", iconColor: "#50e8f0", iconOpacity: 0.9, iconGlow: true, iconGlowColor: "#50e8f0", iconGlowIntensity: 4, createdAt: "2026-05-21T02:22:56.526Z", modifiedAt: "2026-05-21T02:22:56.526Z" },
  { id: "mpev9x9m11artw", name: "OS Regular", assignedTo: "regular", isFactory: false, shape: "asteroid", shapeRotation: 0, cornerRadius: 6, color: "#794101", borderColor: "#572e00", borderWidth: 2, glowEnabled: true, glowColor: "#ffd500", glowIntensity: 7, pattern: "craters", patternColor: "#4d2900", patternOpacity: 0.9, patternScale: 7.5, patternRotation: 0, patternFilled: true, patternLineWidth: 1, icon: "none", iconColor: "#fff", iconOpacity: 0.8, iconGlow: false, iconGlowColor: "#fff", iconGlowIntensity: 4, createdAt: "2026-05-21T02:24:28.694Z", modifiedAt: "2026-05-21T02:24:28.694Z" },
  { id: "mpev3ctjt1g4qy", name: "OS Cross Shot", assignedTo: "cross_shot", isFactory: false, shape: "none", shapeRotation: 0, cornerRadius: 6, color: "#e0457b", borderColor: "#c03868", borderWidth: 2, glowEnabled: true, glowColor: "#ff6b9d", glowIntensity: 4, pattern: "none", patternColor: "#fff", patternOpacity: 0.3, patternScale: 1, patternRotation: 0, patternFilled: false, patternLineWidth: 1.5, icon: "cross", iconColor: "#ff0000", iconOpacity: 0.85, iconGlow: false, iconGlowColor: "#fff", iconGlowIntensity: 4, createdAt: "2026-05-21T02:18:45.953Z", modifiedAt: "2026-05-21T02:18:45.953Z" },
];

var USE_THE_FORCE_SHIP = { id: "ship_1779507928877", name: "Red 5", hull: "none", parts: JSON.parse(JSON.stringify(HULL_PRESETS.red5)), savedAt: "2026-05-23T04:35:37.905Z" };
var TIE_FIGHTS_SHIP    = { id: "ship_1779483721711", name: "My Tie", hull: "none", parts: JSON.parse(JSON.stringify(HULL_PRESETS.mytie)), savedAt: "2026-05-22T22:31:22.050Z" };
var USE_THE_FORCE_PLASMA = { shape: "blast", color: "#ff4488", colorMode: "radial", colorOpacity: 1, glowColor: "#ff4488", glowSize: 13, splitEnabled: true, splitDistance: 42, flashEnabled: true, flashColor: "#ff4488", flashSize: 8, flashOpacity: 0.9, sourceOffsetX: 50, sourceOffsetY: 22, speed: 2, name: "Hope in Red", id: "plasma_1779501546068", savedAt: "2026-05-23T04:40:31.115Z" };
var TIE_FIGHTS_PLASMA    = { shape: "blast", color: "#44ffaa", colorMode: "radial", colorOpacity: 1, glowColor: "#44ffaa", glowSize: 8, splitEnabled: true, splitDistance: 10, flashEnabled: true, flashColor: "#44ffaa", flashSize: 24, flashOpacity: 0.9, sourceOffsetX: 50, sourceOffsetY: 37, speed: 1, name: "Empire Green", id: "plasma_1779424414320", savedAt: "2026-05-22T22:32:28.874Z" };
var USE_THE_FORCE_SET = { id: "set_1779512592664", name: "Use the Force", savedAt: "2026-05-23T05:03:47.522Z", shipDesignId: "ship_1779507928877", plasmaDesignId: "plasma_1779501546068" };
var TIE_FIGHTS_SET    = { id: "set_1779512653579", name: "Tie Fights",     savedAt: "2026-05-23T05:07:04.177Z", shipDesignId: "ship_1779483721711", plasmaDesignId: "plasma_1779424414320" };

// ── SVG Pattern renderer ──
function PatternDef(props) {
  var id = props.id, patternId = props.patternId, color = props.color, opacity = props.opacity, scale = props.scale, rotation = props.rotation, filled = props.filled, lineWidth = props.lineWidth;
  if (patternId === "none" || patternId === "rings") return null;
  // Tile size = spacing. Elements have fixed (or relative) sizes inside the tile,
  // so increasing spacing grows the whitespace between elements.
  var sz = Math.max(2, Math.min(50, props.spacing == null ? 10 : props.spacing));
  var half = sz / 2, strokeW = lineWidth, fill = filled ? color : "none", stroke = color, inner = null;
  switch (patternId) {
    case "lines": inner = React.createElement("line", { x1: 0, y1: half, x2: sz, y2: half, stroke: stroke, strokeWidth: strokeW, opacity: opacity }); break;
    case "crosshatch": inner = React.createElement("g", { opacity: opacity }, React.createElement("line", { x1: 0, y1: 0, x2: sz, y2: sz, stroke: stroke, strokeWidth: strokeW }), React.createElement("line", { x1: sz, y1: 0, x2: 0, y2: sz, stroke: stroke, strokeWidth: strokeW })); break;
    case "chevrons": { var chHW = 5, chHH = 2.5; var chTop = half - 2 * chHH, chBot = half; var pts = (half - chHW) + "," + chBot + " " + half + "," + chTop + " " + (half + chHW) + "," + chBot; inner = React.createElement("polyline", { points: pts, fill: "none", stroke: stroke, strokeWidth: strokeW, opacity: opacity }); break; }
    case "circles": inner = React.createElement("circle", { cx: half, cy: half, r: 3.5, fill: fill, stroke: stroke, strokeWidth: strokeW, opacity: opacity }); break;
    case "squares": var sqSz = 3.5, sqOff = (sz - sqSz) / 2; inner = React.createElement("rect", { x: sqOff, y: sqOff, width: sqSz, height: sqSz, fill: fill, stroke: stroke, strokeWidth: strokeW, opacity: opacity }); break;
    case "craters": {
      // Eight craters per tile, each the asteroid silhouette at a varied size,
      // rotation, and scattered position so they don't read as a grid. Positions
      // are pseudo-random within the tile; sizes range ~1.0-1.8, rotations span
      // the full circle.
      var craterDefs = [[2.0, 2.5, 1.4, 15], [6.0, 1.5, 1.0, -30], [8.5, 3.3, 1.6, 50], [4.0, 4.0, 1.5, 25], [7.8, 5.5, 1.0, -45], [1.8, 6.5, 1.2, 80], [5.5, 7.5, 1.8, -15], [3.5, 9.0, 1.3, 110]];
      var craterEls = [];
      for (var cri = 0; cri < craterDefs.length; cri++) {
        var cd = craterDefs[cri];
        craterEls.push(React.createElement("path", { key: cri, d: craterPath(cd[0], cd[1], cd[2], cd[3]), fill: fill, stroke: stroke, strokeWidth: strokeW, opacity: opacity }));
      }
      inner = React.createElement("g", null, craterEls);
      break;
    }
    default: return null;
  }
  // Craters' Scale slider is repurposed: min 3 = the densest "current 3x" zoom,
  // max 10 = a single tile fills a 100x100 block (no visible repetition).
  var effScale = patternId === "craters" ? Math.max(3, Math.min(10, scale == null ? 10 : scale)) : scale;
  var transform = "translate(50 50) scale(" + effScale + ") rotate(" + rotation + ") translate(-50 -50)";
  return React.createElement("pattern", { id: id, patternUnits: "userSpaceOnUse", width: sz, height: sz, patternTransform: transform }, inner);
}

// ── SVG Block Preview (for designed blocks) ──
function BDBlockPreview(props) {
  var design = props.design, size = props.size || 120;
  var shapePath = getShapePath(design.shape);
  var isCircle = design.shape === "circle";
  var isSquare = design.shape === "square";
  var patId = "preview-pattern-" + design.pattern + "-" + size;
  var hasRotation = design.shapeRotation && design.shapeRotation !== 0;
  var hasCorners = CORNER_SHAPES[design.shape] && design.cornerRadius > 0;
  var cr = design.cornerRadius || 0;
  var glowStyle = {};
  if (design.glowEnabled) { glowStyle.filter = "drop-shadow(0 0 " + design.glowIntensity + "px " + design.glowColor + ")"; }
  var fillOp = design.fillOpacity != null ? design.fillOpacity : 1;
  var borderOp = design.borderOpacity != null ? design.borderOpacity : 1;
  var isNone = design.shape === "none";
  var shapeElement = null;
  if (!isNone) {
    if (isCircle) { shapeElement = React.createElement("circle", { cx: 50, cy: 50, r: 46, fill: design.color, fillOpacity: fillOp, stroke: design.borderColor, strokeOpacity: borderOp, strokeWidth: design.borderWidth * 2 }); }
    else if (isSquare && hasCorners) { shapeElement = React.createElement("rect", { x: 4, y: 4, width: 92, height: 92, rx: cr, ry: cr, fill: design.color, fillOpacity: fillOp, stroke: design.borderColor, strokeOpacity: borderOp, strokeWidth: design.borderWidth * 2 }); }
    else { shapeElement = React.createElement("path", { d: shapePath, fill: design.color, fillOpacity: fillOp, stroke: design.borderColor, strokeOpacity: borderOp, strokeWidth: design.borderWidth * 2, strokeLinejoin: "round" }); }
  }
  var patternOverlay = null;
  var ringsClipDef = null;
  if (!isNone && design.pattern === "rings") {
    // Rings = single bullseye centered on the shape, clipped to the shape outline.
    var rSpacing = Math.max(1, Math.min(50, design.patternRingSpacing == null ? 6 : design.patternRingSpacing));
    var rLineW = design.patternLineWidth || 1.5;
    var rOpacity = design.patternOpacity == null ? 0.3 : design.patternOpacity;
    var rColor = design.patternColor || "#fff";
    var clipId = "ring-clip-" + size;
    var clipShape = isCircle
      ? React.createElement("circle", { cx: 50, cy: 50, r: 46 })
      : (isSquare && hasCorners)
        ? React.createElement("rect", { x: 4, y: 4, width: 92, height: 92, rx: cr, ry: cr })
        : React.createElement("path", { d: shapePath });
    ringsClipDef = React.createElement("clipPath", { id: clipId }, clipShape);
    var ringCircles = [], ringK = 0;
    // Outer max 70 covers the shape extent in the 100x100 viewBox; clip cuts what's outside.
    for (var ringR = 70; ringR > 0.5; ringR -= rSpacing) {
      ringCircles.push(React.createElement("circle", { key: ringK++, cx: 50, cy: 50, r: ringR, fill: "none", stroke: rColor, strokeWidth: rLineW, opacity: rOpacity }));
    }
    patternOverlay = React.createElement("g", { clipPath: "url(#" + clipId + ")" }, ringCircles);
  } else if (!isNone && design.pattern !== "none") {
    if (isCircle) { patternOverlay = React.createElement("circle", { cx: 50, cy: 50, r: 46, fill: "url(#" + patId + ")", stroke: "none" }); }
    else if (isSquare && hasCorners) { patternOverlay = React.createElement("rect", { x: 4, y: 4, width: 92, height: 92, rx: cr, ry: cr, fill: "url(#" + patId + ")", stroke: "none" }); }
    else { patternOverlay = React.createElement("path", { d: shapePath, fill: "url(#" + patId + ")", stroke: "none" }); }
  }
  var iconElement = null, iconGlowFilter = null, iconGlowPath = null;
  var iconDef = null;
  for (var ii = 0; ii < BD_ICONS.length; ii++) { if (BD_ICONS[ii].id === design.icon) { iconDef = BD_ICONS[ii]; break; } }
  if (iconDef && iconDef.path) {
    if (design.iconGlow) {
      var glowFilterId = "icon-glow-" + size;
      iconGlowFilter = React.createElement("filter", { id: glowFilterId }, React.createElement("feGaussianBlur", { stdDeviation: design.iconGlowIntensity || 4, result: "blur" }), React.createElement("feMerge", null, React.createElement("feMergeNode", { "in": "blur" }), React.createElement("feMergeNode", { "in": "SourceGraphic" })));
      iconGlowPath = React.createElement("path", { d: iconDef.path, fill: design.iconGlowColor || design.iconColor, fillRule: iconDef.fillRule || "evenodd", opacity: Math.min(1, (design.iconOpacity || 0.8) + 0.15), stroke: "none", filter: "url(#" + glowFilterId + ")" });
    }
    iconElement = React.createElement(React.Fragment, null, iconGlowPath, React.createElement("path", { d: iconDef.path, fill: design.iconColor, fillRule: iconDef.fillRule || "evenodd", opacity: design.iconOpacity, stroke: "none" }));
    if (iconDef.scale && iconDef.scale !== 1) { iconElement = React.createElement("g", { transform: "scale(" + iconDef.scale + ")" }, iconElement); }
    if (design.iconRotation) { iconElement = React.createElement("g", { transform: "rotate(" + design.iconRotation + " 50 50)" }, iconElement); }
  }
  var groupProps = {};
  if (hasRotation) { groupProps.transform = "rotate(" + design.shapeRotation + " 50 50)"; }
  return React.createElement("div", { style: Object.assign({ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }, glowStyle) },
    React.createElement("svg", { viewBox: "0 0 100 100", width: size, height: size, xmlns: "http://www.w3.org/2000/svg" },
      React.createElement("defs", null, React.createElement(PatternDef, { id: patId, patternId: design.pattern, color: design.patternColor, opacity: design.patternOpacity, scale: design.patternScale, rotation: design.patternRotation, filled: design.patternFilled, lineWidth: design.patternLineWidth, spacing: design.patternSpacing }), ringsClipDef, iconGlowFilter),
      React.createElement("g", groupProps, shapeElement, patternOverlay, iconElement)));
}

// ── BD UI Sub-Components ──
function HudIcon(props) {
  var type = props.type, color = props.color || "#889";
  var paths = {
    shape: React.createElement("path", { d: "M 10,2 L 18,6 L 18,14 L 10,18 L 2,14 L 2,6 Z", fill: "none", stroke: color, strokeWidth: 1.5, strokeLinejoin: "round" }),
    color: React.createElement("circle", { cx: 10, cy: 10, r: 7, fill: color, opacity: 0.9 }),
    border: React.createElement("rect", { x: 3, y: 3, width: 14, height: 14, rx: 2, fill: "none", stroke: color, strokeWidth: 2.5 }),
    pattern: React.createElement("g", { fill: color, opacity: 0.85 }, React.createElement("circle", { cx: 5, cy: 5, r: 1.8 }), React.createElement("circle", { cx: 10, cy: 5, r: 1.8 }), React.createElement("circle", { cx: 15, cy: 5, r: 1.8 }), React.createElement("circle", { cx: 5, cy: 10, r: 1.8 }), React.createElement("circle", { cx: 10, cy: 10, r: 1.8 }), React.createElement("circle", { cx: 15, cy: 10, r: 1.8 }), React.createElement("circle", { cx: 5, cy: 15, r: 1.8 }), React.createElement("circle", { cx: 10, cy: 15, r: 1.8 }), React.createElement("circle", { cx: 15, cy: 15, r: 1.8 })),
    icon: React.createElement("path", { d: "M 10,2 L 12.5,7.5 L 18,8 L 14,12 L 15,18 L 10,15 L 5,18 L 6,12 L 2,8 L 7.5,7.5 Z", fill: color, opacity: 0.85 }),
  };
  return React.createElement("svg", { viewBox: "0 0 20 20", width: 22, height: 22 }, paths[type] || null);
}

var HUD_TABS = [
  { id: "shape", label: "Shape", iconType: "shape" }, { id: "color", label: "Color", iconType: "color" },
  { id: "border", label: "Border", iconType: "border" }, { id: "pattern", label: "Pattern", iconType: "pattern" },
  { id: "icon", label: "Icon", iconType: "icon" },
];

function BDHudTabBar(props) {
  var active = props.active, onSelect = props.onSelect, lockedTabs = props.lockedTabs || {}, onLockedClick = props.onLockedClick;
  return React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 8 } },
    HUD_TABS.map(function(tab) {
      var selected = tab.id === active;
      var locked = !!lockedTabs[tab.id];
      var handleClick = locked ? onLockedClick : function() { onSelect(tab.id); };
      return React.createElement("button", { key: tab.id, onClick: handleClick, style: { flex: 1, padding: "10px 2px 8px", borderRadius: 8, border: selected ? "1px solid rgba(68,136,255,0.5)" : "1px solid rgba(255,255,255,0.06)", background: selected ? "rgba(68,136,255,0.15)" : "rgba(255,255,255,0.02)", color: selected ? "#88bbff" : "#667", fontSize: 10, fontFamily: "'Exo 2', sans-serif", fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, WebkitTapHighlightColor: "transparent", textTransform: "uppercase", letterSpacing: 0.5, transition: "all 0.15s ease", opacity: locked ? 0.3 : 1 } },
        React.createElement(HudIcon, { type: tab.iconType, color: selected ? "#88bbff" : "#556" }),
        React.createElement("span", null, tab.label));
    }));
}

function BDColorPicker(props) {
  var value = props.value, onChange = props.onChange, label = props.label, presets = props.presets;
  return React.createElement("div", { style: { marginBottom: 12 } },
    label && React.createElement("div", { style: { fontSize: 13, color: "#889", marginBottom: 6, fontFamily: "'Exo 2', sans-serif" } }, label),
    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
      React.createElement("input", { type: "color", value: value, onChange: function(e) { onChange(e.target.value); }, style: { width: 44, height: 44, border: "2px solid rgba(255,255,255,0.15)", borderRadius: 8, background: "none", cursor: "pointer", padding: 2, fontSize: 16 } }),
      presets && React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", flex: 1 } },
        presets.map(function(c) {
          return React.createElement("button", { key: c, onClick: function() { onChange(c); }, style: { width: 28, height: 28, borderRadius: 6, background: c, border: value === c ? "2px solid #fff" : "2px solid rgba(255,255,255,0.1)", cursor: "pointer", padding: 0, WebkitTapHighlightColor: "transparent" } });
        }))));
}

function BDSlider(props) {
  var value = props.value, onChange = props.onChange, min = props.min, max = props.max, step = props.step || 1, label = props.label, displayValue = props.displayValue;
  // Tap the displayed value to type a number directly; commit clamps to
  // [min, max]. Available everywhere BDSlider is used (Block Designer, VFX,
  // UFO, Hangar). Enter commits, Escape cancels.
  var _ed = useState(false), editing = _ed[0], setEditing = _ed[1];
  var _ev = useState(""), editValue = _ev[0], setEditValue = _ev[1];
  function commitEdit() {
    var n = parseFloat(editValue);
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
    setEditing(false);
  }
  function cancelEdit() { setEditing(false); }
  return React.createElement("div", { style: { marginBottom: 12 } },
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#889", marginBottom: 4, fontFamily: "'Exo 2', sans-serif" } },
      React.createElement("span", null, label),
      editing
        ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4 } },
            React.createElement("input", {
              type: "text", value: editValue, autoFocus: true,
              onChange: function(e) { setEditValue(e.target.value); },
              onKeyDown: function(e) { if (e.key === "Enter") commitEdit(); else if (e.key === "Escape") cancelEdit(); },
              style: { width: 64, padding: "2px 6px", fontSize: 16, fontFamily: "'Exo 2', sans-serif", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(128,221,255,0.5)", color: "#bbc", borderRadius: 4, outline: "none", textAlign: "right" }
            }),
            React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: commitEdit,
              title: "Confirm",
              style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)" } },
              React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24" },
                React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
            React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: cancelEdit,
              title: "Cancel",
              style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", background: "rgba(220,60,80,0.18)", border: "1px solid rgba(220,60,80,0.45)" } },
              React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24" },
                React.createElement("path", { d: "M6 6L18 18 M18 6L6 18", fill: "none", stroke: "#ff8088", strokeWidth: "2.5", strokeLinecap: "round" }))))
        : React.createElement("span", { onClick: function() { setEditValue(String(value)); setEditing(true); },
            title: "Tap to type a value",
            style: { color: "#bbc", cursor: "pointer", padding: "2px 6px", borderRadius: 4, userSelect: "none" } },
            displayValue != null ? displayValue : value)),
    React.createElement("input", { type: "range", min: min, max: max, step: step, value: value, onChange: function(e) { onChange(parseFloat(e.target.value)); }, style: { width: "100%", fontSize: 16 } }));
}

function BDToggle(props) {
  var value = props.value, onChange = props.onChange, label = props.label;
  return React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
    React.createElement("span", { style: { fontSize: 13, color: "#889", fontFamily: "'Exo 2', sans-serif" } }, label),
    React.createElement("button", { onClick: function() { onChange(!value); }, style: { width: 48, height: 28, borderRadius: 14, border: "none", background: value ? "#4488ff" : "rgba(255,255,255,0.15)", position: "relative", cursor: "pointer", transition: "background 0.2s", WebkitTapHighlightColor: "transparent", padding: 0 } },
      React.createElement("div", { style: { width: 22, height: 22, borderRadius: 11, background: "#fff", position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s" } })));
}

function BDOptionGrid(props) {
  var options = props.options, value = props.value, onChange = props.onChange, columns = props.columns || 4;
  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(" + columns + ", 1fr)", gap: 6, marginBottom: 12 } },
    options.map(function(opt) {
      var selected = opt.id === value;
      return React.createElement("button", { key: opt.id, onClick: function() { onChange(opt.id); }, style: { padding: "10px 4px", borderRadius: 8, border: selected ? "2px solid #4488ff" : "2px solid rgba(255,255,255,0.06)", background: selected ? "rgba(68,136,255,0.12)" : "rgba(255,255,255,0.02)", color: selected ? "#88bbff" : "#778", fontSize: 12, fontFamily: "'Exo 2', sans-serif", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, WebkitTapHighlightColor: "transparent" } },
        opt.icon && React.createElement("span", { style: { fontSize: 20 } }, opt.icon),
        React.createElement("span", null, opt.label));
    }));
}


// ═══════════════════════════════════════════════════════════════
// SHARED UI STYLES
// ═══════════════════════════════════════════════════════════════

// Unified button style for list cards
var BTN_BASE = { borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Quicksand',sans-serif" };
var BTN_EDIT = Object.assign({}, BTN_BASE, { padding: "5px 12px", background: PNL, border: "1px solid rgba(80,200,255,0.3)", color: "#80ddff", display: "flex", alignItems: "center", gap: 5 });
var BTN_RENAME = Object.assign({}, BTN_BASE, { padding: "5px 10px", background: PNL, border: PNLB, color: "rgba(200,210,220,0.6)", display: "flex", alignItems: "center", gap: 5 });
var BTN_EXPORT = Object.assign({}, BTN_BASE, { padding: "5px 10px", background: PNL, border: "1px solid rgba(200,184,255,0.3)", color: "#c8b8ff", display: "flex", alignItems: "center", gap: 5 });
var BTN_DELETE_ICON = Object.assign({}, BTN_BASE, { padding: "5px 8px", background: "rgba(80,20,20,0.4)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff8866", display: "flex", alignItems: "center", justifyContent: "center" });
function WsIconPencil(sz) { var s = sz || 11; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.3", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), React.createElement("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })); }
function WsIconCopy(sz) { var s = sz || 11; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.3", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2" }), React.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })); }
function WsIconShare(sz) { var s = sz || 11; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.3", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" }), React.createElement("polyline", { points: "16 6 12 2 8 6" }), React.createElement("line", { x1: "12", y1: "2", x2: "12", y2: "15" })); }
function WsIconTrash(sz) { var s = sz || 12; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("polyline", { points: "3 6 5 6 21 6" }), React.createElement("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }), React.createElement("path", { d: "M10 11v6M14 11v6" }), React.createElement("path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" })); }
function WsIconReset(sz) { var s = sz || 11; return React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.3", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("polyline", { points: "1 4 1 10 7 10" }), React.createElement("path", { d: "M3.51 15a9 9 0 1 0 .49-5.07" })); }
var BTN_TOPBAR = Object.assign({}, BTN_BASE, { padding: "6px 8px", borderRadius: 4, background: PNL, border: PNLB, color: "rgba(200,210,220,0.8)", fontSize: 9, letterSpacing: 1, boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" });
var BTN_TOPBAR_ACCENT = Object.assign({}, BTN_TOPBAR, { border: "2px solid rgba(80,200,255,0.3)", color: "#80ddff" });
var BTN_TOPBAR_PURPLE = Object.assign({}, BTN_TOPBAR, { border: "1px solid rgba(200,184,255,0.3)", color: "#c8b8ff" });
var BTN_SAVE = Object.assign({}, BTN_TOPBAR, { background: "linear-gradient(180deg, #2a5a3a, #1a3a28)", border: "2px solid rgba(80,200,100,0.4)", color: "#80dd90" });
var BTN_PLAY = Object.assign({}, BTN_BASE, { padding: "5px 12px", background: "linear-gradient(180deg, #2a5a3a, #1a3a28)", border: "1px solid rgba(80,200,100,0.45)", color: "#80dd90" });
var BTN_SETACTIVE = Object.assign({}, BTN_BASE, { padding: "5px 10px", background: PNL, border: "1px solid rgba(120,200,140,0.4)", color: "rgba(150,220,170,0.8)" });
var BTN_ISACTIVE = Object.assign({}, BTN_BASE, { padding: "5px 10px", background: "linear-gradient(180deg, #2a5a3a, #1a3a28)", border: "1px solid rgba(80,220,120,0.7)", color: "#80dd90" });
var BTN_PLAYSET = Object.assign({}, BTN_BASE, { padding: "5px 12px", background: "linear-gradient(180deg, #2a2000, #1a1400)", border: "1px solid rgba(255,208,96,0.6)", color: "#ffd060", display: "flex", alignItems: "center", gap: 5 });

// Navigate to the game, optionally auto-playing a custom level by id.
function navigateToGame(levelId) {
  var url = "index.html";
  if (levelId != null) url = url + "?play=" + encodeURIComponent(levelId);
  window.location.href = url;
}

// Unified card style for list items
var CARD_STYLE = { background: "rgba(20,20,35,0.6)", border: "1px solid rgba(60,60,80,0.4)", borderRadius: 8, padding: "10px 12px", marginBottom: 8 };

// Overlay background
var OVERLAY_BG = { position: "fixed", inset: 0, zIndex: 500, background: "rgba(5,5,20,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" };
// Import/export "cards" use the workshop's brushed-metal texture so the
// dialogs feel like part of the same cockpit chassis as the panels behind.
var OVERLAY_BOX = { background: "linear-gradient(180deg, #3a4250 0%, #2c333f 35%, #1f2530 70%, #1a1f2a 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)", backgroundBlendMode: "overlay", borderRadius: 16, padding: "20px 24px", textAlign: "center", maxWidth: 300, animation: "introFadeIn 0.25s ease-out", boxShadow: "inset 0 1px 0 rgba(200,230,240,0.10), inset 0 -2px 4px rgba(0,0,0,0.55), 0 6px 18px rgba(0,0,0,0.5)" };

// ═══════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════

var LEVEL_STORAGE_KEY = "cosmic_drift_levels";

var SAMPLE_LEVEL = {
  id: "sample_001",
  name: "First Contact",
  grid: [
    0,0,7,0,0,7,0,0,
    1,2,1,0,0,1,2,1,
    1,1,5,1,1,5,1,1,
    0,1,1,3,3,1,1,0,
    0,0,1,9,9,1,0,0,
    0,0,0,1,1,0,0,0
  ],
  shipStart: 3,
  startPlasma: 10,
  created: 1717200000000,
  modified: 1717200000000,
  savedAt: "Sample Level",
  isSample: true
};

// ── Active Loadout mini-preview helpers ──
// Tiny pixel-grid preview of a saved level's block layout.
function renderGridMiniPreview(level, accent) {
  var w = 54, h = 40;
  var grid = level && level.grid;
  var border = "1px solid " + (accent || "rgba(128,221,255,0.25)");
  if (!grid || grid.length !== COLS * ROWS) {
    return React.createElement("div", { style: { width: w, height: h, background: "rgba(80,200,255,0.04)", borderRadius: 2, border: border, margin: "0 auto" } });
  }
  var cells = [];
  for (var i = 0; i < grid.length; i++) {
    var bt = grid[i];
    var bc = BLOCK_COLORS[bt];
    cells.push(React.createElement("div", { key: i, style: { background: bc ? bc.bg : "transparent" } }));
  }
  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(" + COLS + ", 1fr)", gridTemplateRows: "repeat(" + ROWS + ", 1fr)", gap: 0, width: w, height: h, margin: "0 auto", borderRadius: 2, overflow: "hidden", border: border } }, cells);
}
function truncLabel(s) {
  if (!s) return "";
  if (s.length <= 8) return s;
  return s.slice(0, 8).trim() + "...";
}
// 3x3 grid of tiny BDBlockPreview thumbnails - one per playable block type
// (Extra Core is omitted so the 9 remaining types fit a clean 3x3).
function renderBlocksSetPreview(activeMap, savedDesigns) {
  var items = [];
  var types = [1, 2, 3, 5, 6, 7, 8, 9, 10];
  for (var i = 0; i < types.length; i++) {
    var design = bdResolveActiveDesign(types[i], activeMap, savedDesigns);
    if (design) items.push(React.createElement("div", { key: types[i], style: { width: 18, height: 18, overflow: "hidden" } }, React.createElement(BDBlockPreview, { design: design, size: 18 })));
  }
  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 18px)", gap: 2, width: 58, margin: "0 auto" } }, items);
}
// Compact stylized icon per VFX effect type — captures the visual signature
// of each effect (acid drip / flame / spark burst / explosion ring) using the
// active design's colors so each row personalizes to the player's loadout.
function renderVfxMini(effectType, design) {
  var d = design || {};
  if (effectType === "acid_ooze") {
    var c1 = d.color1 || "#1a6a1a", c2 = d.color2 || "#35a035";
    return React.createElement("svg", { width: 28, height: 28, viewBox: "0 0 22 22" },
      React.createElement("rect", { x: 4, y: 2, width: 14, height: 4, rx: 1, fill: c1, stroke: c2, strokeWidth: 0.6 }),
      React.createElement("path", { d: "M6 7 Q9 10 6 13 Q9 16 6 19 L 16 19 Q 13 16 16 13 Q 13 10 16 7 Z", fill: c2 }),
      React.createElement("ellipse", { cx: 11, cy: 20, rx: 7, ry: 1.4, fill: c2, opacity: 0.7 }));
  }
  if (effectType === "burn") {
    var emC = d.emberColor || "#ff6633", spC = d.sparkColor || "#ffffff";
    return React.createElement("svg", { width: 28, height: 28, viewBox: "0 0 22 22" },
      React.createElement("path", { d: "M11 2 Q5 8 7 14 Q3 15 5.5 19 Q11 22 13 17 Q19 19 17 13 Q14.5 10 16 5 Q13 9 11 2 Z", fill: emC }),
      React.createElement("circle", { cx: 15, cy: 8, r: 1.3, fill: spC, opacity: 0.9 }));
  }
  if (effectType === "block_destroy") {
    var bsC = d.burstColor || "#c8b8ff", acC = d.accentColor || "#80ddff";
    return React.createElement("svg", { width: 28, height: 28, viewBox: "0 0 22 22" },
      React.createElement("path", { d: "M11 1 L12.4 9.6 L21 11 L12.4 12.4 L11 21 L9.6 12.4 L1 11 L9.6 9.6 Z", fill: bsC }),
      React.createElement("circle", { cx: 11, cy: 11, r: 2.6, fill: acC, opacity: 0.85 }));
  }
  if (effectType === "drone_explode") {
    var coreC = d.coreColor || "#ffe066", blastC = d.blastColor || "#ff6633";
    var dots = [];
    for (var i = 0; i < 6; i++) {
      var a = (i * 60) * Math.PI / 180;
      dots.push(React.createElement("circle", { key: i, cx: 11 + Math.cos(a) * 7.5, cy: 11 + Math.sin(a) * 7.5, r: 1.7, fill: blastC }));
    }
    return React.createElement("svg", { width: 28, height: 28, viewBox: "0 0 22 22" },
      React.createElement("circle", { cx: 11, cy: 11, r: 9.5, fill: blastC, opacity: 0.18 }),
      dots,
      React.createElement("circle", { cx: 11, cy: 11, r: 3.5, fill: coreC }));
  }
  return null;
}
// 2x2 grid of effect mini-previews, one per VFX type, using the active design's colors.
function renderVfxSetPreview(activeMap, savedDesigns) {
  var types = ["acid_ooze", "burn", "block_destroy", "drone_explode"];
  var items = types.map(function(t) {
    var d = vfxResolveActive(t, activeMap, savedDesigns);
    return React.createElement("div", { key: t, style: { display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28 } }, renderVfxMini(t, d));
  });
  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 28px)", gap: 3, width: 59, margin: "0 auto" } }, items);
}

function renderPlasmaSingle(design, size) {
  var color = design.color || "#50c8ff";
  var colorMode = design.colorMode || "radial";
  var glowColor = design.glowColor || "#80ddff";
  var glowSize = (design.glowSize != null ? design.glowSize : 8) * 0.6;
  var opacity = design.colorOpacity != null ? design.colorOpacity : 1.0;
  var shape = design.shape || "circle";
  var glow2 = "0 0 " + glowSize + "px " + glowColor + ", 0 0 " + (glowSize * 2) + "px " + glowColor + "44";
  var bg;
  if (colorMode === "standard") {
    bg = color;
  } else if (colorMode === "linear") {
    if (shape === "blast") {
      bg = "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 12%, " + color + " 42%, rgba(0,0,0,0.65) 100%)";
    } else {
      bg = "linear-gradient(145deg, rgba(255,255,255,0.75) 0%, " + color + " 55%, rgba(0,0,0,0.65) 100%)";
    }
  } else {
    if (shape === "circle") {
      bg = "radial-gradient(circle at 38% 33%, #fff 0%, " + color + " 45%, rgba(0,0,0,0.7) 100%)";
    } else if (shape === "blast") {
      bg = "radial-gradient(ellipse at 50% 20%, #fff 0%, " + color + " 38%, rgba(0,0,0,0.7) 85%)";
    } else {
      bg = "radial-gradient(ellipse at 42% 28%, #fff 0%, " + color + " 45%, rgba(0,0,0,0.7) 100%)";
    }
  }
  if (shape === "circle") {
    return React.createElement("div", { style: { width: size, height: size, borderRadius: "50%", background: bg, boxShadow: glow2, opacity: opacity } });
  }
  if (shape === "blast") {
    var bw = Math.round(size * 0.18);
    return React.createElement("div", { style: { width: bw, height: size, borderRadius: 0, background: bg, boxShadow: glow2, opacity: opacity } });
  }
  // torpedo
  var tw = Math.round(size * 0.65);
  return React.createElement("div", { style: { width: tw, height: size, borderRadius: (tw / 2) + "px " + (tw / 2) + "px " + Math.round(tw * 0.15) + "px " + Math.round(tw * 0.15) + "px", background: bg, boxShadow: glow2, opacity: opacity } });
}
function renderPlasmaShape(design, size) {
  if (design && design.splitEnabled) {
    var ss = Math.round(size * 0.68);
    var sg = Math.round(size * 0.14);
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: sg } },
      renderPlasmaSingle(design, ss),
      renderPlasmaSingle(design, ss));
  }
  return renderPlasmaSingle(design, size);
}

// ── Workshop cockpit design tokens + helpers ──
var WS = {
  brushed: "linear-gradient(180deg, #3a4250 0%, #2c333f 35%, #1f2530 70%, #1a1f2a 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)",
  inset: "linear-gradient(180deg, #060810 0%, #0a0e16 60%, #050810 100%)",
  pb: "1px solid #404a58",
  ps: "inset 0 1px 0 rgba(200,230,240,0.10), inset 0 -2px 4px rgba(0,0,0,0.55), 0 3px 6px rgba(0,0,0,0.5)",
  ib: "1px solid #14202e", is: "inset 0 2px 8px rgba(0,0,0,0.7)",
  green: "#50ffae",
};
function WsRivet(pos) { return null; }
function WsPanel(props) {
  var isInset = props.inset;
  var noRivets = props.riveted === false || isInset;
  return React.createElement("div", { onClick: props.onClick, style: Object.assign({ position: "relative", background: isInset ? WS.inset : WS.brushed, backgroundBlendMode: isInset ? "normal" : "overlay", border: isInset ? WS.ib : WS.pb, borderRadius: 10, boxShadow: isInset ? WS.is : WS.ps }, props.style || {}) },
    !noRivets && React.createElement(React.Fragment, null, WsRivet({ top: 5, left: 5 }), WsRivet({ top: 5, right: 5 }), WsRivet({ bottom: 5, left: 5 }), WsRivet({ bottom: 5, right: 5 })),
    props.children
  );
}
function WsLED(props) {
  var color = props.color || WS.green;
  var sz = props.size || 6;
  var on = props.on !== false;
  return React.createElement("span", { style: { display: "inline-block", width: sz, height: sz, borderRadius: sz, background: on ? "radial-gradient(circle at 35% 30%, " + color + ", " + color + "aa 60%, " + color + "33 100%)" : "rgba(80,90,100,0.3)", boxShadow: on ? "0 0 8px " + color : "none", flexShrink: 0 } });
}
function WsMono(props) {
  return React.createElement("span", { style: Object.assign({ fontFamily: "'JetBrains Mono', monospace", fontSize: props.size || 8, letterSpacing: props.ls !== undefined ? props.ls : 2, color: props.color || "rgba(200,220,240,0.55)", textTransform: "uppercase" }, props.style || {}) }, props.children);
}

// ═══════════════════════════════════════════════════════════════
// MAIN WORKSHOP COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CosmicWorkshop() {
  // ── Screen state ──
  var _scr = useState("splash"), screen = _scr[0], setScreen = _scr[1];

  // ── Splash transition state ──
  var _spTr = useState(null), splashTransition = _spTr[0], setSplashTransition = _spTr[1];
  var _spEn = useState(function() { try { return sessionStorage.getItem("cd_transition_from") === "game"; } catch(e) { return false; } }), splashEntering = _spEn[0], setSplashEntering = _spEn[1];
  var splashTouchRef = useRef(null);
  var _splashRowH = useState(0), splashRowH = _splashRowH[0], setSplashRowH = _splashRowH[1];
  var splashRowRef = useRef(null);
  useEffect(function() { if (splashRowRef.current) setSplashRowH(splashRowRef.current.offsetHeight); }, []);

  // ══ BLOCK DESIGNER STATE ══
  var _bdDesign = useState(function() { return bdDefaultDesign(); }), bdDesign = _bdDesign[0], setBdDesign = _bdDesign[1];
  // Undo/redo: stack of bdDesign snapshots. coalesceKey + lastTime collapse
  // continuous edits (slider scrubs, color drags) into a single history step
  // so one Undo reverts the whole drag rather than each frame of it.
  var bdHistoryRef = useRef({ stack: [], idx: -1, lastKey: null, lastTime: 0 });
  var _bdHistVersion = useState(0), bdHistVersion = _bdHistVersion[0], setBdHistVersion = _bdHistVersion[1];
  var _bdSaved = useState([]), bdSaved = _bdSaved[0], setBdSaved = _bdSaved[1];
  var _bdActive = useState({}), bdActiveMap = _bdActive[0], setBdActiveMap = _bdActive[1];
  var _bdEditId = useState(null), bdEditId = _bdEditId[0], setBdEditId = _bdEditId[1];
  var _bdActivePanel = useState(null), bdActivePanel = _bdActivePanel[0], setBdActivePanel = _bdActivePanel[1];
  var _bdPhase = useState(1), bdPhase = _bdPhase[0], setBdPhase = _bdPhase[1];
  var _bdSavedTab = useState("custom"), bdSavedTab = _bdSavedTab[0], setBdSavedTab = _bdSavedTab[1];
  var _bdView = useState("list"), bdCurrentView = _bdView[0], setBdCurrentView = _bdView[1];
  var _bdStatus = useState(""), bdSaveStatus = _bdStatus[0], setBdSaveStatus = _bdStatus[1];
  var _bdDirty = useState(false), bdDirty = _bdDirty[0], setBdDirty = _bdDirty[1];
  var _bdSortMode = useState("date_new"), bdSortMode = _bdSortMode[0], setBdSortMode = _bdSortMode[1];
  var _bdRenamingId = useState(null), bdRenamingId = _bdRenamingId[0], setBdRenamingId = _bdRenamingId[1];
  var _bdRenamingName = useState(""), bdRenamingName = _bdRenamingName[0], setBdRenamingName = _bdRenamingName[1];
  var _bdDeletingId = useState(null), bdDeletingId = _bdDeletingId[0], setBdDeletingId = _bdDeletingId[1];
  var _bdExportId = useState(null), bdExportId = _bdExportId[0], setBdExportId = _bdExportId[1];
  var _bdExportText = useState(""), bdExportText = _bdExportText[0], setBdExportText = _bdExportText[1];
  var _bdCopied = useState(false), bdCopied = _bdCopied[0], setBdCopied = _bdCopied[1];
  var _bdShowExportAll = useState(false), bdShowExportAll = _bdShowExportAll[0], setBdShowExportAll = _bdShowExportAll[1];
  var _bdExportAllText = useState(""), bdExportAllText = _bdExportAllText[0], setBdExportAllText = _bdExportAllText[1];
  var _bdShowImport = useState(false), bdShowImport = _bdShowImport[0], setBdShowImport = _bdShowImport[1];
  var _bdImportText = useState(""), bdImportText = _bdImportText[0], setBdImportText = _bdImportText[1];
  var _bdImportError = useState(""), bdImportError = _bdImportError[0], setBdImportError = _bdImportError[1];
  var _bdImportConfirm = useState(null), bdImportConfirm = _bdImportConfirm[0], setBdImportConfirm = _bdImportConfirm[1];
  var _bdBackWarn = useState(false), bdShowBackWarn = _bdBackWarn[0], setBdShowBackWarn = _bdBackWarn[1];
  // ══ VFX STUDIO STATE ══
  var _vfxSaved = useState([]), vfxSaved = _vfxSaved[0], setVfxSaved = _vfxSaved[1];
  var _vfxActive = useState({}), vfxActiveMap = _vfxActive[0], setVfxActiveMap = _vfxActive[1];
  var _vfxView = useState("list"), vfxCurrentView = _vfxView[0], setVfxCurrentView = _vfxView[1];
  var _vfxSavedTab = useState("custom"), vfxSavedTab = _vfxSavedTab[0], setVfxSavedTab = _vfxSavedTab[1];
  var _vfxSortMode = useState("date_new"), vfxSortMode = _vfxSortMode[0], setVfxSortMode = _vfxSortMode[1];
  var _ufoSortMode = useState("date_new"), ufoSortMode = _ufoSortMode[0], setUfoSortMode = _ufoSortMode[1];
  var _shipSortMode = useState("date_new"), shipSortMode = _shipSortMode[0], setShipSortMode = _shipSortMode[1];
  var _plasmaSortMode = useState("date_new"), plasmaSortMode = _plasmaSortMode[0], setPlasmaSortMode = _plasmaSortMode[1];
  var _setsSortMode = useState("date_new"), setsSortMode = _setsSortMode[0], setSetsSortMode = _setsSortMode[1];
  var _vfxEditDesign = useState(function() { return vfxDefaultDesign(null); }), vfxEditDesign = _vfxEditDesign[0], setVfxEditDesign = _vfxEditDesign[1];
  // Undo/redo (same pattern as BD: see bdHistoryPush comment for details).
  var vfxHistoryRef = useRef({ stack: [], idx: -1, lastKey: null, lastTime: 0 });
  var _vfxHistVersion = useState(0), vfxHistVersion = _vfxHistVersion[0], setVfxHistVersion = _vfxHistVersion[1];
  var _vfxEditId = useState(null), vfxEditId = _vfxEditId[0], setVfxEditId = _vfxEditId[1];
  var _vfxDirty = useState(false), vfxDirty = _vfxDirty[0], setVfxDirty = _vfxDirty[1];
  var _vfxPrevKey = useState(0), vfxPrevKey = _vfxPrevKey[0], setVfxPrevKey = _vfxPrevKey[1];
  var _vfxSaveStatus = useState(""), vfxSaveStatus = _vfxSaveStatus[0], setVfxSaveStatus = _vfxSaveStatus[1];
  var _vfxRenamingId = useState(null), vfxRenamingId = _vfxRenamingId[0], setVfxRenamingId = _vfxRenamingId[1];
  var _vfxRenamingName = useState(""), vfxRenamingName = _vfxRenamingName[0], setVfxRenamingName = _vfxRenamingName[1];
  var _vfxDeletingId = useState(null), vfxDeletingId = _vfxDeletingId[0], setVfxDeletingId = _vfxDeletingId[1];
  var _vfxExportId = useState(null), vfxExportId = _vfxExportId[0], setVfxExportId = _vfxExportId[1];
  var _vfxExportText = useState(""), vfxExportText = _vfxExportText[0], setVfxExportText = _vfxExportText[1];
  var _vfxCopied = useState(false), vfxCopied = _vfxCopied[0], setVfxCopied = _vfxCopied[1];
  var _vfxShowExportAll = useState(false), vfxShowExportAll = _vfxShowExportAll[0], setVfxShowExportAll = _vfxShowExportAll[1];
  var _vfxExportAllText = useState(""), vfxExportAllText = _vfxExportAllText[0], setVfxExportAllText = _vfxExportAllText[1];
  var _vfxShowImport = useState(false), vfxShowImport = _vfxShowImport[0], setVfxShowImport = _vfxShowImport[1];
  var _vfxImportText = useState(""), vfxImportText = _vfxImportText[0], setVfxImportText = _vfxImportText[1];
  var _vfxImportError = useState(""), vfxImportError = _vfxImportError[0], setVfxImportError = _vfxImportError[1];
  var _vfxBackWarn = useState(false), vfxShowBackWarn = _vfxBackWarn[0], setVfxShowBackWarn = _vfxBackWarn[1];
  // ══ UFO CUSTOMIZER STATE ══
  var _ufoSaved = useState([]), ufoSaved = _ufoSaved[0], setUfoSaved = _ufoSaved[1];
  var _ufoActiveId = useState(null), ufoActiveId = _ufoActiveId[0], setUfoActiveId = _ufoActiveId[1];
  var _ufoView = useState("list"), ufoView = _ufoView[0], setUfoView = _ufoView[1];
  var _ufoEditDesign = useState(function() { return Object.assign({}, UFO_DEFAULT_DESIGN, { name: "" }); }), ufoEditDesign = _ufoEditDesign[0], setUfoEditDesign = _ufoEditDesign[1];
  var _ufoEditId = useState(null), ufoEditId = _ufoEditId[0], setUfoEditId = _ufoEditId[1];
  var ufoHistoryRef = useRef({ stack: [], idx: -1, lastKey: null, lastTime: 0 });
  var _ufoHistVersion = useState(0), ufoHistVersion = _ufoHistVersion[0], setUfoHistVersion = _ufoHistVersion[1];
  var _ufoSaveStatus = useState(""), ufoSaveStatus = _ufoSaveStatus[0], setUfoSaveStatus = _ufoSaveStatus[1];
  var _ufoDeletingId = useState(null), ufoDeletingId = _ufoDeletingId[0], setUfoDeletingId = _ufoDeletingId[1];
  var _ufoRenamingId = useState(null), ufoRenamingId = _ufoRenamingId[0], setUfoRenamingId = _ufoRenamingId[1];
  var _ufoRenameValue = useState(""), ufoRenameValue = _ufoRenameValue[0], setUfoRenameValue = _ufoRenameValue[1];
  var _ufoBackWarn = useState(false), ufoShowBackWarn = _ufoBackWarn[0], setUfoShowBackWarn = _ufoBackWarn[1];
  var _ufoShowImport = useState(false), ufoShowImport = _ufoShowImport[0], setUfoShowImport = _ufoShowImport[1];
  var _ufoImportText = useState(""), ufoImportText = _ufoImportText[0], setUfoImportText = _ufoImportText[1];
  var _ufoImportError = useState(""), ufoImportError = _ufoImportError[0], setUfoImportError = _ufoImportError[1];
  var _ufoExportId = useState(null), ufoExportId = _ufoExportId[0], setUfoExportId = _ufoExportId[1];
  var _ufoExportText = useState(""), ufoExportText = _ufoExportText[0], setUfoExportText = _ufoExportText[1];
  var _ufoCopied = useState(false), ufoCopied = _ufoCopied[0], setUfoCopied = _ufoCopied[1];
  var ufoEditDirtyRef = useRef(false);
  // ══ HANGAR STATE ══
  var _shipSaved = useState([]), shipSaved = _shipSaved[0], setShipSaved = _shipSaved[1];
  var _shipActiveId = useState(null), shipActiveId = _shipActiveId[0], setShipActiveId = _shipActiveId[1];
  var _shipView = useState("list"), shipView = _shipView[0], setShipView = _shipView[1];
  // Editor sub-tabs: "templates" (load a preset), "add" (add a new part),
  // "color" (fill + border for selected part), "position" (geometry for
  // selected part), "list" (parts list with select/copy/delete).
  var _shipTab = useState("list"), shipTab = _shipTab[0], setShipTab = _shipTab[1];
  var _shipEdit = useState(function() { return Object.assign({}, SHIP_DEFAULT_DESIGN, { name: "" }); }), shipEdit = _shipEdit[0], setShipEdit = _shipEdit[1];
  var _shipEditId = useState(null), shipEditId = _shipEditId[0], setShipEditId = _shipEditId[1];
  var shipHistoryRef = useRef({ stack: [], idx: -1, lastKey: null, lastTime: 0 });
  var _shipHistVersion = useState(0), shipHistVersion = _shipHistVersion[0], setShipHistVersion = _shipHistVersion[1];
  var _shipSaveStatus = useState(""), shipSaveStatus = _shipSaveStatus[0], setShipSaveStatus = _shipSaveStatus[1];
  var _shipDeletingId = useState(null), shipDeletingId = _shipDeletingId[0], setShipDeletingId = _shipDeletingId[1];
  var _shipBackWarn = useState(false), shipShowBackWarn = _shipBackWarn[0], setShipShowBackWarn = _shipBackWarn[1];
  var _shipExportId = useState(null), shipExportId = _shipExportId[0], setShipExportId = _shipExportId[1];
  var _shipExportText = useState(""), shipExportText = _shipExportText[0], setShipExportText = _shipExportText[1];
  var _shipCopied = useState(false), shipCopied = _shipCopied[0], setShipCopied = _shipCopied[1];
  var _shipShowImport = useState(false), shipShowImport = _shipShowImport[0], setShipShowImport = _shipShowImport[1];
  var _shipImportText = useState(""), shipImportText = _shipImportText[0], setShipImportText = _shipImportText[1];
  var _shipImportError = useState(""), shipImportError = _shipImportError[0], setShipImportError = _shipImportError[1];
  var _shipPvSize = useState(128), shipPreviewSize = _shipPvSize[0], setShipPreviewSize = _shipPvSize[1];
  var _shipPvFull = useState(false), shipPreviewFull = _shipPvFull[0], setShipPreviewFull = _shipPvFull[1];
  var shipResizeDragRef = useRef(null);
  var shipPreviewStickyRef = useRef(null);
  var _shipRenamingId = useState(null), shipRenamingId = _shipRenamingId[0], setShipRenamingId = _shipRenamingId[1];
  var _shipRenameValue = useState(""), shipRenameValue = _shipRenameValue[0], setShipRenameValue = _shipRenameValue[1];
  var _shipPartRenamingIdx = useState(null), shipPartRenamingIdx = _shipPartRenamingIdx[0], setShipPartRenamingIdx = _shipPartRenamingIdx[1];
  var _shipPartRenameVal = useState(""), shipPartRenameVal = _shipPartRenameVal[0], setShipPartRenameVal = _shipPartRenameVal[1];
  var _shipResetConfirm = useState(false), shipResetConfirm = _shipResetConfirm[0], setShipResetConfirm = _shipResetConfirm[1];
  // ══ PLASMA LAB STATE ══
  var _plasmaSaved = useState([]), plasmaSaved = _plasmaSaved[0], setPlasmaSaved = _plasmaSaved[1];
  var _plasmaActiveId = useState(null), plasmaActiveId = _plasmaActiveId[0], setPlasmaActiveId = _plasmaActiveId[1];
  var _plasmaView = useState("list"), plasmaView = _plasmaView[0], setPlasmaView = _plasmaView[1];
  var _plasmaEditDesign = useState(function() { return Object.assign({}, PLASMA_DEFAULT_DESIGN, { name: "" }); }), plasmaEditDesign = _plasmaEditDesign[0], setPlasmaEditDesign = _plasmaEditDesign[1];
  var _plasmaEditId = useState(null), plasmaEditId = _plasmaEditId[0], setPlasmaEditId = _plasmaEditId[1];
  var plasmaEditDirtyRef = useRef(false);
  var plasmaHistoryRef = useRef({ stack: [], idx: -1, lastKey: null, lastTime: 0 });
  var _plasmaHistVersion = useState(0), setPlasmaHistVersion = _plasmaHistVersion[1];
  var _plasmaSaveStatus = useState(""), plasmaSaveStatus = _plasmaSaveStatus[0], setPlasmaSaveStatus = _plasmaSaveStatus[1];
  var _plasmaDeletingId = useState(null), plasmaDeletingId = _plasmaDeletingId[0], setPlasmaDeletingId = _plasmaDeletingId[1];
  var _plasmaRenamingId = useState(null), plasmaRenamingId = _plasmaRenamingId[0], setPlasmaRenamingId = _plasmaRenamingId[1];
  var _plasmaRenameValue = useState(""), plasmaRenameValue = _plasmaRenameValue[0], setPlasmaRenameValue = _plasmaRenameValue[1];
  var _plasmaExportId = useState(null), plasmaExportId = _plasmaExportId[0], setPlasmaExportId = _plasmaExportId[1];
  var _plasmaExportText = useState(""), plasmaExportText = _plasmaExportText[0], setPlasmaExportText = _plasmaExportText[1];
  var _plasmaCopied = useState(false), plasmaCopied = _plasmaCopied[0], setPlasmaCopied = _plasmaCopied[1];
  var _plasmaShowImport = useState(false), plasmaShowImport = _plasmaShowImport[0], setPlasmaShowImport = _plasmaShowImport[1];
  var _plasmaImportText = useState(""), plasmaImportText = _plasmaImportText[0], setPlasmaImportText = _plasmaImportText[1];
  var _plasmaImportError = useState(""), plasmaImportError = _plasmaImportError[0], setPlasmaImportError = _plasmaImportError[1];
  var _plasmaBackWarn = useState(false), plasmaShowBackWarn = _plasmaBackWarn[0], setPlasmaShowBackWarn = _plasmaBackWarn[1];
  var _plasmaEditTab = useState("design"), plasmaEditTab = _plasmaEditTab[0], setPlasmaEditTab = _plasmaEditTab[1];
  var _plasmaRangeKey = useState(0), plasmaRangeKey = _plasmaRangeKey[0], setPlasmaRangeKey = _plasmaRangeKey[1];
  var _plasmaShipSize = useState(72), plasmaShipSize = _plasmaShipSize[0], setPlasmaShipSize = _plasmaShipSize[1];
  var _showPlasmaShipSizeSlider = useState(false), showPlasmaShipSizeSlider = _showPlasmaShipSizeSlider[0], setShowPlasmaShipSizeSlider = _showPlasmaShipSizeSlider[1];
  var plasmaShipSizeTouchRef = useRef(null);
  useEffect(function() { try { window.storage.get("cosmic_drift_ship_size").then(function(r) { if (r && r.value) { var v = Number(r.value); if (v >= 34 && v <= 204) setPlasmaShipSize(v); } }).catch(function() {}); } catch(e) {} }, []);
  var _plasmaPreviewShipId = useState(null), plasmaPreviewShipId = _plasmaPreviewShipId[0], setPlasmaPreviewShipId = _plasmaPreviewShipId[1];
  var shipDirtyRef = useRef(false);
  var _shipSelectedPart = useState(-1), shipSelectedPart = _shipSelectedPart[0], setShipSelectedPart = _shipSelectedPart[1];
  // Multi-select: extra indices beyond the primary. Effective selection is
  // shipSelectedPart (if >= 0) ∪ shipSelectedExtras. Canvas taps clear extras
  // (single-select gesture); the checkbox in the LIST tab toggles extras.
  var _shipSelectedExtras = useState([]), shipSelectedExtras = _shipSelectedExtras[0], setShipSelectedExtras = _shipSelectedExtras[1];
  // Multi-select toggle: when ON, canvas taps add/remove the tapped part
  // (and any group members) instead of replacing the selection.
  var _shipMultiSelectOn = useState(false), shipMultiSelectOn = _shipMultiSelectOn[0], setShipMultiSelectOn = _shipMultiSelectOn[1];
  var shipDragRef = useRef(null);
  // Tracks an active row-drag in the parts list (Z-order reordering by drag).
  var shipDragHandleRef = useRef(null);
  // Hover target while dragging a list row (drop-on-release). Null when not dragging.
  var _shipDragHover = useState(null), shipDragHover = _shipDragHover[0], setShipDragHover = _shipDragHover[1];
  // Which group headers are collapsed in the parts list. Keys are groupIds.
  var _shipCollapsedGroups = useState({}), shipCollapsedGroups = _shipCollapsedGroups[0], setShipCollapsedGroups = _shipCollapsedGroups[1];
  var _shipGroupRenamingId = useState(null), shipGroupRenamingId = _shipGroupRenamingId[0], setShipGroupRenamingId = _shipGroupRenamingId[1];
  var _shipGroupRenameVal = useState(""), shipGroupRenameVal = _shipGroupRenameVal[0], setShipGroupRenameVal = _shipGroupRenameVal[1];
  var _shipHullPromptId = useState(null), shipHullPromptId = _shipHullPromptId[0], setShipHullPromptId = _shipHullPromptId[1];
  var _shipWhLocked = useState(true), shipWhLocked = _shipWhLocked[0], setShipWhLocked = _shipWhLocked[1];
  var bdScrollRef = useRef(null);

  // ══ LEVEL BUILDER STATE ══
  var _lbScreen = useState("list"), lbScreen = _lbScreen[0], setLbScreen = _lbScreen[1];
  var _bg = useState(function() { return new Array(COLS * ROWS).fill(0); }), builderGrid = _bg[0], setBuilderGrid = _bg[1];
  // Undo/redo: snapshot is { grid, shipStart, name, plasma } since all four
  // are editable in the builder. Drag-paint and name typing coalesce within
  // a 600 ms window per key so one Undo reverts the whole stroke.
  var lbHistoryRef = useRef({ stack: [], idx: -1, lastKey: null, lastTime: 0 });
  var _lbHistVersion = useState(0), lbHistVersion = _lbHistVersion[0], setLbHistVersion = _lbHistVersion[1];
  var _bss = useState(3), builderShipStart = _bss[0], setBuilderShipStart = _bss[1];
  var _sbt = useState(null), selectedBlockType = _sbt[0], setSelectedBlockType = _sbt[1];
  var _cratePanel = useState(false), crateSubPanelOpen = _cratePanel[0], setCrateSubPanelOpen = _cratePanel[1];
  var _crateType = useState(9), selectedCrateType = _crateType[0], setSelectedCrateType = _crateType[1];
  var _eli = useState(null), editingLevelId = _eli[0], setEditingLevelId = _eli[1];
  var _bln = useState(""), builderLevelName = _bln[0], setBuilderLevelName = _bln[1];
  var _bdr = useState(false), builderDirty = _bdr[0], setBuilderDirty = _bdr[1];
  var _bdl = useState(false), builderDarkLevel = _bdl[0], setBuilderDarkLevel = _bdl[1];
  var _bwarn = useState(null), builderWarn = _bwarn[0], setBuilderWarn = _bwarn[1];
  var _erase = useState(false), eraserActive = _erase[0], setEraserActive = _erase[1];
  var _bplasma = useState(START_PLASMA), builderPlasma = _bplasma[0], setBuilderPlasma = _bplasma[1];
  var _wsGuide = useState(false), showWsGuide = _wsGuide[0], setShowWsGuide = _wsGuide[1];
  var _wsTester = useState(false), showWsTesterMenu = _wsTester[0], setShowWsTesterMenu = _wsTester[1];
  var _wsTutsReset = useState(false), wsTutsReset = _wsTutsReset[0], setWsTutsReset = _wsTutsReset[1];
  var _wsMenu = useState(false), showWsMenu = _wsMenu[0], setShowWsMenu = _wsMenu[1];
  var builderDragRef = useRef(null);
  var builderTouchUsedRef = useRef(false);
  var _btour = useState(null), builderTourStep = _btour[0], setBuilderTourStep = _btour[1];
  var builderTourSeenRef = useRef(false);
  var builderGridRef = useRef(null);
  // Refs for the builder walkthrough to highlight each editor region.
  var tourPaletteRef = useRef(null);
  var tourCrateRef = useRef(null);
  var tourShipRef = useRef(null);
  var tourPlasmaRef = useRef(null);
  var tourSaveRef = useRef(null);
  var _btrect = useState(null), builderTourRect = _btrect[0], setBuilderTourRect = _btrect[1];

  // ── My Levels state ──
  var _slvls = useState([]), savedLevels = _slvls[0], setSavedLevels = _slvls[1];
  var _sload = useState(false), levelsLoading = _sload[0], setLevelsLoading = _sload[1];
  var _renid = useState(null), renamingId = _renid[0], setRenamingId = _renid[1];
  var _renn = useState(""), renamingName = _renn[0], setRenamingName = _renn[1];
  var _delid = useState(null), deletingId = _delid[0], setDeletingId = _delid[1];
  var _expid = useState(null), exportId = _expid[0], setExportId = _expid[1];
  var _exptext = useState(""), exportText = _exptext[0], setExportText = _exptext[1];
  var _copied = useState(false), copied = _copied[0], setCopied = _copied[1];
  var _expAll = useState(false), showExportAll = _expAll[0], setShowExportAll = _expAll[1];
  var _expAllText = useState(""), exportAllText = _expAllText[0], setExportAllText = _expAllText[1];
  var _sortMode = useState(function() { try { return localStorage.getItem("cosmic-drift-levels-sort") || "date_new"; } catch(e) { return "date_new"; } }), sortMode = _sortMode[0], setSortMode = _sortMode[1];
  var _showImp = useState(false), showImport = _showImp[0], setShowImport = _showImp[1];
  var _impText = useState(""), importText = _impText[0], setImportText = _impText[1];
  var _impErr = useState(""), importError = _impErr[0], setImportError = _impErr[1];
  var _backWarn = useState(false), showBackWarn = _backWarn[0], setShowBackWarn = _backWarn[1];
  var savingRef = useRef(false);

  // ══ SETS STATE ══
  var _setsSaved = useState([]), setsSaved = _setsSaved[0], setSetsSaved = _setsSaved[1];
  var _setsActiveId = useState(null), setsActiveId = _setsActiveId[0], setSetsActiveId = _setsActiveId[1];
  var _setsView = useState("list"), setsView = _setsView[0], setSetsView = _setsView[1];
  var _setsEditSet = useState(null), setsEditSet = _setsEditSet[0], setSetsEditSet = _setsEditSet[1];
  var setsEditDirtyRef = useRef(false);
  var _setsDeletingId = useState(null), setsDeletingId = _setsDeletingId[0], setSetsDeleteId = _setsDeletingId[1];
  var _setsExportId = useState(null), setsExportId = _setsExportId[0], setSetsExportId = _setsExportId[1];
  var _setsExportText = useState(""), setsExportText = _setsExportText[0], setSetsExportText = _setsExportText[1];
  var _setsCopied = useState(false), setsCopied = _setsCopied[0], setSetsCopied = _setsCopied[1];
  var _setsShowImport = useState(false), setsShowImport = _setsShowImport[0], setSetsShowImport = _setsShowImport[1];
  var _setsImportText = useState(""), setsImportText = _setsImportText[0], setSetsImportText = _setsImportText[1];
  var _setsImportError = useState(""), setsImportError = _setsImportError[0], setSetsImportError = _setsImportError[1];
  var _setsActivatePrompt = useState(null), setsActivatePrompt = _setsActivatePrompt[0], setSetsActivatePrompt = _setsActivatePrompt[1];
  var _setsPlayPromptSet = useState(null), setsPlayPromptSet = _setsPlayPromptSet[0], setSetsPlayPromptSet = _setsPlayPromptSet[1];
  var setsPlayAfterActivateRef = useRef(false);
  var _setsRenamingId = useState(null), setsRenamingId = _setsRenamingId[0], setSetsRenamingId = _setsRenamingId[1];
  var _setsRenameValue = useState(""), setsRenameValue = _setsRenameValue[0], setSetsRenameValue = _setsRenameValue[1];
  var _showSaveCurrent = useState(false), showSaveCurrent = _showSaveCurrent[0], setShowSaveCurrent = _showSaveCurrent[1];
  var _saveCurrentSels = useState(null), saveCurrentSels = _saveCurrentSels[0], setSaveCurrentSels = _saveCurrentSels[1];
  var _setsSelMode = useState(null), setsSelMode = _setsSelMode[0], setSetsSelMode = _setsSelMode[1];
  var _setsSelConflict = useState(null), setsSelConflict = _setsSelConflict[0], setSetsSelConflict = _setsSelConflict[1];
  var _setsImportConflicts = useState([]), setsImportConflicts = _setsImportConflicts[0], setSetsImportConflicts = _setsImportConflicts[1];
  var _setsImportPending = useState(null), setsImportPending = _setsImportPending[0], setSetsImportPending = _setsImportPending[1];
  var setsLevelDragRef = useRef(null);
  var _setsLevelInput = useState(null), setsLevelInput = _setsLevelInput[0], setSetsLevelInput = _setsLevelInput[1];
  var lvDragRef = useRef(null);
  var _lvDragHover = useState(null), lvDragHover = _lvDragHover[0], setLvDragHover = _lvDragHover[1];
  var _lvNumInput = useState(null), lvNumInput = _lvNumInput[0], setLvNumInput = _lvNumInput[1];
  var _setsDeleteWarn = useState(null), setsDeleteWarn = _setsDeleteWarn[0], setSetsDeleteWarn = _setsDeleteWarn[1];
  var _setsSelectAllConflicts = useState(null), setsSelectAllConflicts = _setsSelectAllConflicts[0], setSetsSelectAllConflicts = _setsSelectAllConflicts[1];
  var _setsUnsavedWarn = useState(false), setsUnsavedWarn = _setsUnsavedWarn[0], setSetsUnsavedWarn = _setsUnsavedWarn[1];
  var _setsMergeMode = useState(false), setsMergeMode = _setsMergeMode[0], setSetsMergeMode = _setsMergeMode[1];
  var _setsMergeIds = useState([]), setsMergeIds = _setsMergeIds[0], setSetsMergeIds = _setsMergeIds[1];
  var storageWorking = useRef(true);

  // ── Load on mount ──
  useEffect(function() {
    loadSavedLevels();
    if (window.storage && window.storage.get) {
      window.storage.get("cosmic_drift_builder_tour").then(function(r) {
        if (r && r.value === "seen") builderTourSeenRef.current = true;
      }).catch(function() {});
    }
    bdLoadDesigns().then(function(designs) {
      var _hasOs = false;
      for (var _osi = 0; _osi < designs.length; _osi++) { if (designs[_osi].id === OPEN_SPACE_BLOCK_DESIGNS[0].id) { _hasOs = true; break; } }
      if (!_hasOs) { var _seeded = designs.concat(OPEN_SPACE_BLOCK_DESIGNS); bdSaveDesigns(_seeded); setBdSaved(_seeded); } else { setBdSaved(designs); }
    });
    bdLoadActive().then(function(map) { setBdActiveMap(map); });
    vfxLoadDesigns().then(function(designs) { setVfxSaved(designs); });
    vfxLoadActive().then(function(map) { setVfxActiveMap(map); });
    ufoLoadDesigns().then(function(designs) {
      if (designs.length > 0) {
        setUfoSaved(designs);
        ufoLoadActiveId().then(function(id) { setUfoActiveId(id); });
      } else {
        try { window.storage.get(UFO_STORAGE_KEY).then(function(r) {
          if (r && r.value) {
            var old = Object.assign({}, UFO_DEFAULT_DESIGN, JSON.parse(r.value));
            var migrated = Object.assign({}, old, { id: "ufo_" + Date.now(), name: "My UFO", savedAt: new Date().toISOString() });
            setUfoSaved([migrated]);
            setUfoActiveId(migrated.id);
            ufoSaveDesigns([migrated]);
            ufoSaveActiveId(migrated.id);
          } else {
            // First-time install: seed a "Default" UFO using the factory style.
            var seed = Object.assign({}, UFO_DEFAULT_DESIGN, { id: "ufo_default", name: "Default", savedAt: new Date().toISOString() });
            setUfoSaved([seed]);
            setUfoActiveId(seed.id);
            ufoSaveDesigns([seed]);
            ufoSaveActiveId(seed.id);
          }
        }).catch(function() {}); } catch(e) {}
      }
    });
    shipLoadDesigns().then(function(designs) {
      var migrated, _shipNeedsSave = false, _hasUtfShip = false, _hasTfShip = false;
      if (designs && designs.length > 0) {
        migrated = designs.map(shipMigrateDesign);
        for (var _psi = 0; _psi < migrated.length; _psi++) {
          if (migrated[_psi].id === USE_THE_FORCE_SHIP.id) _hasUtfShip = true;
          if (migrated[_psi].id === TIE_FIGHTS_SHIP.id)    _hasTfShip  = true;
        }
        if (!_hasTfShip)  { migrated = [TIE_FIGHTS_SHIP].concat(migrated);    _shipNeedsSave = true; }
        if (!_hasUtfShip) { migrated = [USE_THE_FORCE_SHIP].concat(migrated);  _shipNeedsSave = true; }
        if (_shipNeedsSave) { shipSaveDesigns(migrated); }
        setShipSaved(migrated);
        shipLoadActiveId().then(function(id) { setShipActiveId(id); });
      } else {
        // First-time install: seed preset ships + "Default" from the arrow preset.
        var seed = { id: "ship_default", name: "Default", hull: "arrow", parts: shipHullPresetParts("arrow"), savedAt: new Date().toISOString() };
        migrated = [USE_THE_FORCE_SHIP, TIE_FIGHTS_SHIP, seed];
        setShipSaved(migrated);
        setShipActiveId(seed.id);
        shipSaveDesigns(migrated);
        shipSaveActiveId(seed.id);
      }
    });
    plasmaLoadDesigns().then(function(designs) {
      var _plasmaList, _plasmaNeedsSave = false, _hasUtfPlasma = false, _hasTfPlasma = false;
      if (designs && designs.length > 0) {
        _plasmaList = designs;
        for (var _ppi = 0; _ppi < _plasmaList.length; _ppi++) {
          if (_plasmaList[_ppi].id === USE_THE_FORCE_PLASMA.id) _hasUtfPlasma = true;
          if (_plasmaList[_ppi].id === TIE_FIGHTS_PLASMA.id)    _hasTfPlasma  = true;
        }
        if (!_hasTfPlasma)  { _plasmaList = [TIE_FIGHTS_PLASMA].concat(_plasmaList);    _plasmaNeedsSave = true; }
        if (!_hasUtfPlasma) { _plasmaList = [USE_THE_FORCE_PLASMA].concat(_plasmaList);  _plasmaNeedsSave = true; }
        if (_plasmaNeedsSave) { plasmaSaveDesigns(_plasmaList); }
        setPlasmaSaved(_plasmaList);
        plasmaLoadActiveId().then(function(id) { setPlasmaActiveId(id); });
      } else {
        var seed = Object.assign({}, PLASMA_DEFAULT_DESIGN, { id: "plasma_default", name: "Default", savedAt: new Date().toISOString() });
        _plasmaList = [USE_THE_FORCE_PLASMA, TIE_FIGHTS_PLASMA, seed];
        setPlasmaSaved(_plasmaList);
        setPlasmaActiveId(seed.id);
        plasmaSaveDesigns(_plasmaList);
        plasmaSaveActiveIdToStorage(seed.id);
      }
    });
    try { window.storage.get("cosmic_drift_ship_size").then(function(r) { if (r && r.value) { var v = Number(r.value); if (v >= 34 && v <= 204) setPlasmaShipSize(v); } }).catch(function() {}); } catch(e) {}
    setsLoadAll().then(function(all) {
      var _hasOsSet = false, _hasUtfSet = false, _hasTfSet = false;
      for (var _ssi = 0; _ssi < all.length; _ssi++) {
        if (all[_ssi].id === OPEN_SPACE_SET.id)      _hasOsSet  = true;
        if (all[_ssi].id === USE_THE_FORCE_SET.id)   _hasUtfSet = true;
        if (all[_ssi].id === TIE_FIGHTS_SET.id)      _hasTfSet  = true;
      }
      var _seededSets = all.slice();
      if (!_hasTfSet)  _seededSets = [TIE_FIGHTS_SET].concat(_seededSets);
      if (!_hasUtfSet) _seededSets = [USE_THE_FORCE_SET].concat(_seededSets);
      if (!_hasOsSet)  _seededSets = [OPEN_SPACE_SET].concat(_seededSets);
      if (!_hasOsSet || !_hasUtfSet || !_hasTfSet) { setsSaveAll(_seededSets); }
      setSetsSaved(_seededSets);
      setsLoadActiveId().then(function(id) { setSetsActiveId(id || null); });
    });
  }, []);

  // Entry animation when arriving from game splash
  useEffect(function() {
    try {
      var from = sessionStorage.getItem("cd_transition_from");
      if (from === "game") {
        sessionStorage.removeItem("cd_transition_from");
        setTimeout(function() { setSplashEntering(false); }, 400);
      }
      var openSection = sessionStorage.getItem("cd_open_section");
      if (openSection) {
        sessionStorage.removeItem("cd_open_section");
        if (openSection === "levels") { loadSavedLevels(); setScreen("builder"); setLbScreen("list"); }
        else if (openSection === "designer") { setScreen("designer"); setBdCurrentView("list"); setBdSavedTab("active"); }
        else if (openSection === "vfx") { setScreen("vfx"); setVfxCurrentView("list"); setVfxSavedTab("active"); }
        else if (openSection === "ufo") { setScreen("ufo"); setUfoView("list"); }
        else if (openSection === "hangar") { setScreen("hangar"); setShipView("list"); }
        else if (openSection === "plasma") { setScreen("plasma"); setPlasmaView("list"); }
      }
    } catch(e) {}
  }, []);


  // ?builder=1 handoff: the game wrote a level to storage; open it in the Level Builder.
  // A level with an id edits the saved level in place; one without opens as new.
  useEffect(function() {
    try {
      if (new URLSearchParams(window.location.search).get("builder") !== "1") return;
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, "", window.location.pathname);
      }
      if (!window.storage || !window.storage.get) return;
      window.storage.get("cosmic_drift_workshop_handoff").then(function(r) {
        if (window.storage.delete) { window.storage.delete("cosmic_drift_workshop_handoff"); }
        if (!r || !r.value) return;
        var data = JSON.parse(r.value);
        if (!data || !data.grid) return;
        setScreen("builder");
        openBuilder(data);
      }).catch(function() {});
    } catch (e) {}
  }, []);

  useEffect(function() {
    if (bdDesign.assignedTo === "force_field" && !bdDesign.phases) {
      setBdDesign(function(prev) { return Object.assign({}, prev, { phases: bdDefaultPhases() }); });
    }
    if (bdDesign.assignedTo !== "force_field") { setBdPhase(1); }
  }, [bdDesign.assignedTo]);

  // Builder walkthrough: when the step changes, measure the target region
  // so the glow ring + tooltip can be positioned over it.
  useEffect(function() {
    if (builderTourStep == null) { setBuilderTourRect(null); return; }
    var refs = [builderGridRef, tourPaletteRef, tourCrateRef, tourShipRef, tourPlasmaRef, tourSaveRef];
    var el = refs[builderTourStep] && refs[builderTourStep].current;
    if (!el) { setBuilderTourRect(null); return; }
    var r = el.getBoundingClientRect();
    setBuilderTourRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [builderTourStep]);

  useEffect(function() { try { localStorage.setItem("cosmic-drift-levels-sort", sortMode); } catch(e) {} }, [sortMode]);

  // Tooltip placement: below the target if it's in the upper half, else above.
  var tourTipBelow = false, tourTipLeft = 0;
  if (builderTourRect) {
    tourTipBelow = (builderTourRect.top + builderTourRect.height / 2) < (window.innerHeight * 0.5);
    tourTipLeft = Math.max(8, Math.min(window.innerWidth - 288, builderTourRect.left + builderTourRect.width / 2 - 140));
  }

  var bdDisplayDesign = getDesignForPhase(bdDesign, bdPhase);
  var bdIsActive = !!(bdEditId && !bdDirty && bdDesign.assignedTo && bdActiveMap[bdDesign.assignedTo] === bdEditId);
  var vfxIsActive = !!(vfxEditId && !vfxDirty && vfxActiveMap[vfxEditDesign.effectType] === vfxEditId);

  // ═══════════════════════════════════════
  // SHARED UTILITIES
  // ═══════════════════════════════════════

  function genUUID() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6); }

  function copyToClipboard(text, setCopiedFn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() { setCopiedFn(true); setTimeout(function() { setCopiedFn(false); }, 2000); });
    } else {
      var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); setCopiedFn(true); setTimeout(function() { setCopiedFn(false); }, 2000);
    }
  }

  // ═══════════════════════════════════════
  // LEVEL BUILDER FUNCTIONS
  // ═══════════════════════════════════════

  function persistLevels(levels) {
    if (!window.storage || !window.storage.set) return;
    try {
      window.storage.set(LEVEL_STORAGE_KEY, JSON.stringify(levels), false).then(function() {
        storageWorking.current = true;
      }).catch(function() { storageWorking.current = false; });
    } catch (e) { storageWorking.current = false; }
  }

  // ══ SETS HELPERS ══
  function setsGetActive() {
    if (!setsActiveId) return null;
    for (var _si = 0; _si < setsSaved.length; _si++) { if (setsSaved[_si].id === setsActiveId) return setsSaved[_si]; }
    return null;
  }
  function setsGetModuleChips(setObj) {
    var chips = [];
    if (setObj.levelIds && setObj.levelIds.length > 0) chips.push("LEVELS");
    if (setObj.blockDesignIds && setObj.blockDesignIds.length > 0) chips.push("BLOCKS");
    if (setObj.vfxDesignIds && setObj.vfxDesignIds.length > 0) chips.push("VFX");
    if (setObj.ufoDesignId) chips.push("UFO");
    if (setObj.shipDesignId) chips.push("SHIP");
    if (setObj.plasmaDesignId) chips.push("PLASMA");
    return chips;
  }
  function setsDesignInSets(designId) {
    var found = [];
    for (var _i = 0; _i < setsSaved.length; _i++) {
      var _s = setsSaved[_i]; var _in = false;
      if (_s.blockDesignIds) { for (var _bi = 0; _bi < _s.blockDesignIds.length; _bi++) { if (_s.blockDesignIds[_bi] === designId) { _in = true; break; } } }
      if (!_in && _s.vfxDesignIds) { for (var _vi = 0; _vi < _s.vfxDesignIds.length; _vi++) { if (_s.vfxDesignIds[_vi] === designId) { _in = true; break; } } }
      if (!_in && _s.levelIds) { for (var _li = 0; _li < _s.levelIds.length; _li++) { if (_s.levelIds[_li] === designId) { _in = true; break; } } }
      if (!_in && (_s.ufoDesignId === designId || _s.shipDesignId === designId || _s.plasmaDesignId === designId)) _in = true;
      if (_in) found.push(_s.name || "Unnamed Set");
    }
    return found;
  }
  function setsGetType(setObj) {
    var _k = 0; var _t = "Mixed";
    if (setObj.levelIds && setObj.levelIds.length > 0) { _k++; _t = "Levels"; }
    if (setObj.blockDesignIds && setObj.blockDesignIds.length > 0) { _k++; _t = "Blocks"; }
    if (setObj.vfxDesignIds && setObj.vfxDesignIds.length > 0) { _k++; _t = "VFX"; }
    if (setObj.ufoDesignId) { _k++; _t = "UFO"; }
    if (setObj.shipDesignId) { _k++; _t = "Ship"; }
    if (setObj.plasmaDesignId) { _k++; _t = "Plasma"; }
    return _k === 1 ? _t : "Mixed";
  }
  function setsCreateNew() {
    setSetsEditSet({ id: "set_" + Date.now(), name: "", savedAt: new Date().toISOString() });
    setsEditDirtyRef.current = false;
    setSetsView("editor");
  }
  function setsOpenEditor(setObj) {
    setSetsEditSet(Object.assign({}, setObj));
    setsEditDirtyRef.current = false;
    setSetsView("editor");
  }
  function setsSaveSetObj(setObj) {
    var updated = Object.assign({}, setObj, { savedAt: new Date().toISOString() });
    var existing = false;
    var next = setsSaved.map(function(s) { if (s.id === updated.id) { existing = true; return updated; } return s; });
    if (!existing) next = next.concat([updated]);
    setSetsSaved(next); setsSaveAll(next);
    setSetsEditSet(updated); setsEditDirtyRef.current = false;
    setSetsView("list");
  }
  function setsEditCopy(setObj) {
    var _copy = Object.assign({}, setObj, { id: "set_" + Date.now(), name: "Copy of " + (setObj.name || "Unnamed Set"), savedAt: null });
    if (_copy.levelIds) _copy.levelIds = _copy.levelIds.slice();
    if (_copy.blockDesignIds) _copy.blockDesignIds = _copy.blockDesignIds.slice();
    if (_copy.vfxDesignIds) _copy.vfxDesignIds = _copy.vfxDesignIds.slice();
    setSetsEditSet(_copy); setsEditDirtyRef.current = true; setSetsView("editor");
  }
  function setsMergeExecute() {
    if (setsMergeIds.length < 2) return;
    var _sel = [];
    for (var _i = 0; _i < setsMergeIds.length; _i++) {
      for (var _j = 0; _j < setsSaved.length; _j++) { if (setsSaved[_j].id === setsMergeIds[_i]) { _sel.push(setsSaved[_j]); break; } }
    }
    var _levelIds = [], _blockIds = [], _vfxIds = [], _ufoId = null, _shipId = null, _plasmaId = null;
    for (var _si = 0; _si < _sel.length; _si++) {
      var _s = _sel[_si];
      if (_s.levelIds) { for (var _li = 0; _li < _s.levelIds.length; _li++) { if (_levelIds.indexOf(_s.levelIds[_li]) === -1) _levelIds.push(_s.levelIds[_li]); } }
      if (_s.blockDesignIds) { for (var _bi = 0; _bi < _s.blockDesignIds.length; _bi++) { if (_blockIds.indexOf(_s.blockDesignIds[_bi]) === -1) _blockIds.push(_s.blockDesignIds[_bi]); } }
      if (_s.vfxDesignIds) { for (var _vi = 0; _vi < _s.vfxDesignIds.length; _vi++) { if (_vfxIds.indexOf(_s.vfxDesignIds[_vi]) === -1) _vfxIds.push(_s.vfxDesignIds[_vi]); } }
      if (_s.ufoDesignId) _ufoId = _s.ufoDesignId;
      if (_s.shipDesignId) _shipId = _s.shipDesignId;
      if (_s.plasmaDesignId) _plasmaId = _s.plasmaDesignId;
    }
    var _merged = { id: "set_" + Date.now(), name: "", levelIds: _levelIds, blockDesignIds: _blockIds, vfxDesignIds: _vfxIds };
    if (_ufoId) _merged.ufoDesignId = _ufoId;
    if (_shipId) _merged.shipDesignId = _shipId;
    if (_plasmaId) _merged.plasmaDesignId = _plasmaId;
    setSetsMergeMode(false); setSetsMergeIds([]);
    var _allGroups = [], _groups, _tkeys, _tk, _typeLabel, _d;
    if (_blockIds.length > 1) {
      _groups = {};
      for (var _bdi = 0; _bdi < _blockIds.length; _bdi++) {
        _d = null;
        for (var _bj = 0; _bj < bdSaved.length; _bj++) { if (bdSaved[_bj].id === _blockIds[_bdi]) { _d = bdSaved[_bj]; break; } }
        if (!_d) continue;
        var _bt = _d.assignedTo || "unknown";
        if (!_groups[_bt]) _groups[_bt] = [];
        _groups[_bt].push(_d);
      }
      _tkeys = Object.keys(_groups);
      for (var _bti = 0; _bti < _tkeys.length; _bti++) {
        _tk = _tkeys[_bti];
        if (_groups[_tk].length > 1) {
          _typeLabel = "";
          for (var _bli = 0; _bli < BD_BLOCK_TYPES.length; _bli++) { if (BD_BLOCK_TYPES[_bli].id === _tk) { _typeLabel = BD_BLOCK_TYPES[_bli].label; break; } }
          _allGroups.push({ typeId: _tk, typeLabel: _typeLabel || _tk, moduleType: "block", designs: _groups[_tk], selectedId: _groups[_tk][0].id });
        }
      }
    }
    if (_vfxIds.length > 1) {
      _groups = {};
      for (var _vdi = 0; _vdi < _vfxIds.length; _vdi++) {
        _d = null;
        for (var _vj = 0; _vj < vfxSaved.length; _vj++) { if (vfxSaved[_vj].id === _vfxIds[_vdi]) { _d = vfxSaved[_vj]; break; } }
        if (!_d) continue;
        var _vt = _d.effectType || "unknown";
        if (!_groups[_vt]) _groups[_vt] = [];
        _groups[_vt].push(_d);
      }
      _tkeys = Object.keys(_groups);
      for (var _vti = 0; _vti < _tkeys.length; _vti++) {
        _tk = _tkeys[_vti];
        if (_groups[_tk].length > 1) {
          _typeLabel = "";
          for (var _vli = 0; _vli < VFX_EFFECT_TYPES.length; _vli++) { if (VFX_EFFECT_TYPES[_vli].id === _tk) { _typeLabel = VFX_EFFECT_TYPES[_vli].label; break; } }
          _allGroups.push({ typeId: _tk, typeLabel: _typeLabel || _tk, moduleType: "vfx", designs: _groups[_tk], selectedId: _groups[_tk][0].id });
        }
      }
    }
    var _mergedCapture = _merged;
    if (_allGroups.length > 0) {
      setSetsSelectAllConflicts({ autoIds: [], groups: _allGroups, cancelLabel: "Cancel Merge", onConfirm: function(finalIds, groups) {
        var _pruned = Object.assign({}, _mergedCapture);
        for (var _gi = 0; _gi < groups.length; _gi++) {
          var _grp = groups[_gi];
          var _nonSel = [];
          for (var _gdi = 0; _gdi < _grp.designs.length; _gdi++) { if (_grp.designs[_gdi].id !== _grp.selectedId) _nonSel.push(_grp.designs[_gdi].id); }
          if (_grp.moduleType === "block") { _pruned.blockDesignIds = (_pruned.blockDesignIds || []).filter(function(id) { return _nonSel.indexOf(id) === -1; }); }
          else if (_grp.moduleType === "vfx") { _pruned.vfxDesignIds = (_pruned.vfxDesignIds || []).filter(function(id) { return _nonSel.indexOf(id) === -1; }); }
        }
        setSetsEditSet(_pruned); setsEditDirtyRef.current = true; setSetsView("editor");
      }});
    } else {
      setSetsEditSet(_mergedCapture); setsEditDirtyRef.current = true; setSetsView("editor");
    }
  }
  function setsSaveEdit() {
    if (!setsEditSet) return;
    var _allGroups = [];
    var _groups, _tkeys, _tk, _typeLabel, _d;
    if (setsEditSet.blockDesignIds && setsEditSet.blockDesignIds.length > 1) {
      _groups = {};
      for (var _bi = 0; _bi < setsEditSet.blockDesignIds.length; _bi++) {
        _d = null;
        for (var _bj = 0; _bj < bdSaved.length; _bj++) { if (bdSaved[_bj].id === setsEditSet.blockDesignIds[_bi]) { _d = bdSaved[_bj]; break; } }
        if (!_d) continue;
        var _bt = _d.assignedTo || "unknown";
        if (!_groups[_bt]) _groups[_bt] = [];
        _groups[_bt].push(_d);
      }
      _tkeys = Object.keys(_groups);
      for (var _bti = 0; _bti < _tkeys.length; _bti++) {
        _tk = _tkeys[_bti];
        if (_groups[_tk].length > 1) {
          _typeLabel = "";
          for (var _bli = 0; _bli < BD_BLOCK_TYPES.length; _bli++) { if (BD_BLOCK_TYPES[_bli].id === _tk) { _typeLabel = BD_BLOCK_TYPES[_bli].label; break; } }
          _allGroups.push({ typeId: _tk, typeLabel: _typeLabel || _tk, moduleType: "block", designs: _groups[_tk], selectedId: _groups[_tk][0].id });
        }
      }
    }
    if (setsEditSet.vfxDesignIds && setsEditSet.vfxDesignIds.length > 1) {
      _groups = {};
      for (var _vi = 0; _vi < setsEditSet.vfxDesignIds.length; _vi++) {
        _d = null;
        for (var _vj = 0; _vj < vfxSaved.length; _vj++) { if (vfxSaved[_vj].id === setsEditSet.vfxDesignIds[_vi]) { _d = vfxSaved[_vj]; break; } }
        if (!_d) continue;
        var _vt = _d.effectType || "unknown";
        if (!_groups[_vt]) _groups[_vt] = [];
        _groups[_vt].push(_d);
      }
      _tkeys = Object.keys(_groups);
      for (var _vti = 0; _vti < _tkeys.length; _vti++) {
        _tk = _tkeys[_vti];
        if (_groups[_tk].length > 1) {
          _typeLabel = "";
          for (var _vli = 0; _vli < VFX_EFFECT_TYPES.length; _vli++) { if (VFX_EFFECT_TYPES[_vli].id === _tk) { _typeLabel = VFX_EFFECT_TYPES[_vli].label; break; } }
          _allGroups.push({ typeId: _tk, typeLabel: _typeLabel || _tk, moduleType: "vfx", designs: _groups[_tk], selectedId: _groups[_tk][0].id });
        }
      }
    }
    if (_allGroups.length > 0) {
      var _setCapture = setsEditSet;
      setSetsSelectAllConflicts({ autoIds: [], groups: _allGroups, onConfirm: function(finalIds, groups) {
        var _pruned = Object.assign({}, _setCapture);
        for (var _gi = 0; _gi < groups.length; _gi++) {
          var _grp = groups[_gi];
          var _nonSel = [];
          for (var _di = 0; _di < _grp.designs.length; _di++) { if (_grp.designs[_di].id !== _grp.selectedId) _nonSel.push(_grp.designs[_di].id); }
          if (_grp.moduleType === "block") {
            _pruned.blockDesignIds = (_pruned.blockDesignIds || []).filter(function(id) { return _nonSel.indexOf(id) === -1; });
          } else if (_grp.moduleType === "vfx") {
            _pruned.vfxDesignIds = (_pruned.vfxDesignIds || []).filter(function(id) { return _nonSel.indexOf(id) === -1; });
          }
        }
        setsSaveSetObj(_pruned);
      }});
      return;
    }
    setsSaveSetObj(setsEditSet);
  }
  function setsDeleteSet(id) {
    var next = setsSaved.filter(function(s) { return s.id !== id; });
    setSetsSaved(next); setsSaveAll(next);
    if (setsActiveId === id) { setSetsActiveId(null); setsSaveActiveId(""); }
    setSetsDeleteId(null);
  }
  function setsToggleActive(setObj) {
    if (setsActiveId === setObj.id) { setSetsActiveId(null); setsSaveActiveId(""); return; }
    var needsPrompt = (setObj.blockDesignIds && setObj.blockDesignIds.length > 0) ||
                     (setObj.vfxDesignIds && setObj.vfxDesignIds.length > 0);
    if (needsPrompt) setSetsActivatePrompt(setObj);
    else setsApplyActivation(setObj, "keep");
  }
  function setsApplyActivation(setObj, mode) {
    if (setObj.blockActive && Object.keys(setObj.blockActive).length > 0) {
      var newBdActive = mode === "keep" ? Object.assign({}, bdActiveMap) : {};
      var _bkeys = Object.keys(setObj.blockActive);
      for (var _bki = 0; _bki < _bkeys.length; _bki++) {
        var _btId = _bkeys[_bki]; var _bdId = setObj.blockActive[_btId]; var _bex = false;
        for (var _bj = 0; _bj < bdSaved.length; _bj++) { if (bdSaved[_bj].id === _bdId) { _bex = true; break; } }
        if (_bex) newBdActive[_btId] = _bdId;
      }
      setBdActiveMap(newBdActive); bdSaveActive(newBdActive);
    } else if (mode === "defaults" && setObj.blockDesignIds && setObj.blockDesignIds.length > 0) {
      setBdActiveMap({}); bdSaveActive({});
    }
    if (setObj.vfxActive && Object.keys(setObj.vfxActive).length > 0) {
      var newVfxActive = mode === "keep" ? Object.assign({}, vfxActiveMap) : {};
      var _vkeys = Object.keys(setObj.vfxActive);
      for (var _vki = 0; _vki < _vkeys.length; _vki++) {
        var _vtId = _vkeys[_vki]; var _vdId = setObj.vfxActive[_vtId]; var _vex = false;
        for (var _vj = 0; _vj < vfxSaved.length; _vj++) { if (vfxSaved[_vj].id === _vdId) { _vex = true; break; } }
        if (_vex) newVfxActive[_vtId] = _vdId;
      }
      setVfxActiveMap(newVfxActive); vfxSaveActive(newVfxActive);
    } else if (mode === "defaults" && setObj.vfxDesignIds && setObj.vfxDesignIds.length > 0) {
      setVfxActiveMap({}); vfxSaveActive({});
    }
    if (setObj.ufoDesignId) {
      var _uex = false;
      for (var _ui = 0; _ui < ufoSaved.length; _ui++) { if (ufoSaved[_ui].id === setObj.ufoDesignId) { _uex = true; break; } }
      if (_uex) { setUfoActiveId(setObj.ufoDesignId); ufoSaveActiveId(setObj.ufoDesignId); }
    }
    if (setObj.shipDesignId) {
      var _sex = false;
      for (var _sshi = 0; _sshi < shipSaved.length; _sshi++) { if (shipSaved[_sshi].id === setObj.shipDesignId) { _sex = true; break; } }
      if (_sex) { setShipActiveId(setObj.shipDesignId); shipSaveActiveId(setObj.shipDesignId); }
    }
    if (setObj.plasmaDesignId) {
      var _pex = false;
      for (var _pi = 0; _pi < plasmaSaved.length; _pi++) { if (plasmaSaved[_pi].id === setObj.plasmaDesignId) { _pex = true; break; } }
      if (_pex) { setPlasmaActiveId(setObj.plasmaDesignId); plasmaSaveActiveIdToStorage(setObj.plasmaDesignId); }
    }
    setSetsActiveId(setObj.id); setsSaveActiveId(setObj.id);
    setSetsActivatePrompt(null);
    if (setsPlayAfterActivateRef.current) { setsPlayAfterActivateRef.current = false; handleSplashToGamePlaySet(); }
  }
  function setsPlaySet(setObj) {
    if (setsActiveId === setObj.id) { handleSplashToGamePlaySet(); return; }
    setSetsPlayPromptSet(setObj);
  }
  function setsCommitRename() {
    var id = setsRenamingId;
    if (!id) return;
    var name = (setsRenameValue || "").trim() || "Unnamed Set";
    var next = setsSaved.map(function(s) { return s.id === id ? Object.assign({}, s, { name: name, savedAt: new Date().toISOString() }) : s; });
    setSetsSaved(next); setsSaveAll(next);
    setSetsRenamingId(null); setSetsRenameValue("");
  }
  function setsCancelRename() { setSetsRenamingId(null); setSetsRenameValue(""); }
  function setsExportSet(id) {
    var _so = null;
    for (var _ei = 0; _ei < setsSaved.length; _ei++) { if (setsSaved[_ei].id === id) { _so = setsSaved[_ei]; break; } }
    if (!_so) return;
    var exp = Object.assign({}, _so, { _exportedAt: new Date().toISOString() });
    if (_so.blockDesignIds && _so.blockDesignIds.length > 0) {
      exp._blockDesigns = [];
      for (var _bi2 = 0; _bi2 < _so.blockDesignIds.length; _bi2++) { for (var _bj2 = 0; _bj2 < bdSaved.length; _bj2++) { if (bdSaved[_bj2].id === _so.blockDesignIds[_bi2]) { exp._blockDesigns.push(bdSaved[_bj2]); break; } } }
    }
    if (_so.vfxDesignIds && _so.vfxDesignIds.length > 0) {
      exp._vfxDesigns = [];
      for (var _vi2 = 0; _vi2 < _so.vfxDesignIds.length; _vi2++) { for (var _vj2 = 0; _vj2 < vfxSaved.length; _vj2++) { if (vfxSaved[_vj2].id === _so.vfxDesignIds[_vi2]) { exp._vfxDesigns.push(vfxSaved[_vj2]); break; } } }
    }
    if (_so.ufoDesignId) { for (var _ui2 = 0; _ui2 < ufoSaved.length; _ui2++) { if (ufoSaved[_ui2].id === _so.ufoDesignId) { exp._ufoDesign = ufoSaved[_ui2]; break; } } }
    if (_so.shipDesignId) { for (var _shi2 = 0; _shi2 < shipSaved.length; _shi2++) { if (shipSaved[_shi2].id === _so.shipDesignId) { exp._shipDesign = shipSaved[_shi2]; break; } } }
    if (_so.plasmaDesignId) { for (var _pi2 = 0; _pi2 < plasmaSaved.length; _pi2++) { if (plasmaSaved[_pi2].id === _so.plasmaDesignId) { exp._plasmaDesign = plasmaSaved[_pi2]; break; } } }
    if (_so.levelIds && _so.levelIds.length > 0) {
      exp._levels = [];
      for (var _li2 = 0; _li2 < _so.levelIds.length; _li2++) { for (var _lj2 = 0; _lj2 < savedLevels.length; _lj2++) { if (savedLevels[_lj2].id === _so.levelIds[_li2]) { exp._levels.push(savedLevels[_lj2]); break; } } }
    }
    setSetsExportId(id); setSetsExportText(JSON.stringify(exp, null, 2));
  }
  function setsHandleImport() {
    try {
      var _imp = JSON.parse(setsImportText);
      if (!_imp || typeof _imp !== "object" || !_imp.id) { setSetsImportError("Invalid set data."); return; }
      var _embedded = [].concat(_imp._blockDesigns || [], _imp._vfxDesigns || [],
        _imp._ufoDesign ? [_imp._ufoDesign] : [], _imp._shipDesign ? [_imp._shipDesign] : [],
        _imp._plasmaDesign ? [_imp._plasmaDesign] : [], _imp._levels || []);
      var _allLib = [].concat(bdSaved, vfxSaved, ufoSaved, shipSaved, plasmaSaved, savedLevels);
      var _conflicts = [];
      for (var _ci = 0; _ci < _embedded.length; _ci++) {
        var _d = _embedded[_ci];
        for (var _cj = 0; _cj < _allLib.length; _cj++) {
          if (_allLib[_cj].id === _d.id && _allLib[_cj].savedAt !== _d.savedAt) { _conflicts.push({ lib: _allLib[_cj], imported: _d }); break; }
        }
      }
      var _cleanSet = {};
      var _ks = Object.keys(_imp);
      for (var _ki = 0; _ki < _ks.length; _ki++) { if (_ks[_ki].charAt(0) !== "_") _cleanSet[_ks[_ki]] = _imp[_ks[_ki]]; }
      _cleanSet.id = "set_" + Date.now(); _cleanSet.savedAt = new Date().toISOString();
      if (_conflicts.length > 0) {
        setSetsImportPending({ set: _cleanSet, embedded: _embedded });
        setSetsImportConflicts(_conflicts);
        setSetsShowImport(false); setSetsImportText("");
      } else {
        setsFinishImport(_cleanSet, _embedded, {});
      }
    } catch(e) { setSetsImportError("Could not parse JSON."); }
  }
  function setsFinishImport(cleanSet, embedded, resolutions) {
    var _nBd = bdSaved.slice(), _nVfx = vfxSaved.slice(), _nUfo = ufoSaved.slice();
    var _nShip = shipSaved.slice(), _nPlasma = plasmaSaved.slice(), _nLvl = savedLevels.slice();
    for (var _ii = 0; _ii < embedded.length; _ii++) {
      var _d2 = embedded[_ii]; var _use = resolutions[_d2.id] !== "keep"; var _found = false;
      if ((_d2.id && _d2.id.indexOf("bd_") === 0) || (_d2.assignedTo !== undefined && _d2.effectType === undefined && !_d2.grid)) {
        for (var _k = 0; _k < _nBd.length; _k++) { if (_nBd[_k].id === _d2.id) { if (_use) _nBd[_k] = _d2; _found = true; break; } }
        if (!_found) _nBd.push(_d2);
      } else if ((_d2.id && _d2.id.indexOf("vfx_") === 0) || _d2.effectType !== undefined) {
        for (var _k2 = 0; _k2 < _nVfx.length; _k2++) { if (_nVfx[_k2].id === _d2.id) { if (_use) _nVfx[_k2] = _d2; _found = true; break; } }
        if (!_found) _nVfx.push(_d2);
      } else if (_d2.id && _d2.id.indexOf("ufo_") === 0) {
        for (var _k3 = 0; _k3 < _nUfo.length; _k3++) { if (_nUfo[_k3].id === _d2.id) { if (_use) _nUfo[_k3] = _d2; _found = true; break; } }
        if (!_found) _nUfo.push(_d2);
      } else if (_d2.id && _d2.id.indexOf("ship_") === 0) {
        for (var _k4 = 0; _k4 < _nShip.length; _k4++) { if (_nShip[_k4].id === _d2.id) { if (_use) _nShip[_k4] = _d2; _found = true; break; } }
        if (!_found) _nShip.push(_d2);
      } else if (_d2.id && _d2.id.indexOf("plasma_") === 0) {
        for (var _k5 = 0; _k5 < _nPlasma.length; _k5++) { if (_nPlasma[_k5].id === _d2.id) { if (_use) _nPlasma[_k5] = _d2; _found = true; break; } }
        if (!_found) _nPlasma.push(_d2);
      } else if (_d2.grid) {
        for (var _k6 = 0; _k6 < _nLvl.length; _k6++) { if (_nLvl[_k6].id === _d2.id) { if (_use) _nLvl[_k6] = _d2; _found = true; break; } }
        if (!_found) _nLvl.push(_d2);
      }
    }
    setBdSaved(_nBd); bdSaveDesigns(_nBd);
    setVfxSaved(_nVfx); vfxSaveDesigns(_nVfx);
    setUfoSaved(_nUfo); ufoSaveDesigns(_nUfo);
    setShipSaved(_nShip); shipSaveDesigns(_nShip);
    setPlasmaSaved(_nPlasma); plasmaSaveDesigns(_nPlasma);
    persistLevels(_nLvl); setSavedLevels(_nLvl);
    var _nextSets = setsSaved.concat([cleanSet]);
    setSetsSaved(_nextSets); setsSaveAll(_nextSets);
    setSetsImportConflicts([]); setSetsImportPending(null);
    setSetsShowImport(false); setSetsImportText(""); setSetsImportError("");
  }
  function setsHandleAddSelections(moduleType, selectedIds) {
    if (!setsEditSet) { setSetsSelMode(null); return; }
    var _upd = Object.assign({}, setsEditSet);
    if (moduleType === "block") {
      _upd.blockDesignIds = selectedIds;
      var _nba = {}; var _bak = Object.keys(bdActiveMap);
      for (var _bai = 0; _bai < _bak.length; _bai++) {
        var _bat = _bak[_bai]; var _bad = bdActiveMap[_bat];
        for (var _baj = 0; _baj < selectedIds.length; _baj++) { if (selectedIds[_baj] === _bad) { _nba[_bat] = _bad; break; } }
      }
      _upd.blockActive = _nba;
    } else if (moduleType === "vfx") {
      _upd.vfxDesignIds = selectedIds;
      var _nva = {}; var _vak = Object.keys(vfxActiveMap);
      for (var _vai = 0; _vai < _vak.length; _vai++) {
        var _vat = _vak[_vai]; var _vad = vfxActiveMap[_vat];
        for (var _vaj = 0; _vaj < selectedIds.length; _vaj++) { if (selectedIds[_vaj] === _vad) { _nva[_vat] = _vad; break; } }
      }
      _upd.vfxActive = _nva;
    } else if (moduleType === "ufo") {
      _upd.ufoDesignId = selectedIds.length > 0 ? selectedIds[0] : null;
    } else if (moduleType === "ship") {
      _upd.shipDesignId = selectedIds.length > 0 ? selectedIds[0] : null;
    } else if (moduleType === "plasma") {
      _upd.plasmaDesignId = selectedIds.length > 0 ? selectedIds[0] : null;
    } else if (moduleType === "level") {
      _upd.levelIds = selectedIds;
    }
    setSetsEditSet(_upd); setsEditDirtyRef.current = true;
    setSetsSelMode(null); setScreen("sets"); setSetsView("editor");
  }
  function setsInitSaveCurrent() {
    var _bids = []; var _bak2 = Object.keys(bdActiveMap);
    for (var _baii = 0; _baii < _bak2.length; _baii++) {
      var _bid = bdActiveMap[_bak2[_baii]]; if (!_bid) continue;
      var _bdup = false; for (var _bdj = 0; _bdj < _bids.length; _bdj++) { if (_bids[_bdj] === _bid) { _bdup = true; break; } }
      if (!_bdup) _bids.push(_bid);
    }
    var _vids = []; var _vak2 = Object.keys(vfxActiveMap);
    for (var _vaii = 0; _vaii < _vak2.length; _vaii++) {
      var _vid = vfxActiveMap[_vak2[_vaii]]; if (!_vid) continue;
      var _vdup = false; for (var _vdj = 0; _vdj < _vids.length; _vdj++) { if (_vids[_vdj] === _vid) { _vdup = true; break; } }
      if (!_vdup) _vids.push(_vid);
    }
    setSaveCurrentSels({
      blockDesignIds: _bids, blockActive: Object.assign({}, bdActiveMap),
      vfxDesignIds: _vids, vfxActive: Object.assign({}, vfxActiveMap),
      ufoDesignId: ufoActiveId || null, shipDesignId: shipActiveId || null,
      plasmaDesignId: plasmaActiveId || null, levelIds: []
    });
    setShowSaveCurrent(true);
  }
  function setsFinishSaveCurrent() {
    if (!saveCurrentSels) return;
    setSetsEditSet(Object.assign({}, saveCurrentSels, { id: "set_" + Date.now(), name: "", savedAt: new Date().toISOString() }));
    setsEditDirtyRef.current = true;
    setShowSaveCurrent(false); setSaveCurrentSels(null);
    setSetsView("editor"); setScreen("sets");
  }

  function setsReorderLevel(fromIdx, toIdx) {
    if (!setsEditSet || fromIdx === toIdx) return;
    var _ids = (setsEditSet.levelIds || []).slice();
    var _item = _ids.splice(fromIdx, 1)[0];
    _ids.splice(toIdx, 0, _item);
    setSetsEditSet(Object.assign({}, setsEditSet, { levelIds: _ids }));
    setsEditDirtyRef.current = true;
  }
  function setsConfirmLevelPos(idx) {
    if (!setsLevelInput || setsLevelInput.idx !== idx || !setsEditSet) return;
    var _ids = (setsEditSet.levelIds || []).slice();
    var _pos = parseInt(setsLevelInput.val, 10) - 1;
    if (isNaN(_pos) || _pos < 0) _pos = 0;
    if (_pos >= _ids.length) _pos = _ids.length - 1;
    var _item = _ids.splice(idx, 1)[0];
    _ids.splice(_pos, 0, _item);
    setSetsEditSet(Object.assign({}, setsEditSet, { levelIds: _ids }));
    setsEditDirtyRef.current = true;
    setSetsLevelInput(null);
  }
  function setsLevelDragStart(idx, e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    setsLevelDragRef.current = { idx: idx };
    if (e.currentTarget.setPointerCapture && e.pointerId != null) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch(err) {}
    }
  }
  function setsLevelDragMove(e) {
    var d = setsLevelDragRef.current;
    if (!d) return;
    if (e.preventDefault) e.preventDefault();
    var rows = document.querySelectorAll("[data-setslevel-row]");
    var cy = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    var targetIdx = d.idx;
    for (var _i = 0; _i < rows.length; _i++) {
      var r = rows[_i].getBoundingClientRect();
      if (cy < r.top + r.height / 2) { targetIdx = parseInt(rows[_i].getAttribute("data-setslevel-idx"), 10); break; }
      if (_i === rows.length - 1) targetIdx = parseInt(rows[_i].getAttribute("data-setslevel-idx"), 10);
    }
    if (!isNaN(targetIdx) && targetIdx !== d.idx) { setsReorderLevel(d.idx, targetIdx); d.idx = targetIdx; }
  }
  function setsLevelDragEnd(e) { setsLevelDragRef.current = null; }
  function setsToggleSel(design, typeKey) {
    if (!setsSelMode) return;
    var cur = setsSelMode.selectedIds;
    var found = false;
    for (var _i = 0; _i < cur.length; _i++) { if (cur[_i] === design.id) { found = true; break; } }
    if (found) {
      setSetsSelMode(Object.assign({}, setsSelMode, { selectedIds: cur.filter(function(id) { return id !== design.id; }) }));
    } else {
      if (typeKey && design[typeKey]) {
        var _lib = typeKey === "assignedTo" ? bdSaved : vfxSaved;
        var _conflict = null;
        for (var _ci = 0; _ci < cur.length; _ci++) {
          for (var _li = 0; _li < _lib.length; _li++) {
            if (_lib[_li].id === cur[_ci] && _lib[_li][typeKey] === design[typeKey]) { _conflict = _lib[_li]; break; }
          }
          if (_conflict) break;
        }
        if (_conflict) { setSetsSelConflict({ incoming: design, conflicting: _conflict, typeKey: typeKey }); return; }
      }
      setSetsSelMode(Object.assign({}, setsSelMode, { selectedIds: cur.concat([design.id]) }));
    }
  }

  function setsHandleSelectAll(moduleType, allIds) {
    if (!setsSelMode) return;
    if (moduleType !== "block" && moduleType !== "vfx") {
      setSetsSelMode(Object.assign({}, setsSelMode, { selectedIds: allIds.slice() }));
      return;
    }
    var _typeKey = moduleType === "block" ? "assignedTo" : "effectType";
    var _typeList = moduleType === "block" ? BD_BLOCK_TYPES : VFX_EFFECT_TYPES;
    var _lib = moduleType === "block" ? bdSaved : vfxSaved;
    var _groups = {};
    for (var _i = 0; _i < allIds.length; _i++) {
      var _d = null;
      for (var _j = 0; _j < _lib.length; _j++) { if (_lib[_j].id === allIds[_i]) { _d = _lib[_j]; break; } }
      if (!_d) continue;
      var _t = _d[_typeKey] || "unknown";
      if (!_groups[_t]) _groups[_t] = [];
      _groups[_t].push(_d);
    }
    var _autoIds = [];
    var _conflictGroups = [];
    var _tkeys = Object.keys(_groups);
    for (var _ti = 0; _ti < _tkeys.length; _ti++) {
      var _tk = _tkeys[_ti];
      if (_groups[_tk].length === 1) {
        _autoIds.push(_groups[_tk][0].id);
      } else {
        var _typeLabel = "";
        for (var _li = 0; _li < _typeList.length; _li++) { if (_typeList[_li].id === _tk) { _typeLabel = _typeList[_li].label; break; } }
        _conflictGroups.push({ typeId: _tk, typeLabel: _typeLabel || _tk, moduleType: moduleType, designs: _groups[_tk], selectedId: _groups[_tk][0].id });
      }
    }
    if (_conflictGroups.length === 0) {
      setSetsSelMode(Object.assign({}, setsSelMode, { selectedIds: allIds.slice() }));
    } else {
      var _selModeCapture = setsSelMode;
      setSetsSelectAllConflicts({ autoIds: _autoIds, groups: _conflictGroups, onConfirm: function(finalIds) {
        setSetsSelMode(Object.assign({}, _selModeCapture, { selectedIds: finalIds }));
      }});
    }
  }

  function loadSavedLevels() {
    setLevelsLoading(true);
    if (!window.storage || !window.storage.get) { setSavedLevels([SAMPLE_LEVEL]); setLevelsLoading(false); return; }
    window.storage.get(LEVEL_STORAGE_KEY).then(function(r) {
      if (r && r.value) {
        var levels = JSON.parse(r.value);
        levels.sort(function(a, b) { return (b.modified || 0) - (a.modified || 0); });
        var _needsNums = false;
        for (var _ni = 0; _ni < levels.length; _ni++) { if (levels[_ni].levelNum == null) { _needsNums = true; break; } }
        if (_needsNums) {
          for (var _ai = 0; _ai < levels.length; _ai++) { if (levels[_ai].levelNum == null) levels[_ai].levelNum = _ai + 1; }
          persistLevels(levels);
        }
        if (levels.length === 0) { levels = [SAMPLE_LEVEL]; persistLevels(levels); }
        setSavedLevels(levels);
        storageWorking.current = true;
      } else {
        var seed = [SAMPLE_LEVEL];
        setSavedLevels(seed);
        persistLevels(seed);
      }
      setLevelsLoading(false);
    }).catch(function() { storageWorking.current = false; setSavedLevels([SAMPLE_LEVEL]); setLevelsLoading(false); });
  }

  function copyLevel(lv) {
    openBuilder({ grid: lv.grid.slice(), shipStart: lv.shipStart, startPlasma: lv.startPlasma, darkLevel: !!(lv.darkLevel), id: null, name: (lv.name || "Untitled") + " (copy)" });
  }

  // ── Undo/redo plumbing ──
  function lbHistoryReset(state) {
    lbHistoryRef.current = { stack: [JSON.parse(JSON.stringify(state))], idx: 0, lastKey: null, lastTime: 0 };
    setLbHistVersion(function(v) { return v + 1; });
  }
  function lbHistoryPush(state, coalesceKey) {
    var h = lbHistoryRef.current; var now = Date.now();
    var snap = JSON.parse(JSON.stringify(state));
    if (coalesceKey && h.lastKey === coalesceKey && now - h.lastTime < 600 && h.idx >= 0) {
      h.stack[h.idx] = snap; h.lastTime = now;
    } else {
      h.stack = h.stack.slice(0, h.idx + 1); h.stack.push(snap);
      if (h.stack.length > 50) { h.stack.shift(); }
      h.idx = h.stack.length - 1; h.lastKey = coalesceKey || null; h.lastTime = now;
    }
    setLbHistVersion(function(v) { return v + 1; });
  }
  function lbApplyHistorySnap(s) {
    setBuilderGrid(s.grid.slice());
    setBuilderShipStart(s.shipStart);
    setBuilderLevelName(s.name);
    setBuilderPlasma(s.plasma);
    setBuilderDirty(true);
  }
  function lbUndo() {
    var h = lbHistoryRef.current; if (h.idx <= 0) return;
    h.idx -= 1; h.lastKey = null;
    lbApplyHistorySnap(h.stack[h.idx]);
    setLbHistVersion(function(v) { return v + 1; });
  }
  function lbRedo() {
    var h = lbHistoryRef.current; if (h.idx >= h.stack.length - 1) return;
    h.idx += 1; h.lastKey = null;
    lbApplyHistorySnap(h.stack[h.idx]);
    setLbHistVersion(function(v) { return v + 1; });
  }
  var lbCanUndo = lbHistoryRef.current.idx > 0;
  var lbCanRedo = lbHistoryRef.current.idx < lbHistoryRef.current.stack.length - 1;

  function openBuilder(levelData) {
    var initial;
    if (levelData) {
      initial = { grid: levelData.grid.slice(), shipStart: levelData.shipStart != null ? levelData.shipStart : 3, name: levelData.name || "", plasma: levelData.startPlasma || START_PLASMA };
      setEditingLevelId(levelData.id || null);
    } else {
      initial = { grid: new Array(COLS * ROWS).fill(0), shipStart: 3, name: "", plasma: START_PLASMA };
      setEditingLevelId(null);
    }
    setBuilderGrid(initial.grid.slice());
    setBuilderShipStart(initial.shipStart);
    setBuilderLevelName(initial.name);
    setBuilderPlasma(initial.plasma);
    setBuilderDarkLevel(levelData ? !!(levelData.darkLevel) : false);
    lbHistoryReset(initial);
    setSelectedBlockType(null);
    setEraserActive(false);
    setBuilderDirty(false);
    setBuilderWarn(null);
    if (!builderTourSeenRef.current) { setBuilderTourStep(0); }
    setLbScreen("editor");
  }

  function builderCellAction(idx) {
    setCrateSubPanelOpen(false);
    if (selectedBlockType === 17 && builderGrid.indexOf(17) >= 0 && builderGrid[idx] !== 17) {
      setBuilderWarn("Only one UFO allowed. Remove it from the board to place in a new location.");
      setTimeout(function() { setBuilderWarn(null); }, 3000);
      return;
    }
    setBuilderGrid(function(prev) {
      var g = prev.slice();
      if (eraserActive) { g[idx] = 0; }
      else if (selectedBlockType !== null) {
        if (g[idx] === selectedBlockType) { g[idx] = 0; }
        else { g[idx] = selectedBlockType; }
      } else {
        if (g[idx] > 0) g[idx] = 0;
        else return prev;
      }
      lbHistoryPush({ grid: g, shipStart: builderShipStart, name: builderLevelName, plasma: builderPlasma }, eraserActive ? "erase" : "paint");
      return g;
    });
    setBuilderDirty(true);
  }

  function getBuilderIdxFromTouch(touch) {
    if (!builderGridRef.current) return -1;
    var r = builderGridRef.current.getBoundingClientRect();
    var x = touch.clientX - r.left, y = touch.clientY - r.top;
    var col = Math.floor(x / (r.width / COLS));
    var row = Math.floor(y / (r.height / ROWS));
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
    return row * COLS + col;
  }

  function handleBuilderGridTS(e) { e.preventDefault(); builderTouchUsedRef.current = true; var t = e.touches[0]; var canDrag = selectedBlockType !== null || eraserActive; builderDragRef.current = { lastIdx: -1, active: canDrag }; var idx = getBuilderIdxFromTouch(t); if (idx >= 0) { builderCellAction(idx); builderDragRef.current.lastIdx = idx; } }
  function handleBuilderGridTM(e) { e.preventDefault(); if (!builderDragRef.current || !builderDragRef.current.active) return; var t = e.touches[0]; var idx = getBuilderIdxFromTouch(t); if (idx >= 0 && idx !== builderDragRef.current.lastIdx) { setBuilderGrid(function(prev) { var g = prev.slice(); var changed = false; if (eraserActive) { if (g[idx] !== 0) { g[idx] = 0; changed = true; } } else if (selectedBlockType !== null && g[idx] !== selectedBlockType) { if (selectedBlockType === 17 && g.indexOf(17) >= 0) return prev; g[idx] = selectedBlockType; changed = true; } if (!changed) return prev; lbHistoryPush({ grid: g, shipStart: builderShipStart, name: builderLevelName, plasma: builderPlasma }, eraserActive ? "erase" : "paint"); return g; }); setBuilderDirty(true); builderDragRef.current.lastIdx = idx; } }
  function handleBuilderGridTE(e) { e.preventDefault(); builderDragRef.current = null; setTimeout(function() { builderTouchUsedRef.current = false; }, 300); }
  function handleBuilderGridMD(e) { if (builderTouchUsedRef.current) return; builderTouchUsedRef.current = true; var canDrag = selectedBlockType !== null || eraserActive; builderDragRef.current = { lastIdx: -1, active: canDrag }; var idx = getBuilderIdxFromTouch(e); if (idx >= 0) { builderCellAction(idx); builderDragRef.current.lastIdx = idx; } }
  function handleBuilderGridMM(e) { if (!builderDragRef.current || !builderDragRef.current.active) return; var idx = getBuilderIdxFromTouch(e); if (idx >= 0 && idx !== builderDragRef.current.lastIdx) { setBuilderGrid(function(prev) { var g = prev.slice(); var changed = false; if (eraserActive) { if (g[idx] !== 0) { g[idx] = 0; changed = true; } } else if (selectedBlockType !== null && g[idx] !== selectedBlockType) { if (selectedBlockType === 17 && g.indexOf(17) >= 0) return prev; g[idx] = selectedBlockType; changed = true; } if (!changed) return prev; lbHistoryPush({ grid: g, shipStart: builderShipStart, name: builderLevelName, plasma: builderPlasma }, eraserActive ? "erase" : "paint"); return g; }); setBuilderDirty(true); builderDragRef.current.lastIdx = idx; } }
  function handleBuilderGridMU() { builderDragRef.current = null; setTimeout(function() { builderTouchUsedRef.current = false; }, 100); }
  function handleBuilderGridClick(e) { if (builderTouchUsedRef.current) return; if (!builderGridRef.current) return; var r = builderGridRef.current.getBoundingClientRect(); var x = e.clientX - r.left, y = e.clientY - r.top; var col = Math.floor(x / (r.width / COLS)); var row = Math.floor(y / (r.height / ROWS)); if (col >= 0 && col < COLS && row >= 0 && row < ROWS) { builderCellAction(row * COLS + col); } }

  function validateBuilderGrid(g) { var hasDestructible = false; for (var i = 0; i < g.length; i++) { if (g[i] > 0 && !WIN_EXEMPT[g[i]]) { hasDestructible = true; break; } } return hasDestructible; }

  function updateLevelNum(lvId, valStr) {
    var n = parseInt(valStr, 10);
    setLvNumInput(null);
    if (isNaN(n) || n < 1) return;
    setSavedLevels(function(prev) {
      var levels = prev.slice();
      for (var i = 0; i < levels.length; i++) {
        if (levels[i].id === lvId) { levels[i] = Object.assign({}, levels[i], { levelNum: n }); break; }
      }
      persistLevels(levels);
      return levels;
    });
  }

  function lvReorder(fromSortedIdx, toSortedIdx) {
    setSavedLevels(function(prev) {
      var sorted = sortItems(prev.slice(), "level_num", "modified");
      var item = sorted.splice(fromSortedIdx, 1)[0];
      sorted.splice(toSortedIdx, 0, item);
      for (var i = 0; i < sorted.length; i++) { sorted[i] = Object.assign({}, sorted[i], { levelNum: i + 1 }); }
      var updMap = {};
      for (var j = 0; j < sorted.length; j++) { updMap[sorted[j].id] = sorted[j]; }
      var result = [];
      for (var k = 0; k < prev.length; k++) { result.push(updMap[prev[k].id] || prev[k]); }
      persistLevels(result);
      return result;
    });
  }

  function lvDragStart(idx, e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    lvDragRef.current = { idx: idx };
    if (e.currentTarget.setPointerCapture && e.pointerId != null) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch(err) {}
    }
  }

  function lvDragMove(e) {
    var d = lvDragRef.current;
    if (!d) return;
    if (e.preventDefault) e.preventDefault();
    var rows = document.querySelectorAll("[data-lv-row]");
    var cy = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    var targetIdx = d.idx;
    var displayPos = rows.length;
    for (var _li = 0; _li < rows.length; _li++) {
      var r = rows[_li].getBoundingClientRect();
      if (cy < r.top + r.height / 2) { targetIdx = parseInt(rows[_li].getAttribute("data-lv-idx"), 10); displayPos = _li; break; }
      if (_li === rows.length - 1) targetIdx = parseInt(rows[_li].getAttribute("data-lv-idx"), 10);
    }
    setLvDragHover(displayPos);
    if (!isNaN(targetIdx) && targetIdx !== d.idx) { lvReorder(d.idx, targetIdx); d.idx = targetIdx; }
  }

  function lvDragEnd(e) { lvDragRef.current = null; setLvDragHover(null); }

  function doSaveLevel(id, name) {
    if (savingRef.current) return;
    savingRef.current = true;
    var levelId = id || genUUID();
    var now = Date.now();
    var nowStr = new Date().toISOString();
    var entry = { id: levelId, name: name || "Untitled Level", grid: builderGrid.slice(), shipStart: builderShipStart, startPlasma: builderPlasma, darkLevel: builderDarkLevel, created: now, modified: now, savedAt: nowStr };
    setSavedLevels(function(prev) {
      var levels = prev.slice();
      var found = false;
      for (var i = 0; i < levels.length; i++) { if (levels[i].id === levelId) { entry.created = levels[i].created || now; entry.levelNum = levels[i].levelNum; levels[i] = entry; found = true; break; } }
      if (!found) {
        var _maxLvNum = 0;
        for (var _lni = 0; _lni < levels.length; _lni++) { if (levels[_lni].levelNum && levels[_lni].levelNum > _maxLvNum) _maxLvNum = levels[_lni].levelNum; }
        entry.levelNum = _maxLvNum + 1;
        levels.push(entry);
      }
      persistLevels(levels);
      return levels;
    });
    savingRef.current = false;
    setEditingLevelId(levelId);
    setBuilderLevelName(entry.name);
    setBuilderDirty(false);
    setBuilderWarn("Saved!" + (storageWorking.current ? "" : " (session only - use Export to keep)"));
    setTimeout(function() { setBuilderWarn(null); }, storageWorking.current ? 2000 : 4000);
  }

  function handleBuilderSave() {
    if (!validateBuilderGrid(builderGrid)) { setBuilderWarn("Level has no destructible blocks and cannot be won."); return; }
    if (editingLevelId) { doSaveLevel(editingLevelId, builderLevelName || "Untitled Level"); }
    else { doSaveLevel(null, builderLevelName || "Untitled Level"); }
  }

  function handleBuilderSaveAndPlay() {
    if (!validateBuilderGrid(builderGrid)) { setBuilderWarn("Level has no destructible blocks and cannot be won."); return; }
    var levelId = editingLevelId || genUUID();
    doSaveLevel(levelId, builderLevelName || "Untitled Level");
    // Brief delay so the level is persisted to storage before the game loads it.
    setTimeout(function() { navigateToGame(levelId); }, 60);
  }

  function handleBuilderBack() { if (builderDirty) { setShowBackWarn(true); return; } loadSavedLevels(); setLbScreen("list"); }

  function deleteLevel(id) { setSavedLevels(function(prev) { var levels = prev.filter(function(l) { return l.id !== id; }); persistLevels(levels); return levels; }); setDeletingId(null); }
  function renameLevel(id, newName) { setSavedLevels(function(prev) { var levels = prev.map(function(l) { return l.id === id ? Object.assign({}, l, { name: newName, modified: Date.now() }) : l; }); persistLevels(levels); return levels; }); setRenamingId(null); }
  function exportLevel(levelData) { var out = JSON.stringify({ name: levelData.name || "Untitled", grid: levelData.grid, ship: levelData.shipStart != null ? levelData.shipStart : 3, plasma: levelData.startPlasma || START_PLASMA, savedAt: levelData.savedAt || new Date().toLocaleString() }); setExportText(out); setExportId(levelData.id); setCopied(false); }
  function exportAllLevels() { var arr = savedLevels.map(function(lv) { return { name: lv.name || "Untitled", grid: lv.grid, ship: lv.shipStart != null ? lv.shipStart : 3, plasma: lv.startPlasma || START_PLASMA, savedAt: lv.savedAt || new Date().toLocaleString() }; }); setExportAllText(JSON.stringify(arr)); setShowExportAll(true); setCopied(false); }

  function validateLevelData(parsed) {
    if (!parsed.grid || !Array.isArray(parsed.grid)) return "Missing or invalid grid data";
    if (parsed.grid.length !== COLS * ROWS) return "Grid must have " + (COLS * ROWS) + " cells (got " + parsed.grid.length + ")";
    for (var i = 0; i < parsed.grid.length; i++) { var v = parsed.grid[i]; if (typeof v !== "number" || v < 0 || v > 17 || v !== Math.floor(v)) return "Invalid block type at position " + i; }
    return null;
  }

  function handleImport() {
    var text = importText.trim();
    if (!text) { setImportError("Paste a level code first"); return; }
    var parsed;
    try { parsed = JSON.parse(text); } catch (e) { setImportError("Invalid format - not valid JSON"); return; }
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) { setImportError("Empty array - no levels to import"); return; }
      var newEntries = [];
      for (var a = 0; a < parsed.length; a++) { var err = validateLevelData(parsed[a]); if (err) { setImportError("Level " + (a + 1) + ": " + err); return; } var now = Date.now(); newEntries.push({ id: genUUID(), name: parsed[a].name || ("Imported " + (a + 1)), grid: parsed[a].grid, shipStart: typeof parsed[a].ship === "number" ? Math.max(0, Math.min(COLS - 1, Math.floor(parsed[a].ship))) : 3, startPlasma: typeof parsed[a].plasma === "number" ? parsed[a].plasma : START_PLASMA, created: now, modified: now, savedAt: parsed[a].savedAt || new Date().toLocaleString() }); }
      setSavedLevels(function(prev) { var levels = prev.concat(newEntries); persistLevels(levels); return levels; });
      setShowImport(false); setImportText(""); setImportError(""); return;
    }
    var err2 = validateLevelData(parsed);
    if (err2) { setImportError(err2); return; }
    var now2 = Date.now();
    var entry = { id: genUUID(), name: parsed.name || "Imported Level", grid: parsed.grid, shipStart: typeof parsed.ship === "number" ? Math.max(0, Math.min(COLS - 1, Math.floor(parsed.ship))) : 3, startPlasma: typeof parsed.plasma === "number" ? parsed.plasma : START_PLASMA, created: now2, modified: now2, savedAt: parsed.savedAt || new Date().toLocaleString() };
    setSavedLevels(function(prev) { var levels = prev.concat([entry]); persistLevels(levels); return levels; });
    setShowImport(false); setImportText(""); setImportError("");
  }

  // ═══════════════════════════════════════
  // BLOCK DESIGNER FUNCTIONS
  // ═══════════════════════════════════════

  // ── Undo/redo plumbing ──
  // History stores deep-cloned snapshots of bdDesign. We push *after* a
  // change so stack[idx] is always "current". A coalesce key (typically the
  // field name) collapses runs of same-key updates (slider scrubs, color
  // drags) into one undo step within HISTORY_COALESCE_MS.
  function bdHistoryReset(state) {
    bdHistoryRef.current = { stack: [JSON.parse(JSON.stringify(state))], idx: 0, lastKey: null, lastTime: 0 };
    setBdHistVersion(function(v) { return v + 1; });
  }
  function bdHistoryPush(state, coalesceKey) {
    var h = bdHistoryRef.current;
    var now = Date.now();
    var snap = JSON.parse(JSON.stringify(state));
    if (coalesceKey && h.lastKey === coalesceKey && now - h.lastTime < 600 && h.idx >= 0) {
      // Same field touched again recently — overwrite the top of the stack
      // instead of pushing a new step, so the whole drag collapses.
      h.stack[h.idx] = snap;
      h.lastTime = now;
    } else {
      // Truncate any redo branch and push a fresh entry, then cap at 50.
      h.stack = h.stack.slice(0, h.idx + 1);
      h.stack.push(snap);
      if (h.stack.length > 50) { h.stack.shift(); }
      h.idx = h.stack.length - 1;
      h.lastKey = coalesceKey || null;
      h.lastTime = now;
    }
    setBdHistVersion(function(v) { return v + 1; });
  }
  function bdUndo() {
    var h = bdHistoryRef.current;
    if (h.idx <= 0) return;
    h.idx -= 1;
    h.lastKey = null;
    setBdDesign(JSON.parse(JSON.stringify(h.stack[h.idx])));
    setBdDirty(true);
    setBdHistVersion(function(v) { return v + 1; });
  }
  function bdRedo() {
    var h = bdHistoryRef.current;
    if (h.idx >= h.stack.length - 1) return;
    h.idx += 1;
    h.lastKey = null;
    setBdDesign(JSON.parse(JSON.stringify(h.stack[h.idx])));
    setBdDirty(true);
    setBdHistVersion(function(v) { return v + 1; });
  }
  var bdCanUndo = bdHistoryRef.current.idx > 0;
  var bdCanRedo = bdHistoryRef.current.idx < bdHistoryRef.current.stack.length - 1;

  function bdUpdateDesign(key, value) {
    // Compute next state synchronously so we can both snapshot and apply it.
    var prev = bdDesign;
    var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
    if (bdPhase > 1 && PHASE_PROPS.indexOf(key) >= 0 && next.phases) {
      var newPhases = {}; Object.keys(next.phases).forEach(function(p) { newPhases[p] = {}; Object.keys(next.phases[p]).forEach(function(pk) { newPhases[p][pk] = next.phases[p][pk]; }); });
      if (!newPhases[bdPhase]) newPhases[bdPhase] = {};
      newPhases[bdPhase][key] = value; next.phases = newPhases;
    } else { next[key] = value; }
    // Coalesce key includes phase so toggling phases doesn't collapse with an
    // edit of the same field on a different phase.
    bdHistoryPush(next, key + "@" + bdPhase);
    setBdDesign(next);
    setBdDirty(true);
  }

  function bdTogglePanel(key) { setBdActivePanel(function(prev) { return prev === key ? null : key; }); }

  function bdSaveCurrentDesign() {
    var saveName = bdDesign.name.trim() || "Unnamed Design";
    var newDesign = {}; Object.keys(bdDesign).forEach(function(k) { newDesign[k] = bdDesign[k]; });
    newDesign.name = saveName;
    newDesign.id = bdEditId || genUUID();
    newDesign.createdAt = newDesign.createdAt || new Date().toISOString();
    newDesign.modifiedAt = new Date().toISOString();
    setBdSaved(function(prev) {
      var list = prev.slice(); var found = false;
      for (var i = 0; i < list.length; i++) { if (list[i].id === newDesign.id) { list[i] = newDesign; found = true; break; } }
      if (!found) list.push(newDesign);
      bdSaveDesigns(list); return list;
    });
    setBdEditId(newDesign.id);
    setBdDesign(function(prev) { return Object.assign({}, prev, { name: saveName }); });
    setBdDirty(false);
    setBdSaveStatus("Saved!");
    setTimeout(function() { setBdSaveStatus(""); }, 2000);
  }

  function bdDeleteDesign(id) {
    setBdSaved(function(prev) { var list = prev.filter(function(d) { return d.id !== id; }); bdSaveDesigns(list); return list; });
    setBdActiveMap(function(prev) {
      var next = {}; var changed = false;
      Object.keys(prev).forEach(function(k) { if (prev[k] === id) { changed = true; } else { next[k] = prev[k]; } });
      if (changed) bdSaveActive(next);
      return changed ? next : prev;
    });
    if (bdEditId === id) setBdEditId(null);
    setBdDeletingId(null);
  }

  // Toggle a saved design as the active design for its assigned block type.
  function bdToggleActive(design) {
    if (!design || !design.id || !design.assignedTo) return;
    setBdActiveMap(function(prev) {
      var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
      if (next[design.assignedTo] === design.id) { delete next[design.assignedTo]; }
      else { next[design.assignedTo] = design.id; }
      bdSaveActive(next);
      return next;
    });
  }

  // Render a numeric Level Builder block: uses the active Block Designer
  // design when one exists, otherwise falls back to the hardcoded BlockContent.
  function renderBuilderBlock(type, size, shieldLevel) {
    var design = bdResolveActiveDesign(type, bdActiveMap, bdSaved);
    if (!design) return React.createElement(BlockContent, { type: type, size: size, shieldLevel: shieldLevel || 0 });
    if (type >= 11 && type <= 16) {
      var badgeBox = Math.max(11, size * 0.34);
      var cvColor = null;
      for (var ci = 0; ci < CRATE_VARIANTS.length; ci++) { if (CRATE_VARIANTS[ci].type === type) { cvColor = CRATE_VARIANTS[ci].color; break; } }
      return React.createElement("div", { style: { position: "relative", width: size, height: size } },
        React.createElement(BDBlockPreview, { design: design, size: size }),
        React.createElement("div", { style: { position: "absolute", bottom: -2, right: -2, width: badgeBox, height: badgeBox, borderRadius: "50%", background: "rgba(10,10,20,0.85)", border: "1px solid " + (cvColor || "rgba(255,255,255,0.3)"), display: "flex", alignItems: "center", justifyContent: "center" } }, crateBadgeIcon(type, size)));
    }
    return React.createElement(BDBlockPreview, { design: design, size: size });
  }

  function bdRenameDesign(id, newName) {
    setBdSaved(function(prev) {
      var list = prev.map(function(d) { return d.id === id ? Object.assign({}, d, { name: newName, modifiedAt: new Date().toISOString() }) : d; });
      bdSaveDesigns(list); return list;
    });
    setBdRenamingId(null);
  }

  function bdOpenEditor(design) {
    var initial;
    if (design) {
      initial = {}; Object.keys(design).forEach(function(k) { initial[k] = design[k]; });
      setBdEditId(design.id || null);
    } else {
      initial = bdDefaultDesign();
      setBdEditId(null);
    }
    setBdDesign(initial);
    bdHistoryReset(initial);
    setBdPhase(1);
    setBdDirty(false);
    setBdSaveStatus("");
    setBdActivePanel("shape");
    setBdCurrentView("editor");
    if (bdScrollRef.current) { bdScrollRef.current.scrollTop = 0; }
  }

  function bdCopyPreset(preset) {
    var copy = {}; Object.keys(preset).forEach(function(k) { copy[k] = preset[k]; });
    copy.isFactory = false; copy.id = null; copy.name = preset.name + " (custom)";
    setBdDesign(copy);
    bdHistoryReset(copy);
    setBdEditId(null);
    setBdDirty(true);
    setBdPhase(1);
    setBdActivePanel("shape");
    setBdCurrentView("editor");
  }

  function bdHandleBack() {
    if (bdDirty) { setBdShowBackWarn(true); return; }
    setBdCurrentView("list");
  }

  function bdExportDesign(design) {
    var out = {}; Object.keys(design).forEach(function(k) { if (k !== "isFactory") out[k] = design[k]; });
    setBdExportText(JSON.stringify(out));
    setBdExportId(design.id);
    setBdCopied(false);
  }

  function bdExportAllDesigns() {
    var arr = bdSaved.map(function(d) { var out = {}; Object.keys(d).forEach(function(k) { out[k] = d[k]; }); return out; });
    setBdExportAllText(JSON.stringify(arr));
    setBdShowExportAll(true);
    setBdCopied(false);
  }

  // Export the custom designs currently set active, as one importable group.
  function bdExportActiveBlocks() {
    var arr = [];
    Object.keys(bdActiveMap).forEach(function(typeId) {
      var id = bdActiveMap[typeId];
      for (var i = 0; i < bdSaved.length; i++) {
        if (bdSaved[i].id === id && bdSaved[i].assignedTo === typeId) {
          var out = {}; Object.keys(bdSaved[i]).forEach(function(k) { out[k] = bdSaved[i][k]; });
          arr.push(out); break;
        }
      }
    });
    setBdExportAllText(JSON.stringify(arr));
    setBdShowExportAll(true);
    setBdCopied(false);
  }

  // Set imported designs active for their block types (merge - leaves other types alone).
  // When multiple entries share the same assignedTo, picks the most-recently-edited one.
  function bdActivateImported(entries) {
    var best = {};
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (!e.assignedTo) continue;
      if (!best[e.assignedTo]) {
        best[e.assignedTo] = e;
      } else {
        var existingTime = best[e.assignedTo].modifiedAt ? new Date(best[e.assignedTo].modifiedAt).getTime() : 0;
        var newTime = e.modifiedAt ? new Date(e.modifiedAt).getTime() : 0;
        if (newTime > existingTime) { best[e.assignedTo] = e; }
      }
    }
    setBdActiveMap(function(prev) {
      var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
      Object.keys(best).forEach(function(k) { next[k] = best[k].id; });
      bdSaveActive(next); return next;
    });
  }

  function bdConfirmImport() {
    var entries = bdImportConfirm;
    setBdSaved(function(prev) { var list = prev.concat(entries); bdSaveDesigns(list); return list; });
    bdActivateImported(entries);
    setBdImportConfirm(null);
  }

  function bdValidateDesignImport(parsed) {
    if (typeof parsed !== "object" || parsed === null) return "Invalid design data";
    if (!parsed.shape || typeof parsed.color !== "string") return "Missing required fields (shape, color)";
    return null;
  }

  function bdHandleImport() {
    var text = bdImportText.trim();
    if (!text) { setBdImportError("Paste a design code first"); return; }
    var parsed;
    try { parsed = JSON.parse(text); } catch (e) { setBdImportError("Invalid format - not valid JSON"); return; }
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) { setBdImportError("Empty array - no designs to import"); return; }
      var newEntries = [];
      for (var a = 0; a < parsed.length; a++) { var err = bdValidateDesignImport(parsed[a]); if (err) { setBdImportError("Design " + (a + 1) + ": " + err); return; } var entry = Object.assign({}, bdDefaultDesign(), parsed[a]); entry.id = genUUID(); entry.isFactory = false; entry.modifiedAt = new Date().toISOString(); newEntries.push(entry); }
      if (bdSavedTab === "active") { setBdImportConfirm(newEntries); setBdShowImport(false); setBdImportText(""); setBdImportError(""); return; }
      setBdSaved(function(prev) { var list = prev.concat(newEntries); bdSaveDesigns(list); return list; });
      setBdShowImport(false); setBdImportText(""); setBdImportError(""); return;
    }
    var err2 = bdValidateDesignImport(parsed);
    if (err2) { setBdImportError(err2); return; }
    var entry2 = Object.assign({}, bdDefaultDesign(), parsed); entry2.id = genUUID(); entry2.isFactory = false; entry2.modifiedAt = new Date().toISOString();
    if (bdSavedTab === "active") { setBdImportConfirm([entry2]); setBdShowImport(false); setBdImportText(""); setBdImportError(""); return; }
    setBdSaved(function(prev) { var list = prev.concat([entry2]); bdSaveDesigns(list); return list; });
    setBdShowImport(false); setBdImportText(""); setBdImportError("");
  }

  // ── VFX Studio: design list / editor (mirrors the bd* functions) ──
  // ── Undo/redo plumbing (matches the BD pilot) ──
  function vfxHistoryReset(state) {
    vfxHistoryRef.current = { stack: [JSON.parse(JSON.stringify(state))], idx: 0, lastKey: null, lastTime: 0 };
    setVfxHistVersion(function(v) { return v + 1; });
  }
  function vfxHistoryPush(state, coalesceKey) {
    var h = vfxHistoryRef.current; var now = Date.now();
    var snap = JSON.parse(JSON.stringify(state));
    if (coalesceKey && h.lastKey === coalesceKey && now - h.lastTime < 600 && h.idx >= 0) {
      h.stack[h.idx] = snap; h.lastTime = now;
    } else {
      h.stack = h.stack.slice(0, h.idx + 1); h.stack.push(snap);
      if (h.stack.length > 50) { h.stack.shift(); }
      h.idx = h.stack.length - 1; h.lastKey = coalesceKey || null; h.lastTime = now;
    }
    setVfxHistVersion(function(v) { return v + 1; });
  }
  function vfxUndo() {
    var h = vfxHistoryRef.current; if (h.idx <= 0) return;
    h.idx -= 1; h.lastKey = null;
    setVfxEditDesign(JSON.parse(JSON.stringify(h.stack[h.idx])));
    setVfxDirty(true); setVfxPrevKey(function(k) { return k + 1; });
    setVfxHistVersion(function(v) { return v + 1; });
  }
  function vfxRedo() {
    var h = vfxHistoryRef.current; if (h.idx >= h.stack.length - 1) return;
    h.idx += 1; h.lastKey = null;
    setVfxEditDesign(JSON.parse(JSON.stringify(h.stack[h.idx])));
    setVfxDirty(true); setVfxPrevKey(function(k) { return k + 1; });
    setVfxHistVersion(function(v) { return v + 1; });
  }
  var vfxCanUndo = vfxHistoryRef.current.idx > 0;
  var vfxCanRedo = vfxHistoryRef.current.idx < vfxHistoryRef.current.stack.length - 1;

  function vfxUpdateDesign(key, value) {
    var prev = vfxEditDesign;
    var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
    next[key] = value;
    vfxHistoryPush(next, key);
    setVfxEditDesign(next);
    setVfxDirty(true);
    // Bump the preview key so its whole subtree remounts and every particle
    // animation restarts in sync. Without this, changing e.g. Count adds/removes
    // particle nodes mid-flight while the survivors keep their old animation
    // clock, so they drift out of phase. (Name changes don't affect the preview.)
    if (key !== "name") setVfxPrevKey(function(k) { return k + 1; });
  }
  function vfxSaveCurrentDesign() {
    if (!vfxEditDesign.effectType) { setVfxSaveStatus("Pick an effect type first"); setTimeout(function() { setVfxSaveStatus(""); }, 2500); return; }
    var saveName = (vfxEditDesign.name || "").trim() || "Unnamed Effect";
    var newDesign = {}; Object.keys(vfxEditDesign).forEach(function(k) { newDesign[k] = vfxEditDesign[k]; });
    newDesign.name = saveName;
    newDesign.id = vfxEditId || genUUID();
    newDesign.createdAt = newDesign.createdAt || new Date().toISOString();
    newDesign.modifiedAt = new Date().toISOString();
    setVfxSaved(function(prev) {
      var list = prev.slice(); var found = false;
      for (var i = 0; i < list.length; i++) { if (list[i].id === newDesign.id) { list[i] = newDesign; found = true; break; } }
      if (!found) list.push(newDesign);
      vfxSaveDesigns(list); return list;
    });
    setVfxEditId(newDesign.id);
    setVfxEditDesign(function(prev) { return Object.assign({}, prev, { name: saveName }); });
    setVfxDirty(false);
    setVfxSaveStatus("Saved!");
    setTimeout(function() { setVfxSaveStatus(""); }, 2000);
  }
  function vfxDeleteDesign(id) {
    setVfxSaved(function(prev) { var list = prev.filter(function(d) { return d.id !== id; }); vfxSaveDesigns(list); return list; });
    setVfxActiveMap(function(prev) {
      var next = {}; var changed = false;
      Object.keys(prev).forEach(function(k) { if (prev[k] === id) { changed = true; } else { next[k] = prev[k]; } });
      if (changed) vfxSaveActive(next);
      return changed ? next : prev;
    });
    if (vfxEditId === id) setVfxEditId(null);
    setVfxDeletingId(null);
  }
  function vfxToggleActive(design) {
    if (!design || !design.id || !design.effectType) return;
    setVfxActiveMap(function(prev) {
      var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
      if (next[design.effectType] === design.id) { delete next[design.effectType]; }
      else { next[design.effectType] = design.id; }
      vfxSaveActive(next);
      return next;
    });
  }
  function vfxRenameDesign(id, newName) {
    setVfxSaved(function(prev) {
      var list = prev.map(function(d) { return d.id === id ? Object.assign({}, d, { name: newName, modifiedAt: new Date().toISOString() }) : d; });
      vfxSaveDesigns(list); return list;
    });
    setVfxRenamingId(null);
  }
  function vfxOpenEditor(design) {
    var initial;
    if (design) {
      initial = {}; Object.keys(design).forEach(function(k) { initial[k] = design[k]; });
      setVfxEditId(design.id || null);
    } else {
      initial = vfxDefaultDesign(null);
      setVfxEditId(null);
    }
    setVfxEditDesign(initial);
    vfxHistoryReset(initial);
    setVfxDirty(false);
    setVfxSaveStatus("");
    setVfxCurrentView("editor");
  }
  function vfxCopyPreset(preset) {
    var copy = {}; Object.keys(preset).forEach(function(k) { if (k !== "isFactory" && k !== "id") copy[k] = preset[k]; });
    copy.name = preset.name + " (custom)";
    setVfxEditDesign(copy);
    vfxHistoryReset(copy);
    setVfxEditId(null);
    setVfxDirty(true);
    setVfxSaveStatus("");
    setVfxCurrentView("editor");
  }
  function vfxResetDesign() {
    var params = VFX_DEFAULTS[vfxEditDesign.effectType] || {};
    var prev = vfxEditDesign;
    var next = { name: prev.name, effectType: prev.effectType };
    if (prev.id) next.id = prev.id;
    if (prev.createdAt) next.createdAt = prev.createdAt;
    Object.keys(params).forEach(function(k) { next[k] = params[k]; });
    vfxHistoryPush(next, "__reset_" + Date.now());
    setVfxEditDesign(next);
    setVfxDirty(true);
    setVfxPrevKey(function(k) { return k + 1; });
  }
  // Pick (or switch) the effect type in the editor. Switching resets the
  // type-specific params to that type's defaults, since each effect's controls
  // are entirely different; the name and ids are kept.
  function vfxPickEffectType(type) {
    if (vfxEditDesign.effectType === type) return;
    var params = VFX_DEFAULTS[type] || {};
    var prev = vfxEditDesign;
    var next = { name: prev.name, effectType: type };
    if (prev.id) next.id = prev.id;
    if (prev.createdAt) next.createdAt = prev.createdAt;
    Object.keys(params).forEach(function(k) { next[k] = params[k]; });
    vfxHistoryPush(next, "__pickType_" + Date.now());
    setVfxEditDesign(next);
    setVfxDirty(true);
  }
  function vfxHandleBack() {
    if (vfxDirty) { setVfxShowBackWarn(true); return; }
    setVfxCurrentView("list");
  }
  function vfxExportDesign(design) {
    var out = {}; Object.keys(design).forEach(function(k) { if (k !== "isFactory") out[k] = design[k]; });
    setVfxExportText(JSON.stringify(out));
    setVfxExportId(design.id);
    setVfxCopied(false);
  }
  function vfxExportAllDesigns() {
    var arr = vfxSaved.map(function(d) { var out = {}; Object.keys(d).forEach(function(k) { out[k] = d[k]; }); return out; });
    setVfxExportAllText(JSON.stringify(arr));
    setVfxShowExportAll(true);
    setVfxCopied(false);
  }
  function vfxValidateImport(parsed) {
    if (typeof parsed !== "object" || parsed === null) return "Invalid effect data";
    if (!parsed.effectType || !vfxFactoryFor(parsed.effectType)) return "Missing or unknown effectType";
    return null;
  }
  function vfxHandleImport() {
    var text = vfxImportText.trim();
    if (!text) { setVfxImportError("Paste an effect code first"); return; }
    var parsed;
    try { parsed = JSON.parse(text); } catch (e) { setVfxImportError("Invalid format - not valid JSON"); return; }
    var arr = Array.isArray(parsed) ? parsed : [parsed];
    if (arr.length === 0) { setVfxImportError("Empty array - no effects to import"); return; }
    var newEntries = [];
    for (var a = 0; a < arr.length; a++) {
      var err = vfxValidateImport(arr[a]);
      if (err) { setVfxImportError((arr.length > 1 ? "Effect " + (a + 1) + ": " : "") + err); return; }
      var entry = {}; Object.keys(arr[a]).forEach(function(k) { if (k !== "isFactory") entry[k] = arr[a][k]; });
      entry.id = genUUID();
      entry.modifiedAt = new Date().toISOString();
      newEntries.push(entry);
    }
    setVfxSaved(function(prev) { var list = prev.concat(newEntries); vfxSaveDesigns(list); return list; });
    setVfxShowImport(false); setVfxImportText(""); setVfxImportError("");
  }
  // Compact, non-animated icon for list cards (one per design, reflects its params).
  // Color picker + opacity slider on one row -- compact form used by Burn,
  // Block Destroy, and Drone Explode where each color has its own opacity.
  function renderColorWithOpacity(colorLabel, colorKey, opLabel, opKey, opDefault) {
    var opVal = vfxEditDesign[opKey] == null ? opDefault : vfxEditDesign[opKey];
    return React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "flex-end", marginBottom: 12 } },
      React.createElement("div", { style: { flexShrink: 0 } },
        React.createElement("div", { style: { fontSize: 13, color: "#889", marginBottom: 6, fontFamily: "'Exo 2', sans-serif" } }, colorLabel),
        React.createElement("input", { type: "color", value: vfxEditDesign[colorKey], onChange: function(e) { vfxUpdateDesign(colorKey, e.target.value); }, style: { width: 44, height: 44, border: "2px solid rgba(255,255,255,0.15)", borderRadius: 8, background: "none", cursor: "pointer", padding: 2, fontSize: 16 } })),
      React.createElement("div", { style: { flex: 1, paddingBottom: 6 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#889", marginBottom: 4, fontFamily: "'Exo 2', sans-serif" } },
          React.createElement("span", null, opLabel),
          React.createElement("span", { style: { color: "#bbc" } }, Math.round(opVal * 100) + "%")),
        React.createElement("input", { type: "range", min: 0.1, max: 1, step: 0.05, value: opVal, onChange: function(e) { vfxUpdateDesign(opKey, parseFloat(e.target.value)); }, style: { width: "100%", fontSize: 16 } })));
  }
  function renderVfxIcon(design) {
    var et = design.effectType;
    var box = { position: "relative", width: 44, height: 44, borderRadius: 6, background: "rgba(5,5,20,0.85)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", flexShrink: 0 };
    if (et === "acid_ooze") {
      var ic1 = design.color1 || "#1a6a1a", ic2 = design.color2 || "#35a035";
      var iw = Math.max(0.5, Math.min(2, design.width || 1));
      var iwv = Math.max(0.5, Math.min(2, design.waveSize || 1));
      var ifq = Math.max(2, Math.min(12, Math.round(design.freq == null ? 5 : design.freq)));
      var iop = vfxMakeOozePath(40, iwv, iw, ifq);
      var igid = "vfxicon_" + design.id;
      return React.createElement("div", { style: box },
        React.createElement("svg", { viewBox: "0 0 60 " + iop.svgH, width: 22, height: 40, preserveAspectRatio: "none", style: { position: "absolute", left: "50%", top: 2, transform: "translateX(-50%)" } },
          React.createElement("defs", null,
            React.createElement("linearGradient", { id: igid, x1: "0", y1: "0", x2: "1", y2: "0" },
              React.createElement("stop", { offset: "0%", stopColor: ic1, stopOpacity: "0.6" }),
              React.createElement("stop", { offset: "50%", stopColor: ic2 }),
              React.createElement("stop", { offset: "100%", stopColor: ic1, stopOpacity: "0.6" }))),
          React.createElement("path", { d: iop.path, fill: "url(#" + igid + ")" })));
    }
    if (et === "burn") {
      var ibc = (design.emberColor || "#ff6633") + vfxAlphaHex(design.emberOpacity);
      var isc = (design.sparkColor || "#ffffff") + vfxAlphaHex(design.sparkOpacity == null ? 0.85 : design.sparkOpacity);
      var idots = [];
      var iang = [25, 150, 215, 330];
      for (var bi2 = 0; bi2 < 4; bi2++) {
        var br2 = iang[bi2] * Math.PI / 180;
        idots.push(React.createElement("div", { key: bi2, style: { position: "absolute", left: 22 + Math.cos(br2) * 13 - 2, top: 22 + Math.sin(br2) * 13 - 2, width: 4, height: 4, borderRadius: bi2 % 2 ? "50%" : "1px", background: bi2 % 2 ? isc : ibc } }));
      }
      return React.createElement("div", { style: box },
        React.createElement("div", { style: { position: "absolute", left: 15, top: 15, width: 14, height: 14, borderRadius: 3, background: "#3a3030", border: "1px solid " + (design.emberColor || "#ff6633") } }),
        idots);
    }
    if (et === "block_destroy") {
      var idbc = (design.burstColor || "#c8b8ff") + vfxAlphaHex(design.burstOpacity);
      var idac = (design.accentColor || "#80ddff") + vfxAlphaHex(design.accentOpacity);
      var idots2 = [];
      var iang2 = [0, 60, 120, 180, 240, 300];
      for (var di2 = 0; di2 < 6; di2++) {
        var dr2 = iang2[di2] * Math.PI / 180;
        idots2.push(React.createElement("div", { key: di2, style: { position: "absolute", left: 22 + Math.cos(dr2) * 14 - 2, top: 22 + Math.sin(dr2) * 14 - 2, width: 4, height: 4, borderRadius: "50%", background: di2 % 2 ? idac : idbc } }));
      }
      return React.createElement("div", { style: box },
        React.createElement("div", { style: { position: "absolute", left: 16, top: 16, width: 12, height: 12, borderRadius: 3, background: "#3a3a4a", border: "1px solid " + (design.burstColor || "#c8b8ff") } }),
        idots2);
    }
    if (et === "drone_explode") {
      var ir1 = (design.coreColor || "#ffe066") + vfxAlphaHex(design.coreOpacity);
      var ir2 = (design.blastColor || "#ff6633") + vfxAlphaHex(design.blastOpacity);
      return React.createElement("div", { style: box },
        React.createElement("div", { style: { position: "absolute", left: 4, top: 4, width: 36, height: 36, borderRadius: "50%", background: "radial-gradient(circle, " + ir1 + " 0%, " + ir2 + "88 45%, transparent 72%)" } }),
        React.createElement("div", { style: { position: "absolute", left: 14, top: 14, width: 16, height: 16, borderRadius: "50%", background: "radial-gradient(circle, #fff 0%, " + (design.coreColor || "#ffe066") + " 35%, " + (design.blastColor || "#ff6633") + " 65%, transparent 85%)" } }));
    }
    if (et === "lightning") {
      var ilg = design.glowColor || "#ffe066";
      var ilb = design.boltColor || "#ffe066";
      var ilc = design.coreColor || "#fffde0";
      var ilt = Math.max(0.5, Math.min(2, design.thickness || 1));
      var ilp = "M22 40 L16 30 L27 22 L16 13 L22 4";
      return React.createElement("div", { style: box },
        React.createElement("svg", { width: 44, height: 44, viewBox: "0 0 44 44", style: { overflow: "visible" } },
          React.createElement("path", { d: ilp, stroke: ilg, strokeWidth: 6 * ilt, fill: "none", opacity: "0.3", strokeLinecap: "round", strokeLinejoin: "round" }),
          React.createElement("path", { d: ilp, stroke: ilb, strokeWidth: 2.5 * ilt, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }),
          React.createElement("path", { d: ilp, stroke: ilc, strokeWidth: 1.2 * ilt, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" })));
    }
    return React.createElement("div", { style: box });
  }
  function renderVfxPreview(design, prevKey) {
    var effect = design.effectType;
    var c = design;
    var particles = [];
    var angles8 = [0, 45, 90, 135, 180, 225, 270, 315];
    var previewStyle = { position: "relative", height: 130, background: "rgba(5,5,20,0.8)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", margin: "0 0 16px 0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" };
    if (effect === "acid_ooze") {
      var oozeC1 = c.color1 || "#1a6a1a";
      var oozeC2 = c.color2 || "#35a035";
      var oozeWidth = Math.max(0.5, Math.min(2, c.width || 1));
      var oozeWave = Math.max(0.5, Math.min(2, c.waveSize || 1));
      var oozeFreq = Math.max(2, Math.min(12, Math.round(c.freq == null ? 5 : c.freq)));
      var oozeFlow = Math.max(0.5, Math.min(2, c.speed || 1));
      var oozeBub = Math.max(0, Math.min(2, c.splash == null ? 1 : c.splash));
      var colH = 76, colW = 52;
      var op = vfxMakeOozePath(colH, oozeWave, oozeWidth, oozeFreq);
      var waveDur = (1.2 / oozeFlow).toFixed(2) + "s";
      var gid = "vfxog" + prevKey;
      var oozeBubbles = [];
      var bubCount = Math.round(oozeBub * 5);
      for (var obi = 0; obi < bubCount; obi++) {
        var obx = 12 + (obi * 13) % 28;
        var obsize = 3 + (obi % 3);
        var obdelay = ((obi * 0.47) % 2.4).toFixed(2);
        var obdur = (2 + (obi % 3) * 0.6).toFixed(2);
        oozeBubbles.push(React.createElement("div", { key: "ob" + obi, style: { position: "absolute", left: obx, top: -6, width: obsize, height: obsize, borderRadius: "50%", background: oozeC2, opacity: 0.55, animation: "vfxBubble " + obdur + "s ease-in " + obdelay + "s infinite" } }));
      }
      return React.createElement("div", { key: prevKey + "-" + effect, style: previewStyle },
        React.createElement("div", { style: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center" } },
          React.createElement("div", { style: { width: 34, height: 20, borderRadius: 5, background: oozeC1, border: "1.5px solid " + oozeC2, zIndex: 3 } }),
          React.createElement("div", { style: { position: "relative", width: colW, height: colH, overflow: "hidden", marginTop: -3 } },
            React.createElement("div", { style: { position: "absolute", left: "50%", top: 0, width: colW * 0.8, height: colH, transform: "translateX(-50%)", background: "linear-gradient(to bottom, transparent, " + oozeC2 + "33 15%, " + oozeC2 + "33 85%, transparent)", filter: "blur(6px)", pointerEvents: "none" } }),
            React.createElement("svg", { viewBox: "0 0 60 " + op.svgH, width: colW, height: colH * 2, preserveAspectRatio: "none", style: { position: "absolute", top: -colH, left: 0, animation: "vfxOozeWave " + waveDur + " linear infinite" } },
              React.createElement("defs", null,
                React.createElement("linearGradient", { id: gid, x1: "0", y1: "0", x2: "1", y2: "0" },
                  React.createElement("stop", { offset: "0%", stopColor: oozeC1, stopOpacity: "0.6" }),
                  React.createElement("stop", { offset: "35%", stopColor: oozeC2, stopOpacity: "0.9" }),
                  React.createElement("stop", { offset: "50%", stopColor: oozeC2 }),
                  React.createElement("stop", { offset: "65%", stopColor: oozeC2, stopOpacity: "0.9" }),
                  React.createElement("stop", { offset: "100%", stopColor: oozeC1, stopOpacity: "0.6" }))),
              React.createElement("path", { d: op.path, fill: "url(#" + gid + ")" })),
            oozeBubbles),
          React.createElement("div", { style: { width: colW * 0.9, height: 10, borderRadius: "50%", background: oozeC2 + "99", marginTop: -4, filter: "blur(3px)" } })));
    }
    if (effect === "burn") {
      // Mimics the in-game lightning burn: the block flares then fades out
      // while flame-colored embers scatter radially (no gravity) and white
      // sparks fly sideways and arc downward.
      var emberC = c.emberColor || "#ff6633";
      var sparkC = c.sparkColor || "#ffffff";
      var emberCol = emberC + vfxAlphaHex(c.emberOpacity);
      var sparkCol = sparkC + vfxAlphaHex(c.sparkOpacity == null ? 0.85 : c.sparkOpacity);
      var bSpeed = Math.max(0.5, Math.min(2, c.speed || 1));
      var bSpread = Math.max(0.5, Math.min(2, c.spread || 1));
      var bDensity = Math.max(0.5, Math.min(2, c.density || 1));
      var bSize = Math.max(0.5, Math.min(2, c.emberSize || 1));
      var burnDur = (1.4 / bSpeed).toFixed(2) + "s";
      var emberCount = Math.round(bDensity * 9);
      var sparkCount = Math.round(bDensity * 5);
      for (var bi = 0; bi < emberCount; bi++) {
        var brad = (bi / emberCount) * Math.PI * 2 + (bi % 2) * 0.5;
        var bdist = (24 + (bi % 3) * 13) * bSpread;
        var bsz = (4 + (bi % 3) * 2.5) * bSize;
        particles.push(React.createElement("div", { key: "e" + bi, style: { position: "absolute", left: "50%", top: "50%", width: bsz, height: bsz, marginLeft: -bsz / 2, marginTop: -bsz / 2, borderRadius: bi % 2 === 0 ? "50%" : "1px", background: emberCol, animation: "vfxBurst " + burnDur + " ease-out " + ((bi * 0.13) % 1).toFixed(2) + "s infinite", "--bx": (Math.cos(brad) * bdist).toFixed(0) + "px", "--by": (Math.sin(brad) * bdist).toFixed(0) + "px" } }));
      }
      for (var si = 0; si < sparkCount; si++) {
        var sdir = si % 2 === 0 ? 1 : -1;
        var ssx = sdir * (16 + (si % 3) * 14) * bSpread;
        var ssy = (22 + (si % 4) * 11) * bSpread;
        var ssz = (2 + (si % 2) * 1.5) * bSize;
        particles.push(React.createElement("div", { key: "s" + si, style: { position: "absolute", left: "50%", top: "50%", width: ssz, height: ssz, marginLeft: -ssz / 2, marginTop: -ssz / 2, borderRadius: "50%", background: sparkCol, animation: "vfxSpark " + burnDur + " ease-in " + (0.1 + (si * 0.17) % 0.8).toFixed(2) + "s infinite", "--sx": ssx.toFixed(0) + "px", "--sy": ssy.toFixed(0) + "px" } }));
      }
      return React.createElement("div", { key: prevKey + "-" + effect, style: previewStyle },
        React.createElement("div", { style: { width: 30, height: 30, borderRadius: 5, background: "#3a3030", border: "1.5px solid " + emberC, animation: "vfxBurnBlock " + burnDur + " ease-out infinite" } }),
        React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" } }, particles));
    }
    if (effect === "block_destroy") {
      // Mimics the in-game block pop: the block flashes and shrinks while an
      // even radial ring of uniform shards shoots straight out, alternating two
      // colors, fading in then shrinking away (all fire at once, no stagger).
      var bdBurst = c.burstColor || "#c8b8ff";
      var bdAccent = c.accentColor || "#80ddff";
      var bdBurstCol = bdBurst + vfxAlphaHex(c.burstOpacity);
      var bdAccentCol = bdAccent + vfxAlphaHex(c.accentOpacity);
      var bdSpeed = Math.max(0.5, Math.min(2, c.speed || 1));
      var bdSpread = Math.max(0.5, Math.min(2, c.spread || 1));
      var bdCount = Math.max(0.5, Math.min(2, c.count || 1));
      var bdSize = Math.max(0.5, Math.min(2, c.particleSize || 1));
      var destDur = (0.85 / bdSpeed).toFixed(2) + "s";
      var bdN = Math.round(bdCount * 8);
      for (var di = 0; di < bdN; di++) {
        var drad = (di / bdN) * Math.PI * 2;
        var ddist = 40 * bdSpread;
        var dsz = 6 * bdSize;
        particles.push(React.createElement("div", { key: "d" + di, style: { position: "absolute", left: "50%", top: "50%", width: dsz, height: dsz, marginLeft: -dsz / 2, marginTop: -dsz / 2, borderRadius: "50%", background: di % 2 === 0 ? bdBurstCol : bdAccentCol, animation: "vfxShatter " + destDur + " ease-out infinite", "--bx": (Math.cos(drad) * ddist).toFixed(0) + "px", "--by": (Math.sin(drad) * ddist).toFixed(0) + "px" } }));
      }
      return React.createElement("div", { key: prevKey + "-" + effect, style: previewStyle },
        React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" } },
          React.createElement("div", { style: { width: 28, height: 28, borderRadius: 5, background: "#3a3a4a", border: "1.5px solid " + bdBurst, animation: "vfxPop " + destDur + " ease-out infinite" } }),
          particles));
    }
    if (effect === "drone_explode") {
      // Mimics the in-game drone explosion: a layered blast -- an expanding
      // shockwave ring, a white-hot core flash, and an even radial spray of
      // shards in two sizes/colors that shrink as they fly out. All synced.
      var deCore = c.coreColor || "#ffe066";
      var deBlast = c.blastColor || "#ff6633";
      var deCoreCol = deCore + vfxAlphaHex(c.coreOpacity);
      var deBlastCol = deBlast + vfxAlphaHex(c.blastOpacity);
      var deSpeed = Math.max(0.5, Math.min(2, c.speed || 1));
      var deSpread = Math.max(0.5, Math.min(2, c.spread || 1));
      var deCount = Math.max(0.5, Math.min(2, c.count || 1));
      var deSize = Math.max(0.5, Math.min(2, c.particleSize || 1));
      var drDur = (0.95 / deSpeed).toFixed(2) + "s";
      var deN = Math.round(deCount * 12);
      for (var dri = 0; dri < deN; dri++) {
        var drrad = (dri / deN) * Math.PI * 2;
        var drdist = (32 + (dri % 3) * 9) * deSpread;
        var drsz = (dri % 3 === 0 ? 9 : 6) * deSize;
        particles.push(React.createElement("div", { key: "r" + dri, style: { position: "absolute", left: "50%", top: "50%", width: drsz, height: drsz, marginLeft: -drsz / 2, marginTop: -drsz / 2, borderRadius: "50%", background: dri % 3 === 0 ? deCoreCol : deBlastCol, animation: "vfxDroneShard " + drDur + " ease-out infinite", "--bx": (Math.cos(drrad) * drdist).toFixed(0) + "px", "--by": (Math.sin(drrad) * drdist).toFixed(0) + "px" } }));
      }
      var deRing = 80 * deSpread;
      return React.createElement("div", { key: prevKey + "-" + effect, style: previewStyle },
        React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" } },
          React.createElement("div", { style: { position: "absolute", width: deRing, height: deRing, borderRadius: "50%", background: "radial-gradient(circle, " + deCoreCol + " 0%, " + deBlastCol + "88 40%, transparent 70%)", animation: "vfxRing " + drDur + " ease-out infinite" } }),
          particles,
          React.createElement("div", { style: { position: "absolute", width: 44, height: 44, borderRadius: "50%", background: "radial-gradient(circle, #fff 0%, " + deCore + " 30%, " + deBlast + " 60%, transparent 80%)", animation: "vfxFlash " + drDur + " ease-out infinite" } })));
    }
    if (effect === "lightning") {
      var lGlow = c.glowColor || "#ffe066";
      var lBolt = c.boltColor || "#ffe066";
      var lCore = c.coreColor || "#fffde0";
      var lThick = Math.max(0.5, Math.min(2, c.thickness || 1));
      var lJag = Math.max(0.5, Math.min(2, c.jaggedness || 1));
      var lSpeed = Math.max(0.5, Math.min(2, c.speed || 1));
      var lDur = (1.4 / lSpeed).toFixed(2) + "s";
      var lH = 96, lSegs = 6, lSegH = lH / lSegs, lCx = 40;
      var lPath = "M" + lCx + " " + lH;
      var lMidX = lCx, lMidY = lH / 2;
      for (var li = 1; li <= lSegs; li++) {
        var lY = lH - li * lSegH;
        var lX = lCx + (li % 2 === 0 ? 1 : -1) * (6 + Math.sin(li * 2.7) * 8) * lJag;
        lPath += " L" + lX.toFixed(1) + " " + lY.toFixed(1);
        if (li === Math.floor(lSegs / 2)) { lMidX = lX; lMidY = lY; }
      }
      var lGW = (8 * lThick).toFixed(1), lMW = (3 * lThick).toFixed(1), lCW = (1.5 * lThick).toFixed(1);
      var lArrow = "M" + lMidX.toFixed(1) + " " + lMidY.toFixed(1) + " L" + (lMidX + 14 * lJag).toFixed(1) + " " + (lMidY - 22).toFixed(1) + " L" + (lMidX + 10 * lJag).toFixed(1) + " " + (lMidY - 38).toFixed(1);
      return React.createElement("div", { key: prevKey + "-" + effect, style: previewStyle },
        React.createElement("svg", { width: 80, height: lH + 4, viewBox: "0 0 80 " + (lH + 4), style: { overflow: "visible", animation: "vfxLightningBolt " + lDur + " ease-out infinite" } },
          React.createElement("path", { d: lPath, stroke: lGlow, strokeWidth: lGW, fill: "none", opacity: "0.3", strokeLinecap: "round", strokeLinejoin: "round" }),
          React.createElement("path", { d: lPath, stroke: lBolt, strokeWidth: lMW, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }),
          React.createElement("path", { d: lPath, stroke: lCore, strokeWidth: lCW, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }),
          React.createElement("path", { d: lArrow, stroke: lBolt, strokeWidth: "2", fill: "none", opacity: "0.6", strokeLinecap: "round", strokeLinejoin: "round" })));
    }
    return React.createElement("div", { key: prevKey + "-" + effect, style: previewStyle });
  }

  // ═══════════════════════════════════════
  // SHARED OVERLAY RENDERERS
  // ═══════════════════════════════════════

  function renderDeleteOverlay(title, onCancel, onConfirm) {
    return React.createElement("div", { style: OVERLAY_BG },
      React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(255,80,80,0.3)" }) },
        React.createElement("div", { style: { color: "#ff8866", fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Quicksand',sans-serif" } }, title),
        React.createElement("div", { style: { color: "rgba(200,184,255,0.45)", fontSize: 12, marginBottom: 16 } }, "This cannot be undone."),
        React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "center" } },
          React.createElement("div", { onClick: onCancel, style: { padding: "8px 20px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "Cancel"),
          React.createElement("div", { onClick: onConfirm, style: { padding: "8px 20px", borderRadius: 16, background: "rgba(255,60,60,0.3)", border: "1px solid rgba(255,80,80,0.4)", color: "#ff6644", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Delete"))));
  }

  function renderExportOverlay(title, text, isCopied, onCopy, onClose) {
    return React.createElement("div", { style: OVERLAY_BG },
      React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(200,184,255,0.3)", maxWidth: 340, width: "90%" }) },
        React.createElement("div", { style: { color: "#c8b8ff", fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Quicksand',sans-serif" } }, title),
        React.createElement("div", { style: { color: "rgba(200,184,255,0.4)", fontSize: 11, marginBottom: 12 } }, "Copy this code to share:"),
        React.createElement("textarea", { readOnly: true, value: text, style: { width: "100%", height: 80, padding: 8, borderRadius: 6, background: SCRN, border: SCRNB, color: "#80ddff", fontSize: 16, fontFamily: "monospace", resize: "none", outline: "none", boxSizing: "border-box" }, onClick: function(e) { e.target.select(); } }),
        React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "center", marginTop: 12 } },
          React.createElement("div", { onClick: onClose, style: { padding: "8px 20px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "Close"),
          React.createElement("div", { onClick: onCopy, style: { padding: "8px 20px", borderRadius: 16, background: isCopied ? "rgba(80,200,100,0.3)" : "linear-gradient(135deg,#7b5ea7,#9f7fd0)", border: isCopied ? "1px solid rgba(80,200,100,0.5)" : "none", color: isCopied ? "#80dd90" : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, isCopied ? "Copied!" : "Copy"))));
  }

  function getShipImportPreview(parsed) {
    try {
      var arr = Array.isArray(parsed) ? parsed : [parsed];
      var d = arr[0];
      if (!d || typeof d.hull !== "string") return null;
      return React.createElement(ShipDesignSvg, { size: 80, design: d, uid: "imp-ship-prev" });
    } catch(e) { return null; }
  }
  function getPlasmaImportPreview(parsed) {
    try {
      var arr = Array.isArray(parsed) ? parsed : [parsed];
      var d = arr[0];
      if (!d || typeof d.shape !== "string") return null;
      return renderPlasmaShape(d, 48);
    } catch(e) { return null; }
  }
  function getUfoImportPreview(parsed) {
    try {
      var arr = Array.isArray(parsed) ? parsed : [parsed];
      var d = arr[0];
      if (!d || typeof d.hullColor !== "string") return null;
      return React.createElement(UFOBlockSvg, { size: 64, design: d, uid: "imp-ufo-prev" });
    } catch(e) { return null; }
  }
  function getSetsImportPreview(parsed) {
    try {
      if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
      var parts = [];
      if (parsed._shipDesign && typeof parsed._shipDesign.hull === "string") {
        parts.push(React.createElement(ShipDesignSvg, { key: "s", size: 64, design: parsed._shipDesign, uid: "imp-set-ship" }));
      }
      if (parsed._plasmaDesign && typeof parsed._plasmaDesign.shape === "string") {
        parts.push(React.createElement("div", { key: "p", style: { display: "flex", alignItems: "center" } }, renderPlasmaShape(parsed._plasmaDesign, 32)));
      }
      if (parts.length === 0) return null;
      return React.createElement("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", gap: 12 } }, parts);
    } catch(e) { return null; }
  }
  function getLevelImportPreview(parsed) {
    try {
      var arr = Array.isArray(parsed) ? parsed : [parsed];
      var d = arr[0];
      if (!d || !d.grid || !d.grid.length) return null;
      var cs = 9;
      var cells = [];
      for (var ri = 0; ri < d.grid.length; ri++) {
        for (var ci = 0; ci < d.grid[ri].length; ci++) {
          var t = d.grid[ri][ci];
          if (!t) continue;
          var bc = BLOCK_COLORS[t];
          cells.push(React.createElement("rect", { key: ri + "-" + ci, x: ci * (cs + 1), y: ri * (cs + 1), width: cs, height: cs, fill: bc ? bc.particle : "rgba(200,200,200,0.5)", rx: 1.5, opacity: 0.85 }));
        }
      }
      return React.createElement("svg", { width: COLS * (cs + 1) - 1, height: d.grid.length * (cs + 1) - 1, style: { borderRadius: 3 } }, cells);
    } catch(e) { return null; }
  }

  function renderImportOverlay(title, text, setText, error, setError, onImport, onClose, getPreview) {
    var preview = null;
    if (getPreview && text.trim()) {
      try { preview = getPreview(JSON.parse(text.trim())); } catch(e) {}
    }
    return React.createElement("div", { style: OVERLAY_BG, onClick: function(e) { e.stopPropagation(); } },
      React.createElement("div", { onClick: function(e) { e.stopPropagation(); }, style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(80,200,255,0.3)", maxWidth: 320, width: "90%", maxHeight: "88vh", overflowY: "auto" }) },
        React.createElement("div", { style: { color: "#80ddff", fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Quicksand',sans-serif" } }, title),
        preview && React.createElement("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 10, padding: "10px 0", background: "rgba(0,0,0,0.25)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" } }, preview),
        React.createElement("div", { style: { color: "rgba(180,200,220,0.4)", fontSize: 11, marginBottom: 12 } }, "Paste an exported code:"),
        React.createElement("textarea", { value: text, onChange: function(e) { setText(e.target.value); setError(""); }, onKeyDown: function(e) { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); onImport(); } if (e.key === "Escape") { e.preventDefault(); onClose(); } }, placeholder: "Paste JSON here...", style: { width: "100%", height: 90, padding: 8, borderRadius: 6, background: SCRN, border: error ? "2px solid rgba(255,80,60,0.5)" : SCRNB, color: "#b0c8d8", fontSize: 16, fontFamily: "monospace", resize: "none", outline: "none", boxSizing: "border-box" } }),
        error && React.createElement("div", { style: { color: "#ff8866", fontSize: 11, marginTop: 6, fontWeight: 600 } }, error),
        React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "center", marginTop: 12 } },
          React.createElement("div", { onClick: onClose, style: { padding: "8px 20px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "Cancel"),
          React.createElement("div", { onClick: onImport, style: { padding: "8px 20px", borderRadius: 16, background: "linear-gradient(135deg,#2a5a6a,#1a3a4a)", border: "1px solid rgba(80,200,255,0.4)", color: "#80ddff", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Import"))));
  }

  function renderImportConfirmOverlay(entries, onConfirm, onCancel) {
    var typeCount = 0;
    var seen = {};
    for (var i = 0; i < entries.length; i++) { if (entries[i].assignedTo && !seen[entries[i].assignedTo]) { seen[entries[i].assignedTo] = true; typeCount++; } }
    var msg = "Import " + entries.length + " design" + (entries.length === 1 ? "" : "s") + " and set " + (typeCount === 1 ? "it" : "them") + " active for " + typeCount + " block type" + (typeCount === 1 ? "" : "s") + "?";
    return React.createElement("div", { style: OVERLAY_BG, onClick: function(e) { e.stopPropagation(); } },
      React.createElement("div", { onClick: function(e) { e.stopPropagation(); }, style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(80,200,255,0.3)", maxWidth: 300 }) },
        React.createElement("div", { style: { color: "#80ddff", fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Quicksand',sans-serif" } }, "Import Set"),
        React.createElement("div", { style: { color: "rgba(180,200,220,0.6)", fontSize: 12, marginBottom: 16, lineHeight: 1.5 } }, msg),
        React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "center" } },
          React.createElement("div", { onClick: onCancel, style: { padding: "8px 20px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "Cancel"),
          React.createElement("div", { onClick: onConfirm, style: { padding: "8px 20px", borderRadius: 16, background: "linear-gradient(135deg,#2a5a6a,#1a3a4a)", border: "1px solid rgba(80,200,255,0.4)", color: "#80ddff", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Import & Set Active"))));
  }

  // Unsaved-changes overlay used by every workshop editor.
  // - onStay: keep editing (close overlay)
  // - onSaveAndLeave: save the current edit, then exit
  // - onLeave: discard changes and exit
  function renderBackWarnOverlay(onStay, onSaveAndLeave, onLeave) {
    var btnBase = { padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Exo 2', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };
    return React.createElement("div", { style: OVERLAY_BG },
      React.createElement("div", { style: {
        background: WS.brushed, backgroundBlendMode: "overlay",
        borderRadius: 14, padding: "20px 22px 18px",
        maxWidth: 320, width: "calc(100% - 40px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.55)",
        textAlign: "center", animation: "introFadeIn 0.25s ease-out"
      } },
        React.createElement("div", { style: { color: "#c8b8ff", fontSize: 13, fontWeight: 700, marginBottom: 8, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'Exo 2', sans-serif" } }, "Unsaved Changes"),
        React.createElement("div", { style: { color: "rgba(200,210,220,0.65)", fontSize: 12, marginBottom: 14, lineHeight: 1.4 } }, "You have unsaved changes. What would you like to do?"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
          // Save & Leave (primary, green)
          onSaveAndLeave && React.createElement("div", { onClick: onSaveAndLeave,
            style: Object.assign({}, btnBase, { background: "linear-gradient(180deg, #2a5a3a, #1a3a28)", border: "1px solid rgba(80,200,100,0.5)", color: "#80dd90", boxShadow: "0 0 6px rgba(80,200,100,0.18), inset 0 1px 0 rgba(255,255,255,0.08)" }) },
            React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
              React.createElement("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" }),
              React.createElement("polyline", { points: "17 21 17 13 7 13 7 21" }),
              React.createElement("polyline", { points: "7 3 7 8 15 8" })),
            "Save & Leave"),
          // Stay (subdued, return arrow)
          React.createElement("div", { onClick: onStay,
            style: Object.assign({}, btnBase, { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(200,210,220,0.85)" }) },
            React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
              React.createElement("path", { d: "M3 12a9 9 0 1 0 3-6.7L3 8" }),
              React.createElement("polyline", { points: "3 3 3 8 8 8" })),
            "Stay & Keep Editing"),
          // Leave Without Saving (destructive, red)
          React.createElement("div", { onClick: onLeave,
            style: Object.assign({}, btnBase, { background: "rgba(220,60,80,0.15)", border: "1px solid rgba(220,60,80,0.4)", color: "#ff8088" }) },
            React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
              React.createElement("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
              React.createElement("polyline", { points: "16 17 21 12 16 7" }),
              React.createElement("line", { x1: "21", y1: "12", x2: "9", y2: "12" })),
            "Leave Without Saving"))));
  }

  function renderSortBar(currentSort, onSort, extraOpts) {
    var opts = [["date_new", "Newest"], ["date_old", "Oldest"], ["name", "Name"]];
    if (extraOpts) opts = opts.concat(extraOpts);
    return React.createElement("div", { style: { display: "flex", gap: 4, padding: "6px 10px 2px", position: "relative", zIndex: 1 } },
      React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", paddingTop: 4, marginRight: 2 } }, "Sort:"),
      opts.map(function(opt) {
        var active = currentSort === opt[0];
        return React.createElement("div", { key: opt[0], onClick: function() { onSort(opt[0]); }, style: { padding: "3px 8px", borderRadius: 3, background: active ? "rgba(80,200,255,0.12)" : "transparent", border: active ? "1px solid rgba(80,200,255,0.3)" : "1px solid transparent", color: active ? "#80ddff" : "rgba(180,200,220,0.3)", fontSize: 9, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 } }, opt[1]);
      }));
  }
  function renderTypeHeader(label, color) {
    return React.createElement("div", { style: { color: color || "rgba(180,200,220,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", padding: "10px 2px 4px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 } }, label);
  }
  function renderSetsSelBar(moduleType, allIds) {
    if (!setsSelMode || setsSelMode.moduleType !== moduleType) return null;
    var _setName = setsEditSet ? (setsEditSet.name || "Unnamed Set") : "Set";
    var _isMulti = moduleType === "block" || moduleType === "vfx" || moduleType === "level";
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "rgba(255,208,96,0.07)", borderBottom: "1px solid rgba(255,208,96,0.18)", zIndex: 2, position: "relative" } },
      React.createElement("div", { style: { flex: 1, color: "rgba(255,208,96,0.85)", fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 } }, "Adding to: " + _setName),
      _isMulti && React.createElement("div", { onClick: function() { setsHandleSelectAll(moduleType, allIds); }, style: Object.assign({}, BTN_BASE, { padding: "4px 8px", background: "rgba(255,208,96,0.08)", border: "1px solid rgba(255,208,96,0.25)", color: "rgba(255,208,96,0.75)", fontSize: 9, fontWeight: 700 }) }, "All"),
      React.createElement("div", { onClick: function() { setSetsSelMode(Object.assign({}, setsSelMode, { selectedIds: [] })); }, style: Object.assign({}, BTN_BASE, { padding: "4px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(200,210,220,0.5)", fontSize: 9 }) }, "Clear"),
      React.createElement("div", { onClick: function() { setsHandleAddSelections(setsSelMode.moduleType, setsSelMode.selectedIds); }, style: Object.assign({}, BTN_BASE, { padding: "4px 10px", background: "rgba(255,208,96,0.14)", border: "1px solid rgba(255,208,96,0.4)", color: "#ffd060", fontSize: 9, fontWeight: 700 }) }, "Add to Set"));
  }
  function renderSetsConflictOverlay() {
    if (!setsSelConflict) return null;
    var _typeLabel = "";
    if (setsSelConflict.typeKey === "assignedTo") {
      for (var _i = 0; _i < BD_BLOCK_TYPES.length; _i++) {
        if (BD_BLOCK_TYPES[_i].id === setsSelConflict.incoming.assignedTo) { _typeLabel = BD_BLOCK_TYPES[_i].label; break; }
      }
    } else if (setsSelConflict.typeKey === "effectType") {
      for (var _vi = 0; _vi < VFX_EFFECT_TYPES.length; _vi++) {
        if (VFX_EFFECT_TYPES[_vi].id === setsSelConflict.incoming.effectType) { _typeLabel = VFX_EFFECT_TYPES[_vi].label; break; }
      }
    }
    return React.createElement("div", { style: OVERLAY_BG },
      React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(255,208,96,0.3)" }) },
        React.createElement("div", { style: { color: "#ffd060", fontSize: 15, fontWeight: 700, marginBottom: 8 } }, "Type Already Selected"),
        React.createElement("div", { style: { color: "rgba(200,184,255,0.6)", fontSize: 12, marginBottom: 16, lineHeight: 1.5 } }, "A " + (_typeLabel || "design") + " design is already selected."),
        React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "center" } },
          React.createElement("div", { onClick: function() { setSetsSelConflict(null); }, style: { padding: "8px 20px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "Keep Selected"),
          React.createElement("div", { onClick: function() {
            var _newIds = setsSelMode.selectedIds.filter(function(id) { return id !== setsSelConflict.conflicting.id; });
            _newIds = _newIds.concat([setsSelConflict.incoming.id]);
            setSetsSelMode(Object.assign({}, setsSelMode, { selectedIds: _newIds }));
            setSetsSelConflict(null);
          }, style: { padding: "8px 20px", borderRadius: 16, background: "rgba(255,208,96,0.2)", border: "1px solid rgba(255,208,96,0.4)", color: "#ffd060", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Use This One"))));
  }
  function renderSetsDeleteWarnOverlay() {
    if (!setsDeleteWarn) return null;
    return React.createElement("div", { style: OVERLAY_BG },
      React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(255,80,80,0.3)" }) },
        React.createElement("div", { style: { color: "#ff8866", fontSize: 15, fontWeight: 700, marginBottom: 8 } }, "Used in Sets"),
        React.createElement("div", { style: { color: "rgba(200,184,255,0.6)", fontSize: 12, marginBottom: 16, lineHeight: 1.5 } }, "This design is used in: " + setsDeleteWarn.setNames.join(", ") + ". It will no longer be available in those sets."),
        React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "center" } },
          React.createElement("div", { onClick: function() { setSetsDeleteWarn(null); }, style: { padding: "8px 20px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "Cancel"),
          React.createElement("div", { onClick: function() { setsDeleteWarn.onConfirm(); }, style: { padding: "8px 20px", borderRadius: 16, background: "rgba(255,60,60,0.3)", border: "1px solid rgba(255,80,80,0.4)", color: "#ff6644", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Delete Anyway"))));
  }

  function renderSetsUnsavedWarnOverlay() {
    if (!setsUnsavedWarn) return null;
    return React.createElement("div", { style: OVERLAY_BG },
      React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(255,208,96,0.3)" }) },
        React.createElement("div", { style: { color: "#ffd060", fontSize: 15, fontWeight: 700, marginBottom: 8 } }, "Unsaved Changes"),
        React.createElement("div", { style: { color: "rgba(200,184,255,0.6)", fontSize: 12, marginBottom: 16, lineHeight: 1.5 } }, "This set has unsaved changes."),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
          React.createElement("div", { onClick: function() { setSetsUnsavedWarn(false); setsSaveEdit(); }, style: { padding: "10px 20px", borderRadius: 16, background: "rgba(255,208,96,0.2)", border: "1px solid rgba(255,208,96,0.5)", color: "#ffd060", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "center" } }, "Save and Exit"),
          React.createElement("div", { onClick: function() { setSetsUnsavedWarn(false); setSetsEditSet(null); setsEditDirtyRef.current = false; setSetsView("list"); }, style: { padding: "10px 20px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center" } }, "Exit Without Saving"),
          React.createElement("div", { onClick: function() { setSetsUnsavedWarn(false); }, style: { padding: "8px 20px", color: "rgba(180,200,220,0.4)", fontSize: 12, cursor: "pointer", textAlign: "center" } }, "Keep Editing")
        )
      )
    );
  }
  function renderSetsSelectAllConflictsOverlay() {
    if (!setsSelectAllConflicts) return null;
    var _sac = setsSelectAllConflicts;
    return React.createElement("div", { style: OVERLAY_BG },
      React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(255,208,96,0.3)", maxWidth: 360, width: "92%", textAlign: "left", padding: 0, overflow: "hidden" }) },
        React.createElement("div", { style: { padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,208,96,0.15)" } },
          React.createElement("div", { style: { color: "#ffd060", fontSize: 14, fontWeight: 700, marginBottom: 4 } }, "Type Conflicts"),
          React.createElement("div", { style: { color: "rgba(200,210,220,0.55)", fontSize: 11, lineHeight: 1.5 } }, "Multiple designs share a type. Pick one for each:")),
        React.createElement("div", { style: { overflowY: "auto", maxHeight: "55vh", padding: "10px 12px" } },
          _sac.groups.map(function(grp) {
            var _isBlock = grp.moduleType === "block";
            return React.createElement("div", { key: grp.typeId, style: { marginBottom: 14 } },
              React.createElement("div", { style: { color: _isBlock ? "#c8b8ff" : "#ffb43c", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 } }, grp.typeLabel.toUpperCase()),
              grp.designs.map(function(des) {
                var _sel = grp.selectedId === des.id;
                return React.createElement("div", {
                  key: des.id,
                  onClick: function() {
                    var _newGroups = _sac.groups.map(function(g) { return g.typeId === grp.typeId ? Object.assign({}, g, { selectedId: des.id }) : g; });
                    setSetsSelectAllConflicts(Object.assign({}, _sac, { groups: _newGroups }));
                  },
                  style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, marginBottom: 5, background: _sel ? "rgba(255,208,96,0.08)" : "rgba(255,255,255,0.02)", border: "1px solid " + (_sel ? "rgba(255,208,96,0.35)" : "rgba(255,255,255,0.06)"), cursor: "pointer" }
                },
                  React.createElement("div", { style: { width: 18, height: 18, borderRadius: "50%", border: "2px solid " + (_sel ? "#ffd060" : "rgba(255,255,255,0.2)"), background: _sel ? "#ffd060" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" } },
                    _sel && React.createElement("div", { style: { width: 7, height: 7, borderRadius: "50%", background: "#1a1400" } })),
                  _isBlock
                    ? React.createElement("div", { style: { width: 28, height: 28, flexShrink: 0 } }, React.createElement(BDBlockPreview, { design: des, size: 28 }))
                    : React.createElement("div", { style: { width: 28, height: 28, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" } }, renderVfxMini(des.effectType, des)),
                  React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { color: _sel ? "#fff8dc" : "rgba(200,210,220,0.75)", fontSize: 12, fontWeight: _sel ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, des.name || "Unnamed"),
                    React.createElement("div", { style: { color: "rgba(160,180,200,0.4)", fontSize: 10 } }, des.savedAt ? new Date(des.savedAt).toLocaleDateString() : ""))
                );
              })
            );
          })
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "center", padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" } },
          React.createElement("div", { onClick: function() { setSetsSelectAllConflicts(null); }, style: { padding: "8px 18px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, _sac.cancelLabel || "Cancel"),
          React.createElement("div", { onClick: function() {
            var _finalIds = _sac.autoIds.slice();
            for (var _gi = 0; _gi < _sac.groups.length; _gi++) { _finalIds.push(_sac.groups[_gi].selectedId); }
            _sac.onConfirm(_finalIds, _sac.groups);
            setSetsSelectAllConflicts(null);
          }, style: { padding: "8px 18px", borderRadius: 16, background: "rgba(255,208,96,0.2)", border: "1px solid rgba(255,208,96,0.5)", color: "#ffd060", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Confirm")
        )
      )
    );
  }

  function sortItems(items, mode, dateKey) {
    return items.slice().sort(function(a, b) {
      if (mode === "name") return (a.name || "").localeCompare(b.name || "");
      if (mode === "type") {
        var order = {};
        for (var ti = 0; ti < BD_BLOCK_TYPES.length; ti++) { order[BD_BLOCK_TYPES[ti].id] = ti; }
        var ao = order[a.assignedTo] != null ? order[a.assignedTo] : 99;
        var bo = order[b.assignedTo] != null ? order[b.assignedTo] : 99;
        if (ao !== bo) return ao - bo;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (mode === "effect") {
        var eorder = {};
        for (var eti = 0; eti < VFX_EFFECT_TYPES.length; eti++) { eorder[VFX_EFFECT_TYPES[eti].id] = eti; }
        var aeo = eorder[a.effectType] != null ? eorder[a.effectType] : 99;
        var beo = eorder[b.effectType] != null ? eorder[b.effectType] : 99;
        if (aeo !== beo) return aeo - beo;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (mode === "hull") {
        var hi = SHIP_HULLS.indexOf(a.hull), hj = SHIP_HULLS.indexOf(b.hull);
        if (hi !== hj) return (hi === -1 ? 99 : hi) - (hj === -1 ? 99 : hj);
        return (a.name || "").localeCompare(b.name || "");
      }
      if (mode === "shape") {
        var shapes = ["circle", "blast", "torpedo"];
        var si = shapes.indexOf(a.shape), sj = shapes.indexOf(b.shape);
        if (si !== sj) return (si === -1 ? 99 : si) - (sj === -1 ? 99 : sj);
        return (a.name || "").localeCompare(b.name || "");
      }
      if (mode === "set_type") {
        var stOrder = { "Levels": 0, "Blocks": 1, "VFX": 2, "UFO": 3, "Ship": 4, "Plasma": 5, "Mixed": 6 };
        var asto = stOrder[setsGetType(a)]; if (asto == null) asto = 6;
        var bsto = stOrder[setsGetType(b)]; if (bsto == null) bsto = 6;
        if (asto !== bsto) return asto - bsto;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (mode === "level_num") {
        var lna = a.levelNum != null ? a.levelNum : 9999;
        var lnb = b.levelNum != null ? b.levelNum : 9999;
        if (lna !== lnb) return lna - lnb;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (mode === "date_old") return ((a[dateKey] ? new Date(a[dateKey]).getTime() : 0) || 0) - ((b[dateKey] ? new Date(b[dateKey]).getTime() : 0) || 0);
      return ((b[dateKey] ? new Date(b[dateKey]).getTime() : 0) || 0) - ((a[dateKey] ? new Date(a[dateKey]).getTime() : 0) || 0);
    });
  }

  // ═══════════════════════════════════════
  function ufoGetActiveDesign() {
    if (ufoActiveId) {
      for (var i = 0; i < ufoSaved.length; i++) { if (ufoSaved[i].id === ufoActiveId) return ufoSaved[i]; }
    }
    return Object.assign({}, UFO_DEFAULT_DESIGN);
  }
  // ── Undo/redo plumbing ──
  function ufoHistoryReset(state) {
    ufoHistoryRef.current = { stack: [JSON.parse(JSON.stringify(state))], idx: 0, lastKey: null, lastTime: 0 };
    setUfoHistVersion(function(v) { return v + 1; });
  }
  function ufoHistoryPush(state, coalesceKey) {
    var h = ufoHistoryRef.current; var now = Date.now();
    var snap = JSON.parse(JSON.stringify(state));
    if (coalesceKey && h.lastKey === coalesceKey && now - h.lastTime < 600 && h.idx >= 0) {
      h.stack[h.idx] = snap; h.lastTime = now;
    } else {
      h.stack = h.stack.slice(0, h.idx + 1); h.stack.push(snap);
      if (h.stack.length > 50) { h.stack.shift(); }
      h.idx = h.stack.length - 1; h.lastKey = coalesceKey || null; h.lastTime = now;
    }
    setUfoHistVersion(function(v) { return v + 1; });
  }
  function ufoUndo() {
    var h = ufoHistoryRef.current; if (h.idx <= 0) return;
    h.idx -= 1; h.lastKey = null;
    setUfoEditDesign(JSON.parse(JSON.stringify(h.stack[h.idx])));
    ufoEditDirtyRef.current = true;
    setUfoHistVersion(function(v) { return v + 1; });
  }
  function ufoRedo() {
    var h = ufoHistoryRef.current; if (h.idx >= h.stack.length - 1) return;
    h.idx += 1; h.lastKey = null;
    setUfoEditDesign(JSON.parse(JSON.stringify(h.stack[h.idx])));
    ufoEditDirtyRef.current = true;
    setUfoHistVersion(function(v) { return v + 1; });
  }
  var ufoCanUndo = ufoHistoryRef.current.idx > 0;
  var ufoCanRedo = ufoHistoryRef.current.idx < ufoHistoryRef.current.stack.length - 1;

  function ufoOpenNew() {
    ufoEditDirtyRef.current = false;
    setUfoEditId(null);
    var initial = Object.assign({}, UFO_DEFAULT_DESIGN, { name: "" });
    setUfoEditDesign(initial);
    ufoHistoryReset(initial);
    setUfoView("editor");
  }
  function ufoOpenEditor(design) {
    ufoEditDirtyRef.current = false;
    setUfoEditId(design.id);
    var initial = Object.assign({}, design);
    setUfoEditDesign(initial);
    ufoHistoryReset(initial);
    setUfoView("editor");
  }
  function ufoUpdateEdit(key, val) {
    ufoEditDirtyRef.current = true;
    var prev = ufoEditDesign;
    var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
    next[key] = val;
    ufoHistoryPush(next, key);
    setUfoEditDesign(next);
  }
  function ufoSaveCurrent() {
    var now = new Date().toISOString();
    var name = (ufoEditDesign.name || "").trim() || "My UFO";
    var isNew = !ufoEditId;
    var id = isNew ? ("ufo_" + Date.now()) : ufoEditId;
    var saved = Object.assign({}, ufoEditDesign, { id: id, name: name, savedAt: now });
    var nextActive = ufoActiveId;
    setUfoSaved(function(prev) {
      var list = isNew ? prev.concat([saved]) : prev.map(function(d) { return d.id === id ? saved : d; });
      ufoSaveDesigns(list);
      return list;
    });
    if (isNew || !ufoActiveId) {
      nextActive = id;
      setUfoActiveId(id);
      ufoSaveActiveId(id);
    }
    setUfoEditId(id);
    ufoEditDirtyRef.current = false;
    setUfoSaveStatus("Saved");
    setTimeout(function() { setUfoSaveStatus(""); }, 1500);
  }
  function ufoSetActive(id) {
    setUfoActiveId(id);
    ufoSaveActiveId(id);
  }
  function ufoCommitRename() {
    var id = ufoRenamingId;
    if (!id) return;
    var name = (ufoRenameValue || "").trim() || "Untitled";
    setUfoSaved(function(prev) {
      var list = prev.map(function(d) { return d.id === id ? Object.assign({}, d, { name: name, savedAt: new Date().toISOString() }) : d; });
      ufoSaveDesigns(list);
      return list;
    });
    setUfoRenamingId(null); setUfoRenameValue("");
  }
  function ufoCancelRename() { setUfoRenamingId(null); setUfoRenameValue(""); }
  function ufoDeleteDesign(id) {
    setUfoSaved(function(prev) {
      var list = prev.filter(function(d) { return d.id !== id; });
      ufoSaveDesigns(list);
      return list;
    });
    if (ufoActiveId === id) {
      setUfoActiveId(null);
      ufoSaveActiveId(null);
    }
    setUfoDeletingId(null);
  }
  function ufoExportDesign(design) {
    var exp = {};
    Object.keys(design).forEach(function(k) { exp[k] = design[k]; });
    setUfoExportText(JSON.stringify(exp, null, 2));
    setUfoExportId(design.id);
    setUfoCopied(false);
  }
  function ufoHandleImport() {
    var text = ufoImportText.trim();
    if (!text) { setUfoImportError("Paste a UFO design code first"); return; }
    var parsed;
    try { parsed = JSON.parse(text); } catch (e) { setUfoImportError("Invalid format — not valid JSON"); return; }
    var arr = Array.isArray(parsed) ? parsed : [parsed];
    if (arr.length === 0) { setUfoImportError("No designs found"); return; }
    var newEntries = [];
    for (var a = 0; a < arr.length; a++) {
      var d = arr[a];
      if (!d || typeof d !== "object") { setUfoImportError("Item " + (a + 1) + ": not an object"); return; }
      if (typeof d.hullColor !== "string") { setUfoImportError("Item " + (a + 1) + ": missing hullColor"); return; }
      var entry = Object.assign({}, UFO_DEFAULT_DESIGN, d);
      entry.id = genUUID();
      entry.name = d.name || "Imported UFO";
      entry.isFactory = false;
      entry.savedAt = new Date().toISOString();
      newEntries.push(entry);
    }
    setUfoSaved(function(prev) { var list = prev.concat(newEntries); ufoSaveDesigns(list); return list; });
    setUfoShowImport(false); setUfoImportText(""); setUfoImportError("");
  }

  // ═══════════════════════════════════════
  // PLASMA LAB FUNCTIONS
  // ═══════════════════════════════════════
  function plasmaGetActiveDesign() {
    if (plasmaActiveId) {
      for (var i = 0; i < plasmaSaved.length; i++) { if (plasmaSaved[i].id === plasmaActiveId) return plasmaSaved[i]; }
    }
    return Object.assign({}, PLASMA_DEFAULT_DESIGN);
  }
  function plasmaHistoryReset(state) {
    plasmaHistoryRef.current = { stack: [JSON.parse(JSON.stringify(state))], idx: 0, lastKey: null, lastTime: 0 };
    setPlasmaHistVersion(function(v) { return v + 1; });
  }
  function plasmaHistoryPush(state, coalesceKey) {
    var h = plasmaHistoryRef.current; var now = Date.now();
    var snap = JSON.parse(JSON.stringify(state));
    if (coalesceKey && h.lastKey === coalesceKey && now - h.lastTime < 600 && h.idx >= 0) {
      h.stack[h.idx] = snap; h.lastTime = now;
    } else {
      h.stack = h.stack.slice(0, h.idx + 1); h.stack.push(snap);
      if (h.stack.length > 50) { h.stack.shift(); }
      h.idx = h.stack.length - 1; h.lastKey = coalesceKey || null; h.lastTime = now;
    }
    setPlasmaHistVersion(function(v) { return v + 1; });
  }
  function plasmaUndo() {
    var h = plasmaHistoryRef.current; if (h.idx <= 0) return;
    h.idx -= 1; h.lastKey = null;
    setPlasmaEditDesign(JSON.parse(JSON.stringify(h.stack[h.idx])));
    plasmaEditDirtyRef.current = true;
    setPlasmaHistVersion(function(v) { return v + 1; });
  }
  function plasmaRedo() {
    var h = plasmaHistoryRef.current; if (h.idx >= h.stack.length - 1) return;
    h.idx += 1; h.lastKey = null;
    setPlasmaEditDesign(JSON.parse(JSON.stringify(h.stack[h.idx])));
    plasmaEditDirtyRef.current = true;
    setPlasmaHistVersion(function(v) { return v + 1; });
  }
  function plasmaOpenNew() {
    plasmaEditDirtyRef.current = false;
    setPlasmaEditId(null);
    var initial = Object.assign({}, PLASMA_DEFAULT_DESIGN, { name: "" });
    setPlasmaEditDesign(initial);
    plasmaHistoryReset(initial);
    setPlasmaEditTab("design");
    setPlasmaView("editor");
  }
  function plasmaOpenEditor(design) {
    plasmaEditDirtyRef.current = false;
    setPlasmaEditId(design.id);
    var snap = Object.assign({}, design);
    setPlasmaEditDesign(snap);
    plasmaHistoryReset(snap);
    setPlasmaEditTab("design");
    setPlasmaView("editor");
  }
  function plasmaUpdateEdit(key, val) {
    plasmaEditDirtyRef.current = true;
    setPlasmaEditDesign(function(prev) {
      var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
      next[key] = val;
      plasmaHistoryPush(next, key);
      return next;
    });
  }
  function plasmaSaveCurrent() {
    var now = new Date().toISOString();
    var name = (plasmaEditDesign.name || "").trim() || "My Plasma";
    var isNew = !plasmaEditId;
    var id = isNew ? ("plasma_" + Date.now()) : plasmaEditId;
    var saved = Object.assign({}, plasmaEditDesign, { id: id, name: name, savedAt: now });
    setPlasmaSaved(function(prev) {
      var list = isNew ? prev.concat([saved]) : prev.map(function(d) { return d.id === id ? saved : d; });
      plasmaSaveDesigns(list);
      return list;
    });
    if (isNew || !plasmaActiveId) {
      setPlasmaActiveId(id);
      plasmaSaveActiveIdToStorage(id);
    }
    setPlasmaEditId(id);
    plasmaEditDirtyRef.current = false;
    setPlasmaSaveStatus("Saved");
    setTimeout(function() { setPlasmaSaveStatus(""); }, 1500);
  }
  function plasmaSetActive(id) {
    setPlasmaActiveId(id);
    plasmaSaveActiveIdToStorage(id);
  }
  function plasmaGetPreviewShipDesign() {
    if (plasmaPreviewShipId) {
      for (var psi = 0; psi < shipSaved.length; psi++) { if (shipSaved[psi].id === plasmaPreviewShipId) return shipMigrateDesign(shipSaved[psi]); }
    }
    return shipGetActiveDesign();
  }
  function plasmaDeleteDesign(id) {
    setPlasmaSaved(function(prev) {
      var list = prev.filter(function(d) { return d.id !== id; });
      plasmaSaveDesigns(list);
      return list;
    });
    if (plasmaActiveId === id) {
      setPlasmaActiveId(null);
      plasmaSaveActiveIdToStorage(null);
    }
    setPlasmaDeletingId(null);
  }
  function plasmaCommitRename() {
    var id = plasmaRenamingId;
    if (!id) return;
    var name = (plasmaRenameValue || "").trim() || "My Plasma";
    setPlasmaSaved(function(prev) {
      var list = prev.map(function(d) { return d.id === id ? Object.assign({}, d, { name: name, savedAt: new Date().toISOString() }) : d; });
      plasmaSaveDesigns(list);
      return list;
    });
    setPlasmaRenamingId(null); setPlasmaRenameValue("");
  }
  function plasmaCancelRename() { setPlasmaRenamingId(null); setPlasmaRenameValue(""); }
  function plasmaExportDesign(design) {
    var exp = {}; Object.keys(design).forEach(function(k) { exp[k] = design[k]; });
    setPlasmaExportText(JSON.stringify(exp, null, 2));
    setPlasmaExportId(design.id);
    setPlasmaCopied(false);
  }
  function plasmaHandleImport() {
    var text = plasmaImportText.trim();
    if (!text) { setPlasmaImportError("Paste a plasma design code first"); return; }
    var parsed;
    try { parsed = JSON.parse(text); } catch(e) { setPlasmaImportError("Invalid format -- not valid JSON"); return; }
    var arr = Array.isArray(parsed) ? parsed : [parsed];
    if (arr.length === 0) { setPlasmaImportError("No designs found"); return; }
    var newEntries = [];
    for (var a = 0; a < arr.length; a++) {
      var d = arr[a];
      if (!d || typeof d !== "object") { setPlasmaImportError("Item " + (a + 1) + ": not an object"); return; }
      if (typeof d.shape !== "string") { setPlasmaImportError("Item " + (a + 1) + ": missing shape"); return; }
      newEntries.push(Object.assign({}, d, { id: genUUID(), isFactory: false, savedAt: new Date().toISOString() }));
    }
    var updated = plasmaSaved.concat(newEntries);
    try { window.storage.set("cosmic-drift-plasma-designs", JSON.stringify(updated)); } catch(ex) {}
    setPlasmaSaved(updated);
    if (newEntries.length === 1) { plasmaSetActive(newEntries[0].id); }
    setPlasmaShowImport(false); setPlasmaImportText(""); setPlasmaImportError("");
  }
  function plasmaEditCopy(design) {
    plasmaEditDirtyRef.current = false;
    setPlasmaEditId(null);
    var copy = Object.assign({}, design, { name: (design.name || "My Plasma") + " (copy)" });
    setPlasmaEditDesign(copy);
    plasmaHistoryReset(copy);
    setPlasmaEditTab("design");
    setPlasmaView("editor");
  }

  function shipGetActiveDesign() {
    if (shipActiveId) {
      for (var i = 0; i < shipSaved.length; i++) { if (shipSaved[i].id === shipActiveId) return shipMigrateDesign(shipSaved[i]); }
    }
    return { hull: "arrow", parts: shipHullPresetParts("arrow") };
  }
  // ── Undo/redo plumbing. shipApplyEdit wraps every shipEdit mutation so the
  // coalesce key + 600 ms window collapses drags (preview move, slider scrubs)
  // into a single undo step while keeping discrete actions (add/delete/reorder)
  // as their own entries. ──
  function shipHistoryReset(state) {
    shipHistoryRef.current = { stack: [JSON.parse(JSON.stringify(state))], idx: 0, lastKey: null, lastTime: 0 };
    setShipHistVersion(function(v) { return v + 1; });
  }
  function shipHistoryPush(state, coalesceKey) {
    var h = shipHistoryRef.current; var now = Date.now();
    var snap = JSON.parse(JSON.stringify(state));
    if (coalesceKey && h.lastKey === coalesceKey && now - h.lastTime < 600 && h.idx >= 0) {
      h.stack[h.idx] = snap; h.lastTime = now;
    } else {
      h.stack = h.stack.slice(0, h.idx + 1); h.stack.push(snap);
      if (h.stack.length > 50) { h.stack.shift(); }
      h.idx = h.stack.length - 1; h.lastKey = coalesceKey || null; h.lastTime = now;
    }
    setShipHistVersion(function(v) { return v + 1; });
  }
  function shipUndo() {
    var h = shipHistoryRef.current; if (h.idx <= 0) return;
    h.idx -= 1; h.lastKey = null;
    setShipEdit(JSON.parse(JSON.stringify(h.stack[h.idx])));
    shipDirtyRef.current = true;
    setShipHistVersion(function(v) { return v + 1; });
  }
  function shipRedo() {
    var h = shipHistoryRef.current; if (h.idx >= h.stack.length - 1) return;
    h.idx += 1; h.lastKey = null;
    setShipEdit(JSON.parse(JSON.stringify(h.stack[h.idx])));
    shipDirtyRef.current = true;
    setShipHistVersion(function(v) { return v + 1; });
  }
  var shipCanUndo = shipHistoryRef.current.idx > 0;
  var shipCanRedo = shipHistoryRef.current.idx < shipHistoryRef.current.stack.length - 1;
  // Wrapper used by every mutation site. updater(prev) -> next; returning prev
  // unchanged signals "no-op" and skips history.
  function shipApplyEdit(updater, coalesceKey) {
    setShipEdit(function(prev) {
      var next = updater(prev);
      if (next === prev) return prev;
      shipHistoryPush(next, coalesceKey);
      return next;
    });
  }

  function shipOpenNew() {
    shipDirtyRef.current = false;
    setShipEditId(null);
    var initial = { hull: "none", name: "", parts: [] };
    setShipEdit(initial);
    shipHistoryReset(initial);
    setShipTab("add");
    setShipSelectedPart(-1);
    setShipSelectedExtras([]);
    setShipView("editor");
  }
  function shipOpenEditor(design) {
    shipDirtyRef.current = false;
    var migrated = shipMigrateDesign(design);
    setShipEditId(design.id);
    var initial = Object.assign({}, migrated, { parts: (migrated.parts || []).slice() });
    setShipEdit(initial);
    shipHistoryReset(initial);
    setShipTab("list");
    setShipSelectedPart(-1);
    setShipSelectedExtras([]);
    setShipView("editor");
  }
  function shipAddPart(type) {
    var defaults = {
      circle:    { w: 6, h: 6,  color: "#80ddff" },
      rect:      { w: 6, h: 6,  color: "#80ddff", cr: 0 },
      triangle:  { w: 7, h: 7,  color: "#80ddff" },
      trapezoid: { w: 8, h: 6,  color: "#80ddff", tw: 4, tofs: 0 },
      line:      { w: 10, h: 1, color: "#ffd060" },
      arrow:     { w: 12, h: 16, color: "#efb6ed" }
    };
    var dflt = defaults[type] || defaults.circle;
    var part = { type: type, x: 20, y: 22, w: dflt.w, h: dflt.h, rot: 0, color: dflt.color, opacity: 1, bw: 0, bc: "#000000", bo: 1 };
    if (type === "rect") part.cr = 0;
    if (type === "trapezoid") { part.tw = dflt.tw; part.tofs = dflt.tofs; }
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (Array.isArray(prev.parts) ? prev.parts : []).concat([part]);
      var next = Object.assign({}, prev, { parts: list });
      setShipSelectedPart(list.length - 1);
      return next;
    }, "__addPart_" + Date.now());
  }
  // Replace/Add/Cancel flow for hull-tab tile taps.
  function shipApplyHullPreset(hullId, mode) {
    var presetParts = shipHullPresetParts(hullId);
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var nextParts;
      if (mode === "add") {
        nextParts = (Array.isArray(prev.parts) ? prev.parts : []).concat(presetParts);
      } else {
        nextParts = presetParts;
      }
      return Object.assign({}, prev, { hull: hullId, parts: nextParts });
    }, "__hullPreset_" + hullId + "_" + Date.now());
    setShipSelectedPart(-1);
  }
  function shipOnHullTileTap(hullId) {
    shipApplyHullPreset(hullId, "replace");
  }
  function shipUpdatePart(idx, key, val) {
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      if (!list[idx]) return prev;
      list[idx] = Object.assign({}, list[idx], (function(){ var o = {}; o[key] = val; return o; })());
      return Object.assign({}, prev, { parts: list });
    }, "part_" + idx + "_" + key);
  }
  // Cycle a part's visibility: visible (0) → invisible (1) → ghost (2) → visible.
  function shipCyclePartVisibility(idx) {
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      if (!list[idx]) return prev;
      var cur = list[idx].hidden || 0;
      var next = cur === 0 ? 1 : cur === 1 ? 2 : 0;
      list[idx] = Object.assign({}, list[idx], { hidden: next });
      return Object.assign({}, prev, { parts: list });
    });
  }
  // Duplicate the part at idx: deep-copies, nudges by (1.5, 1.5) so the copy is
  // visible, inserts right after the original, and selects the new copy.
  function shipDuplicatePart(idx) {
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      if (idx < 0 || idx >= list.length) return prev;
      var src = list[idx];
      var copy = JSON.parse(JSON.stringify(src));
      copy.x = Math.max(0, Math.min(40, (src.x || 20) + 1.5));
      copy.y = Math.max(0, Math.min(40, (src.y || 20) + 1.5));
      if (src.name) copy.name = src.name + " copy";
      list.splice(idx + 1, 0, copy);
      setShipSelectedPart(idx + 1);
      return Object.assign({}, prev, { parts: list });
    }, "__dupPart_" + Date.now());
  }
  function shipDeletePart(idx) {
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      list.splice(idx, 1);
      return Object.assign({}, prev, { parts: list });
    }, "__delPart_" + Date.now());
    setShipSelectedPart(function(prevSel) {
      if (prevSel === idx) return -1;
      if (prevSel > idx) return prevSel - 1;
      return prevSel;
    });
  }
  function shipMovePart(idx, dir) {
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      var j = idx + dir;
      if (j < 0 || j >= list.length) return prev;
      var tmp = list[idx]; list[idx] = list[j]; list[j] = tmp;
      shipDirtyRef.current = true;
      setShipSelectedPart(j);
      return Object.assign({}, prev, { parts: list });
    }, "__movePart_" + Date.now());
  }
  // Moves a part from its current index to `toIdx`, shifting others.
  // Used by the Z (layer) slider.
  function shipReorderPart(fromIdx, toIdx, clearGroup) {
    if (fromIdx === toIdx) return;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      if (fromIdx < 0 || fromIdx >= list.length) return prev;
      // Allow t == list.length (after splice) so a part can reach the very top display position.
      var t = Math.max(0, Math.min(list.length, toIdx));
      var p = list[fromIdx];
      list.splice(fromIdx, 1);
      if (t > list.length) t = list.length;
      list.splice(t, 0, p);
      // Update groupId. clearGroup forces ungrouped regardless of neighbors.
      var newGid;
      if (clearGroup) {
        newGid = null;
      } else {
        var below = t > 0 ? list[t - 1] : null;
        var above = t < list.length - 1 ? list[t + 1] : null;
        var belowGid = (below && below.groupId) || null;
        var aboveGid = (above && above.groupId) || null;
        var currentGid = p.groupId || null;
        if (belowGid === aboveGid) {
          newGid = belowGid;
        } else if (currentGid && (belowGid === currentGid || aboveGid === currentGid)) {
          newGid = currentGid;
        } else {
          newGid = belowGid;
        }
      }
      if (newGid !== currentGid) {
        var newGroupName = null;
        if (newGid) {
          for (var ni = 0; ni < list.length; ni++) {
            if (list[ni] && list[ni].groupId === newGid && list[ni].groupName) { newGroupName = list[ni].groupName; break; }
          }
        }
        list[t] = Object.assign({}, p, { groupId: newGid || null, groupName: newGroupName });
      }
      shipDirtyRef.current = true;
      setShipSelectedPart(t);
      return Object.assign({}, prev, { parts: list });
    }, "reorder_" + fromIdx);
  }
  // Width/height edit that respects the shipWhLocked toggle (preserves ratio).
  function shipUpdatePartSize(idx, key, val) {
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      if (!list[idx]) return prev;
      var p = list[idx];
      var nw = p.w, nh = p.h;
      if (key === "w") {
        nw = val;
        if (shipWhLocked && p.w > 0) nh = p.h * (val / p.w);
      } else {
        nh = val;
        if (shipWhLocked && p.h > 0) nw = p.w * (val / p.h);
      }
      var finalW = Math.max(0.5, nw);
      var patch = { w: finalW, h: Math.max(0.5, nh) };
      if (p.type === "trapezoid" && typeof p.tw === "number" && p.w > 0) {
        patch.tw = Math.max(0, p.tw * (finalW / p.w));
      }
      list[idx] = Object.assign({}, p, patch);
      return Object.assign({}, prev, { parts: list });
    }, "size_" + idx + "_" + key);
  }
  // ── Multi-select helpers ──
  // Effective selection = primary index ∪ extras (deduped, in canvas order).
  function shipGetSelected() {
    var out = [];
    var seen = {};
    if (shipSelectedPart >= 0) { out.push(shipSelectedPart); seen[shipSelectedPart] = 1; }
    for (var i = 0; i < shipSelectedExtras.length; i++) {
      var ix = shipSelectedExtras[i];
      if (!seen[ix]) { out.push(ix); seen[ix] = 1; }
    }
    return out;
  }
  function shipIsSelected(idx) {
    if (idx === shipSelectedPart) return true;
    for (var i = 0; i < shipSelectedExtras.length; i++) if (shipSelectedExtras[i] === idx) return true;
    return false;
  }
  // Checkbox tap on a part row toggles it in/out of extras. When the toggled
  // row equals the primary, we shift primary off and promote the first extra
  // (if any) instead of leaving an orphan primary.
  function shipToggleSelected(idx) {
    if (idx === shipSelectedPart) {
      // Removing primary: promote first remaining extra (if any) to primary.
      if (shipSelectedExtras.length > 0) {
        var promoted = shipSelectedExtras[0];
        setShipSelectedPart(promoted);
        setShipSelectedExtras(shipSelectedExtras.slice(1));
      } else {
        setShipSelectedPart(-1);
      }
      return;
    }
    var inExtras = false;
    var next = [];
    for (var i = 0; i < shipSelectedExtras.length; i++) {
      if (shipSelectedExtras[i] === idx) { inExtras = true; }
      else next.push(shipSelectedExtras[i]);
    }
    if (inExtras) {
      setShipSelectedExtras(next);
    } else if (shipSelectedPart < 0) {
      // No primary yet — make this the primary instead of adding to extras.
      setShipSelectedPart(idx);
    } else {
      setShipSelectedExtras(next.concat([idx]));
    }
  }
  // Fan-out property edit to every selected part as one history step.
  function shipUpdateSelected(key, val) {
    var sels = shipGetSelected();
    if (sels.length === 0) return;
    if (sels.length === 1) { shipUpdatePart(sels[0], key, val); return; }
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      for (var i = 0; i < sels.length; i++) {
        var ix = sels[i];
        if (list[ix] === undefined) continue;
        var patch = {}; patch[key] = val;
        list[ix] = Object.assign({}, list[ix], patch);
      }
      return Object.assign({}, prev, { parts: list });
    }, "multiEdit_" + key);
  }
  // True iff 2+ parts are selected and they disagree on `key`. Used to badge
  // property controls with "MIXED" so the user knows changing the value will
  // overwrite distinct values across the selection.
  // List all part indices that share `gid` (used for group expansion on tap).
  function shipGroupMembers(gid) {
    var out = []; if (!gid) return out;
    var parts = (shipEdit && shipEdit.parts) || [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] && parts[i].groupId === gid) out.push(i);
    }
    return out;
  }
  // Returns the shared groupId if ALL selected parts belong to the same group, null otherwise.
  function shipAreSelectedSameGroup() {
    var sels = shipGetSelected();
    if (sels.length < 2) return false;
    var parts = (shipEdit && shipEdit.parts) || [];
    for (var i = 0; i < sels.length; i++) {
      var p = parts[sels[i]];
      if (!p || !p.groupId) return false;
    }
    return true;
  }
  function shipGroupVisualBBox(idxList) {
    var parts = (shipEdit && shipEdit.parts) || [];
    var minX = 99999, maxX = -99999, minY = 99999, maxY = -99999;
    for (var i = 0; i < idxList.length; i++) {
      var p = parts[idxList[i]]; if (!p) continue;
      var gsx = (p.gsx != null) ? p.gsx : 1;
      var gsy = (p.gsy != null) ? p.gsy : 1;
      var gcx = (p.gcx != null) ? p.gcx : p.x;
      var gcy = (p.gcy != null) ? p.gcy : p.y;
      var vx = p.x * gsx + gcx * (1 - gsx);
      var vy = p.y * gsy + gcy * (1 - gsy);
      var vhw = p.w * gsx / 2;
      var vhh = p.h * gsy / 2;
      var vrot = (p.rot || 0) * Math.PI / 180;
      var vcosR = Math.cos(vrot), vsinR = Math.sin(vrot);
      var vdxs = [-vhw, vhw, vhw, -vhw];
      var vdys = [-vhh, -vhh, vhh, vhh];
      for (var vci = 0; vci < 4; vci++) {
        var vrx = vx + vdxs[vci] * vcosR - vdys[vci] * vsinR;
        var vry = vy + vdxs[vci] * vsinR + vdys[vci] * vcosR;
        if (vrx < minX) minX = vrx;
        if (vrx > maxX) maxX = vrx;
        if (vry < minY) minY = vry;
        if (vry > maxY) maxY = vry;
      }
    }
    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
  }
  // Single entry point for canvas / list-row taps. addMode comes from the
  // multi-select toggle; when true, the tap adds/removes the tapped part
  // (and any group members) instead of replacing the selection.
  function shipApplyTap(idx, addMode) {
    var parts = (shipEdit && shipEdit.parts) || [];
    var p = parts[idx]; if (!p) return;
    var members = p.groupId ? shipGroupMembers(p.groupId) : [idx];
    if (!addMode) {
      setShipSelectedPart(members[0]);
      setShipSelectedExtras(members.slice(1));
      return;
    }
    var current = shipGetSelected();
    var allIn = members.every(function(m) { return current.indexOf(m) >= 0; });
    if (allIn) {
      // Toggle the group out of the selection
      var remaining = current.filter(function(c) { return members.indexOf(c) < 0; });
      if (remaining.length === 0) { setShipSelectedPart(-1); setShipSelectedExtras([]); return; }
      setShipSelectedPart(remaining[0]);
      setShipSelectedExtras(remaining.slice(1));
    } else {
      var union = current.slice();
      members.forEach(function(m) { if (union.indexOf(m) < 0) union.push(m); });
      if (shipSelectedPart < 0) {
        setShipSelectedPart(union[0]);
        setShipSelectedExtras(union.slice(1));
      } else {
        setShipSelectedExtras(union.filter(function(u) { return u !== shipSelectedPart; }));
      }
    }
  }
  function shipSelectAll() {
    var parts = (shipEdit && shipEdit.parts) || [];
    if (parts.length === 0) return;
    var all = []; for (var i = 0; i < parts.length; i++) all.push(i);
    setShipSelectedPart(all[0]);
    setShipSelectedExtras(all.slice(1));
  }
  function shipClearSelection() {
    setShipSelectedPart(-1);
    setShipSelectedExtras([]);
  }
  // Delete every selected part as one history step. Splice descending so
  // earlier indices don't shift mid-loop. Selection is cleared after.
  function shipDeleteSelected() {
    var sels = shipGetSelected();
    if (sels.length === 0) return;
    if (sels.length === 1) { shipDeletePart(sels[0]); return; }
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      var sorted = sels.slice().sort(function(a, b) { return b - a; });
      for (var i = 0; i < sorted.length; i++) list.splice(sorted[i], 1);
      return Object.assign({}, prev, { parts: list });
    }, "__delMulti_" + Date.now());
    setShipSelectedPart(-1);
    setShipSelectedExtras([]);
  }
  // Duplicate every selected part as one history step. Each copy is nudged
  // (1.5, 1.5) and gets " copy" appended to its name. The new copies become
  // the next selection.
  function shipDuplicateSelected() {
    var sels = shipGetSelected();
    if (sels.length === 0) return;
    if (sels.length === 1) { shipDuplicatePart(sels[0]); return; }
    shipDirtyRef.current = true;
    var firstNew = -1, restNew = [];
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      var sorted = sels.slice().sort(function(a, b) { return a - b; });
      for (var i = 0; i < sorted.length; i++) {
        var src = list[sorted[i]]; if (!src) continue;
        var copy = JSON.parse(JSON.stringify(src));
        copy.x = Math.max(0, Math.min(40, (src.x || 20) + 1.5));
        copy.y = Math.max(0, Math.min(40, (src.y || 20) + 1.5));
        if (src.name) copy.name = src.name + " copy";
        list.push(copy);
        var newIx = list.length - 1;
        if (firstNew < 0) firstNew = newIx; else restNew.push(newIx);
      }
      return Object.assign({}, prev, { parts: list });
    }, "__dupMulti_" + Date.now());
    if (firstNew >= 0) {
      setShipSelectedPart(firstNew);
      setShipSelectedExtras(restNew);
    }
  }
  // Tag every selected part with a fresh groupId so subsequent canvas/row
  // taps select the whole group together.
  function shipGroupSelected() {
    var sels = shipGetSelected();
    if (sels.length < 2) return;
    var gid = "g" + Date.now();
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      for (var i = 0; i < sels.length; i++) {
        var p = list[sels[i]]; if (!p) continue;
        list[sels[i]] = shipBakeGroupTransform(p);
      }
      var minX = 99999, maxX = -99999, minY = 99999, maxY = -99999;
      for (var j = 0; j < sels.length; j++) {
        var sp = list[sels[j]]; if (!sp) continue;
        var hw = sp.w / 2, hh = sp.h / 2;
        if (sp.x - hw < minX) minX = sp.x - hw;
        if (sp.x + hw > maxX) maxX = sp.x + hw;
        if (sp.y - hh < minY) minY = sp.y - hh;
        if (sp.y + hh > maxY) maxY = sp.y + hh;
      }
      var gcx = (minX + maxX) / 2;
      var gcy = (minY + maxY) / 2;
      for (var k = 0; k < sels.length; k++) {
        var q = list[sels[k]]; if (!q) continue;
        list[sels[k]] = Object.assign({}, q, { groupId: gid, gsx: 1, gsy: 1, gcx: gcx, gcy: gcy });
      }
      return Object.assign({}, prev, { parts: list });
    }, "__group_" + Date.now());
  }
  // Strip groupId from every selected part.
  function shipUngroupSelected() {
    var sels = shipGetSelected();
    if (sels.length === 0) return;
    var anyGrouped = false;
    var parts = (shipEdit && shipEdit.parts) || [];
    for (var i = 0; i < sels.length; i++) {
      if (parts[sels[i]] && parts[sels[i]].groupId) { anyGrouped = true; break; }
    }
    if (!anyGrouped) return;
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      for (var i = 0; i < sels.length; i++) {
        var p = list[sels[i]]; if (!p || !p.groupId) continue;
        var baked = shipBakeGroupTransform(p);
        var copy = Object.assign({}, baked);
        delete copy.groupId;
        list[sels[i]] = copy;
      }
      return Object.assign({}, prev, { parts: list });
    }, "__ungroup_" + Date.now());
  }
  // True if at least one selected part has a groupId (used to toggle the
  // visibility of the Ungroup button).
  // Deterministic tint for a groupId so members of the same group share a
  // colored chip in the list. Returns null when there's no group.
  function shipGroupTint(gid) {
    if (!gid) return null;
    var h = 0;
    for (var i = 0; i < gid.length; i++) h = (h * 31 + gid.charCodeAt(i)) >>> 0;
    return "hsl(" + (h % 360) + ", 70%, 62%)";
  }
  // Select every member of a group. The highest-index member becomes primary.
  function shipSelectGroup(groupId) {
    var parts = (shipEdit && shipEdit.parts) || [];
    var members = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] && parts[i].groupId === groupId) members.push(i);
    }
    if (members.length === 0) return;
    members.sort(function(a, b) { return a - b; });
    var maxMem = members[members.length - 1];
    setShipSelectedPart(maxMem);
    setShipSelectedExtras(members.slice(0, members.length - 1));
  }
  // Move all members of a group together so the highest-index member lands at
  // targetMaxIdx.  Non-members keep their relative order.
  function shipReorderGroup(groupId, targetMaxIdx) {
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      var members = [], nonMembers = [];
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].groupId === groupId) members.push(list[i]);
        else nonMembers.push(list[i]);
      }
      if (members.length === 0) return prev;
      var insertStart = Math.max(0, Math.min(nonMembers.length, targetMaxIdx - members.length + 1));
      var result = nonMembers.slice(0, insertStart).concat(members).concat(nonMembers.slice(insertStart));
      shipDirtyRef.current = true;
      setShipSelectedPart(insertStart + members.length - 1);
      return Object.assign({}, prev, { parts: result });
    }, "reorderGroup_" + groupId);
  }
  // Start dragging a group header row (moves the whole group).
  function shipDragGroupHandleStart(groupId, maxIdx, e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    shipSelectGroup(groupId);
    shipDragHandleRef.current = { idx: maxIdx, groupId: groupId };
    if (e.currentTarget.setPointerCapture && e.pointerId != null) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch(err) {}
    }
  }
  function shipGroupDisplayName(groupId) {
    var parts = (shipEdit && shipEdit.parts) || [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] && parts[i].groupId === groupId && parts[i].groupName) return parts[i].groupName;
    }
    return null;
  }
  function shipRenameGroup(groupId, newName) {
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].groupId === groupId) {
          list[i] = Object.assign({}, list[i], { groupName: newName || null });
        }
      }
      return Object.assign({}, prev, { parts: list });
    }, "renameGroup_" + groupId);
  }
  function shipDeleteGroup(groupId) {
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).filter(function(p) { return !(p && p.groupId === groupId); });
      return Object.assign({}, prev, { parts: list });
    }, "delGroup_" + groupId);
    setShipSelectedPart(-1);
    setShipSelectedExtras([]);
  }
  function shipDuplicateGroup(groupId) {
    var newGroupId = "g" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      // Find the canonical group name from the clicked group.
      var origName = null;
      for (var ni = 0; ni < list.length; ni++) {
        if (list[ni] && list[ni].groupId === groupId && list[ni].groupName) { origName = list[ni].groupName; break; }
      }
      // Collect by groupId AND by matching groupName — catches split groups where
      // some parts ended up with a different groupId (e.g. from old duplicate ops)
      // but the same human-visible name.
      var members = [];
      var maxIdx = -1;
      for (var i = 0; i < list.length; i++) {
        var p = list[i]; if (!p) continue;
        var byId   = p.groupId === groupId;
        var byName = origName && p.groupId && p.groupName === origName;
        if (byId || byName) {
          members.push(i);
          if (i > maxIdx) maxIdx = i;
        }
      }
      if (members.length === 0) return prev;
      var copyName = origName ? origName + " copy" : null;
      var newParts = [];
      for (var j = 0; j < members.length; j++) {
        var upd = { groupId: newGroupId };
        if (copyName) upd.groupName = copyName;
        newParts.push(Object.assign({}, list[members[j]], upd));
      }
      // Insert immediately after the original group so the copy appears
      // right above it in the reverse-Z list display.
      var newList = list.slice(0, maxIdx + 1).concat(newParts).concat(list.slice(maxIdx + 1));
      return Object.assign({}, prev, { parts: newList });
    }, "dupGroup_" + groupId);
  }
  // Cycle all group members atomically: visible→hidden→ghost→visible.
  // Mixed states normalize to visible first.
  function shipCycleGroupVisibility(groupId) {
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      var members = [];
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].groupId === groupId) members.push(i);
      }
      if (members.length === 0) return prev;
      var firstHidden = list[members[0]].hidden || 0;
      var allSame = true;
      for (var j = 1; j < members.length; j++) {
        if ((list[members[j]].hidden || 0) !== firstHidden) { allSame = false; break; }
      }
      var next = allSame ? (firstHidden === 0 ? 1 : firstHidden === 1 ? 2 : 0) : 0;
      for (var k = 0; k < members.length; k++) {
        list[members[k]] = Object.assign({}, list[members[k]], { hidden: next });
      }
      return Object.assign({}, prev, { parts: list });
    });
  }
  function shipSelectionHasGroup() {
    var sels = shipGetSelected();
    var parts = (shipEdit && shipEdit.parts) || [];
    for (var i = 0; i < sels.length; i++) {
      if (parts[sels[i]] && parts[sels[i]].groupId) return true;
    }
    return false;
  }

  function shipMixed(key) {
    // Guard: same label text ("Opacity", "Rotation", "Width", ...) is reused
    // in Block Designer / VFX / UFO, but those modules have nothing to do
    // with ship part selection. Only return true on the hangar screen.
    if (screen !== "hangar") return false;
    var sels = shipGetSelected();
    if (sels.length < 2) return false;
    var parts = (shipEdit && shipEdit.parts) || [];
    var v0; var have = false;
    for (var i = 0; i < sels.length; i++) {
      var p = parts[sels[i]]; if (!p) continue;
      if (!have) { v0 = p[key]; have = true; }
      else if (p[key] !== v0) return true;
    }
    return false;
  }
  function shipMixedLbl(key, label) {
    return shipMixed(key) ? (label + " · MIXED") : label;
  }
  // Align the current selection to one of six edges/centers of the group's
  // bounding box. Single history step regardless of how many parts move.
  function shipAlignSelected(mode) {
    var sels = shipGetSelected();
    if (sels.length < 2) return;
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      var minL = Infinity, maxR = -Infinity, minT = Infinity, maxB = -Infinity;
      for (var i = 0; i < sels.length; i++) {
        var p = list[sels[i]]; if (!p) continue;
        var l = p.x - p.w / 2, r = p.x + p.w / 2, t = p.y - p.h / 2, b = p.y + p.h / 2;
        if (l < minL) minL = l;
        if (r > maxR) maxR = r;
        if (t < minT) minT = t;
        if (b > maxB) maxB = b;
      }
      var cx = (minL + maxR) / 2;
      var cy = (minT + maxB) / 2;
      for (var j = 0; j < sels.length; j++) {
        var ix = sels[j];
        var pp = list[ix]; if (!pp) continue;
        var nx = pp.x, ny = pp.y;
        if (mode === "left") nx = minL + pp.w / 2;
        else if (mode === "right") nx = maxR - pp.w / 2;
        else if (mode === "hcenter") nx = cx;
        else if (mode === "top") ny = minT + pp.h / 2;
        else if (mode === "bottom") ny = maxB - pp.h / 2;
        else if (mode === "vcenter") ny = cy;
        if (nx !== pp.x || ny !== pp.y) list[ix] = Object.assign({}, pp, { x: nx, y: ny });
      }
      return Object.assign({}, prev, { parts: list });
    }, "align_" + mode + "_" + Date.now());
  }
  // Size-aware fan-out: when all selected parts are in the same group, scales
  // the group as one unit (positions + sizes); otherwise applies the same
  // absolute value to each selected part individually.
  function shipUpdatePartSizeSelected(key, val) {
    var sels = shipGetSelected();
    if (sels.length === 0) return;
    if (sels.length === 1) { shipUpdatePartSize(sels[0], key, val); return; }
    if (shipAreSelectedSameGroup()) { shipScaleGroupSelected(key, val); return; }
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      for (var i = 0; i < sels.length; i++) {
        var ix = sels[i];
        var p = list[ix]; if (!p) continue;
        var nw = p.w, nh = p.h;
        if (key === "w") { nw = val; if (shipWhLocked && p.w > 0) nh = p.h * (val / p.w); }
        else { nh = val; if (shipWhLocked && p.h > 0) nw = p.w * (val / p.h); }
        list[ix] = Object.assign({}, p, { w: Math.max(0.5, nw), h: Math.max(0.5, nh) });
      }
      return Object.assign({}, prev, { parts: list });
    }, "multiSize_" + key);
  }
  function shipMoveGroupSelected(key, val) {
    var sels = shipGetSelected();
    if (sels.length < 2) return;
    var vbbox = shipGroupVisualBBox(sels);
    var dx = key === "x" ? val - vbbox.cx : 0;
    var dy = key === "y" ? val - vbbox.cy : 0;
    if (dx === 0 && dy === 0) return;
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      for (var i = 0; i < sels.length; i++) {
        var ix = sels[i]; var p = list[ix]; if (!p) continue;
        var pgcx = (p.gcx != null) ? p.gcx : p.x;
        var pgcy = (p.gcy != null) ? p.gcy : p.y;
        list[ix] = Object.assign({}, p, {
          x: Math.max(0, Math.min(40, p.x + dx)),
          y: Math.max(0, Math.min(40, p.y + dy)),
          gcx: pgcx + dx,
          gcy: pgcy + dy
        });
      }
      return Object.assign({}, prev, { parts: list });
    }, "groupPos_" + key);
  }
  // Bake a part's gsx/gsy group-scale transform into its geometry.
  // Returns plain {x,y,w,h,tw,tofs,cr} with scale already applied.
  // Doesn't touch the part object itself — caller decides what to store.
  function shipBakePartGs(p) {
    var bgsx = (p.gsx != null) ? p.gsx : 1;
    var bgsy = (p.gsy != null) ? p.gsy : 1;
    var bgcx = (p.gcx != null) ? p.gcx : p.x;
    var bgcy = (p.gcy != null) ? p.gcy : p.y;
    return {
      x:    p.x * bgsx + bgcx * (1 - bgsx),
      y:    p.y * bgsy + bgcy * (1 - bgsy),
      w:    Math.max(0.5, p.w * bgsx),
      h:    Math.max(0.5, p.h * bgsy),
      tw:   typeof p.tw   === "number" ? p.tw   * bgsx : p.tw,
      tofs: typeof p.tofs === "number" ? p.tofs * bgsx : p.tofs,
      cr:   typeof p.cr   === "number" ? p.cr   * Math.min(bgsx, bgsy) : p.cr
    };
  }
  // Rotate every part in the group selection around the group's visual-center
  // pivot.  Bakes any accumulated gsx/gsy first so the rotation is always
  // applied to the true on-screen positions.
  function shipRotateGroupSelected(newRot, currentRot) {
    var sels = shipGetSelected();
    if (sels.length < 2) return;
    var delta = newRot - currentRot;
    if (delta === 0) return;
    var partsNow = (shipEdit && shipEdit.parts) || [];
    // Bake gsx/gsy so we work with real visual positions
    var baked = {};
    for (var bi = 0; bi < sels.length; bi++) {
      var bp = partsNow[sels[bi]]; if (!bp) continue;
      baked[sels[bi]] = shipBakePartGs(bp);
    }
    // Pivot = center of baked visual positions
    var minX = 99999, maxX = -99999, minY = 99999, maxY = -99999;
    for (var pi = 0; pi < sels.length; pi++) {
      var bk = baked[sels[pi]]; if (!bk) continue;
      if (bk.x < minX) minX = bk.x; if (bk.x > maxX) maxX = bk.x;
      if (bk.y < minY) minY = bk.y; if (bk.y > maxY) maxY = bk.y;
    }
    var pcx = (minX + maxX) / 2, pcy = (minY + maxY) / 2;
    var deltaRad = delta * Math.PI / 180;
    var cosD = Math.cos(deltaRad), sinD = Math.sin(deltaRad);
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      for (var i = 0; i < sels.length; i++) {
        var ix = sels[i]; var p = list[ix]; if (!p) continue;
        var bk2 = baked[ix]; if (!bk2) continue;
        var dx = bk2.x - pcx, dy = bk2.y - pcy;
        var nx = pcx + dx * cosD - dy * sinD;
        var ny = pcy + dx * sinD + dy * cosD;
        var nrot = ((p.rot || 0) + delta) % 360;
        if (nrot < 0) nrot += 360;
        // Write baked geometry back + reset scale; keep gcx/gcy as the pivot
        list[ix] = Object.assign({}, p, {
          x: nx, y: ny, w: bk2.w, h: bk2.h,
          rot: nrot, gsx: 1, gsy: 1, gcx: pcx, gcy: pcy
        });
      }
      return Object.assign({}, prev, { parts: list });
    }, "groupRot");
  }
  // Scale every part in the group as a rigid body.  Bakes any existing
  // gsx/gsy first, then applies world-space (sx, sy) scaling to positions
  // and uses a rotation-aware formula to find new (w, h) so the group's
  // VISUAL bounding box changes by exactly the requested amount.
  function shipScaleGroupSelected(key, val) {
    var sels = shipGetSelected();
    if (sels.length < 2) return;
    var partsNow = (shipEdit && shipEdit.parts) || [];
    var baked = {};
    for (var gbi = 0; gbi < sels.length; gbi++) {
      var gbp = partsNow[sels[gbi]]; if (!gbp) continue;
      baked[sels[gbi]] = shipBakePartGs(gbp);
    }
    // Rotation-aware visual bbox of baked parts
    var vminX = 99999, vmaxX = -99999, vminY = 99999, vmaxY = -99999;
    for (var gvi = 0; gvi < sels.length; gvi++) {
      var gvp = partsNow[sels[gvi]]; if (!gvp) continue;
      var gvbk = baked[sels[gvi]]; if (!gvbk) continue;
      var gvr = (gvp.rot || 0) * Math.PI / 180;
      var gvcos = Math.cos(gvr), gvsin = Math.sin(gvr);
      var gvhw = gvbk.w / 2, gvhh = gvbk.h / 2;
      var gvdxs = [-gvhw, gvhw, gvhw, -gvhw], gvdys = [-gvhh, -gvhh, gvhh, gvhh];
      for (var gvci = 0; gvci < 4; gvci++) {
        var gvrx = gvbk.x + gvdxs[gvci] * gvcos - gvdys[gvci] * gvsin;
        var gvry = gvbk.y + gvdxs[gvci] * gvsin + gvdys[gvci] * gvcos;
        if (gvrx < vminX) vminX = gvrx; if (gvrx > vmaxX) vmaxX = gvrx;
        if (gvry < vminY) vminY = gvry; if (gvry > vmaxY) vmaxY = gvry;
      }
    }
    var vbboxW = vmaxX - vminX, vbboxH = vmaxY - vminY;
    if (vbboxW < 0.01 || vbboxH < 0.01) return;
    var gsx = 1, gsy = 1;
    if (key === "w") { gsx = val / vbboxW; if (shipWhLocked) gsy = gsx; }
    else             { gsy = val / vbboxH; if (shipWhLocked) gsx = gsy; }
    if (Math.abs(gsx - 1) < 0.001 && Math.abs(gsy - 1) < 0.001) return;
    // Pivot = center of baked-part-center bbox
    var cminX = 99999, cmaxX = -99999, cminY = 99999, cmaxY = -99999;
    for (var gci = 0; gci < sels.length; gci++) {
      var gcbk = baked[sels[gci]]; if (!gcbk) continue;
      if (gcbk.x < cminX) cminX = gcbk.x; if (gcbk.x > cmaxX) cmaxX = gcbk.x;
      if (gcbk.y < cminY) cminY = gcbk.y; if (gcbk.y > cmaxY) cmaxY = gcbk.y;
    }
    var pcx = (cminX + cmaxX) / 2, pcy = (cminY + cmaxY) / 2;
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      for (var i = 0; i < sels.length; i++) {
        var ix = sels[i]; var p = list[ix]; if (!p) continue;
        var bk3 = baked[ix]; if (!bk3) continue;
        // Scale position relative to pivot
        var nx = pcx + (bk3.x - pcx) * gsx;
        var ny = pcy + (bk3.y - pcy) * gsy;
        // Rotation-aware dimension scaling: find new (w, h) so the part's
        // world-space bounding-box contribution scales by (gsx, gsy).
        // For a part with rotation r:
        //   world_x_halfextent = w/2*|cos r| + h/2*|sin r|
        //   world_y_halfextent = w/2*|sin r| + h/2*|cos r|
        // We solve the 2×2 system for new w/2 and h/2.
        var r = (p.rot || 0) * Math.PI / 180;
        var cosR = Math.abs(Math.cos(r)), sinR = Math.abs(Math.sin(r));
        var det = cosR * cosR - sinR * sinR;
        var nw, nh;
        if (Math.abs(det) < 0.02) {
          // Near 45° / 135° — system is singular; use geometric mean scale
          var sm = Math.sqrt(gsx * gsy);
          nw = Math.max(0.5, bk3.w * sm);
          nh = Math.max(0.5, bk3.h * sm);
        } else {
          var hw3 = bk3.w / 2, hh3 = bk3.h / 2;
          var rhs1 = gsx * (hw3 * cosR + hh3 * sinR);
          var rhs2 = gsy * (hw3 * sinR + hh3 * cosR);
          nw = Math.max(0.5, 2 * Math.abs((cosR * rhs1 - sinR * rhs2) / det));
          nh = Math.max(0.5, 2 * Math.abs((cosR * rhs2 - sinR * rhs1) / det));
        }
        // Scale trapezoid tw/tofs by the same ratio w changed
        var wRatio = bk3.w > 0.01 ? nw / bk3.w : 1;
        var hRatio = bk3.h > 0.01 ? nh / bk3.h : 1;
        var patch = { x: nx, y: ny, w: nw, h: nh, gsx: 1, gsy: 1, gcx: pcx, gcy: pcy };
        if (typeof bk3.tw   === "number") patch.tw   = Math.max(0, bk3.tw   * wRatio);
        if (typeof bk3.tofs === "number") patch.tofs  = bk3.tofs * wRatio;
        if (typeof bk3.cr   === "number") patch.cr    = Math.max(0, bk3.cr   * Math.min(wRatio, hRatio));
        list[ix] = Object.assign({}, p, patch);
      }
      return Object.assign({}, prev, { parts: list });
    }, "groupSize_" + key);
  }
  // Flip / Mirror core: bake group-scale, reflect positions + rotations, clear gs.
  // axis "h" = flip left↔right about cx; axis "v" = flip top↔bottom about cy.
  function shipTransformFlip(axis, cx, cy) {
    var sels = shipGetSelected();
    if (sels.length === 0) return;
    var partsNow = (shipEdit && shipEdit.parts) || [];
    var baked = {};
    for (var fbi = 0; fbi < sels.length; fbi++) {
      var fbp = partsNow[sels[fbi]]; if (!fbp) continue;
      baked[sels[fbi]] = shipBakePartGs(fbp);
    }
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      for (var fi = 0; fi < sels.length; fi++) {
        var fix = sels[fi]; var fp = list[fix]; if (!fp) continue;
        var fbk = baked[fix]; if (!fbk) continue;
        var fnx = fbk.x, fny = fbk.y, fnrot;
        if (axis === "h") {
          fnx = 2 * cx - fbk.x;
          fnrot = (360 - (fp.rot || 0)) % 360;
        } else {
          fny = 2 * cy - fbk.y;
          fnrot = ((180 - (fp.rot || 0)) + 360) % 360;
        }
        var fupd = { x: fnx, y: fny, w: fbk.w, h: fbk.h, rot: fnrot, gsx: 1, gsy: 1, gcx: fnx, gcy: fny };
        if (typeof fbk.tw   === "number") fupd.tw   = fbk.tw;
        if (typeof fbk.cr   === "number") fupd.cr   = fbk.cr;
        if (typeof fbk.tofs === "number") fupd.tofs = (axis === "h") ? -fbk.tofs : fbk.tofs;
        if (typeof fp.gradAngle === "number") fupd.gradAngle = (axis === "h") ? (180 - fp.gradAngle + 360) % 360 : (360 - fp.gradAngle) % 360;
        list[fix] = Object.assign({}, fp, fupd);
      }
      return Object.assign({}, prev, { parts: list });
    }, "flip_" + axis);
  }
  function shipFlipSelected(axis) {
    var sels = shipGetSelected();
    if (sels.length === 0) return;
    var bbox = shipGroupVisualBBox(sels);
    shipTransformFlip(axis, bbox.cx, bbox.cy);
  }
  function shipMirrorSelected(axis) {
    shipTransformFlip(axis, 20, 20);
  }
  // Replace / Add / Cancel popup shown when tapping a hull preset that would
  // overwrite existing parts.
  function renderHullPresetOverlay(hullId, onCancel, onChoose) {
    var label = SHIP_HULL_LABELS[hullId] || hullId;
    return React.createElement("div", { onClick: onCancel,
      style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 } },
      React.createElement("div", { onClick: function(e) { e.stopPropagation(); },
        style: { background: "linear-gradient(180deg, #2a1525, #1a0c18)", border: "1px solid rgba(255,138,170,0.3)", borderRadius: 12, padding: "18px 18px 14px", maxWidth: 320, width: "100%", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" } },
        React.createElement("div", { style: { color: "#ff8aaa", fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Exo 2', sans-serif", marginBottom: 8 } }, "Apply " + label + " preset"),
        React.createElement("div", { style: { color: "rgba(200,210,220,0.7)", fontSize: 12, lineHeight: 1.4, marginBottom: 14 } }, "This ship already has parts. Replace them with the preset, or add the preset's parts on top of yours?"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
          React.createElement("div", { onClick: function() { onChoose("replace"); },
            style: { padding: "9px 12px", textAlign: "center", borderRadius: 6, cursor: "pointer", background: "rgba(255,138,170,0.18)", border: "1px solid rgba(255,138,170,0.5)", color: "#ff8aaa", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" } }, "Replace current shapes"),
          React.createElement("div", { onClick: function() { onChoose("add"); },
            style: { padding: "9px 12px", textAlign: "center", borderRadius: 6, cursor: "pointer", background: "rgba(128,221,255,0.12)", border: "1px solid rgba(128,221,255,0.4)", color: "#80ddff", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" } }, "Add to current shapes"),
          React.createElement("div", { onClick: onCancel,
            style: { padding: "9px 12px", textAlign: "center", borderRadius: 6, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(200,210,220,0.7)", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" } }, "Cancel"))));
  }
  // Header shown at the top of the Color / Position sub-tabs when a part is
  // selected: part type label, name input, duplicate, delete.
  function renderShipSelectedHeader(sel) {
    var selCount = shipGetSelected().length;
    var heading = selCount > 1 ? (selCount + " parts selected") : ("Selected: " + (sel.name || SHIP_PART_LABELS[sel.type]));
    return React.createElement("div", { style: { color: "#ff8aaa", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "'Exo 2', sans-serif", marginBottom: 8 } }, heading);
  }
  // Placeholder shown on the Color / Position sub-tabs when nothing is selected.
  function renderShipSelectMessage() {
    return React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "18px 16px", textAlign: "center" } },
      React.createElement("div", { style: { color: "rgba(180,200,220,0.7)", fontSize: 12, fontFamily: "'Exo 2', sans-serif", marginBottom: 6 } }, "No part selected"),
      React.createElement("div", { style: { color: "rgba(180,200,220,0.4)", fontSize: 11 } }, "Tap a part on the preview, or open the LIST tab to choose one."));
  }
  function shipPreviewPointerDown(e) {
    if (e.preventDefault) e.preventDefault();
    var rect = e.currentTarget.getBoundingClientRect();
    var cx = (e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0));
    var cy = (e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0));
    var px = (cx - rect.left) / rect.width * 40;
    var py = (cy - rect.top) / rect.height * 40;
    var parts = shipEdit.parts || [];
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      var hw = ((p.w || 8) / 2) + 1.5, hh = ((p.h || 8) / 2) + 1.5;
      if (px >= p.x - hw && px <= p.x + hw && py >= p.y - hh && py <= p.y + hh) {
        shipApplyTap(i, shipMultiSelectOn);
        if (!shipMultiSelectOn) {
          var members = p.groupId ? shipGroupMembers(p.groupId) : [i];
          if (p.groupId && members.length > 1) {
            var parts2 = (shipEdit && shipEdit.parts) || [];
            var startPos = [];
            for (var j = 0; j < members.length; j++) {
              var sp = parts2[members[j]];
              startPos.push(sp ? { x: sp.x, y: sp.y, gcx: (sp.gcx != null) ? sp.gcx : sp.x, gcy: (sp.gcy != null) ? sp.gcy : sp.y } : { x: 0, y: 0, gcx: 0, gcy: 0 });
            }
            shipDragRef.current = { group: true, sels: members, startPos: startPos, startPx: px, startPy: py };
          } else if (!p.groupId) {
            shipDragRef.current = { idx: i, offX: px - p.x, offY: py - p.y };
          }
          if (shipDragRef.current && e.currentTarget.setPointerCapture && e.pointerId != null) {
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch(err) {}
          }
        }
        return;
      }
    }
    if (!shipMultiSelectOn) {
      setShipSelectedPart(-1);
      setShipSelectedExtras([]);
    }
  }
  function shipPreviewPointerMove(e) {
    if (!shipDragRef.current) return;
    if (e.preventDefault) e.preventDefault();
    var rect = e.currentTarget.getBoundingClientRect();
    var cx = (e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0));
    var cy = (e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0));
    var px = (cx - rect.left) / rect.width * 40;
    var py = (cy - rect.top) / rect.height * 40;
    var di = shipDragRef.current;
    if (di.group) {
      var dx = px - di.startPx;
      var dy = py - di.startPy;
      var gsels = di.sels;
      var gstart = di.startPos;
      shipApplyEdit(function(prev) {
        var list = (prev.parts || []).slice();
        for (var i = 0; i < gsels.length; i++) {
          var ix = gsels[i]; var p = list[ix]; if (!p) continue;
          list[ix] = Object.assign({}, p, { x: Math.max(0, Math.min(40, gstart[i].x + dx)), y: Math.max(0, Math.min(40, gstart[i].y + dy)), gcx: gstart[i].gcx + dx, gcy: gstart[i].gcy + dy });
        }
        shipDirtyRef.current = true;
        return Object.assign({}, prev, { parts: list });
      }, "groupDrag");
      return;
    }
    var nx = Math.max(0, Math.min(40, px - di.offX));
    var ny = Math.max(0, Math.min(40, py - di.offY));
    shipApplyEdit(function(prev) {
      var list = (prev.parts || []).slice();
      if (!list[di.idx]) return prev;
      list[di.idx] = Object.assign({}, list[di.idx], { x: nx, y: ny });
      shipDirtyRef.current = true;
      return Object.assign({}, prev, { parts: list });
    }, "pos_" + di.idx);
  }
  function shipPreviewPointerUp(e) {
    shipDragRef.current = null;
  }
  function shipResizePointerDown(e) {
    e.stopPropagation();
    e.preventDefault();
    if (e.target.setPointerCapture && e.pointerId != null) {
      try { e.target.setPointerCapture(e.pointerId); } catch(err) {}
    }
    shipResizeDragRef.current = { startY: e.clientY, startSize: shipPreviewSize, moved: false };
  }
  function shipResizePointerMove(e) {
    if (!shipResizeDragRef.current) return;
    e.stopPropagation();
    var dy = e.clientY - shipResizeDragRef.current.startY;
    if (Math.abs(dy) > 4) shipResizeDragRef.current.moved = true;
    var fullW = shipPreviewStickyRef.current ? (shipPreviewStickyRef.current.offsetWidth - 24) : 340;
    var newSize = Math.max(80, Math.min(fullW, shipResizeDragRef.current.startSize + dy));
    setShipPreviewSize(Math.round(newSize));
    setShipPreviewFull(newSize >= fullW - 4);
  }
  function shipResizePointerUp(e) {
    if (!shipResizeDragRef.current) return;
    e.stopPropagation();
    var moved = shipResizeDragRef.current.moved;
    shipResizeDragRef.current = null;
    if (!moved) {
      if (shipPreviewFull) {
        setShipPreviewSize(128);
        setShipPreviewFull(false);
      } else {
        var fullW = shipPreviewStickyRef.current ? (shipPreviewStickyRef.current.offsetWidth - 24) : 340;
        setShipPreviewSize(Math.round(fullW));
        setShipPreviewFull(true);
      }
    }
  }
  // Parts-list row-drag handlers. The grip on each row owns the pointer
  // capture; while dragging, we measure other rows' bounding rects to figure
  // out the target index and swap as the pointer crosses each midpoint.
  function shipDragHandleStart(idx, e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    setShipSelectedPart(idx);
    shipDragHandleRef.current = { idx: idx };
    if (e.currentTarget.setPointerCapture && e.pointerId != null) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch(err) {}
    }
  }
  function shipDragHandleMove(e) {
    var d = shipDragHandleRef.current;
    if (!d) return;
    if (e.preventDefault) e.preventDefault();
    var rows = document.querySelectorAll("[data-shippart-row]");
    var cy = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    // Find display position (0 = before first row, rows.length = after last row).
    var displayPos = rows.length;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i].getBoundingClientRect();
      if (cy < r.top + r.height / 2) { displayPos = i; break; }
    }
    // Compute the target array index from the row at displayPos (clamped).
    var clampedPos = Math.min(displayPos, rows.length - 1);
    var toIdx = rows.length > 0 ? parseInt(rows[clampedPos].getAttribute("data-shippart-actual-idx"), 10) : d.idx;
    if (isNaN(toIdx)) toIdx = d.idx;
    // freeSlot = true when drop would clear groupId (top/bottom boundary or between different groups).
    var freeSlot = false;
    if (displayPos === 0 || displayPos >= rows.length) {
      freeSlot = true;
    } else {
      var gAbove = rows[displayPos - 1].getAttribute("data-shippart-gid") || "";
      var gBelow = rows[displayPos].getAttribute("data-shippart-gid") || "";
      freeSlot = gAbove !== gBelow;
    }
    // Only re-render when position actually changes.
    var prev = d.hover;
    if (!prev || prev.displayPos !== displayPos || prev.toIdx !== toIdx || prev.freeSlot !== freeSlot) {
      d.hover = { displayPos: displayPos, toIdx: toIdx, freeSlot: freeSlot };
      setShipDragHover({ displayPos: displayPos, toIdx: toIdx, freeSlot: freeSlot });
    }
  }
  function shipDragHandleEnd(e) {
    var d = shipDragHandleRef.current;
    var hover = d && d.hover;
    shipDragHandleRef.current = null;
    setShipDragHover(null);
    if (!d || !hover || hover.toIdx === d.idx) return;
    if (d.groupId) {
      shipReorderGroup(d.groupId, hover.toIdx);
    } else {
      shipReorderPart(d.idx, hover.toIdx, hover.freeSlot);
    }
  }
  function shipUpdateEdit(key, val) {
    shipDirtyRef.current = true;
    shipApplyEdit(function(prev) { var next = Object.assign({}, prev); next[key] = val; return next; }, "edit_" + key);
  }
  function shipSaveCurrent() {
    var now = new Date().toISOString();
    var name = (shipEdit.name || "").trim() || "My Ship";
    var isNew = !shipEditId;
    var id = isNew ? ("ship_" + Date.now()) : shipEditId;
    var saved = Object.assign({}, shipEdit, { id: id, name: name, savedAt: now });
    setShipSaved(function(prev) {
      var list = isNew ? prev.concat([saved]) : prev.map(function(d) { return d.id === id ? saved : d; });
      shipSaveDesigns(list);
      return list;
    });
    if (isNew || !shipActiveId) {
      setShipActiveId(id);
      shipSaveActiveId(id);
    }
    setShipEditId(id);
    shipDirtyRef.current = false;
    setShipSaveStatus("Saved");
    setTimeout(function() { setShipSaveStatus(""); }, 1500);
  }
  function shipSetActive(id) {
    setShipActiveId(id);
    shipSaveActiveId(id);
  }
  // Inline rename from the list. Saves on Enter/blur, cancels on Escape.
  function shipStartRename(design) {
    setShipRenameValue(design.name || "");
    setShipRenamingId(design.id);
  }
  function shipCommitRename() {
    var id = shipRenamingId;
    if (!id) return;
    var name = (shipRenameValue || "").trim() || "Untitled";
    setShipSaved(function(prev) {
      var list = prev.map(function(d) { return d.id === id ? Object.assign({}, d, { name: name, savedAt: new Date().toISOString() }) : d; });
      shipSaveDesigns(list);
      return list;
    });
    setShipRenamingId(null);
    setShipRenameValue("");
  }
  function shipCancelRename() {
    setShipRenamingId(null);
    setShipRenameValue("");
  }
  function shipDeleteDesign(id) {
    setShipSaved(function(prev) {
      var list = prev.filter(function(d) { return d.id !== id; });
      shipSaveDesigns(list);
      return list;
    });
    if (shipActiveId === id) {
      setShipActiveId(null);
      shipSaveActiveId(null);
    }
    setShipDeletingId(null);
  }
  function shipExportDesign(design) {
    var exp = Object.assign({}, design);
    setShipExportText(JSON.stringify(exp, null, 2));
    setShipExportId(design.id);
    setShipCopied(false);
  }
  function shipHandleImport() {
    var text = shipImportText.trim();
    if (!text) { setShipImportError("Paste a ship design code first"); return; }
    var parsed;
    try { parsed = JSON.parse(text); } catch (e) { setShipImportError("Invalid format -- not valid JSON"); return; }
    var arr = Array.isArray(parsed) ? parsed : [parsed];
    if (arr.length === 0) { setShipImportError("No designs found"); return; }
    var newEntries = [];
    for (var a = 0; a < arr.length; a++) {
      var d = arr[a];
      if (!d || typeof d !== "object") { setShipImportError("Item " + (a + 1) + ": not an object"); return; }
      if (typeof d.hull !== "string") { setShipImportError("Item " + (a + 1) + ": missing hull"); return; }
      var entry = Object.assign({}, SHIP_DEFAULT_DESIGN, d);
      entry.id = "ship_" + Date.now() + "_" + a;
      entry.name = d.name || "Imported Ship";
      entry.savedAt = new Date().toISOString();
      newEntries.push(entry);
    }
    setShipSaved(function(prev) { var list = prev.concat(newEntries); shipSaveDesigns(list); return list; });
    setShipShowImport(false); setShipImportText(""); setShipImportError("");
  }

  function handleSplashToGame() {
    setSplashTransition("exit");
    try { sessionStorage.setItem("cd_transition_from", "workshop"); } catch(e2) {}
    setTimeout(function() { window.location.href = "index.html"; }, 620);
  }
  function handleSplashToGamePlaySet() {
    setSplashTransition("exit");
    try { sessionStorage.setItem("cd_transition_from", "workshop"); } catch(e5) {}
    setTimeout(function() { window.location.href = "index.html?playset=1"; }, 620);
  }
  function handleSplashTouchStart(e) {
    splashTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function handleSplashTouchEnd(e) {
    if (!splashTouchRef.current) return;
    var dx = e.changedTouches[0].clientX - splashTouchRef.current.x;
    var dy = e.changedTouches[0].clientY - splashTouchRef.current.y;
    splashTouchRef.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dx > 0) {
      handleSplashToGame();
    }
  }

  // RENDER
  // ═══════════════════════════════════════
  var plasmaCanUndo = plasmaHistoryRef.current.idx > 0;
  var plasmaCanRedo = plasmaHistoryRef.current.idx < plasmaHistoryRef.current.stack.length - 1;
  var plasmaEasing = plasmaEditDesign.shape === "blast" ? "linear" : plasmaEditDesign.shape === "torpedo" ? "cubic-bezier(0.895, 0.030, 0.685, 0.220)" : "ease-in";
  var plasmaAnimDur = "plasmaZip " + (1.5 / (plasmaEditDesign.speed || 1.0)).toFixed(2) + "s " + plasmaEasing + " infinite";
  var plasmaFlashAnimStr = "plasmaFlash " + (1.5 / (plasmaEditDesign.speed || 1.0)).toFixed(2) + "s ease-out infinite";
  var plasmaSplitDist = Math.round(((plasmaEditDesign.splitDistance != null ? plasmaEditDesign.splitDistance : 30) / 100) * plasmaShipSize);
  var plasmaSourceOffsetPx = Math.round(((plasmaEditDesign.sourceOffsetX != null ? plasmaEditDesign.sourceOffsetX : 50) - 50) / 100 * plasmaShipSize);
  var plasmaSourceY = plasmaEditDesign.sourceOffsetY != null ? plasmaEditDesign.sourceOffsetY : 0;
  // Origin: 0% = nose (top of ship), 100% = tail (bottom). Ship sits at bottom:10.
  var plasmaOriginBottom = 10 + Math.round(plasmaShipSize * (1 - plasmaSourceY / 100));
  var plasmaFlashBottom = plasmaOriginBottom;
  var plasmaShotBottom = plasmaOriginBottom + 8;
  var plasmaEndY = String(-(260 - plasmaShotBottom - 10)) + "px";
  var plasmaFlashSize = plasmaEditDesign.flashSize || 24;
  var plasmaFlashOpacity = plasmaEditDesign.flashOpacity != null ? plasmaEditDesign.flashOpacity : 0.9;
  var plasmaSplitFlashSize = Math.round(plasmaFlashSize * 0.75);
  var plasmaIndicatorColor = plasmaEditDesign.glowColor || "#80ddff";
  var plasmaIndicatorGlow = "0 0 5px " + plasmaIndicatorColor + ", 0 0 12px " + plasmaIndicatorColor + "99";

  // ── Global keyboard shortcuts (for local testing) ──
  useEffect(function() {
    function handleKbd(e) {
      var key = e.key;
      var tag = document.activeElement ? document.activeElement.tagName : "";
      var isInput = tag === "INPUT" || tag === "TEXTAREA";
      if (key === "Escape") {
        if (showWsTesterMenu) { setShowWsTesterMenu(false); return; }
        if (showWsGuide) { setShowWsGuide(false); return; }
        if (showWsMenu) { setShowWsMenu(false); return; }
        if (bdImportConfirm) { setBdImportConfirm(null); return; }
        if (showImport) { setShowImport(false); setImportText(""); setImportError(""); return; }
        if (bdShowImport) { setBdShowImport(false); setBdImportText(""); setBdImportError(""); return; }
        if (vfxShowImport) { setVfxShowImport(false); setVfxImportText(""); setVfxImportError(""); return; }
        if (ufoShowImport) { setUfoShowImport(false); setUfoImportText(""); setUfoImportError(""); return; }
        if (shipShowImport) { setShipShowImport(false); setShipImportText(""); setShipImportError(""); return; }
        if (plasmaShowImport) { setPlasmaShowImport(false); setPlasmaImportText(""); setPlasmaImportError(""); return; }
        if (setsShowImport) { setSetsShowImport(false); setSetsImportText(""); setSetsImportError(""); return; }
        if (showBackWarn) { setShowBackWarn(false); return; }
        if (bdShowBackWarn) { setBdShowBackWarn(false); return; }
        if (vfxShowBackWarn) { setVfxShowBackWarn(false); return; }
        if (ufoShowBackWarn) { setUfoShowBackWarn(false); return; }
        if (shipShowBackWarn) { setShipShowBackWarn(false); return; }
        if (plasmaShowBackWarn) { setPlasmaShowBackWarn(false); return; }
      }
      if (key === "Enter" && !isInput) {
        if (bdImportConfirm) { bdConfirmImport(); return; }
      }
    }
    document.addEventListener("keydown", handleKbd);
    return function() { document.removeEventListener("keydown", handleKbd); };
  }, [showWsTesterMenu, showWsGuide, showWsMenu, bdImportConfirm, showImport, bdShowImport, vfxShowImport, ufoShowImport, shipShowImport, plasmaShowImport, setsShowImport, showBackWarn, bdShowBackWarn, vfxShowBackWarn, ufoShowBackWarn, shipShowBackWarn, plasmaShowBackWarn]);

  return React.createElement("div", { style: { position: "fixed", inset: 0, background: "#0b0c1a", fontFamily: "'Quicksand',sans-serif", overflow: "hidden" } },
    React.createElement("style", null, ANIM_CSS),
    React.createElement("div", { style: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" } }, React.createElement(Stars, null)),

    // ═══ SPLASH SCREEN ═══
    screen === "splash" && React.createElement("div", { onTouchStart: handleSplashTouchStart, onTouchEnd: handleSplashTouchEnd, style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", background: "radial-gradient(ellipse 90% 60% at 50% 28%, #0e0820 0%, #0a0618 45%, #06040f 100%)", animation: splashEntering ? "cdSplashEnterFromGame 0.4s ease-out both" : (splashTransition === "exit" ? "cdSplashExitShrink 0.62s ease-in both" : "none"), willChange: "transform, filter" } },

      // ── TITLE + STATUS HEADER ──
      React.createElement(WsPanel, { style: { flexShrink: 0, padding: "8px 8px 8px 18px", display: "flex", alignItems: "center", gap: 10, overflow: "hidden", borderRadius: "10px 10px 0 0" } },
        React.createElement("div", { style: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: "repeating-linear-gradient(135deg, #ffcc00 0 4px, #111 4px 8px)", opacity: 0.65, borderRadius: "10px 0 0 0" } }),
        React.createElement("div", { style: { position: "absolute", right: 0, top: 0, bottom: 0, width: 5, background: "repeating-linear-gradient(135deg, #ffcc00 0 4px, #111 4px 8px)", opacity: 0.65, borderRadius: "0 10px 0 0" } }),
        React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 } },
          React.createElement("div", { style: { fontFamily: "'Exo 2', sans-serif", fontSize: 33, fontWeight: 700, letterSpacing: 7, color: "#ede8ff", textTransform: "uppercase", textShadow: "0 0 22px rgba(160,100,255,0.55), 0 0 44px rgba(120,60,220,0.25)", lineHeight: 1.1 } }, "WORKSHOP"),
          React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } },
            React.createElement("div", { style: { height: 1, width: 22, background: "rgba(160,100,255,0.25)" } }),
            React.createElement(WsMono, { size: 8, ls: 2, color: "rgba(200,170,255,0.32)" }, "SERVICE PANEL  ·  v5.2"),
            React.createElement("div", { style: { height: 1, width: 22, background: "rgba(160,100,255,0.25)" } })
          ),
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginTop: 2 } },
            React.createElement(WsLED, { color: WS.green, size: 6 }),
            React.createElement(WsLED, { color: "#b060ff", size: 6 })
          )
        ),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 } },
          React.createElement("div", { onClick: function() { setShowWsGuide(true); }, style: { width: 36, height: 36, borderRadius: 6, background: "linear-gradient(180deg, #3a2060 0%, #261040 100%)", border: "1px solid rgba(160,100,255,0.35)", boxShadow: "inset 0 1px 0 rgba(200,160,255,0.18), 0 2px 4px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 } },
            React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "rgba(200,170,255,0.6)", strokeWidth: "2" },
              React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
              React.createElement("path", { d: "M9.5 9.5a2.5 2.5 0 1 1 4.4 1.7c-.6.6-1.4.9-1.4 2.3" }),
              React.createElement("circle", { cx: "12", cy: "17", r: "0.6", fill: "rgba(200,170,255,0.6)" })
            )
          ),
          React.createElement("div", { onClick: function() { setShowWsMenu(true); }, style: { width: 36, height: 36, borderRadius: 6, background: "linear-gradient(180deg, #3a2060 0%, #261040 100%)", border: "1px solid rgba(160,100,255,0.35)", boxShadow: "inset 0 1px 0 rgba(200,160,255,0.18), 0 2px 4px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", flexShrink: 0 } },
            React.createElement("div", { style: { width: 14, height: 2, borderRadius: 1, background: "rgba(200,170,255,0.6)" } }),
            React.createElement("div", { style: { width: 14, height: 2, borderRadius: 1, background: "rgba(200,170,255,0.6)" } }),
            React.createElement("div", { style: { width: 14, height: 2, borderRadius: 1, background: "rgba(200,170,255,0.6)" } })
          )
        )
      ),

      // ── SCROLLABLE BODY ──
      React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "8px 10px 6px", display: "flex", flexDirection: "column", gap: 8 } },

        // COMBINED MODULES + ACTIVE PANEL (single frame, two columns)
        React.createElement(WsPanel, { style: { padding: "10px", display: "flex", flexDirection: "column" } },
          // Header row aligned to body columns (MODULES over col 1, ACTIVE over col 2)
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", paddingLeft: 2 } },
              React.createElement(WsMono, { size: 11, ls: 2.5, color: "rgba(220,200,255,0.88)" }, "MODULES")
            ),
            React.createElement("div", { style: { display: "flex", alignItems: "center", paddingRight: 2 } },
              React.createElement(WsMono, { size: 11, ls: 2.5, color: "rgba(220,200,255,0.88)" }, "ACTIVE")
            )
          ),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, flex: 1 } },
            React.createElement("div", { ref: splashRowRef, style: { display: "flex", flexDirection: "row", gap: 6 } },
              React.createElement("div", { onClick: function() { loadSavedLevels(); setScreen("builder"); setLbScreen("list"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "1px solid rgba(80,200,255,0.12)", borderLeft: "3px solid #80ddff", borderRadius: 8, padding: "10px", cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", gap: 10, flex: 1 } },
                React.createElement("svg", { width: "40", height: "40", viewBox: "0 0 24 24", style: { flexShrink: 0 } },
                  React.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1", fill: "none", stroke: "#80ddff", strokeWidth: "1.5" }),
                  React.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1", fill: "#80ddff", opacity: "0.45" }),
                  React.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1", fill: "#80ddff", opacity: "0.45" }),
                  React.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1", fill: "none", stroke: "#80ddff", strokeWidth: "1.5", strokeDasharray: "2 2" })
                ),
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { color: "#ddf0ff", fontSize: 20, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "Level Builder"),
                  React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
                    React.createElement("div", { style: { color: "rgba(170,195,215,0.45)", fontSize: 12 } }, "Design custom grids"),
                    React.createElement(WsMono, { size: 9, ls: 0.5, color: "rgba(128,221,255,0.45)" }, savedLevels.length + " SAVED")
                  )
                )
              ),
              React.createElement("div", { onClick: function() { setScreen("builder"); if (savedLevels.length > 0) { var latest = savedLevels.slice().sort(function(a, b) { return new Date(b.savedAt || 0) - new Date(a.savedAt || 0); })[0]; openBuilder(latest); } else { loadSavedLevels(); setLbScreen("list"); } }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "2px solid #80ddff", borderRadius: 7, padding: "5px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, aspectRatio: splashRowH ? undefined : "1", alignSelf: splashRowH ? "auto" : "stretch", width: splashRowH || undefined, height: splashRowH || undefined } },
                React.createElement("div", { style: { display: "flex", justifyContent: "center" } },
                  renderGridMiniPreview(savedLevels.length > 0 ? savedLevels.slice().sort(function(a, b) { return new Date(b.savedAt || 0) - new Date(a.savedAt || 0); })[0] : null, "rgba(128,221,255,0.3)")),
                React.createElement("div", { style: { color: "#a8d8f0", fontFamily: "'Exo 2', sans-serif", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" } }, truncLabel(savedLevels.length > 0 ? (savedLevels.slice().sort(function(a, b) { return new Date(b.savedAt || 0) - new Date(a.savedAt || 0); })[0].name || "Untitled") : "Default"))
              )
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "row", gap: 6 } },
              React.createElement("div", { onClick: function() { setScreen("designer"); setBdCurrentView("list"); setBdSavedTab("active"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "1px solid rgba(200,184,255,0.12)", borderLeft: "3px solid #c8b8ff", borderRadius: 8, padding: "10px", cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", gap: 10, flex: 1 } },
                React.createElement("svg", { width: "40", height: "40", viewBox: "0 0 24 24", style: { flexShrink: 0 } },
                  React.createElement("rect", { x: "4", y: "4", width: "16", height: "16", rx: "3", fill: "none", stroke: "#c8b8ff", strokeWidth: "1.5" }),
                  React.createElement("circle", { cx: "12", cy: "12", r: "4", fill: "#c8b8ff", opacity: "0.4" }),
                  React.createElement("path", { d: "M8 4v16M16 4v16M4 8h16M4 16h16", stroke: "#c8b8ff", strokeWidth: "0.5", opacity: "0.2" })
                ),
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { color: "#ede8ff", fontSize: 20, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "Block Designer"),
                  React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
                    React.createElement("div", { style: { color: "rgba(170,195,215,0.45)", fontSize: 12 } }, "Custom block skins"),
                    React.createElement(WsMono, { size: 9, ls: 0.5, color: "rgba(200,184,255,0.45)" }, bdSaved.length + " SAVED")
                  )
                )
              ),
              React.createElement("div", { onClick: function() { setScreen("designer"); setBdCurrentView("list"); setBdSavedTab("active"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "2px solid #c8b8ff", borderRadius: 7, padding: "5px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", aspectRatio: splashRowH ? undefined : "1", alignSelf: splashRowH ? "auto" : "stretch", width: splashRowH || undefined, height: splashRowH || undefined } },
                React.createElement("div", { style: { display: "flex", justifyContent: "center" } },
                  renderBlocksSetPreview(bdActiveMap, bdSaved))
              )
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "row", gap: 6 } },
              React.createElement("div", { onClick: function() { setScreen("vfx"); setVfxCurrentView("list"); setVfxSavedTab("active"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "1px solid rgba(255,180,60,0.12)", borderLeft: "3px solid #ffb43c", borderRadius: 8, padding: "10px", cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", gap: 10, flex: 1 } },
                React.createElement("svg", { width: "40", height: "40", viewBox: "0 0 24 24", style: { flexShrink: 0 } },
                  React.createElement("circle", { cx: "12", cy: "12", r: "3", fill: "#ffb43c" }),
                  React.createElement("path", { d: "M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l-2.1 2.1M7.7 16.3l-2.1 2.1", stroke: "#ffb43c", strokeWidth: "1.8", strokeLinecap: "round" })
                ),
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { color: "#fff3dd", fontSize: 20, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "VFX Studio"),
                  React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
                    React.createElement("div", { style: { color: "rgba(170,195,215,0.45)", fontSize: 12 } }, "Tune visual effects"),
                    React.createElement(WsMono, { size: 9, ls: 0.5, color: "rgba(255,180,60,0.45)" }, vfxSaved.length + " SAVED")
                  )
                )
              ),
              React.createElement("div", { onClick: function() { setScreen("vfx"); setVfxCurrentView("list"); setVfxSavedTab("active"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "2px solid #ffb43c", borderRadius: 7, padding: "5px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", aspectRatio: splashRowH ? undefined : "1", alignSelf: splashRowH ? "auto" : "stretch", width: splashRowH || undefined, height: splashRowH || undefined } },
                React.createElement("div", { style: { display: "flex", justifyContent: "center" } },
                  renderVfxSetPreview(vfxActiveMap, vfxSaved))
              )
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "row", gap: 6 } },
              React.createElement("div", { onClick: function() { setScreen("ufo"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "1px solid rgba(100,220,180,0.12)", borderLeft: "3px solid #64dcb4", borderRadius: 8, padding: "10px", cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", gap: 10, flex: 1 } },
                React.createElement("svg", { width: "40", height: "40", viewBox: "0 0 24 24", style: { flexShrink: 0 } },
                  React.createElement("ellipse", { cx: "12", cy: "9.5", rx: "3.5", ry: "2.5", fill: "none", stroke: "#64dcb4", strokeWidth: "1.5" }),
                  React.createElement("ellipse", { cx: "12", cy: "13", rx: "10", ry: "2.5", fill: "none", stroke: "#64dcb4", strokeWidth: "1.5" }),
                  React.createElement("circle", { cx: "6",  cy: "17", r: "0.9", fill: "#64dcb4" }),
                  React.createElement("circle", { cx: "12", cy: "18", r: "0.9", fill: "#64dcb4" }),
                  React.createElement("circle", { cx: "18", cy: "17", r: "0.9", fill: "#64dcb4" })
                ),
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { color: "#ddffee", fontSize: 20, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "UFO Customizer"),
                  React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
                    React.createElement("div", { style: { color: "rgba(170,195,215,0.45)", fontSize: 12 } }, "Configure the alien hull"),
                    React.createElement(WsMono, { size: 9, ls: 0.5, color: "rgba(100,220,180,0.45)" }, ufoSaved.length + " SAVED")
                  )
                )
              ),
              React.createElement("div", { onClick: function() { setScreen("ufo"); var ad = ufoGetActiveDesign(); if (ad) ufoOpenEditor(ad); else setUfoView("list"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "2px solid #64dcb4", borderRadius: 7, padding: "5px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, aspectRatio: splashRowH ? undefined : "1", alignSelf: splashRowH ? "auto" : "stretch", width: splashRowH || undefined, height: splashRowH || undefined } },
                React.createElement("div", { style: { display: "flex", justifyContent: "center" } },
                  React.createElement(UFOBlockSvg, { size: 42, design: ufoGetActiveDesign(), uid: "loadout-ufo" })),
                React.createElement("div", { style: { color: "#80e8c4", fontFamily: "'Exo 2', sans-serif", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" } }, truncLabel(ufoSaved.length > 0 ? (ufoGetActiveDesign().name || "Active") : "Default"))
              )
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "row", gap: 6 } },
              React.createElement("div", { onClick: function() { setScreen("hangar"); setShipView("list"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "1px solid rgba(255,138,170,0.12)", borderLeft: "3px solid #ff8aaa", borderRadius: 8, padding: "10px", cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", gap: 10, flex: 1 } },
                React.createElement("svg", { width: "40", height: "40", viewBox: "0 0 24 24", style: { flexShrink: 0 } },
                  React.createElement("polygon", { points: "12,2 22,17 16,15 12,22 8,15 2,17", fill: "none", stroke: "#ff8aaa", strokeWidth: "1.5", strokeLinejoin: "round" })
                ),
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { color: "#ffe0ea", fontSize: 20, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "Hangar"),
                  React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
                    React.createElement("div", { style: { color: "rgba(170,195,215,0.45)", fontSize: 12 } }, "Design your ship"),
                    React.createElement(WsMono, { size: 9, ls: 0.5, color: "rgba(255,138,170,0.45)" }, shipSaved.length + " SAVED")
                  )
                )
              ),
              React.createElement("div", { onClick: function() { setScreen("hangar"); var sd = null; for (var i = 0; i < shipSaved.length; i++) { if (shipSaved[i].id === shipActiveId) { sd = shipSaved[i]; break; } } if (sd) shipOpenEditor(sd); else setShipView("list"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "2px solid #ff8aaa", borderRadius: 7, padding: "5px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, aspectRatio: splashRowH ? undefined : "1", alignSelf: splashRowH ? "auto" : "stretch", width: splashRowH || undefined, height: splashRowH || undefined } },
                React.createElement("div", { style: { display: "flex", justifyContent: "center" } },
                  React.createElement(ShipDesignSvg, { size: 42, design: shipGetActiveDesign(), uid: "loadout-ship" })),
                React.createElement("div", { style: { color: "#ffb8cc", fontFamily: "'Exo 2', sans-serif", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" } }, truncLabel((function() { return shipSaved.length > 0 && shipActiveId ? (shipGetActiveDesign().name || "Custom") : "Default"; }())))
              )
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "row", gap: 6 } },
              React.createElement("div", { onClick: function() { setScreen("plasma"); setPlasmaView("list"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "1px solid rgba(80,200,255,0.12)", borderLeft: "3px solid #50c8ff", borderRadius: 8, padding: "10px", cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", gap: 10, flex: 1 } },
                React.createElement("svg", { width: "40", height: "40", viewBox: "0 0 24 24", style: { flexShrink: 0 } },
                  React.createElement("defs", null,
                    React.createElement("radialGradient", { id: "plSplash", cx: "38%", cy: "33%" },
                      React.createElement("stop", { offset: "0%", stopColor: "#fff", stopOpacity: "0.9" }),
                      React.createElement("stop", { offset: "35%", stopColor: "#80ddff", stopOpacity: "0.85" }),
                      React.createElement("stop", { offset: "100%", stopColor: "#2060ff", stopOpacity: "0.6" }))),
                  React.createElement("circle", { cx: "12", cy: "13", r: "7", fill: "url(#plSplash)" }),
                  React.createElement("circle", { cx: "12", cy: "13", r: "3", fill: "rgba(255,255,255,0.75)" }),
                  React.createElement("line", { x1: "12", y1: "6", x2: "12", y2: "2", stroke: "#50c8ff", strokeWidth: "1.8", strokeLinecap: "round" }),
                  React.createElement("line", { x1: "12", y1: "2", x2: "9.5", y2: "4.5", stroke: "#50c8ff", strokeWidth: "1.4", strokeLinecap: "round" }),
                  React.createElement("line", { x1: "12", y1: "2", x2: "14.5", y2: "4.5", stroke: "#50c8ff", strokeWidth: "1.4", strokeLinecap: "round" })
                ),
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { color: "#d0f0ff", fontSize: 20, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "Plasma Lab"),
                  React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
                    React.createElement("div", { style: { color: "rgba(170,195,215,0.45)", fontSize: 12 } }, "Design plasma effects"),
                    React.createElement(WsMono, { size: 9, ls: 0.5, color: "rgba(80,200,255,0.45)" }, plasmaSaved.length + " SAVED")
                  )
                )
              ),
              React.createElement("div", { onClick: function() { setScreen("plasma"); var ad = plasmaGetActiveDesign(); if (ad) plasmaOpenEditor(ad); else setPlasmaView("list"); }, style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "2px solid #50c8ff", borderRadius: 7, padding: "5px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, aspectRatio: splashRowH ? undefined : "1", alignSelf: splashRowH ? "auto" : "stretch", width: splashRowH || undefined, height: splashRowH || undefined } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: 42 } },
                  renderPlasmaShape(plasmaGetActiveDesign(), 21)),
                React.createElement("div", { style: { color: "#80d8ff", fontFamily: "'Exo 2', sans-serif", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" } }, truncLabel(plasmaSaved.length > 0 && plasmaActiveId ? (plasmaGetActiveDesign().name || "Active") : "Default"))
              )
            )
          )
        ),

        // SETS PANEL
        React.createElement(WsPanel, { onClick: function() { setScreen("sets"); setSetsView("list"); }, style: { padding: "10px", display: "flex", flexDirection: "column", cursor: "pointer" } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", paddingLeft: 2 } },
              React.createElement(WsMono, { size: 11, ls: 2.5, color: "rgba(220,200,255,0.88)" }, "SETS")
            ),
            React.createElement("div", { style: { display: "flex", alignItems: "center", paddingRight: 2 } },
              React.createElement(WsMono, { size: 11, ls: 2.5, color: "rgba(220,200,255,0.88)" }, "ACTIVE")
            )
          ),
          React.createElement("div", { style: { display: "flex", flexDirection: "row", gap: 6 } },
            React.createElement("div", { style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "1px solid rgba(255,208,96,0.12)", borderLeft: "3px solid #ffd060", borderRadius: 8, padding: "10px", display: "flex", flexDirection: "row", alignItems: "center", gap: 10, flex: 1 } },
              React.createElement("svg", { width: "40", height: "40", viewBox: "0 0 24 24", style: { flexShrink: 0 } },
                React.createElement("rect", { x: "3", y: "5", width: "18", height: "4", rx: "1.5", fill: "none", stroke: "#ffd060", strokeWidth: "1.5" }),
                React.createElement("rect", { x: "3", y: "10", width: "18", height: "4", rx: "1.5", fill: "#ffd060", opacity: "0.35" }),
                React.createElement("rect", { x: "3", y: "15", width: "18", height: "4", rx: "1.5", fill: "#ffd060", opacity: "0.18" })
              ),
              React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { color: "#fff8dc", fontSize: 20, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "Set Editor"),
                React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
                  React.createElement("div", { style: { color: "rgba(170,195,215,0.45)", fontSize: 12 } }, "Bundle and share designs"),
                  React.createElement(WsMono, { size: 9, ls: 0.5, color: "rgba(255,208,96,0.45)" }, setsSaved.length + " SAVED")
                )
              )
            ),
            React.createElement("div", { style: { background: "linear-gradient(160deg, rgba(8,18,32,0.95) 0%, rgba(5,12,24,0.98) 100%)", border: "2px solid #ffd060", borderRadius: 7, padding: "5px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, aspectRatio: splashRowH ? undefined : "1", alignSelf: splashRowH ? "auto" : "stretch", width: splashRowH || undefined, height: splashRowH || undefined } },
              (function() {
                var _as = setsGetActive();
                if (!_as) return React.createElement(WsMono, { size: 8, ls: 0.5, color: "rgba(255,208,96,0.3)" }, "NONE");
                return [
                  React.createElement("svg", { key: "ic", width: "22", height: "22", viewBox: "0 0 24 24" },
                    React.createElement("rect", { x: "3", y: "5", width: "18", height: "3.5", rx: "1.2", fill: "#ffd060", opacity: "0.8" }),
                    React.createElement("rect", { x: "3", y: "10", width: "18", height: "3.5", rx: "1.2", fill: "#ffd060", opacity: "0.5" }),
                    React.createElement("rect", { x: "3", y: "15", width: "18", height: "3.5", rx: "1.2", fill: "#ffd060", opacity: "0.25" })
                  ),
                  React.createElement("div", { key: "nm", style: { color: "#ffd060", fontFamily: "'Exo 2', sans-serif", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" } }, truncLabel(_as.name || "Unnamed"))
                ];
              }())
            )
          )
        ),

        // FLEX SPACER — pushes the credit + Resume + Bridge to bottom
        React.createElement("div", { style: { flex: 1, minHeight: 8 } }),

        // CREDIT
        React.createElement("div", { style: { textAlign: "center", paddingBottom: 4 } },
          React.createElement(WsMono, { size: 7, ls: 1, color: "rgba(200,180,255,0.1)" }, "Created by Dan Medwin and Claude")
        )

      ),

      // ── BOTTOM BRIDGE BAR (mirrors game-splash Workshop lever) ──
      React.createElement(WsPanel, { onClick: function() { handleSplashToGame(); }, style: { flexShrink: 0, borderRadius: "0 0 10px 10px", borderTop: "none", padding: "8px 14px", height: 60, display: "flex", alignItems: "center", gap: 10, overflow: "hidden", cursor: "pointer" } },
        // Mechanical toggle — knob on LEFT (bridge/off position)
        React.createElement("div", { style: { position: "relative", width: 64, height: 32, borderRadius: 18, background: WS.inset, border: WS.ib, boxShadow: WS.is + ", inset 0 0 6px rgba(0,0,0,0.6)", flexShrink: 0 } },
          React.createElement("div", { style: { position: "absolute", top: 4, bottom: 4, left: 8, right: 8, borderRadius: 999, background: "repeating-linear-gradient(90deg, rgba(160,100,255,0.15) 0 1px, transparent 1px 9px)", opacity: 0.7 } }),
          React.createElement("div", { style: { position: "absolute", top: 2, left: 2, width: 28, height: 28, borderRadius: 14, background: "radial-gradient(circle at 30% 25%, #7a8494 0%, #4a525e 50%, #2a323c 100%)", border: "1px solid #6a7484", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 3px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" } },
            React.createElement("div", { style: { display: "flex", gap: 2 } },
              React.createElement("span", { style: { width: 2, height: 11, borderRadius: 1, background: "#1a1f2a" } }),
              React.createElement("span", { style: { width: 2, height: 11, borderRadius: 1, background: "#1a1f2a" } }),
              React.createElement("span", { style: { width: 2, height: 11, borderRadius: 1, background: "#1a1f2a" } })
            ),
            React.createElement("div", { style: { position: "absolute", top: 3, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: 4, background: WS.green, boxShadow: "0 0 6px " + WS.green } })
          )
        ),
        // Right-pointing chevrons (fading outward: dim → bright)
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 1 } },
          React.createElement("svg", { width: "10", height: "14", viewBox: "0 0 10 14", style: { opacity: 0.25 } }, React.createElement("path", { d: "M 2 1 L 8 7 L 2 13", stroke: "#b060ff", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })),
          React.createElement("svg", { width: "10", height: "14", viewBox: "0 0 10 14", style: { opacity: 0.55 } }, React.createElement("path", { d: "M 2 1 L 8 7 L 2 13", stroke: "#b060ff", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })),
          React.createElement("svg", { width: "10", height: "14", viewBox: "0 0 10 14", style: { opacity: 0.9, filter: "drop-shadow(0 0 4px rgba(180,100,255,0.7))" } }, React.createElement("path", { d: "M 2 1 L 8 7 L 2 13", stroke: "#b060ff", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }))
        ),
        React.createElement("div", { style: { flex: 1 } }),
        // BRIDGE label + section LEDs (right side)
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", marginRight: 8 } },
          React.createElement("div", { style: { fontFamily: "'Exo 2', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 2.5, color: "#dfe9f3", textShadow: "0 0 10px rgba(180,100,255,0.45), 0 -1px 0 rgba(0,0,0,0.5)" } }, "BRIDGE"),
          React.createElement("div", { style: { display: "flex", gap: 4 } },
            React.createElement(WsLED, { color: "#80ddff", size: 4 }),
            React.createElement(WsLED, { color: "#c8b8ff", size: 4 }),
            React.createElement(WsLED, { color: "#ffb43c", size: 4 }),
            React.createElement(WsLED, { color: "#64dcb4", size: 4 })
          )
        )
      )

    ),
    // ═══ SETS SCREEN ═══
    screen === "sets" && React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100%", background: "linear-gradient(180deg, #0a0a14 0%, #12121e 100%)" } },
      // ── LIST VIEW ──
      setsView === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: function() { if (setsMergeMode) { setSetsMergeMode(false); setSetsMergeIds([]); } else { setScreen("splash"); setSetsView("list"); } }, backLabel: setsMergeMode ? "Cancel" : "Workshop", title: "My Sets", color: "#ffd060",
          rightContent: setsMergeMode
            ? React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "center" } },
                React.createElement("div", { style: { color: "rgba(255,208,96,0.5)", fontSize: 10, marginRight: 2 } }, setsMergeIds.length + " selected"),
                React.createElement("div", { onClick: setsMergeIds.length >= 2 ? setsMergeExecute : null, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg,#2a2000,#1a1400)", border: "1px solid rgba(255,208,96,0.4)", color: "#ffd060", opacity: setsMergeIds.length >= 2 ? 1 : 0.35 }) }, "Merge " + (setsMergeIds.length >= 2 ? setsMergeIds.length + " Sets" : "Sets")))
            : React.createElement("div", { style: { display: "flex", gap: 4 } },
                React.createElement("div", { onClick: setsInitSaveCurrent, style: Object.assign({}, BTN_TOPBAR, { color: "#ffd060", border: "1px solid rgba(255,208,96,0.35)" }) }, "Save Current"),
                React.createElement("div", { onClick: setsCreateNew, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg,#2a2000,#1a1400)", border: "1px solid rgba(255,208,96,0.4)", color: "#ffd060" }) }, "+ New"),
                React.createElement("div", { onClick: function() { setSetsShowImport(true); setSetsImportText(""); setSetsImportError(""); }, style: BTN_TOPBAR }, "Import")) }),
        !setsMergeMode && setsSaved.length > 1 && renderSortBar(setsSortMode, setSetsSortMode, [["set_type", "Type"]]),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px" } },
          setsSaved.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(255,208,96,0.3)", fontSize: 14, marginBottom: 8 } }, "No sets saved yet"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Tap Save Current to bundle your active designs, or + New to build from scratch.")),
          (function() { var _ssa = sortItems(setsSaved, setsSortMode, "savedAt"); var _ssi = []; var _sslt = null; for (var _ssk = 0; _ssk < _ssa.length; _ssk++) { var setObj = _ssa[_ssk]; if (setsSortMode === "set_type") { var _sst = setsGetType(setObj); if (_sst !== _sslt) { _sslt = _sst; _ssi.push(renderTypeHeader(_sst, "#ffd060")); } }
            var _chips = setsGetModuleChips(setObj);
            var _isActive = setsActiveId === setObj.id;
            var _date = setObj.savedAt ? new Date(setObj.savedAt).toLocaleDateString() : "";
            var _mergeChecked = setsMergeIds.indexOf(setObj.id) !== -1;
            _ssi.push(React.createElement("div", { key: setObj.id, style: Object.assign({}, CARD_STYLE, setsMergeMode && _mergeChecked ? { borderColor: "rgba(255,208,96,0.4)", background: "rgba(255,208,96,0.05)" } : {}), onClick: setsMergeMode ? function() { setSetsMergeIds(_mergeChecked ? setsMergeIds.filter(function(id) { return id !== setObj.id; }) : setsMergeIds.concat([setObj.id])); } : null },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 } },
                setsMergeMode && React.createElement("div", { style: { width: 20, height: 20, borderRadius: 4, border: "2px solid " + (_mergeChecked ? "#ffd060" : "rgba(255,255,255,0.2)"), background: _mergeChecked ? "#ffd060" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" } },
                  _mergeChecked && React.createElement("svg", { width: 12, height: 12, viewBox: "0 0 12 12" }, React.createElement("path", { d: "M2 6 L5 9 L10 3", stroke: "#1a1400", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }))),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  setsRenamingId === setObj.id
                    ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                        React.createElement("input", { value: setsRenameValue, autoFocus: true, onChange: function(e) { setSetsRenameValue(e.target.value); }, onKeyDown: function(e) { if (e.key === "Enter") setsCommitRename(); else if (e.key === "Escape") setsCancelRename(); }, style: { flex: 1, minWidth: 0, padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,208,96,0.5)", color: "#fff8dc", fontSize: 16, fontWeight: 700, fontFamily: "'Quicksand',sans-serif", outline: "none", boxSizing: "border-box" } }),
                        React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: setsCommitRename, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
                          React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
                        React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: setsCancelRename, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(220,60,80,0.18)", border: "1px solid rgba(220,60,80,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
                          React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M6 6L18 18 M18 6L6 18", fill: "none", stroke: "#ff8088", strokeWidth: "2.5", strokeLinecap: "round" }))))
                    : React.createElement(React.Fragment, null,
                        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                          React.createElement("div", { style: { color: "#fff8dc", fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, setObj.name || "Unnamed Set"),
                          !setsMergeMode && React.createElement("div", { onClick: function(e) { e.stopPropagation(); setSetsRenamingId(setObj.id); setSetsRenameValue(setObj.name || ""); }, title: "Rename set", style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", color: "rgba(180,200,220,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 } },
                            WsIconPencil(11))),
                        React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10, marginTop: 2 } }, _date))
                ),
                !setsMergeMode && setsRenamingId !== setObj.id && React.createElement("div", { onClick: function(e) { e.stopPropagation(); setsToggleActive(setObj); }, style: Object.assign({}, _isActive ? BTN_ISACTIVE : BTN_SETACTIVE, { flexShrink: 0 }) }, _isActive ? "★ Active" : "Set Active")
              ),
              _chips.length > 0 && React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 } },
                _chips.map(function(chip) {
                  return React.createElement("div", { key: chip, style: { background: "rgba(255,208,96,0.08)", border: "1px solid rgba(255,208,96,0.2)", borderRadius: 3, padding: "1px 6px", fontSize: 9, color: "rgba(255,208,96,0.6)", fontWeight: 700, letterSpacing: 0.5 } }, chip);
                })
              ),
              !setsMergeMode && React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
                setObj.levelIds && setObj.levelIds.length > 0 && React.createElement("div", { onClick: function() { setsPlaySet(setObj); }, style: BTN_PLAYSET },
                  React.createElement("svg", { width: 9, height: 10, viewBox: "0 0 9 10" }, React.createElement("path", { d: "M0 0 L9 5 L0 10 Z", fill: "#ffd060" })),
                  "PLAY"
                ),
                React.createElement("div", { onClick: function() { setsOpenEditor(setObj); }, style: BTN_EDIT }, WsIconPencil(), "EDIT"),
                React.createElement("div", { onClick: function(e) { e.stopPropagation(); setsEditCopy(setObj); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"),
                React.createElement("div", { onClick: function(e) { e.stopPropagation(); setSetsMergeMode(true); setSetsMergeIds([setObj.id]); }, style: BTN_EDIT }, "MERGE"),
                React.createElement("div", { onClick: function() { setsExportSet(setObj.id); }, style: BTN_EXPORT }, WsIconShare(), "SHARE"),
                React.createElement("div", { style: { flex: 1 } }),
                React.createElement("div", { onClick: function() { setSetsDeleteId(setObj.id); }, style: BTN_DELETE_ICON }, WsIconTrash())
              )
            ));
          } return _ssi; }())
        ),
        setsDeletingId && renderDeleteOverlay("Delete Set?", function() { setSetsDeleteId(null); }, function() { setsDeleteSet(setsDeletingId); }),
        setsExportId && renderExportOverlay("Export Set", setsExportText, setsCopied, function() { copyToClipboard(setsExportText, setSetsCopied); }, function() { setSetsExportId(null); }),
        setsShowImport && renderImportOverlay("Import Set", setsImportText, setSetsImportText, setsImportError, setSetsImportError, setsHandleImport, function() { setSetsShowImport(false); setSetsImportText(""); setSetsImportError(""); }, getSetsImportPreview),
        // Import conflict resolution overlay
        setsImportConflicts.length > 0 && setsImportPending && (function() {
          var _ci = 0; var _c = setsImportConflicts[_ci];
          var _remaining = setsImportConflicts.length;
          return React.createElement("div", { style: OVERLAY_BG },
            React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(255,208,96,0.3)", maxWidth: 360, width: "92%", textAlign: "left" }) },
              React.createElement("div", { style: { color: "#ffd060", fontSize: 14, fontWeight: 700, marginBottom: 4, fontFamily: "'Quicksand',sans-serif" } }, "Design Conflict"),
              React.createElement("div", { style: { color: "rgba(200,210,220,0.6)", fontSize: 11, marginBottom: 14 } }, _remaining + " design" + (_remaining > 1 ? "s" : "") + " in this set already exist in your library with different versions. Choose which to keep:"),
              React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 } },
                React.createElement("div", { style: { color: "#b0c8d8", fontSize: 13, fontWeight: 700, marginBottom: 4 } }, _c.lib.name || "Unnamed"),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                  React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 9, letterSpacing: 0.5, marginBottom: 2 } }, "YOURS"),
                    React.createElement("div", { style: { color: "rgba(200,210,220,0.7)", fontSize: 10 } }, _c.lib.savedAt ? new Date(_c.lib.savedAt).toLocaleString() : "Unknown date")),
                  React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { color: "rgba(255,208,96,0.5)", fontSize: 9, letterSpacing: 0.5, marginBottom: 2 } }, "IMPORTED"),
                    React.createElement("div", { style: { color: "rgba(200,210,220,0.7)", fontSize: 10 } }, _c.imported.savedAt ? new Date(_c.imported.savedAt).toLocaleString() : "Unknown date"))
                )
              ),
              React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "center" } },
                React.createElement("div", { onClick: function() {
                  var _res = {}; for (var _ri = 0; _ri < setsImportConflicts.length; _ri++) _res[setsImportConflicts[_ri].imported.id] = "keep";
                  setsFinishImport(setsImportPending.set, setsImportPending.embedded, _res);
                }, style: { padding: "8px 16px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "Keep Mine (All)"),
                React.createElement("div", { onClick: function() { setsFinishImport(setsImportPending.set, setsImportPending.embedded, {}); }, style: { padding: "8px 16px", borderRadius: 16, background: "rgba(255,208,96,0.15)", border: "1px solid rgba(255,208,96,0.4)", color: "#ffd060", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Use Imported (All)")
              )
            )
          );
        }()),
        // Save Current modal
        showSaveCurrent && saveCurrentSels && React.createElement("div", { style: OVERLAY_BG },
          React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(255,208,96,0.3)", maxWidth: 360, width: "92%", textAlign: "left", maxHeight: "80vh", overflowY: "auto" }) },
            React.createElement("div", { style: { color: "#ffd060", fontSize: 14, fontWeight: 700, marginBottom: 4, fontFamily: "'Quicksand',sans-serif" } }, "Save Current as Set"),
            React.createElement("div", { style: { color: "rgba(200,210,220,0.5)", fontSize: 11, marginBottom: 14 } }, "Choose which currently active designs to include:"),
            (function() {
              var _rows = [
                { key: "blockDesignIds", label: "Block Designs", count: saveCurrentSels.blockDesignIds.length, accent: "#c8b8ff" },
                { key: "vfxDesignIds", label: "VFX Designs", count: saveCurrentSels.vfxDesignIds.length, accent: "#ffb43c" },
                { key: "ufoDesignId", label: "UFO Design", count: saveCurrentSels.ufoDesignId ? 1 : 0, accent: "#64dcb4" },
                { key: "shipDesignId", label: "Ship Design", count: saveCurrentSels.shipDesignId ? 1 : 0, accent: "#ff8aaa" },
                { key: "plasmaDesignId", label: "Plasma Design", count: saveCurrentSels.plasmaDesignId ? 1 : 0, accent: "#50c8ff" }
              ];
              return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 } },
                _rows.map(function(row) {
                  var _has = row.count > 0;
                  var _included = _has;
                  return React.createElement("div", { key: row.key, style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, background: _has ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", opacity: _has ? 1 : 0.4 } },
                    React.createElement("div", { style: { width: 16, height: 16, borderRadius: 3, background: _included ? row.accent : "transparent", border: "2px solid " + (_included ? row.accent : "rgba(255,255,255,0.2)"), flexShrink: 0 } }),
                    React.createElement("div", { style: { flex: 1 } },
                      React.createElement("div", { style: { color: _has ? row.accent : "rgba(180,200,220,0.3)", fontSize: 11, fontWeight: 700 } }, row.label),
                      React.createElement("div", { style: { color: "rgba(180,200,220,0.35)", fontSize: 10 } }, _has ? (row.count + " design" + (row.count > 1 ? "s" : "")) : "None active")
                    )
                  );
                })
              );
            }()),
            React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "center" } },
              React.createElement("div", { onClick: function() { setShowSaveCurrent(false); setSaveCurrentSels(null); }, style: { padding: "8px 20px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "Cancel"),
              React.createElement("div", { onClick: setsFinishSaveCurrent, style: { padding: "8px 20px", borderRadius: 16, background: "rgba(255,208,96,0.2)", border: "1px solid rgba(255,208,96,0.5)", color: "#ffd060", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Create Set")
            )
          )
        )
      ),

      // ── EDITOR VIEW ──
      setsView === "editor" && setsEditSet && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, {
          onBack: function() {
            if (setsEditDirtyRef.current) { setSetsUnsavedWarn(true); }
            else { setSetsView("list"); }
          },
          backLabel: "My Sets",
          title: setsEditSet.id && setsSaved.some(function(s) { return s.id === setsEditSet.id; }) ? "Edit Set" : "New Set",
          color: "#ffd060",
          rightContent: React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
            setsEditSet.levelIds && setsEditSet.levelIds.length > 0 && React.createElement("div", { onClick: function() { setsPlaySet(setsEditSet); }, style: BTN_PLAYSET }, React.createElement("svg", { width: 9, height: 10, viewBox: "0 0 9 10" }, React.createElement("path", { d: "M0 0 L9 5 L0 10 Z", fill: "#ffd060" })), "PLAY"),
            setsEditSet.id && setsSaved.some(function(s) { return s.id === setsEditSet.id; }) && React.createElement("div", { onClick: function() { setsToggleActive(setsEditSet); }, style: Object.assign({}, setsActiveId === setsEditSet.id ? BTN_ISACTIVE : BTN_SETACTIVE, { flexShrink: 0 }) }, setsActiveId === setsEditSet.id ? "★ Active" : "Set Active"),
            React.createElement("div", { onClick: setsSaveEdit, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg,#2a2000,#1a1400)", border: "1px solid rgba(255,208,96,0.5)", color: "#ffd060" }) }, "Save & Exit"))
        }),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "10px 12px 32px" } },
          // Name field
          React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", marginBottom: 14 } },
            React.createElement("div", { style: { color: "rgba(255,208,96,0.5)", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 } }, "SET NAME"),
            React.createElement("input", { value: setsEditSet.name || "", onChange: function(e) { setSetsEditSet(Object.assign({}, setsEditSet, { name: e.target.value })); setsEditDirtyRef.current = true; }, placeholder: "Name your set...", style: { width: "100%", background: "transparent", border: "none", color: "#fff8dc", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none", padding: 0, boxSizing: "border-box" } })
          ),
          // Module sections
          (function() {
            var _sections = [
              { key: "block", label: "Block Designs", accent: "#c8b8ff", screen: "designer", ids: setsEditSet.blockDesignIds || [], getNames: function(ids) { return ids.map(function(id) { for (var _i = 0; _i < bdSaved.length; _i++) { if (bdSaved[_i].id === id) return bdSaved[_i].name || "Unnamed"; } return "Unknown"; }); } },
              { key: "vfx", label: "VFX Designs", accent: "#ffb43c", screen: "vfx", ids: setsEditSet.vfxDesignIds || [], getNames: function(ids) { return ids.map(function(id) { for (var _i = 0; _i < vfxSaved.length; _i++) { if (vfxSaved[_i].id === id) return vfxSaved[_i].name || "Unnamed"; } return "Unknown"; }); } },
              { key: "ufo", label: "UFO Design", accent: "#64dcb4", screen: "ufo", ids: setsEditSet.ufoDesignId ? [setsEditSet.ufoDesignId] : [], getNames: function(ids) { return ids.map(function(id) { for (var _i = 0; _i < ufoSaved.length; _i++) { if (ufoSaved[_i].id === id) return ufoSaved[_i].name || "Unnamed"; } return "Unknown"; }); } },
              { key: "ship", label: "Ship Design", accent: "#ff8aaa", screen: "hangar", ids: setsEditSet.shipDesignId ? [setsEditSet.shipDesignId] : [], getNames: function(ids) { return ids.map(function(id) { for (var _i = 0; _i < shipSaved.length; _i++) { if (shipSaved[_i].id === id) return shipSaved[_i].name || "Unnamed"; } return "Unknown"; }); } },
              { key: "plasma", label: "Plasma Design", accent: "#50c8ff", screen: "plasma", ids: setsEditSet.plasmaDesignId ? [setsEditSet.plasmaDesignId] : [], getNames: function(ids) { return ids.map(function(id) { for (var _i = 0; _i < plasmaSaved.length; _i++) { if (plasmaSaved[_i].id === id) return plasmaSaved[_i].name || "Unnamed"; } return "Unknown"; }); } },
              { key: "level", label: "Levels", accent: "#80ddff", screen: "builder", ids: setsEditSet.levelIds || [], getNames: function(ids) { return ids.map(function(id) { for (var _i = 0; _i < savedLevels.length; _i++) { if (savedLevels[_i].id === id) return savedLevels[_i].name || "Untitled"; } return "Unknown"; }); } }
            ];
            return _sections.map(function(sec) {
              var _names = sec.getNames(sec.ids);
              var _empty = sec.ids.length === 0;
              return React.createElement("div", { key: sec.key, style: { background: "rgba(20,20,35,0.6)", border: "1px solid rgba(60,60,80,0.4)", borderLeft: "3px solid " + sec.accent, borderRadius: 8, padding: "10px 12px", marginBottom: 8 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: _empty ? 0 : 8 } },
                  React.createElement("div", { style: { color: sec.accent, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" } }, sec.label),
                  React.createElement("div", { onClick: function() {
                    setSetsSelMode({ moduleType: sec.key, selectedIds: sec.ids.slice() });
                    if (sec.key === "level") { loadSavedLevels(); setScreen("builder"); setLbScreen("list"); }
                    else setScreen(sec.screen);
                  }, style: Object.assign({}, BTN_BASE, { padding: "4px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(200,210,220,0.6)", fontSize: 9 }) }, _empty ? "Browse My " + sec.label : "Edit Selection")
                ),
                !_empty && (sec.key === "level"
                  ? React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3 } },
                      sec.ids.map(function(levelId, idx) {
                        var _nm = _names[idx];
                        var _isEdit = setsLevelInput && setsLevelInput.idx === idx;
                        var _lvObj = null; for (var _lvfi = 0; _lvfi < savedLevels.length; _lvfi++) { if (savedLevels[_lvfi].id === levelId) { _lvObj = savedLevels[_lvfi]; break; } } var _lvNum = _lvObj ? _lvObj.levelNum : null; var _isNumEdit = lvNumInput && lvNumInput.id === levelId;
                        return React.createElement("div", { key: levelId, "data-setslevel-row": "1", "data-setslevel-idx": String(idx), style: { display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, padding: "4px 6px" } },
                          React.createElement("div", {
                            onPointerDown: function(e) { setsLevelDragStart(idx, e); },
                            onPointerMove: setsLevelDragMove,
                            onPointerUp: setsLevelDragEnd,
                            onPointerCancel: setsLevelDragEnd,
                            style: { color: "rgba(180,200,220,0.35)", cursor: "grab", touchAction: "none", flexShrink: 0, display: "flex", alignItems: "center" }
                          }, React.createElement("svg", { width: "10", height: "14", viewBox: "0 0 10 16", fill: "currentColor" },
                            React.createElement("circle", { cx: 2.5, cy: 3,  r: 1.3 }),
                            React.createElement("circle", { cx: 7.5, cy: 3,  r: 1.3 }),
                            React.createElement("circle", { cx: 2.5, cy: 8,  r: 1.3 }),
                            React.createElement("circle", { cx: 7.5, cy: 8,  r: 1.3 }),
                            React.createElement("circle", { cx: 2.5, cy: 13, r: 1.3 }),
                            React.createElement("circle", { cx: 7.5, cy: 13, r: 1.3 }))),
                          _isEdit
                            ? React.createElement(React.Fragment, null,
                                React.createElement("input", { value: setsLevelInput.val, autoFocus: true,
                                  onChange: function(e) { setSetsLevelInput({ idx: idx, val: e.target.value }); },
                                  onKeyDown: function(e) { if (e.key === "Enter") setsConfirmLevelPos(idx); else if (e.key === "Escape") setSetsLevelInput(null); },
                                  style: { width: 28, padding: "2px 4px", borderRadius: 3, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(80,221,128,0.5)", color: "#80dd90", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none", textAlign: "center" } }),
                                React.createElement("div", { onClick: function() { setsConfirmLevelPos(idx); }, style: { width: 18, height: 18, borderRadius: 3, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 } },
                                  React.createElement("svg", { width: "10", height: "10", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
                                React.createElement("div", { onClick: function() { setSetsLevelInput(null); }, style: { width: 18, height: 18, borderRadius: 3, background: "rgba(220,60,80,0.15)", border: "1px solid rgba(220,60,80,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ff8088", fontSize: 11, fontWeight: 700, flexShrink: 0 } }, "X"))
                            : React.createElement("div", { onClick: function() { setSetsLevelInput({ idx: idx, val: String(idx + 1) }); }, style: { width: 20, textAlign: "center", color: "rgba(128,221,255,0.7)", fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(0,0,0,0.25)", borderRadius: 3, padding: "1px 2px", flexShrink: 0 } }, String(idx + 1)),
                          _isNumEdit
                            ? React.createElement("input", { type: "number", value: lvNumInput.val, autoFocus: true, onChange: function(e) { setLvNumInput({ id: levelId, val: e.target.value }); }, onBlur: function(e) { updateLevelNum(levelId, e.target.value); }, onKeyDown: function(e) { if (e.key === "Enter") { updateLevelNum(levelId, e.target.value); } if (e.key === "Escape") { setLvNumInput(null); } }, style: { width: 32, fontSize: 16, textAlign: "center", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(128,220,255,0.4)", borderRadius: 3, color: "#80ddff", outline: "none", padding: "0 3px", fontFamily: "'Quicksand',sans-serif" } })
                            : React.createElement("div", { onClick: function() { setLvNumInput({ id: levelId, val: _lvNum != null ? String(_lvNum) : "" }); }, style: { fontSize: 9, color: "#80ddff", opacity: 0.65, background: "rgba(128,220,255,0.06)", border: "1px solid rgba(128,220,255,0.18)", borderRadius: 3, padding: "1px 4px", cursor: "pointer", fontWeight: 700, flexShrink: 0 } }, _lvNum != null ? "#" + _lvNum : "#–"),
                          React.createElement("span", { style: { flex: 1, color: "rgba(200,210,220,0.8)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, _nm),
                          React.createElement("span", { onClick: function() {
                            var _newIds = sec.ids.filter(function(id2, i) { return i !== idx; });
                            setSetsEditSet(Object.assign({}, setsEditSet, { levelIds: _newIds }));
                            setsEditDirtyRef.current = true;
                          }, style: { color: "rgba(255,80,80,0.6)", fontSize: 14, cursor: "pointer", lineHeight: 1, flexShrink: 0, padding: "0 2px" } }, "×"));
                      }))
                  : React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } },
                      _names.map(function(nm, idx) {
                        return React.createElement("div", { key: idx, style: { display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "3px 8px" } },
                          React.createElement("span", { style: { color: "rgba(200,210,220,0.8)", fontSize: 11 } }, nm),
                          React.createElement("span", { onClick: function() {
                            var _newIds = sec.ids.filter(function(id, i) { return i !== idx; });
                            var _upd = Object.assign({}, setsEditSet);
                            if (sec.key === "block") { _upd.blockDesignIds = _newIds; }
                            else if (sec.key === "vfx") { _upd.vfxDesignIds = _newIds; }
                            else if (sec.key === "ufo") { _upd.ufoDesignId = null; }
                            else if (sec.key === "ship") { _upd.shipDesignId = null; }
                            else if (sec.key === "plasma") { _upd.plasmaDesignId = null; }
                            setSetsEditSet(_upd); setsEditDirtyRef.current = true;
                          }, style: { color: "rgba(255,80,80,0.6)", fontSize: 12, cursor: "pointer", lineHeight: 1 } }, "×")
                        );
                      })
                    ))
              );
            });
          }())
        )
      ),
      // Play prompt overlay — rendered at sets-div level so it shows in both list and editor views
      setsPlayPromptSet && React.createElement("div", { style: OVERLAY_BG },
        React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(255,208,96,0.4)", maxWidth: 320, width: "92%", textAlign: "center" }) },
          React.createElement("div", { style: { color: "#ffd060", fontSize: 14, fontWeight: 700, marginBottom: 8, fontFamily: "'Quicksand',sans-serif" } }, setsPlayPromptSet.name || "Unnamed Set"),
          React.createElement("div", { style: { color: "rgba(200,210,220,0.6)", fontSize: 12, marginBottom: 20 } }, "Activate this set and play?"),
          React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "center" } },
            React.createElement("div", { onClick: function() { setSetsPlayPromptSet(null); }, style: { padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(200,210,220,0.2)", color: "rgba(200,210,220,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "Cancel"),
            React.createElement("div", { onClick: function() { setsPlayAfterActivateRef.current = true; setsToggleActive(setsPlayPromptSet); setSetsPlayPromptSet(null); }, style: { padding: "9px 18px", borderRadius: 8, background: "linear-gradient(180deg, #2a2000, #1a1400)", border: "1px solid rgba(255,208,96,0.6)", color: "#ffd060", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Activate & Play")
          )
        )
      ),
      // Activation prompt overlay — rendered at sets-div level so it shows in both list and editor views
      setsActivatePrompt && React.createElement("div", { style: OVERLAY_BG },
        React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(255,208,96,0.3)", maxWidth: 340, width: "92%", textAlign: "left" }) },
          React.createElement("div", { style: { color: "#ffd060", fontSize: 14, fontWeight: 700, marginBottom: 8, fontFamily: "'Quicksand',sans-serif" } }, "Activate Set"),
          React.createElement("div", { style: { color: "rgba(200,210,220,0.6)", fontSize: 12, marginBottom: 16 } }, "This set includes custom block and/or VFX designs. What should happen to your currently active designs that are not in this set?"),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 } },
            React.createElement("div", { onClick: function() { setsApplyActivation(setsActivatePrompt, "keep"); }, style: { padding: "10px 14px", borderRadius: 8, background: "rgba(80,200,100,0.1)", border: "1px solid rgba(80,200,100,0.3)", cursor: "pointer" } },
              React.createElement("div", { style: { color: "#80dd90", fontSize: 12, fontWeight: 700, marginBottom: 3 } }, "Keep current active"),
              React.createElement("div", { style: { color: "rgba(200,210,220,0.5)", fontSize: 10 } }, "Only override the specific designs in this set. Everything else stays as-is.")),
            React.createElement("div", { onClick: function() { setsApplyActivation(setsActivatePrompt, "defaults"); }, style: { padding: "10px 14px", borderRadius: 8, background: "rgba(255,208,96,0.08)", border: "1px solid rgba(255,208,96,0.25)", cursor: "pointer" } },
              React.createElement("div", { style: { color: "#ffd060", fontSize: 12, fontWeight: 700, marginBottom: 3 } }, "Use defaults for the rest"),
              React.createElement("div", { style: { color: "rgba(200,210,220,0.5)", fontSize: 10 } }, "Apply only this set's designs. All other block/VFX types revert to game defaults."))
          ),
          React.createElement("div", { style: { textAlign: "center" } },
            React.createElement("div", { onClick: function() { setSetsActivatePrompt(null); }, style: { color: "rgba(200,210,220,0.5)", fontSize: 12, cursor: "pointer" } }, "Cancel"))
        )
      )
    ),

    // ═══ SETS SELECTION CONFLICT OVERLAY (global) ═══
    renderSetsConflictOverlay(),
    renderSetsSelectAllConflictsOverlay(),
    renderSetsUnsavedWarnOverlay(),

    // ═══ WORKSHOP GUIDE OVERLAY ═══
    showWsGuide && React.createElement("div", { onClick: function() { setShowWsGuide(false); }, style: { position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } },
      React.createElement(WsPanel, { onClick: function(e) { e.stopPropagation(); }, style: { width: 300, maxWidth: "90vw", padding: 0, overflow: "hidden" } },
        React.createElement("div", { style: { padding: "12px 14px 10px", borderBottom: "1px solid rgba(160,100,255,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            React.createElement(WsLED, { color: WS.green, size: 5 }),
            React.createElement(WsMono, { size: 10, ls: 2, color: "rgba(220,200,255,0.9)" }, "WORKSHOP GUIDE")
          ),
          React.createElement("div", { onClick: function() { setShowWsGuide(false); }, style: { width: 22, height: 22, borderRadius: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(160,100,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(200,170,255,0.5)", fontSize: 14, lineHeight: 1 } }, "✕")
        ),
        React.createElement("div", { style: { padding: "10px 14px 14px", display: "flex", flexDirection: "column", gap: 8 } },
          [
            { color: "#80ddff", label: "LEVEL BUILDER", desc: "Design custom levels on an 8×6 grid. Place blocks, set ship position and plasma budget, then save and play your creation." },
            { color: "#c8b8ff", label: "BLOCK DESIGNER", desc: "Create custom skins for every block type. Use the Active Blocks tab to see what's currently equipped in the game." },
            { color: "#ffb43c", label: "VFX STUDIO", desc: "Tune visual effects: ooze, burn, block destroy, and drone explosions. Changes apply instantly in the game." },
            { color: "#64dcb4", label: "UFO CUSTOMIZER", desc: "Customize the alien ship's hull color, dome, lights, alien inside, and particle effects." }
          ].map(function(item, i) {
            return React.createElement("div", { key: i, style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(160,100,255,0.1)", borderLeft: "3px solid " + item.color, borderRadius: 7, padding: "8px 10px" } },
              React.createElement(WsMono, { size: 8, ls: 1.5, color: item.color }, item.label),
              React.createElement("div", { style: { color: "rgba(200,190,220,0.6)", fontSize: 10.5, marginTop: 4, lineHeight: 1.5 } }, item.desc)
            );
          })
        )
      )
    ),

    // ═══ FOR TESTERS PANEL ═══
    showWsTesterMenu && React.createElement("div", { onClick: function() { setShowWsTesterMenu(false); }, style: { position: "fixed", inset: 0, zIndex: 450, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(5,5,15,0.75)", backdropFilter: "blur(5px)", paddingBottom: 0 } },
      React.createElement("div", { onClick: function(e) { e.stopPropagation(); }, style: { width: "100%", maxWidth: 420, background: "linear-gradient(180deg,#0d1022,#080d1a)", borderTop: "1px solid rgba(80,120,200,0.25)", borderRadius: "16px 16px 0 0", padding: "20px 22px 36px", fontFamily: "'Quicksand',sans-serif" } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 } },
          React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "rgba(180,200,220,0.5)", letterSpacing: 3 } }, "FOR TESTERS"),
          React.createElement("div", { onClick: function() { setShowWsTesterMenu(false); }, style: { fontSize: 11, color: "rgba(180,200,220,0.3)", cursor: "pointer", padding: "4px 8px" } }, "CLOSE")
        ),
        React.createElement("div", { style: { marginBottom: 18, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(180,200,220,0.08)" } },
          React.createElement("div", { style: { fontSize: 9, color: "rgba(180,200,220,0.3)", letterSpacing: 2, marginBottom: 4 } }, "VERSION"),
          React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: "rgba(180,200,220,0.55)", letterSpacing: 1 } }, "SERVICE PANEL  ·  v5.2")
        ),
        React.createElement("div", { onClick: function() { window.location.href = "mailto:cosmicdriftapp@gmail.com?subject=I%20found%20a%20bug!"; }, style: { width: "100%", padding: "11px 0", borderRadius: 8, background: "rgba(255,80,80,0.07)", border: "1px solid rgba(255,80,80,0.18)", color: "rgba(255,140,140,0.7)", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center", letterSpacing: 1, boxSizing: "border-box" } }, "Report a Bug"),
        React.createElement("div", { onClick: function() { try { window.storage.delete("cosmic_drift_builder_tour"); } catch(e) {} builderTourSeenRef.current = false; setWsTutsReset(true); setTimeout(function() { setWsTutsReset(false); }, 2500); }, style: { width: "100%", padding: "11px 0", marginTop: 10, borderRadius: 8, background: wsTutsReset ? "rgba(80,200,120,0.12)" : "rgba(80,140,255,0.1)", border: wsTutsReset ? "1px solid rgba(80,200,120,0.3)" : "1px solid rgba(80,140,255,0.25)", color: wsTutsReset ? "rgba(130,220,150,0.9)" : "rgba(120,170,255,0.85)", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center", letterSpacing: 1, boxSizing: "border-box" } }, wsTutsReset ? "Builder Tour Reset ✓" : "Reset Builder Tour")
      )
    ),

    // ═══ WORKSHOP MENU OVERLAY ═══
    showWsMenu && React.createElement("div", { onClick: function() { setShowWsMenu(false); }, style: { position: "fixed", inset: 0, zIndex: 60, background: "radial-gradient(circle 220px at calc(100% - 26px) 26px, rgba(160,80,255,0.08) 0%, transparent 70%), rgba(5,5,15,0.5)" } },
      React.createElement(WsPanel, { onClick: function(e) { e.stopPropagation(); }, style: { position: "absolute", top: 48, right: 8, zIndex: 61, minWidth: 210, padding: "4px 0" } },
        WsRivet({ top: 5, left: 5 }),
        WsRivet({ top: 5, right: 5 }),
        WsRivet({ bottom: 5, left: 5 }),
        WsRivet({ bottom: 5, right: 5 }),
        React.createElement("div", { onClick: function() { setShowWsMenu(false); setShowWsGuide(true); }, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", color: "rgba(200,210,220,0.85)", fontSize: 12, fontWeight: 600 } },
          React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24" },
            React.createElement("circle", { cx: "12", cy: "12", r: "10", fill: "none", stroke: "rgba(200,170,255,0.5)", strokeWidth: "2" }),
            React.createElement("text", { x: "12", y: "17", textAnchor: "middle", fill: "rgba(200,170,255,0.6)", fontSize: "14", fontWeight: "700" }, "?")
          ),
          "Workshop Guide"
        ),
        React.createElement("div", { onClick: function() { setShowWsMenu(false); setShowWsTesterMenu(true); }, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", color: "rgba(100,180,255,0.6)", fontSize: 12, fontWeight: 600 } },
          React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24" },
            React.createElement("path", { d: "M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z", fill: "rgba(100,180,255,0.5)" })
          ),
          React.createElement("span", { style: { flex: 1 } }, "For Testers"),
          React.createElement("span", { style: { width: 6, height: 6, borderRadius: 6, background: "#48cc80", boxShadow: "0 0 6px #48cc80", flexShrink: 0 } })
        ),
        React.createElement("div", { style: { height: 1, background: "rgba(80,100,140,0.2)", margin: "2px 12px" } }),
        React.createElement("div", { onClick: function() { setShowWsMenu(false); handleSplashToGame(); }, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", color: "#ff8866", fontSize: 12, fontWeight: 600 } },
          React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24" },
            React.createElement("path", { d: "M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z", fill: "rgba(255,100,80,0.7)" })
          ),
          React.createElement("span", { style: { flex: 1 } }, "Return to Game"),
          React.createElement("span", { style: { width: 6, height: 6, borderRadius: 6, background: "#ff8866", boxShadow: "0 0 6px #ff8866", flexShrink: 0 } })
        )
      )
    ),

    // ═══ LEVEL BUILDER ═══
    screen === "builder" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", background: WS.brushed, backgroundBlendMode: "overlay" } },
      WsRivet({ bottom: 5, left: 5 }), WsRivet({ bottom: 5, right: 5 }),

      // ── MY LEVELS LIST ──
      lbScreen === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: function() { if (setsSelMode) { setSetsSelMode(null); setScreen("sets"); setSetsView("editor"); } else { setScreen("splash"); } }, backLabel: setsSelMode ? "Set" : "Workshop", title: "My Levels", color: "#80ddff",
          rightContent: !setsSelMode && React.createElement("div", { style: { display: "flex", gap: 4 } },
            React.createElement("div", { onClick: function() { setShowImport(true); setImportText(""); setImportError(""); }, style: BTN_TOPBAR_PURPLE }, "Import"),
            savedLevels.length > 0 && React.createElement("div", { onClick: exportAllLevels, style: Object.assign({}, BTN_TOPBAR, { color: "rgba(200,184,255,0.6)", fontSize: 8 }) }, "Exp All"),
            React.createElement("div", { onClick: function() { openBuilder(); }, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #1a3a4a, #0f2a38)", boxShadow: "0 0 8px rgba(80,200,255,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, "+ New")) }),
        renderSetsSelBar("level", savedLevels.map(function(lv) { return lv.id; })),
        !setsSelMode && savedLevels.length > 1 && renderSortBar(sortMode, setSortMode, [["level_num", "Order"]]),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px", position: "relative", zIndex: 1 }, onPointerMove: lvDragMove, onPointerUp: lvDragEnd },
          levelsLoading && React.createElement("div", { style: { textAlign: "center", padding: 40, color: "rgba(180,200,220,0.4)", fontSize: 14 } }, "Loading..."),
          !levelsLoading && savedLevels.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 14, marginBottom: 8 } }, "No saved levels yet"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Build a new level or tap Import to paste a level code.")),
          !levelsLoading && (function() { var _lvsorted = sortItems(savedLevels, sortMode, "modified"); var _mapped = _lvsorted.map(function(lv, sortedIdx) {
            var _lvDateObj = new Date(lv.savedAt);
            var dateStr = (lv.savedAt && !isNaN(_lvDateObj.getTime())) ? _lvDateObj.toLocaleDateString() : (lv.modified ? new Date(lv.modified).toLocaleDateString() : "");
            var _lvSel = setsSelMode && setsSelMode.selectedIds.indexOf(lv.id) !== -1;
            return React.createElement("div", { key: lv.id, "data-lv-row": "1", "data-lv-idx": sortedIdx, style: Object.assign({}, CARD_STYLE, (setsSelMode || sortMode === "level_num") ? { display: "flex", alignItems: "flex-start", gap: 8 } : {}) },
              sortMode === "level_num" && !setsSelMode && React.createElement("div", { onPointerDown: function(e) { lvDragStart(sortedIdx, e); }, onPointerMove: lvDragMove, onPointerUp: lvDragEnd, style: { cursor: "grab", padding: "2px 4px", alignSelf: "stretch", display: "flex", alignItems: "center", touchAction: "none" } },
                React.createElement("svg", { width: 10, height: 14, viewBox: "0 0 10 14", fill: "rgba(180,200,220,0.3)" },
                  React.createElement("circle", { cx: 2.5, cy: 2.5, r: 1.5 }),
                  React.createElement("circle", { cx: 7.5, cy: 2.5, r: 1.5 }),
                  React.createElement("circle", { cx: 2.5, cy: 7, r: 1.5 }),
                  React.createElement("circle", { cx: 7.5, cy: 7, r: 1.5 }),
                  React.createElement("circle", { cx: 2.5, cy: 11.5, r: 1.5 }),
                  React.createElement("circle", { cx: 7.5, cy: 11.5, r: 1.5 }))),
              setsSelMode && React.createElement("div", { onClick: function() { setsToggleSel(lv, null); }, style: { width: 20, height: 20, borderRadius: 4, border: _lvSel ? "1.5px solid #ffd060" : "1.5px solid rgba(255,208,96,0.3)", background: _lvSel ? "#ffd060" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 } },
                _lvSel && React.createElement("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "#1a1400", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M5 12l5 5L20 7" }))),
              React.createElement("div", { style: { flex: 1 } },
                renamingId === lv.id ? React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8, alignItems: "center" } },
                  React.createElement("input", { value: renamingName, onChange: function(e) { setRenamingName(e.target.value); }, style: { flex: 1, padding: "4px 8px", borderRadius: 4, background: SCRN, border: SCRNB, color: "#b0c8d8", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none" } }),
                  React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: function() { renameLevel(lv.id, renamingName); }, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
                  React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: function() { setRenamingId(null); }, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(220,60,80,0.18)", border: "1px solid rgba(220,60,80,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M6 6L18 18 M18 6L6 18", fill: "none", stroke: "#ff8088", strokeWidth: "2.5", strokeLinecap: "round" }))))
                : React.createElement("div", { style: { marginBottom: 8 } },
                  React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5 } },
                    !setsSelMode && (lvNumInput && lvNumInput.id === lv.id
                      ? React.createElement("input", { type: "number", value: lvNumInput.val, autoFocus: true, onChange: function(e) { setLvNumInput({ id: lv.id, val: e.target.value }); }, onBlur: function(e) { updateLevelNum(lv.id, e.target.value); }, onKeyDown: function(e) { if (e.key === "Enter") { updateLevelNum(lv.id, e.target.value); } if (e.key === "Escape") { setLvNumInput(null); } }, style: { width: 36, fontSize: 16, textAlign: "center", background: SCRN, border: SCRNB, borderRadius: 3, color: "#80ddff", outline: "none", padding: "0 4px", fontFamily: "'Quicksand',sans-serif" } })
                      : React.createElement("div", { onClick: function() { setLvNumInput({ id: lv.id, val: lv.levelNum != null ? String(lv.levelNum) : "" }); }, style: { fontSize: 10, color: "#80ddff", opacity: 0.7, background: "rgba(128,220,255,0.08)", border: "1px solid rgba(128,220,255,0.2)", borderRadius: 3, padding: "1px 5px", cursor: "pointer", fontWeight: 700, flexShrink: 0 } }, lv.levelNum != null ? "#" + lv.levelNum : "#–")),
                    React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, lv.name || "Untitled"),
                    !setsSelMode && React.createElement("div", { onClick: function() { setRenamingId(lv.id); setRenamingName(lv.name || ""); }, style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", color: "rgba(180,200,220,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 } }, WsIconPencil(11))),
                  React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, dateStr)),
                !setsSelMode && React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
                  React.createElement("div", { onClick: function() { navigateToGame(lv.id); }, style: BTN_PLAY }, "PLAY"),
                  React.createElement("div", { onClick: function() { openBuilder(lv); }, style: BTN_EDIT }, WsIconPencil(), "EDIT"),
                  React.createElement("div", { onClick: function() { copyLevel(lv); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"),
                  React.createElement("div", { onClick: function() { exportLevel(lv); }, style: BTN_EXPORT }, WsIconShare(), "SHARE"),
                  React.createElement("div", { style: { flex: 1 } }),
                  React.createElement("div", { onClick: function() {
                    var _inSets = setsDesignInSets(lv.id);
                    if (_inSets.length > 0) { setSetsDeleteWarn({ setNames: _inSets, onConfirm: function() { setDeletingId(lv.id); setSetsDeleteWarn(null); } }); }
                    else { setDeletingId(lv.id); }
                  }, style: BTN_DELETE_ICON }, WsIconTrash()))));
          }); if (sortMode === "level_num" && lvDragHover != null) { var _dzPos = Math.max(0, Math.min(_lvsorted.length, lvDragHover)); var _dz = React.createElement("div", { key: "dz", style: { height: 3, borderRadius: 2, margin: "1px 0", background: "rgba(80,200,255,0.4)", border: "1px solid rgba(80,200,255,0.7)" } }); return _mapped.slice(0, _dzPos).concat([_dz]).concat(_mapped.slice(_dzPos)); } return _mapped; }())),
        deletingId && renderDeleteOverlay("Delete Level?", function() { setDeletingId(null); }, function() { deleteLevel(deletingId); }),
        renderSetsDeleteWarnOverlay(),
        exportId && renderExportOverlay("Export Level", exportText, copied, function() { copyToClipboard(exportText, setCopied); }, function() { setExportId(null); }),
        showImport && renderImportOverlay("Import Level", importText, setImportText, importError, setImportError, handleImport, function() { setShowImport(false); setImportText(""); setImportError(""); }, getLevelImportPreview),
        showExportAll && renderExportOverlay("Export All Levels (" + savedLevels.length + ")", exportAllText, copied, function() { copyToClipboard(exportAllText, setCopied); }, function() { setShowExportAll(false); })),

      // ── BUILDER EDITOR ──
      lbScreen === "editor" && React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, padding: "6px 8px", background: WS.brushed, backgroundBlendMode: "overlay", borderBottom: PNLB, boxShadow: "0 3px 6px rgba(0,0,0,0.4)", position: "relative", zIndex: 2 } },
          WsRivet({ top: 4, left: 4 }), WsRivet({ top: 4, right: 4 }),
          React.createElement("div", { onClick: handleBuilderBack, style: Object.assign({}, BTN_TOPBAR, { display: "flex", alignItems: "center", gap: 3 }) }, React.createElement("svg", { width: "8", height: "8", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M15 18l-6-6 6-6", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" })), "My Levels"),
          React.createElement("div", { style: { display: "flex", gap: 3 } },
            React.createElement("div", { onClick: lbUndo, title: "Undo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 7px", opacity: lbCanUndo ? 1 : 0.35, cursor: lbCanUndo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M9 14L4 9l5-5" }),
                React.createElement("path", { d: "M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-3" }))),
            React.createElement("div", { onClick: lbRedo, title: "Redo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 7px", opacity: lbCanRedo ? 1 : 0.35, cursor: lbCanRedo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M15 14l5-5-5-5" }),
                React.createElement("path", { d: "M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h3" })))),
          React.createElement("div", { ref: tourSaveRef, style: { display: "flex", gap: 5 } },
            React.createElement("div", { onClick: handleBuilderSave, style: BTN_SAVE }, "Save"),
            React.createElement("div", { onClick: handleBuilderSaveAndPlay, style: Object.assign({}, BTN_SAVE, { display: "flex", alignItems: "center", gap: 3 }) }, React.createElement("svg", { width: "8", height: "8", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 3 L20 12 L5 21 Z", fill: "currentColor" })), "Save & Play")),
          React.createElement("div", { style: { flex: 1 } }),
          React.createElement("div", { onClick: function() { setBuilderTourStep(0); }, style: { width: 28, height: 28, borderRadius: 4, background: PNL, border: PNLB, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" } }, React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 16 16" }, React.createElement("circle", { cx: "8", cy: "8", r: "7", fill: "none", stroke: "rgba(180,200,220,0.5)", strokeWidth: "1.5" }), React.createElement("text", { x: "8", y: "12", textAnchor: "middle", fill: "rgba(180,200,220,0.5)", fontSize: "10", fontWeight: "700" }, "?")))),
        // ── Name input on its own row so the button row has room to breathe ──
        React.createElement("div", { style: { display: "flex", padding: "6px 10px", background: WS.brushed, backgroundBlendMode: "overlay", borderBottom: PNLB, position: "relative", zIndex: 2 } },
          React.createElement("div", { style: { flex: 1, background: SCRN, border: SCRNB, borderRadius: 4, padding: "4px 10px", boxShadow: SCRNS } },
            React.createElement("input", { value: builderLevelName, onChange: function(e) { var v = e.target.value; setBuilderLevelName(v); setBuilderDirty(true); lbHistoryPush({ grid: builderGrid, shipStart: builderShipStart, name: v, plasma: builderPlasma }, "name"); }, placeholder: "Level name...", style: { width: "100%", background: "transparent", border: "none", outline: "none", color: "#b0c8d8", fontSize: 16, fontWeight: 600, fontFamily: "'Quicksand',sans-serif", letterSpacing: 0.5 } }))),
        builderWarn && React.createElement("div", { style: { padding: "6px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: builderWarn.indexOf("Saved") === 0 ? "#80dd90" : "#ff8866", background: builderWarn.indexOf("Saved") === 0 ? "rgba(80,200,100,0.1)" : "rgba(255,80,60,0.1)", zIndex: 2, position: "relative" } }, builderWarn),
        React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 10px 0", position: "relative", zIndex: 1, overflow: "hidden" } },
          React.createElement("div", { ref: builderGridRef, onClick: handleBuilderGridClick, onTouchStart: handleBuilderGridTS, onTouchMove: handleBuilderGridTM, onTouchEnd: handleBuilderGridTE, onMouseDown: handleBuilderGridMD, onMouseMove: handleBuilderGridMM, onMouseUp: handleBuilderGridMU, onMouseLeave: function() { if (builderDragRef.current) { builderDragRef.current = null; setTimeout(function() { builderTouchUsedRef.current = false; }, 100); } }, style: { display: "grid", gridTemplateColumns: "repeat(" + COLS + ", 1fr)", gap: GAP, width: "100%", maxWidth: 380, aspectRatio: COLS + "/" + ROWS, userSelect: "none", WebkitUserSelect: "none" } },
            builderGrid.map(function(cell, idx) {
              return React.createElement("div", { key: idx, style: { aspectRatio: "1", borderRadius: 6, background: cell > 0 ? "transparent" : "rgba(30,30,50,0.6)", border: cell > 0 ? (eraserActive ? "1px solid rgba(255,80,80,0.25)" : "none") : "1px dashed rgba(80,100,140,0.3)", cursor: (selectedBlockType !== null || eraserActive) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", pointerEvents: "none" } },
                cell > 0 && renderBuilderBlock(cell, 40, cell === 10 ? 2 : 0),
                cell === 0 && React.createElement("div", { style: { width: 6, height: 6, borderRadius: "50%", background: "rgba(80,100,140,0.15)" } }));
            })),
          React.createElement("div", { ref: tourShipRef, style: { width: "100%", maxWidth: 380, height: 50, position: "relative", marginTop: 4 } },
            React.createElement("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(140,160,180,0.06)" } }),
            [0,1,2,3,4,5,6,7].map(function(c) {
              var isSelected = c === builderShipStart;
              return React.createElement("div", { key: c, onClick: function() { setBuilderShipStart(c); setBuilderDirty(true); lbHistoryPush({ grid: builderGrid, shipStart: c, name: builderLevelName, plasma: builderPlasma }, "shipStart"); }, style: { position: "absolute", left: (c / COLS * 100) + "%", width: (100 / COLS) + "%", top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" } },
                isSelected ? React.createElement("svg", { viewBox: "0 0 36 40", width: "28", height: "32" }, React.createElement("defs", null, React.createElement("linearGradient", { id: "bsg", x1: "0", y1: "0", x2: "0", y2: "1" }, React.createElement("stop", { offset: "0%", stopColor: "#ffd0ff" }), React.createElement("stop", { offset: "100%", stopColor: "#cc70cc" }))), React.createElement("path", { d: "M18 0L4 32L12 27L18 40L24 27L32 32Z", fill: "url(#bsg)" })) : React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: "rgba(255,168,255,0.15)", border: "1px solid rgba(255,168,255,0.1)" } }));
            })),
          React.createElement("div", { ref: tourPlasmaRef, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 6, marginBottom: 2 } },
            React.createElement("div", { onClick: function() { var n = Math.max(1, builderPlasma - 1); setBuilderPlasma(n); setBuilderDirty(true); lbHistoryPush({ grid: builderGrid, shipStart: builderShipStart, name: builderLevelName, plasma: n }, "plasma"); }, style: { width: 28, height: 28, borderRadius: 4, background: PNL, border: PNLB, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#b0c8d8", fontSize: 16, fontWeight: 700 } }, "-"),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
              React.createElement(PlasmaContainer, { current: builderPlasma, max: 20 }),
              React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 } }, "Plasma")),
            React.createElement("div", { onClick: function() { var n = Math.min(20, builderPlasma + 1); setBuilderPlasma(n); setBuilderDirty(true); lbHistoryPush({ grid: builderGrid, shipStart: builderShipStart, name: builderLevelName, plasma: n }, "plasma"); }, style: { width: 28, height: 28, borderRadius: 4, background: PNL, border: PNLB, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#b0c8d8", fontSize: 16, fontWeight: 700 } }, "+"))),
        React.createElement("div", { style: { display: "flex", justifyContent: "center", padding: "2px 10px 4px" } },
          React.createElement("div", { onClick: function() { setBuilderDarkLevel(!builderDarkLevel); setBuilderDirty(true); }, style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 12, cursor: "pointer", background: builderDarkLevel ? "rgba(50,15,90,0.7)" : "rgba(20,20,35,0.4)", border: builderDarkLevel ? "1px solid rgba(150,70,255,0.5)" : "1px solid rgba(80,80,100,0.2)", boxShadow: builderDarkLevel ? "0 0 8px rgba(100,30,180,0.3)" : "none" } },
            React.createElement("svg", { width: 10, height: 10, viewBox: "0 0 24 24" }, React.createElement("path", { d: "M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z", fill: builderDarkLevel ? "#cc88ff" : "rgba(180,200,220,0.25)" })),
            React.createElement("div", { style: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: builderDarkLevel ? "#cc88ff" : "rgba(180,200,220,0.25)" } }, "Dark Level"))),
        React.createElement("div", { style: { position: "relative" } },
          isCrate(selectedBlockType) && React.createElement("div", { style: { position: "absolute", bottom: "100%", left: 0, right: 0, zIndex: 3, background: "linear-gradient(180deg, #1a1a2e, #151528)", borderBottom: "2px solid rgba(212,168,67,0.3)", padding: "8px 8px 6px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" } },
          React.createElement("div", { style: { color: "rgba(212,168,67,0.7)", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 } }, "Crate Reward"),
          React.createElement("div", { style: { display: "flex", gap: 4, justifyContent: "center" } },
            CRATE_VARIANTS.map(function(cv) {
              var isActive2 = selectedCrateType === cv.type;
              return React.createElement("div", { key: cv.type, onClick: function() { setSelectedCrateType(cv.type); setSelectedBlockType(cv.type); setEraserActive(false); }, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 2px 4px", borderRadius: 4, background: isActive2 ? "rgba(100,80,30,0.5)" : "rgba(30,30,50,0.6)", border: isActive2 ? "2px solid rgba(212,168,67,0.6)" : "1px solid rgba(80,80,100,0.3)", cursor: "pointer" } },
                React.createElement("div", { style: { width: 28, height: 28 } }, renderBuilderBlock(cv.type, 28, 0)),
                React.createElement("div", { style: { fontSize: 7, fontWeight: 700, color: isActive2 ? "rgba(212,168,67,0.9)" : "rgba(180,200,220,0.4)", textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center", lineHeight: 1.2 } }, cv.name));
            }))),
        React.createElement("div", { style: { position: "relative", zIndex: 2, background: PNL, borderTop: "3px solid #505058", padding: "8px 6px 10px", boxShadow: "0 -3px 8px rgba(0,0,0,0.3)" } },
          React.createElement("div", { ref: tourPaletteRef, style: { display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" } },
            [1,2,3,5,9,6,7,8,10,17].map(function(t) {
              if (t === 9) {
                var isCrateActive = isCrate(selectedBlockType);
                return React.createElement("div", { key: t, ref: tourCrateRef, onClick: function() { setSelectedBlockType(selectedCrateType); setEraserActive(false); }, style: { width: "18%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "5px 2px 4px", borderRadius: 4, background: isCrateActive ? "rgba(40,100,120,0.4)" : PNL, border: isCrateActive ? "2px solid rgba(80,200,255,0.5)" : PNLB, cursor: "pointer", boxShadow: isCrateActive ? "inset 0 0 10px rgba(80,200,255,0.15), 0 0 8px rgba(80,200,255,0.2)" : "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" } },
                  React.createElement("div", { style: { width: 28, height: 28 } }, renderBuilderBlock(selectedCrateType, 28, 0)),
                  React.createElement("div", { style: { fontSize: 7, fontWeight: 700, color: isCrateActive ? "#80ddff" : "rgba(180,200,220,0.5)", textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center", lineHeight: 1.2 } }, isCrateActive ? "ACTIVE" : "Crate"));
              }
              if (t === 17) {
                var ufoOnBoard = builderGrid.indexOf(17) >= 0;
                var isUfoActive = selectedBlockType === 17;
                if (ufoOnBoard && !isUfoActive) {
                  return React.createElement("div", { key: t, onClick: function() { setBuilderWarn("Only one UFO allowed. Remove it from the board to place in a new location."); setTimeout(function() { setBuilderWarn(null); }, 4000); }, style: { width: "18%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "5px 2px 4px", borderRadius: 4, background: "rgba(30,30,40,0.6)", border: "1px solid rgba(80,80,100,0.2)", cursor: "pointer", opacity: 0.4 } },
                    React.createElement("div", { style: { width: 28, height: 28 } }, renderBuilderBlock(17, 28, 0)),
                    React.createElement("div", { style: { fontSize: 7, fontWeight: 700, color: "rgba(140,140,160,0.4)", textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center", lineHeight: 1.2 } }, "UFO"));
                }
              }
              var isActive = selectedBlockType === t;
              return React.createElement("div", { key: t, onClick: function() { setSelectedBlockType(isActive ? null : t); setEraserActive(false); setCrateSubPanelOpen(false); }, style: { width: "18%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "5px 2px 4px", borderRadius: 4, background: isActive ? "rgba(40,100,120,0.4)" : PNL, border: isActive ? "2px solid rgba(80,200,255,0.5)" : PNLB, cursor: "pointer", boxShadow: isActive ? "inset 0 0 10px rgba(80,200,255,0.15), 0 0 8px rgba(80,200,255,0.2)" : "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" } },
                React.createElement("div", { style: { width: 28, height: 28 } }, renderBuilderBlock(t, 28, t === 10 ? 2 : 0)),
                React.createElement("div", { style: { fontSize: 7, fontWeight: 700, color: isActive ? "#80ddff" : "rgba(180,200,220,0.5)", textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center", lineHeight: 1.2 } }, isActive ? "ACTIVE" : BLOCK_LABELS[t]));
            })),
          React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "center", marginTop: 6 } },
            React.createElement("div", { onClick: function() { setEraserActive(!eraserActive); setSelectedBlockType(null); setCrateSubPanelOpen(false); }, style: { padding: "6px 14px", borderRadius: 4, background: eraserActive ? "rgba(120,40,40,0.5)" : PNL, border: eraserActive ? "2px solid rgba(255,100,80,0.5)" : PNLB, cursor: "pointer", color: eraserActive ? "#ff9977" : "rgba(200,210,220,0.5)", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5, boxShadow: eraserActive ? "inset 0 0 10px rgba(255,80,60,0.15), 0 0 6px rgba(255,80,60,0.2)" : "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" } },
              React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M20 5.5L8.5 17H4l-1-1 8-8L18.5 1l1.5 1.5L12 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), React.createElement("line", { x1: "4", y1: "20", x2: "20", y2: "20", stroke: "currentColor", strokeWidth: "1.5" })),
              eraserActive ? "ERASING" : "Eraser"),
            React.createElement("div", { onClick: function() { setSelectedBlockType(null); setEraserActive(false); setCrateSubPanelOpen(false); }, style: { padding: "6px 14px", borderRadius: 4, background: (selectedBlockType !== null || eraserActive) ? "rgba(80,30,30,0.4)" : PNL, border: (selectedBlockType !== null || eraserActive) ? "2px solid rgba(255,80,80,0.3)" : PNLB, cursor: "pointer", color: (selectedBlockType !== null || eraserActive) ? "rgba(255,120,120,0.7)" : "rgba(140,160,180,0.25)", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 } },
              React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24" }, React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round" }), React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round" })),
              "Deselect"),
            React.createElement("div", { onClick: function() { setBuilderGrid(new Array(COLS * ROWS).fill(0)); setBuilderDirty(true); }, style: { padding: "6px 14px", borderRadius: 4, background: PNL, border: PNLB, cursor: "pointer", color: "rgba(200,210,220,0.5)", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" } }, "Clear All")))),
        builderTourStep != null && builderTourRect && React.createElement(React.Fragment, null,
          React.createElement("div", { style: { position: "fixed", top: builderTourRect.top - 5, left: builderTourRect.left - 5, width: builderTourRect.width + 10, height: builderTourRect.height + 10, border: "2px solid #50c8ff", borderRadius: 8, boxShadow: "0 0 16px rgba(80,200,255,0.6), inset 0 0 10px rgba(80,200,255,0.2)", pointerEvents: "none", zIndex: 499, animation: "pulse 1.6s ease-in-out infinite" } }),
          React.createElement("div", { style: Object.assign({ position: "fixed", left: tourTipLeft, width: 280, zIndex: 500, background: "linear-gradient(170deg,#1a2740,#15203a)", border: "1px solid rgba(80,200,255,0.35)", borderRadius: 12, padding: "14px 16px", boxShadow: "0 8px 28px rgba(0,0,0,0.6)" }, tourTipBelow ? { top: builderTourRect.top + builderTourRect.height + 14 } : { bottom: (window.innerHeight - builderTourRect.top) + 14 }) },
            React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 } }, BUILDER_TOUR_STEPS.map(function(s, si) { return React.createElement("div", { key: si, style: { width: 7, height: 7, borderRadius: "50%", background: si === builderTourStep ? "#50c8ff" : si < builderTourStep ? "rgba(80,200,255,0.35)" : "rgba(80,200,255,0.12)" } }); })),
            React.createElement("div", { style: { color: "#80ddff", fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 } }, BUILDER_TOUR_STEPS[builderTourStep].title),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.75)", fontSize: 13, lineHeight: 1.5, marginBottom: 14 } }, BUILDER_TOUR_STEPS[builderTourStep].desc),
            React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "center", alignItems: "center" } },
              builderTourStep > 0 && React.createElement("div", { onClick: function() { setBuilderTourStep(builderTourStep - 1); }, style: { padding: "6px 16px", borderRadius: 16, border: "1px solid rgba(80,200,255,0.2)", color: "rgba(180,200,220,0.5)", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "Back"),
              React.createElement("div", { onClick: function() { if (builderTourStep < BUILDER_TOUR_STEPS.length - 1) { setBuilderTourStep(builderTourStep + 1); } else { setBuilderTourStep(null); builderTourSeenRef.current = true; try { window.storage.set("cosmic_drift_builder_tour", "seen"); } catch (e) {} } }, style: { padding: "8px 24px", borderRadius: 16, background: "linear-gradient(135deg,#2a4a6a,#1a3a5a)", border: "2px solid rgba(80,200,255,0.4)", color: "#80ddff", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 } }, builderTourStep < BUILDER_TOUR_STEPS.length - 1 ? "Next" : "Got It!")),
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 } },
              React.createElement("div", { style: { width: 36 } }),
              React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, (builderTourStep + 1) + " of " + BUILDER_TOUR_STEPS.length),
              builderTourStep < BUILDER_TOUR_STEPS.length - 1 ? React.createElement("div", { onClick: function() { setBuilderTourStep(null); builderTourSeenRef.current = true; try { window.storage.set("cosmic_drift_builder_tour", "seen"); } catch (e) {} }, style: { color: "rgba(180,200,220,0.35)", fontSize: 10, fontWeight: 600, cursor: "pointer" } }, "Skip") : React.createElement("div", { style: { width: 36 } })))),
        showBackWarn && renderBackWarnOverlay(
          function() { setShowBackWarn(false); },
          function() { handleBuilderSave(); setShowBackWarn(false); loadSavedLevels(); setLbScreen("list"); },
          function() { setShowBackWarn(false); loadSavedLevels(); setLbScreen("list"); }))),

    // ═══ BLOCK DESIGNER ═══
    screen === "designer" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", background: WS.brushed, backgroundBlendMode: "overlay" } },
      WsRivet({ bottom: 5, left: 5 }), WsRivet({ bottom: 5, right: 5 }),

      // ── MY DESIGNS LIST ──
      bdCurrentView === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: function() { if (setsSelMode) { setSetsSelMode(null); setScreen("sets"); setSetsView("editor"); } else { setScreen("splash"); } }, backLabel: setsSelMode ? "Set" : "Workshop", title: "My Blocks", color: "#c8b8ff",
          rightContent: !setsSelMode && React.createElement("div", { style: { display: "flex", gap: 4 } },
            React.createElement("div", { onClick: function() { setBdShowImport(true); setBdImportText(""); setBdImportError(""); }, style: BTN_TOPBAR_PURPLE }, "Import"),
            ((bdSavedTab === "active" && Object.keys(bdActiveMap).length > 0) || (bdSavedTab !== "active" && bdSaved.length > 0)) && React.createElement("div", { onClick: bdSavedTab === "active" ? bdExportActiveBlocks : bdExportAllDesigns, style: Object.assign({}, BTN_TOPBAR, { color: "rgba(200,184,255,0.6)", fontSize: 8 }) }, "Exp All"),
            React.createElement("div", { onClick: function() { bdOpenEditor(null); }, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #1a3a4a, #0f2a38)", boxShadow: "0 0 8px rgba(80,200,255,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, "+ New")) }),
        renderSetsSelBar("block", bdSaved.map(function(d) { return d.id; })),
        // Tabs: My Designs / Game Blocks
        React.createElement("div", { style: { display: "flex", margin: "0 10px", borderBottom: "1px solid rgba(60,60,80,0.3)", position: "relative", zIndex: 1 } },
          [["custom", "My Designs (" + bdSaved.length + ")"], ["factory", "Game Blocks"], ["active", "Active Blocks"]].map(function(tab) {
            var active = bdSavedTab === tab[0];
            return React.createElement("div", { key: tab[0], onClick: function() { setBdSavedTab(tab[0]); }, style: { flex: 1, textAlign: "center", padding: "10px 0 8px", color: active ? "#c8b8ff" : "rgba(180,200,220,0.3)", fontSize: 11, fontWeight: active ? 700 : 600, cursor: "pointer", borderBottom: active ? "2px solid #c8b8ff" : "2px solid transparent", letterSpacing: 0.2 } }, tab[1]);
          })),
        bdSavedTab === "custom" && !setsSelMode && bdSaved.length > 1 && renderSortBar(bdSortMode, setBdSortMode, [["type", "Type"]]),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px", position: "relative", zIndex: 1 } },
          // My Designs tab
          bdSavedTab === "custom" && bdSaved.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 14, marginBottom: 8 } }, "No saved designs yet"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Create a new design or copy a Game Block to start.")),
          bdSavedTab === "custom" && (function() { var _bds = sortItems(bdSaved, bdSortMode, "modifiedAt"); var _bdi = []; var _bdlt = null; for (var _bdk = 0; _bdk < _bds.length; _bdk++) { var saved = _bds[_bdk]; if (bdSortMode === "type") { var _bdbt = null; for (var _bdbti = 0; _bdbti < BD_BLOCK_TYPES.length; _bdbti++) { if (BD_BLOCK_TYPES[_bdbti].id === saved.assignedTo) { _bdbt = BD_BLOCK_TYPES[_bdbti]; break; } } var _bdt = _bdbt ? _bdbt.label : "Other"; if (_bdt !== _bdlt) { _bdlt = _bdt; _bdi.push(renderTypeHeader(_bdt, "#c8b8ff")); } }
            var bt = null; for (var bi = 0; bi < BD_BLOCK_TYPES.length; bi++) { if (BD_BLOCK_TYPES[bi].id === saved.assignedTo) { bt = BD_BLOCK_TYPES[bi]; break; } }
            var _dateRaw = saved.modifiedAt || saved.createdAt || saved.savedAt;
            var dateStr = _dateRaw ? new Date(_dateRaw).toLocaleDateString() : "";
            var _bdSel = setsSelMode && setsSelMode.selectedIds.indexOf(saved.id) !== -1;
            _bdi.push(React.createElement("div", { key: saved.id, style: Object.assign({}, CARD_STYLE, setsSelMode ? { display: "flex", alignItems: "flex-start", gap: 8 } : {}) },
              setsSelMode && React.createElement("div", { onClick: function() { setsToggleSel(saved, "assignedTo"); }, style: { width: 20, height: 20, borderRadius: 4, border: _bdSel ? "1.5px solid #ffd060" : "1.5px solid rgba(255,208,96,0.3)", background: _bdSel ? "#ffd060" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 } },
                _bdSel && React.createElement("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "#1a1400", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M5 12l5 5L20 7" }))),
              React.createElement("div", { style: { flex: 1 } },
                bdRenamingId === saved.id ? React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8, alignItems: "center" } },
                  React.createElement("input", { value: bdRenamingName, onChange: function(e) { setBdRenamingName(e.target.value); }, style: { flex: 1, padding: "4px 8px", borderRadius: 4, background: SCRN, border: SCRNB, color: "#b0c8d8", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none" } }),
                  React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: function() { bdRenameDesign(saved.id, bdRenamingName); }, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
                  React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: function() { setBdRenamingId(null); }, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(220,60,80,0.18)", border: "1px solid rgba(220,60,80,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M6 6L18 18 M18 6L6 18", fill: "none", stroke: "#ff8088", strokeWidth: "2.5", strokeLinecap: "round" }))))
                : React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 8, alignItems: "center" } },
                  React.createElement(BDBlockPreview, { design: saved, size: 38 }),
                  React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5 } },
                      React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, saved.name || "Unnamed"),
                      !setsSelMode && React.createElement("div", { onClick: function() { setBdRenamingId(saved.id); setBdRenamingName(saved.name || ""); }, style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", color: "rgba(180,200,220,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 } }, WsIconPencil(11))),
                  React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, (bt ? bt.label + " \u00B7 " : "") + saved.shape + (saved.pattern !== "none" ? " \u00B7 " + saved.pattern : "") + (dateStr ? " \u00B7 " + dateStr : ""))),
                  !setsSelMode && saved.assignedTo && React.createElement("div", { onClick: function() { bdToggleActive(saved); }, style: bdActiveMap[saved.assignedTo] === saved.id ? BTN_ISACTIVE : BTN_SETACTIVE }, bdActiveMap[saved.assignedTo] === saved.id ? "★ Active" : "Set Active")),
                !setsSelMode && React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
                  React.createElement("div", { onClick: function() { bdOpenEditor(saved); }, style: BTN_EDIT }, WsIconPencil(), "EDIT"),
                  React.createElement("div", { onClick: function() { bdCopyPreset(saved); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"),
                  React.createElement("div", { onClick: function() { bdExportDesign(saved); }, style: BTN_EXPORT }, WsIconShare(), "SHARE"),
                  React.createElement("div", { style: { flex: 1 } }),
                  React.createElement("div", { onClick: function() {
                    var _inSets = setsDesignInSets(saved.id);
                    if (_inSets.length > 0) { setSetsDeleteWarn({ setNames: _inSets, onConfirm: function() { setBdDeletingId(saved.id); setSetsDeleteWarn(null); } }); }
                    else { setBdDeletingId(saved.id); }
                  }, style: BTN_DELETE_ICON }, WsIconTrash())))));
          } return _bdi; }()),
          // Game Blocks tab
          bdSavedTab === "factory" && BD_FACTORY_PRESETS.map(function(preset) {
            return React.createElement("div", { key: preset.id, style: Object.assign({}, CARD_STYLE, { display: "flex", alignItems: "center", gap: 10 }) },
              React.createElement(BDBlockPreview, { design: preset, size: 38 }),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, preset.name)),
              React.createElement("div", { onClick: function() { bdCopyPreset(preset); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"));
          }),
          // Active Blocks tab - the design active for each block type
          bdSavedTab === "active" && BD_BLOCK_TYPES.map(function(bt) {
            var activeId = bdActiveMap[bt.id], customActive = null;
            if (activeId) { for (var ci = 0; ci < bdSaved.length; ci++) { if (bdSaved[ci].id === activeId && bdSaved[ci].assignedTo === bt.id) { customActive = bdSaved[ci]; break; } } }
            var factory = null; for (var fi = 0; fi < BD_FACTORY_PRESETS.length; fi++) { if (BD_FACTORY_PRESETS[fi].assignedTo === bt.id) { factory = BD_FACTORY_PRESETS[fi]; break; } }
            var shown = customActive || factory;
            return React.createElement("div", { key: bt.id, style: Object.assign({}, CARD_STYLE, { display: "flex", alignItems: "center", gap: 10 }) },
              shown && React.createElement(BDBlockPreview, { design: shown, size: 38 }),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, bt.label),
                React.createElement("div", { style: { color: customActive ? "rgba(150,220,170,0.7)" : "rgba(180,200,220,0.3)", fontSize: 10 } }, customActive ? (customActive.name || "Unnamed") : "Default")),
              customActive && React.createElement("div", { onClick: function() { bdOpenEditor(customActive); }, style: BTN_EDIT }, WsIconPencil(), "Edit"),
              customActive && React.createElement("div", { onClick: function() { bdToggleActive(customActive); }, style: BTN_RENAME }, WsIconReset(), "Use Default"),
              customActive && factory && React.createElement(BDBlockPreview, { design: factory, size: 22 }),
              !customActive && factory && React.createElement("div", { onClick: function() { bdCopyPreset(factory); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"));
          })),
        bdDeletingId && renderDeleteOverlay("Delete Design?", function() { setBdDeletingId(null); }, function() { bdDeleteDesign(bdDeletingId); }),
        bdExportId && renderExportOverlay("Export Design", bdExportText, bdCopied, function() { copyToClipboard(bdExportText, setBdCopied); }, function() { setBdExportId(null); }),
        bdShowImport && renderImportOverlay("Import Design", bdImportText, setBdImportText, bdImportError, setBdImportError, bdHandleImport, function() { setBdShowImport(false); setBdImportText(""); setBdImportError(""); }),
        bdImportConfirm && renderImportConfirmOverlay(bdImportConfirm, bdConfirmImport, function() { setBdImportConfirm(null); }),
        bdShowExportAll && renderExportOverlay("Export All Designs (" + bdSaved.length + ")", bdExportAllText, bdCopied, function() { copyToClipboard(bdExportAllText, setBdCopied); }, function() { setBdShowExportAll(false); }),
        renderSetsDeleteWarnOverlay()),

      // ── DESIGN EDITOR ──
      bdCurrentView === "editor" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: bdHandleBack, backLabel: "My Blocks", title: "Block Designer", color: "#c8b8ff", fontFamily: "'Exo 2', sans-serif",
          rightContent: React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "center" } },
            // ── Undo / Redo (pilot) ──
            React.createElement("div", { onClick: bdUndo, title: "Undo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 8px", opacity: bdCanUndo ? 1 : 0.35, cursor: bdCanUndo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M9 14L4 9l5-5" }),
                React.createElement("path", { d: "M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-3" }))),
            React.createElement("div", { onClick: bdRedo, title: "Redo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 8px", opacity: bdCanRedo ? 1 : 0.35, cursor: bdCanRedo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M15 14l5-5-5-5" }),
                React.createElement("path", { d: "M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h3" }))),
            React.createElement("div", { onClick: bdSaveCurrentDesign, style: BTN_SAVE }, "Save"),
            React.createElement("div", { onClick: function() {
              if (!bdDesign.assignedTo) { setBdSaveStatus("Choose a Block type first"); setTimeout(function() { setBdSaveStatus(""); }, 2500); return; }
              if (!bdEditId || bdDirty) { setBdSaveStatus("Save the design first"); setTimeout(function() { setBdSaveStatus(""); }, 2500); return; }
              bdToggleActive({ id: bdEditId, assignedTo: bdDesign.assignedTo });
            }, style: Object.assign({}, BTN_TOPBAR, { color: bdIsActive ? "#80dd90" : "rgba(200,210,220,0.7)", border: bdIsActive ? "2px solid rgba(80,200,100,0.5)" : PNLB }) }, bdIsActive ? "★ Active" : "Set Active")) }),
        bdSaveStatus && React.createElement("div", { style: { padding: "6px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#80dd90", background: "rgba(80,200,100,0.1)", zIndex: 2, position: "relative" } }, bdSaveStatus),
        React.createElement("div", { ref: bdScrollRef, style: { flex: 1, overflowY: "auto", fontFamily: "'Exo 2', sans-serif" } },
          // Preview area with 3x3 grid + main preview
          React.createElement("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", padding: "12px 16px 8px", gap: 16 } },
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, opacity: 0.5 } },
              Array.from({ length: 9 }).map(function(_, i) {
                return React.createElement("div", { key: i }, React.createElement(BDBlockPreview, { design: bdDisplayDesign, size: 26 }));
              })),
            React.createElement("div", { style: { background: "radial-gradient(circle, rgba(30,40,60,0.8) 0%, rgba(10,14,26,0.9) 100%)", borderRadius: 14, padding: 14, border: "1px solid rgba(255,255,255,0.06)" } },
              React.createElement(BDBlockPreview, { design: bdDisplayDesign, size: 96 }))),
          // Name + Block Type
          React.createElement("div", { style: { display: "flex", gap: 8, padding: "0 14px 8px" } },
            React.createElement("div", { style: { flex: 2 } },
              React.createElement("div", { style: { fontSize: 10, color: "#445", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 } }, "Name"),
              React.createElement("input", { value: bdDesign.name, onChange: function(e) { bdUpdateDesign("name", e.target.value); }, placeholder: "Unnamed Design", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e0e0e0", fontSize: 16, fontFamily: "'Exo 2', sans-serif", outline: "none", boxSizing: "border-box" } })),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontSize: 10, color: "#445", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 } }, "Block"),
              React.createElement("select", { value: bdDesign.assignedTo, onChange: function(e) { bdUpdateDesign("assignedTo", e.target.value); }, style: { width: "100%", padding: "8px 4px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e0e0e0", fontSize: 16, fontFamily: "'Exo 2', sans-serif", outline: "none", boxSizing: "border-box" } },
                React.createElement("option", { value: "" }, "None"),
                BD_BLOCK_TYPES.map(function(bt) { return React.createElement("option", { key: bt.id, value: bt.id }, bt.label); })))),
          // Phase picker (force field only)
          bdDesign.assignedTo === "force_field" && React.createElement("div", { style: { display: "flex", gap: 6, padding: "0 14px", marginBottom: 8 } },
            [1, 2, 3].map(function(p) {
              var sel = bdPhase === p;
              var labels = { 1: "Phase 1: Full Shield", 2: "Phase 2: Weakened", 3: "Phase 3: Depleted" };
              return React.createElement("button", { key: p, onClick: function() { setBdPhase(p); }, style: { flex: 1, padding: "10px 4px", borderRadius: 8, border: sel ? "1px solid rgba(68,136,255,0.5)" : "1px solid rgba(255,255,255,0.06)", background: sel ? "rgba(68,136,255,0.15)" : "rgba(255,255,255,0.02)", color: sel ? "#88bbff" : "#556", fontSize: 11, fontFamily: "'Exo 2', sans-serif", fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent", textAlign: "center" } }, labels[p]);
            })),
          // Controls area
          React.createElement("div", { style: { padding: "0 12px 100px" } },
            React.createElement(BDHudTabBar, { active: bdActivePanel, onSelect: bdTogglePanel, lockedTabs: bdDesign.shape === "none" ? { color: true, border: true, pattern: true } : {}, onLockedClick: function() { setBdActivePanel("shape"); setBdSaveStatus("Select Shape to edit properties."); setTimeout(function() { setBdSaveStatus(""); }, 2500); } }),
            bdActivePanel && React.createElement("div", { style: { borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(68,136,255,0.15)", padding: "16px", marginTop: 2 } },
              bdActivePanel === "shape" && React.createElement(React.Fragment, null,
                React.createElement(BDOptionGrid, { options: SHAPES, value: bdDesign.shape, onChange: function(v) { bdUpdateDesign("shape", v); }, columns: 4 }),
                React.createElement(BDSlider, { label: shipMixedLbl("rot", "Rotation"), value: bdDesign.shapeRotation, onChange: function(v) { bdUpdateDesign("shapeRotation", v); }, min: 0, max: 360, step: 5, displayValue: bdDesign.shapeRotation + "\u00b0" }),
                CORNER_SHAPES[bdDesign.shape] && React.createElement(BDSlider, { label: shipMixedLbl("cr", "Corner Radius"), value: bdDesign.cornerRadius, onChange: function(v) { bdUpdateDesign("cornerRadius", v); }, min: 0, max: 46, step: 1 })),
              bdActivePanel === "color" && React.createElement(React.Fragment, null,
                React.createElement(BDColorPicker, { value: bdDesign.color, onChange: function(v) { bdUpdateDesign("color", v); }, presets: BD_COLOR_PRESETS }),
                React.createElement(BDSlider, { label: "Fill Opacity", value: bdDesign.fillOpacity != null ? bdDesign.fillOpacity : 1, onChange: function(v) { bdUpdateDesign("fillOpacity", v); }, min: 0, max: 1, step: 0.05, displayValue: Math.round((bdDesign.fillOpacity != null ? bdDesign.fillOpacity : 1) * 100) + "%" })),
              bdActivePanel === "border" && React.createElement(React.Fragment, null,
                React.createElement(BDColorPicker, { value: bdDisplayDesign.borderColor, onChange: function(v) { bdUpdateDesign("borderColor", v); }, label: "Color", presets: BD_COLOR_PRESETS }),
                React.createElement(BDSlider, { label: "Thickness", value: bdDisplayDesign.borderWidth, onChange: function(v) { bdUpdateDesign("borderWidth", v); }, min: 0, max: 8, step: 0.5 }),
                React.createElement(BDSlider, { label: shipMixedLbl("bo", "Border Opacity"), value: bdDisplayDesign.borderOpacity != null ? bdDisplayDesign.borderOpacity : 1, onChange: function(v) { bdUpdateDesign("borderOpacity", v); }, min: 0, max: 1, step: 0.05, displayValue: Math.round((bdDisplayDesign.borderOpacity != null ? bdDisplayDesign.borderOpacity : 1) * 100) + "%" }),
                React.createElement(BDToggle, { label: "Glow", value: bdDisplayDesign.glowEnabled, onChange: function(v) { bdUpdateDesign("glowEnabled", v); } }),
                bdDisplayDesign.glowEnabled && React.createElement(React.Fragment, null,
                  React.createElement(BDColorPicker, { value: bdDisplayDesign.glowColor, onChange: function(v) { bdUpdateDesign("glowColor", v); }, label: shipMixedLbl("glowColor", "Glow Color") }),
                  React.createElement(BDSlider, { label: "Intensity", value: bdDisplayDesign.glowIntensity, onChange: function(v) { bdUpdateDesign("glowIntensity", v); }, min: 2, max: 20, step: 1 }))),
              bdActivePanel === "pattern" && React.createElement(React.Fragment, null,
                React.createElement(BDOptionGrid, { options: PATTERNS, value: bdDesign.pattern, onChange: function(v) {
                  // Craters uses a wider Scale range (3..10); other patterns use 0.3..3.
                  // Adjust patternScale on switch so the slider lands in-range.
                  if (v === "craters" && (bdDesign.patternScale == null || bdDesign.patternScale < 3)) { bdUpdateDesign("patternScale", 10); }
                  else if (v !== "craters" && bdDesign.patternScale != null && bdDesign.patternScale > 3) { bdUpdateDesign("patternScale", 1); }
                  bdUpdateDesign("pattern", v);
                }, columns: 4 }),
                bdDesign.pattern !== "none" && (function() {
                  var caps = PATTERN_CAPS[bdDesign.pattern] || {};
                  return React.createElement(React.Fragment, null,
                    React.createElement(BDColorPicker, { value: bdDesign.patternColor, onChange: function(v) { bdUpdateDesign("patternColor", v); }, label: "Color" }),
                    React.createElement(BDSlider, { label: shipMixedLbl("opacity", "Opacity"), value: bdDesign.patternOpacity, onChange: function(v) { bdUpdateDesign("patternOpacity", v); }, min: 0.1, max: 1, step: 0.05, displayValue: Math.round(bdDesign.patternOpacity * 100) + "%" }),
                    bdDesign.pattern !== "rings" && (function() {
                      var isCraters = bdDesign.pattern === "craters";
                      var sMin = isCraters ? 3 : 0.3, sMax = isCraters ? 10 : 3, sStep = isCraters ? 0.5 : 0.1;
                      var sVal = bdDesign.patternScale == null ? (isCraters ? 10 : 1) : Math.max(sMin, Math.min(sMax, bdDesign.patternScale));
                      return React.createElement(BDSlider, { label: "Scale", value: sVal, onChange: function(v) { bdUpdateDesign("patternScale", v); }, min: sMin, max: sMax, step: sStep, displayValue: sVal.toFixed(1) + "x" });
                    })(),
                    bdDesign.pattern !== "rings" && React.createElement(BDSlider, { label: shipMixedLbl("rot", "Rotation"), value: bdDesign.patternRotation, onChange: function(v) { bdUpdateDesign("patternRotation", v); }, min: 0, max: 360, step: 5, displayValue: bdDesign.patternRotation + "\u00b0" }),
                    caps.lineWidth && React.createElement(BDSlider, { label: "Line Width", value: bdDesign.patternLineWidth, onChange: function(v) { bdUpdateDesign("patternLineWidth", v); }, min: 0.5, max: 4, step: 0.25 }),
                    caps.spacing && React.createElement(BDSlider, { label: "Spacing", value: bdDesign.patternSpacing == null ? 10 : bdDesign.patternSpacing, onChange: function(v) { bdUpdateDesign("patternSpacing", v); }, min: 4, max: 30, step: 1, displayValue: String(Math.round(bdDesign.patternSpacing == null ? 10 : bdDesign.patternSpacing)) }),
                    caps.ringSpacing && React.createElement(BDSlider, { label: "Ring Spacing", value: bdDesign.patternRingSpacing == null ? 6 : bdDesign.patternRingSpacing, onChange: function(v) { bdUpdateDesign("patternRingSpacing", v); }, min: 2, max: 30, step: 1, displayValue: String(Math.round(bdDesign.patternRingSpacing == null ? 6 : bdDesign.patternRingSpacing)) }),
                    caps.filled && React.createElement(BDToggle, { label: "Filled", value: bdDesign.patternFilled, onChange: function(v) { bdUpdateDesign("patternFilled", v); } }));
                })()),
              bdActivePanel === "icon" && React.createElement(React.Fragment, null,
                React.createElement(BDOptionGrid, { options: BD_ICONS.map(function(ic) { return { id: ic.id, label: ic.label }; }), value: bdDisplayDesign.icon, onChange: function(v) { bdUpdateDesign("icon", v); }, columns: 4 }),
                bdDisplayDesign.icon !== "none" && React.createElement(React.Fragment, null,
                  React.createElement(BDColorPicker, { value: bdDisplayDesign.iconColor, onChange: function(v) { bdUpdateDesign("iconColor", v); }, label: "Color" }),
                  React.createElement(BDSlider, { label: shipMixedLbl("opacity", "Opacity"), value: bdDisplayDesign.iconOpacity, onChange: function(v) { bdUpdateDesign("iconOpacity", v); }, min: 0.1, max: 1, step: 0.05, displayValue: Math.round(bdDisplayDesign.iconOpacity * 100) + "%" }),
                  React.createElement(BDSlider, { label: shipMixedLbl("rot", "Rotation"), value: bdDisplayDesign.iconRotation || 0, onChange: function(v) { bdUpdateDesign("iconRotation", v); }, min: 0, max: 360, step: 5, displayValue: (bdDisplayDesign.iconRotation || 0) + "°" }),
                  React.createElement(BDToggle, { label: "Icon Glow", value: bdDisplayDesign.iconGlow, onChange: function(v) { bdUpdateDesign("iconGlow", v); } }),
                  bdDisplayDesign.iconGlow && React.createElement(React.Fragment, null,
                    React.createElement(BDColorPicker, { value: bdDisplayDesign.iconGlowColor, onChange: function(v) { bdUpdateDesign("iconGlowColor", v); }, label: shipMixedLbl("glowColor", "Glow Color") }),
                    React.createElement(BDSlider, { label: "Glow Spread", value: bdDisplayDesign.iconGlowIntensity, onChange: function(v) { bdUpdateDesign("iconGlowIntensity", v); }, min: 1, max: 12, step: 0.5 }))))))),
        bdShowBackWarn && renderBackWarnOverlay(
          function() { setBdShowBackWarn(false); },
          function() { bdSaveCurrentDesign(); setBdShowBackWarn(false); setBdCurrentView("list"); },
          function() { setBdShowBackWarn(false); setBdCurrentView("list"); }))),

    screen === "vfx" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", background: WS.brushed, backgroundBlendMode: "overlay" } },
      WsRivet({ bottom: 5, left: 5 }), WsRivet({ bottom: 5, right: 5 }),

      // ── VFX EFFECTS LIST ──
      vfxCurrentView === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: function() { if (setsSelMode) { setSetsSelMode(null); setScreen("sets"); setSetsView("editor"); } else { setScreen("splash"); } }, backLabel: setsSelMode ? "Set" : "Workshop", title: "VFX Studio", color: "#ffb43c",
          rightContent: !setsSelMode && React.createElement("div", { style: { display: "flex", gap: 4 } },
            React.createElement("div", { onClick: function() { setVfxShowImport(true); setVfxImportText(""); setVfxImportError(""); }, style: BTN_TOPBAR_PURPLE }, "Import"),
            vfxSaved.length > 0 && React.createElement("div", { onClick: vfxExportAllDesigns, style: Object.assign({}, BTN_TOPBAR, { color: "rgba(255,180,60,0.7)", fontSize: 8 }) }, "Exp All"),
            React.createElement("div", { onClick: function() { vfxOpenEditor(null); }, style: Object.assign({}, BTN_TOPBAR_ACCENT, { border: "2px solid rgba(255,180,60,0.4)", color: "#ffb43c" }) }, "+ New")) }),
        renderSetsSelBar("vfx", vfxSaved.map(function(d) { return d.id; })),
        // Tabs
        React.createElement("div", { style: { display: "flex", margin: "8px 10px 0", borderBottom: "1px solid rgba(60,60,80,0.3)", position: "relative", zIndex: 1 } },
          [["custom", "My Effects (" + vfxSaved.length + ")"], ["factory", "Defaults"], ["active", "Active"]].map(function(tab) {
            var tabActive = vfxSavedTab === tab[0];
            return React.createElement("div", { key: tab[0], onClick: function() { setVfxSavedTab(tab[0]); }, style: { flex: 1, textAlign: "center", padding: "10px 0 8px", color: tabActive ? "#ffb43c" : "rgba(180,200,220,0.3)", fontSize: 11, fontWeight: tabActive ? 700 : 600, cursor: "pointer", borderBottom: tabActive ? "2px solid #ffb43c" : "2px solid transparent" } }, tab[1]);
          })),
        vfxSavedTab === "custom" && !setsSelMode && vfxSaved.length > 1 && renderSortBar(vfxSortMode, setVfxSortMode, [["effect", "Effect"]]),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px", position: "relative", zIndex: 1 } },
          vfxSavedTab === "custom" && vfxSaved.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 14, marginBottom: 8 } }, "No saved effects yet"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Create a new effect or copy a Default to start.")),
          vfxSavedTab === "custom" && (function() { var _vfxs = sortItems(vfxSaved, vfxSortMode, "modifiedAt"); var _vfxi = []; var _vfxlt = null; for (var _vfxk = 0; _vfxk < _vfxs.length; _vfxk++) { var saved = _vfxs[_vfxk]; if (vfxSortMode === "effect") { var _vfxei = vfxTypeInfo(saved.effectType); var _vfxet = _vfxei ? _vfxei.label : "Other"; if (_vfxet !== _vfxlt) { _vfxlt = _vfxet; _vfxi.push(renderTypeHeader(_vfxet, "#ffb43c")); } }
            var etInfo = vfxTypeInfo(saved.effectType);
            var _dateRaw = saved.modifiedAt || saved.createdAt || saved.savedAt;
            var dateStr = _dateRaw ? new Date(_dateRaw).toLocaleDateString() : "";
            var isAct = vfxActiveMap[saved.effectType] === saved.id;
            var _vfxSel = setsSelMode && setsSelMode.selectedIds.indexOf(saved.id) !== -1;
            _vfxi.push(React.createElement("div", { key: saved.id, style: Object.assign({}, CARD_STYLE, setsSelMode ? { display: "flex", alignItems: "flex-start", gap: 8 } : {}) },
              setsSelMode && React.createElement("div", { onClick: function() { setsToggleSel(saved, "effectType"); }, style: { width: 20, height: 20, borderRadius: 4, border: _vfxSel ? "1.5px solid #ffd060" : "1.5px solid rgba(255,208,96,0.3)", background: _vfxSel ? "#ffd060" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 } },
                _vfxSel && React.createElement("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "#1a1400", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M5 12l5 5L20 7" }))),
              React.createElement("div", { style: { flex: 1 } },
                vfxRenamingId === saved.id ? React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8, alignItems: "center" } },
                  React.createElement("input", { value: vfxRenamingName, onChange: function(e) { setVfxRenamingName(e.target.value); }, style: { flex: 1, padding: "4px 8px", borderRadius: 4, background: SCRN, border: SCRNB, color: "#b0c8d8", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none" } }),
                  React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: function() { vfxRenameDesign(saved.id, vfxRenamingName); }, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
                  React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: function() { setVfxRenamingId(null); }, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(220,60,80,0.18)", border: "1px solid rgba(220,60,80,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M6 6L18 18 M18 6L6 18", fill: "none", stroke: "#ff8088", strokeWidth: "2.5", strokeLinecap: "round" }))))
                : React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 8, alignItems: "center" } },
                  renderVfxIcon(saved),
                  React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5 } },
                      React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, saved.name || "Unnamed"),
                      !setsSelMode && React.createElement("div", { onClick: function() { setVfxRenamingId(saved.id); setVfxRenamingName(saved.name || ""); }, style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", color: "rgba(180,200,220,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 } }, WsIconPencil(11))),
                    React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, etInfo.label + (dateStr ? " · " + dateStr : ""))),
                  !setsSelMode && React.createElement("div", { onClick: function() { vfxToggleActive(saved); }, style: isAct ? BTN_ISACTIVE : BTN_SETACTIVE }, isAct ? "★ Active" : "Set Active")),
                !setsSelMode && React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
                  React.createElement("div", { onClick: function() { vfxOpenEditor(saved); }, style: BTN_EDIT }, WsIconPencil(), "EDIT"),
                  React.createElement("div", { onClick: function() { vfxCopyPreset(saved); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"),
                  React.createElement("div", { onClick: function() { vfxExportDesign(saved); }, style: BTN_EXPORT }, WsIconShare(), "SHARE"),
                  React.createElement("div", { style: { flex: 1 } }),
                  React.createElement("div", { onClick: function() {
                    var _inSets = setsDesignInSets(saved.id);
                    if (_inSets.length > 0) { setSetsDeleteWarn({ setNames: _inSets, onConfirm: function() { setVfxDeletingId(saved.id); setSetsDeleteWarn(null); } }); }
                    else { setVfxDeletingId(saved.id); }
                  }, style: BTN_DELETE_ICON }, WsIconTrash())))));
          } return _vfxi; }()),
          vfxSavedTab === "factory" && VFX_FACTORY_PRESETS.map(function(preset) {
            return React.createElement("div", { key: preset.id, style: Object.assign({}, CARD_STYLE, { display: "flex", alignItems: "center", gap: 10 }) },
              renderVfxIcon(preset),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, preset.name),
                React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, vfxTypeInfo(preset.effectType).label + " · built-in")),
              React.createElement("div", { onClick: function() { vfxCopyPreset(preset); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"));
          }),
          vfxSavedTab === "active" && VFX_EFFECT_TYPES.map(function(et) {
            var activeId = vfxActiveMap[et.id], customActive = null;
            if (activeId) { for (var ci = 0; ci < vfxSaved.length; ci++) { if (vfxSaved[ci].id === activeId && vfxSaved[ci].effectType === et.id) { customActive = vfxSaved[ci]; break; } } }
            var shown = customActive || vfxFactoryFor(et.id);
            return React.createElement("div", { key: et.id, style: Object.assign({}, CARD_STYLE, { display: "flex", alignItems: "center", gap: 10 }) },
              shown && renderVfxIcon(shown),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, et.label),
                React.createElement("div", { style: { color: customActive ? "rgba(255,200,120,0.7)" : "rgba(180,200,220,0.3)", fontSize: 10 } }, customActive ? (customActive.name || "Unnamed") : "Default")),
              customActive && React.createElement("div", { onClick: function() { vfxOpenEditor(customActive); }, style: BTN_EDIT }, WsIconPencil(), "Edit"),
              customActive && React.createElement("div", { onClick: function() { vfxToggleActive(customActive); }, style: BTN_RENAME }, WsIconReset(), "Use Default"),
              customActive && vfxFactoryFor(et.id) && React.createElement("div", { style: { width: 22, height: 22, overflow: "hidden", borderRadius: 4, flexShrink: 0 } }, React.createElement("div", { style: { transform: "scale(0.5)", transformOrigin: "top left", width: 44, height: 44 } }, renderVfxIcon(vfxFactoryFor(et.id)))),
              !customActive && shown && React.createElement("div", { onClick: function() { vfxCopyPreset(shown); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"));
          })),
        vfxDeletingId && renderDeleteOverlay("Delete Effect?", function() { setVfxDeletingId(null); }, function() { vfxDeleteDesign(vfxDeletingId); }),
        vfxExportId && renderExportOverlay("Export Effect", vfxExportText, vfxCopied, function() { copyToClipboard(vfxExportText, setVfxCopied); }, function() { setVfxExportId(null); }),
        vfxShowImport && renderImportOverlay("Import Effect", vfxImportText, setVfxImportText, vfxImportError, setVfxImportError, vfxHandleImport, function() { setVfxShowImport(false); setVfxImportText(""); setVfxImportError(""); }),
        vfxShowExportAll && renderExportOverlay("Export All Effects (" + vfxSaved.length + ")", vfxExportAllText, vfxCopied, function() { copyToClipboard(vfxExportAllText, setVfxCopied); }, function() { setVfxShowExportAll(false); }),
        renderSetsDeleteWarnOverlay()),

      // ── VFX EFFECT EDITOR ──
      vfxCurrentView === "editor" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: vfxHandleBack, backLabel: "VFX Studio", title: "VFX Studio", color: "#ffb43c",
          rightContent: React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "center" } },
            React.createElement("div", { onClick: vfxUndo, title: "Undo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 8px", opacity: vfxCanUndo ? 1 : 0.35, cursor: vfxCanUndo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M9 14L4 9l5-5" }),
                React.createElement("path", { d: "M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-3" }))),
            React.createElement("div", { onClick: vfxRedo, title: "Redo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 8px", opacity: vfxCanRedo ? 1 : 0.35, cursor: vfxCanRedo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M15 14l5-5-5-5" }),
                React.createElement("path", { d: "M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h3" }))),
            React.createElement("div", { onClick: vfxSaveCurrentDesign, style: BTN_SAVE }, "Save"),
            React.createElement("div", { onClick: function() {
              if (!vfxEditId || vfxDirty) { setVfxSaveStatus("Save the effect first"); setTimeout(function() { setVfxSaveStatus(""); }, 2500); return; }
              vfxToggleActive({ id: vfxEditId, effectType: vfxEditDesign.effectType });
            }, style: Object.assign({}, BTN_TOPBAR, { color: vfxIsActive ? "#80dd90" : "rgba(200,210,220,0.7)", border: vfxIsActive ? "2px solid rgba(80,200,100,0.5)" : PNLB }) }, vfxIsActive ? "★ Active" : "Set Active")) }),
        vfxSaveStatus && React.createElement("div", { style: { padding: "6px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#80dd90", background: "rgba(80,200,100,0.1)", zIndex: 2, position: "relative" } }, vfxSaveStatus),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "12px 14px 60px" } },
          React.createElement("div", { style: { marginBottom: 12 } },
            React.createElement("div", { style: { fontSize: 10, color: "#445", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 } }, "Name"),
            React.createElement("input", { value: vfxEditDesign.name, onChange: function(e) { vfxUpdateDesign("name", e.target.value); }, placeholder: "Unnamed Effect", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e0e0e0", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none", boxSizing: "border-box" } })),
          React.createElement("div", { style: { fontSize: 10, color: "#445", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 } }, "Effect"),
          React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 } },
            VFX_EFFECT_TYPES.map(function(et) {
              var sel = vfxEditDesign.effectType === et.id;
              return React.createElement("div", { key: et.id, onClick: function() { vfxPickEffectType(et.id); }, style: { padding: "7px 14px", borderRadius: 16, background: sel ? "rgba(255,255,255,0.1)" : "transparent", border: sel ? "1px solid " + et.color + "88" : "1px solid rgba(255,255,255,0.08)", color: sel ? et.color : "rgba(180,200,220,0.45)", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3 } }, et.label);
            })),
          !vfxEditDesign.effectType && React.createElement("div", { style: { textAlign: "center", padding: "48px 20px", color: "rgba(180,200,220,0.35)" } },
            React.createElement("div", { style: { fontSize: 14, fontWeight: 600, marginBottom: 6 } }, "Pick an effect to work on"),
            React.createElement("div", { style: { fontSize: 12, color: "rgba(180,200,220,0.25)" } }, "Choose one of the effect types above to start designing.")),
          vfxEditDesign.effectType && React.createElement(React.Fragment, null,
            renderVfxPreview(vfxEditDesign, vfxPrevKey),
            vfxEditDesign.effectType === "acid_ooze" && React.createElement(React.Fragment, null,
              React.createElement(BDColorPicker, { label: "Body Color", value: vfxEditDesign.color1, onChange: function(v) { vfxUpdateDesign("color1", v); } }),
              React.createElement(BDColorPicker, { label: "Highlight Color", value: vfxEditDesign.color2, onChange: function(v) { vfxUpdateDesign("color2", v); } }),
              React.createElement(BDSlider, { label: shipMixedLbl("w", "Width"), value: vfxEditDesign.width, onChange: function(v) { vfxUpdateDesign("width", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.width || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Waves", value: vfxEditDesign.waveSize, onChange: function(v) { vfxUpdateDesign("waveSize", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.waveSize || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Frequency", value: vfxEditDesign.freq, onChange: function(v) { vfxUpdateDesign("freq", v); }, min: 2, max: 12, step: 1, displayValue: String(Math.round(vfxEditDesign.freq == null ? 5 : vfxEditDesign.freq)) }),
              React.createElement(BDSlider, { label: "Speed of Flow", value: vfxEditDesign.speed, onChange: function(v) { vfxUpdateDesign("speed", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.speed || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Splash", value: vfxEditDesign.splash, onChange: function(v) { vfxUpdateDesign("splash", v); }, min: 0, max: 2, step: 0.1, displayValue: (vfxEditDesign.splash == null ? 1 : vfxEditDesign.splash).toFixed(1) + "x" })),
            vfxEditDesign.effectType === "burn" && React.createElement(React.Fragment, null,
              renderColorWithOpacity("Ember Color", "emberColor", "Ember Opacity", "emberOpacity", 1),
              renderColorWithOpacity("Spark Color", "sparkColor", "Spark Opacity", "sparkOpacity", 0.85),
              React.createElement(BDSlider, { label: "Speed", value: vfxEditDesign.speed, onChange: function(v) { vfxUpdateDesign("speed", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.speed || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Spread", value: vfxEditDesign.spread, onChange: function(v) { vfxUpdateDesign("spread", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.spread || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Density", value: vfxEditDesign.density, onChange: function(v) { vfxUpdateDesign("density", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.density || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Ember Size", value: vfxEditDesign.emberSize, onChange: function(v) { vfxUpdateDesign("emberSize", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.emberSize || 1).toFixed(1) + "x" })),
            vfxEditDesign.effectType === "block_destroy" && React.createElement(React.Fragment, null,
              renderColorWithOpacity("Burst Color", "burstColor", "Burst Opacity", "burstOpacity", 1),
              renderColorWithOpacity("Accent Color", "accentColor", "Accent Opacity", "accentOpacity", 1),
              React.createElement(BDSlider, { label: "Speed", value: vfxEditDesign.speed, onChange: function(v) { vfxUpdateDesign("speed", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.speed || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Spread", value: vfxEditDesign.spread, onChange: function(v) { vfxUpdateDesign("spread", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.spread || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Count", value: vfxEditDesign.count, onChange: function(v) { vfxUpdateDesign("count", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.count || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Particle Size", value: vfxEditDesign.particleSize, onChange: function(v) { vfxUpdateDesign("particleSize", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.particleSize || 1).toFixed(1) + "x" })),
            vfxEditDesign.effectType === "drone_explode" && React.createElement(React.Fragment, null,
              renderColorWithOpacity("Core Color", "coreColor", "Core Opacity", "coreOpacity", 1),
              renderColorWithOpacity("Blast Color", "blastColor", "Blast Opacity", "blastOpacity", 1),
              React.createElement(BDSlider, { label: "Speed", value: vfxEditDesign.speed, onChange: function(v) { vfxUpdateDesign("speed", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.speed || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Spread", value: vfxEditDesign.spread, onChange: function(v) { vfxUpdateDesign("spread", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.spread || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Count", value: vfxEditDesign.count, onChange: function(v) { vfxUpdateDesign("count", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.count || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Particle Size", value: vfxEditDesign.particleSize, onChange: function(v) { vfxUpdateDesign("particleSize", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.particleSize || 1).toFixed(1) + "x" })),
            vfxEditDesign.effectType === "lightning" && React.createElement(React.Fragment, null,
              React.createElement(BDColorPicker, { label: "Core Color", value: vfxEditDesign.coreColor, onChange: function(v) { vfxUpdateDesign("coreColor", v); } }),
              React.createElement(BDColorPicker, { label: "Bolt Color", value: vfxEditDesign.boltColor, onChange: function(v) { vfxUpdateDesign("boltColor", v); } }),
              React.createElement(BDColorPicker, { label: "Glow Color", value: vfxEditDesign.glowColor, onChange: function(v) { vfxUpdateDesign("glowColor", v); } }),
              React.createElement(BDSlider, { label: "Thickness", value: vfxEditDesign.thickness, onChange: function(v) { vfxUpdateDesign("thickness", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.thickness || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Jaggedness", value: vfxEditDesign.jaggedness, onChange: function(v) { vfxUpdateDesign("jaggedness", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.jaggedness || 1).toFixed(1) + "x" }),
              React.createElement(BDSlider, { label: "Flash Speed", value: vfxEditDesign.speed, onChange: function(v) { vfxUpdateDesign("speed", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.speed || 1).toFixed(1) + "x" })),
            React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 8, justifyContent: "center" } },
              React.createElement("div", { onClick: vfxResetDesign, style: Object.assign({}, BTN_RENAME, { padding: "8px 18px", fontSize: 11 }) }, "Reset to Default")))),
        vfxShowBackWarn && renderBackWarnOverlay(
          function() { setVfxShowBackWarn(false); },
          function() { vfxSaveCurrentDesign(); setVfxShowBackWarn(false); setVfxCurrentView("list"); },
          function() { setVfxShowBackWarn(false); setVfxCurrentView("list"); }))),

    // ═══ UFO CUSTOMIZER ═══
    screen === "ufo" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", background: WS.brushed, backgroundBlendMode: "overlay" } },
      WsRivet({ bottom: 5, left: 5 }), WsRivet({ bottom: 5, right: 5 }),

      // ── LIST VIEW ──
      ufoView === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, {
          onBack: function() { if (setsSelMode) { setSetsSelMode(null); setScreen("sets"); setSetsView("editor"); } else { setScreen("splash"); setUfoView("list"); } }, backLabel: setsSelMode ? "Set" : "Workshop", title: "UFO Customizer", color: "#64dcb4",
          rightContent: !setsSelMode && React.createElement("div", { style: { display: "flex", gap: 4 } },
            React.createElement("div", { onClick: function() { setUfoShowImport(true); setUfoImportText(""); setUfoImportError(""); }, style: BTN_TOPBAR_PURPLE }, "Import"),
            React.createElement("div", { onClick: ufoOpenNew, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #1a3a30, #0f2a22)", boxShadow: "0 0 8px rgba(100,220,180,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, "+ New"))
        }),
        renderSetsSelBar("ufo", ufoSaved.map(function(d) { return d.id; })),
        !setsSelMode && ufoSaved.length > 1 && renderSortBar(ufoSortMode, setUfoSortMode),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px" } },
          ufoSaved.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 14, marginBottom: 8 } }, "No saved UFO designs"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Tap + New to design your first UFO.")),
          sortItems(ufoSaved, ufoSortMode, "savedAt").map(function(design) {
            var isActive = design.id === ufoActiveId;
            var _ufoSel = setsSelMode && setsSelMode.selectedIds.indexOf(design.id) !== -1;
            var _ufoDateStr = design.savedAt ? new Date(design.savedAt).toLocaleDateString() : "";
            return React.createElement("div", { key: design.id, style: Object.assign({}, CARD_STYLE, _ufoSel ? { borderColor: "rgba(255,208,96,0.4)", background: "rgba(255,208,96,0.05)" } : {}) },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: setsSelMode ? 0 : 10 } },
                setsSelMode && React.createElement("div", { onClick: function() {
                  var _newIds = _ufoSel ? [] : [design.id];
                  setSetsSelMode(Object.assign({}, setsSelMode, { selectedIds: _newIds }));
                }, style: { width: 20, height: 20, borderRadius: 4, border: _ufoSel ? "1.5px solid #ffd060" : "1.5px solid rgba(255,208,96,0.3)", background: _ufoSel ? "#ffd060" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 } },
                  _ufoSel && React.createElement("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "#1a1400", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M5 12l5 5L20 7" }))),
                React.createElement("div", { style: { width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 } },
                  React.createElement(UFOBlockSvg, { size: 56, design: design, uid: design.id })),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  ufoRenamingId === design.id
                    ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                        React.createElement("input", { value: ufoRenameValue, autoFocus: true, onChange: function(e) { setUfoRenameValue(e.target.value); }, onKeyDown: function(e) { if (e.key === "Enter") ufoCommitRename(); else if (e.key === "Escape") ufoCancelRename(); }, style: { flex: 1, minWidth: 0, padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(100,220,180,0.5)", color: "#b0c8d8", fontSize: 16, fontWeight: 700, fontFamily: "'Quicksand',sans-serif", outline: "none", boxSizing: "border-box" } }),
                        React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: ufoCommitRename, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
                        React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: ufoCancelRename, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(220,60,80,0.18)", border: "1px solid rgba(220,60,80,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M6 6L18 18 M18 6L6 18", fill: "none", stroke: "#ff8088", strokeWidth: "2.5", strokeLinecap: "round" }))))
                    : React.createElement(React.Fragment, null,
                        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 } },
                          React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, design.name || "Untitled"),
                          !setsSelMode && React.createElement("div", { onClick: function(e) { e.stopPropagation(); setUfoRenamingId(design.id); setUfoRenameValue(design.name || ""); }, title: "Rename UFO", style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", color: "rgba(180,200,220,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 } }, WsIconPencil(11))),
                        _ufoDateStr && React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, _ufoDateStr))),
                !setsSelMode && ufoRenamingId !== design.id && React.createElement("div", { onClick: function() { ufoSetActive(design.id); }, style: isActive ? BTN_ISACTIVE : BTN_SETACTIVE }, isActive ? "★ Active" : "Set Active")),
              !setsSelMode && ufoRenamingId !== design.id && React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
                React.createElement("div", { onClick: function() { ufoOpenEditor(design); }, style: BTN_EDIT }, WsIconPencil(), "EDIT"),
                React.createElement("div", { onClick: function() { ufoEditDirtyRef.current = false; setUfoEditId(null); setUfoEditDesign(Object.assign({}, design, { name: (design.name || "My UFO") + " (copy)" })); setUfoView("editor"); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"),
                React.createElement("div", { onClick: function() { ufoExportDesign(design); }, style: BTN_EXPORT }, WsIconShare(), "SHARE"),
                React.createElement("div", { style: { flex: 1 } }),
                React.createElement("div", { onClick: function() {
                  var _inSets = setsDesignInSets(design.id);
                  if (_inSets.length > 0) { setSetsDeleteWarn({ setNames: _inSets, onConfirm: function() { setUfoDeletingId(design.id); setSetsDeleteWarn(null); } }); }
                  else { setUfoDeletingId(design.id); }
                }, style: BTN_DELETE_ICON }, WsIconTrash())));
          })),
        ufoDeletingId && renderDeleteOverlay("Delete UFO Design?", function() { setUfoDeletingId(null); }, function() { ufoDeleteDesign(ufoDeletingId); }),
        ufoExportId && renderExportOverlay("Export UFO Design", ufoExportText, ufoCopied, function() { copyToClipboard(ufoExportText, setUfoCopied); }, function() { setUfoExportId(null); }),
        ufoShowImport && renderImportOverlay("Import UFO Design", ufoImportText, setUfoImportText, ufoImportError, setUfoImportError, ufoHandleImport, function() { setUfoShowImport(false); setUfoImportText(""); setUfoImportError(""); }, getUfoImportPreview),
        renderSetsDeleteWarnOverlay()),

      // ── EDITOR VIEW ──
      ufoView === "editor" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, {
          onBack: function() {
            if (ufoEditDirtyRef.current) { setUfoShowBackWarn(true); } else { setUfoView("list"); }
          },
          backLabel: "My UFOs", title: ufoEditId ? "Edit UFO" : "New UFO", color: "#64dcb4",
          rightContent: React.createElement("div", { style: { display: "flex", gap: 6 } },
            React.createElement("div", { onClick: ufoUndo, title: "Undo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 8px", opacity: ufoCanUndo ? 1 : 0.35, cursor: ufoCanUndo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M9 14L4 9l5-5" }),
                React.createElement("path", { d: "M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-3" }))),
            React.createElement("div", { onClick: ufoRedo, title: "Redo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 8px", opacity: ufoCanRedo ? 1 : 0.35, cursor: ufoCanRedo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M15 14l5-5-5-5" }),
                React.createElement("path", { d: "M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h3" }))),
            ufoEditId && React.createElement("div", { onClick: function() { ufoEditId === ufoActiveId ? ufoSetActive(null) : ufoSetActive(ufoEditId); }, style: Object.assign({}, BTN_TOPBAR, { color: ufoEditId === ufoActiveId ? "#80dd90" : "rgba(200,210,220,0.7)", border: ufoEditId === ufoActiveId ? "2px solid rgba(80,200,100,0.5)" : PNLB }) }, ufoEditId === ufoActiveId ? "★ Active" : "Set Active"),
            React.createElement("div", { onClick: ufoSaveCurrent, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #1a3a30, #0f2a22)", boxShadow: "0 0 8px rgba(100,220,180,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, ufoSaveStatus || "Save"))
        }),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "0 16px 32px" } },
          // Live preview
          React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0 24px" } },
            React.createElement(UFOBlockSvg, { size: 140, design: ufoEditDesign, uid: "edit" })),
          // Name field
          React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", marginBottom: 10 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 11, marginBottom: 6, letterSpacing: 0.5 } }, "NAME"),
            React.createElement("input", { value: ufoEditDesign.name || "", onChange: function(e) { ufoUpdateEdit("name", e.target.value); },
              placeholder: "My UFO", style: { width: "100%", padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#b0c8d8", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none", boxSizing: "border-box" } })),
          // Controls
          React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 16px 8px" } },
            React.createElement(BDColorPicker, { label: "Hull Color", value: ufoEditDesign.hullColor,
              presets: ["#b86020", "#804020", "#207040", "#204080", "#602080", "#808080", "#a0a060", "#a03020"],
              onChange: function(v) { ufoUpdateEdit("hullColor", v); } }),
            React.createElement(BDColorPicker, { label: "Dome Color", value: ufoEditDesign.domeColor,
              presets: ["#44ffee", "#88ddff", "#ffcc44", "#ff88dd", "#aaffaa", "#ff8844", "#cc88ff", "#ffffff"],
              onChange: function(v) { ufoUpdateEdit("domeColor", v); } }),
            React.createElement(BDColorPicker, { label: "Light Color", value: ufoEditDesign.lightColor,
              presets: ["#4488ff", "#ff4488", "#44ff88", "#ffaa44", "#aa44ff", "#44ddff", "#ffff44", "#ff6644"],
              onChange: function(v) { ufoUpdateEdit("lightColor", v); } }),
            React.createElement(BDSlider, { label: "Light Speed", value: ufoEditDesign.lightSpeed,
              min: 2, max: 16, step: 0.5, displayValue: ufoEditDesign.lightSpeed + "s",
              onChange: function(v) { ufoUpdateEdit("lightSpeed", v); } }),
            React.createElement(BDSlider, { label: "Particle Count", value: ufoEditDesign.particleCount || 3,
              min: 2, max: 10, step: 1, displayValue: String(Math.round(ufoEditDesign.particleCount || 3)),
              onChange: function(v) { ufoUpdateEdit("particleCount", Math.round(v)); } }),
            React.createElement(BDSlider, { label: "Particle Size", value: ufoEditDesign.particleSize || 1.0,
              min: 0.3, max: 2.5, step: 0.1, displayValue: (ufoEditDesign.particleSize || 1.0).toFixed(1) + "x",
              onChange: function(v) { ufoUpdateEdit("particleSize", v); } }),
            React.createElement(BDSlider, { label: shipMixedLbl("glowIntensity", "Glow Intensity"), value: ufoEditDesign.glowOpacity || 0,
              min: 0, max: 1, step: 0.05, displayValue: (Math.round((ufoEditDesign.glowOpacity || 0) * 100) || 0) + "%",
              onChange: function(v) { ufoUpdateEdit("glowOpacity", v); } }),
            React.createElement(BDToggle, { label: "Alien Inside", value: !!ufoEditDesign.showAlien,
              onChange: function(v) { ufoUpdateEdit("showAlien", v); } })),
          // Reset button
          React.createElement("div", { style: { display: "flex", justifyContent: "center", marginTop: 20 } },
            React.createElement("div", {
              onClick: function() { ufoEditDirtyRef.current = true; setUfoEditDesign(Object.assign({}, UFO_DEFAULT_DESIGN, { name: ufoEditDesign.name || "" })); },
              style: { padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", color: "rgba(180,200,220,0.5)", fontSize: 11, fontFamily: "'Exo 2', sans-serif", cursor: "pointer", letterSpacing: 0.5 }
            }, "Reset to Defaults"))),
        ufoShowBackWarn && renderBackWarnOverlay(
          function() { setUfoShowBackWarn(false); },
          function() { ufoSaveCurrent(); setUfoShowBackWarn(false); setUfoView("list"); ufoEditDirtyRef.current = false; },
          function() { setUfoShowBackWarn(false); setUfoView("list"); ufoEditDirtyRef.current = false; })))
,

    // ═══ HANGAR ═══
    screen === "hangar" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", background: WS.brushed, backgroundBlendMode: "overlay" } },
      WsRivet({ bottom: 5, left: 5 }), WsRivet({ bottom: 5, right: 5 }),

      // ── LIST VIEW ──
      shipView === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, {
          onBack: function() { if (setsSelMode) { setSetsSelMode(null); setScreen("sets"); setSetsView("editor"); } else { setScreen("splash"); } }, backLabel: setsSelMode ? "Set" : "Workshop", title: "Hangar", color: "#ff8aaa",
          rightContent: !setsSelMode && React.createElement("div", { style: { display: "flex", gap: 4 } },
            React.createElement("div", { onClick: function() { setShipShowImport(true); setShipImportText(""); setShipImportError(""); }, style: BTN_TOPBAR_PURPLE }, "Import"),
            React.createElement("div", { onClick: shipOpenNew, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #3a1030, #280820)", boxShadow: "0 0 8px rgba(255,138,170,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, "+ New"))
        }),
        renderSetsSelBar("ship", shipSaved.map(function(d) { return d.id; })),
        !setsSelMode && shipSaved.length > 1 && renderSortBar(shipSortMode, setShipSortMode, [["hull", "Hull"]]),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px" } },
          shipSaved.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 14, marginBottom: 8 } }, "No saved ship designs"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Tap + New to design your first ship.")),
          (function() { var _shps = sortItems(shipSaved, shipSortMode, "savedAt"); var _shpi = []; var _shplt = null; for (var _shpk = 0; _shpk < _shps.length; _shpk++) { var design = _shps[_shpk]; if (shipSortMode === "hull") { var _shpt = SHIP_HULL_LABELS[design.hull] || design.hull || "Custom"; if (_shpt !== _shplt) { _shplt = _shpt; _shpi.push(renderTypeHeader(_shpt, "#ff8aaa")); } }
            var isActive = design.id === shipActiveId;
            var _shipSel = setsSelMode && setsSelMode.selectedIds.indexOf(design.id) !== -1;
            var _shipDateStr = design.savedAt ? new Date(design.savedAt).toLocaleDateString() : "";
            _shpi.push(React.createElement("div", { key: design.id, style: Object.assign({}, CARD_STYLE, _shipSel ? { borderColor: "rgba(255,208,96,0.4)", background: "rgba(255,208,96,0.05)" } : {}) },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: setsSelMode ? 0 : 10 } },
                setsSelMode && React.createElement("div", { onClick: function() {
                  var _newIds = _shipSel ? [] : [design.id];
                  setSetsSelMode(Object.assign({}, setsSelMode, { selectedIds: _newIds }));
                }, style: { width: 20, height: 20, borderRadius: 4, border: _shipSel ? "1.5px solid #ffd060" : "1.5px solid rgba(255,208,96,0.3)", background: _shipSel ? "#ffd060" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 } },
                  _shipSel && React.createElement("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "#1a1400", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M5 12l5 5L20 7" }))),
                React.createElement("div", { style: { width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 } },
                  React.createElement(ShipDesignSvg, { size: 56, design: design, uid: design.id })),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  shipRenamingId === design.id
                    ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 3 } },
                        React.createElement("input", {
                          value: shipRenameValue,
                          autoFocus: true,
                          onChange: function(e) { setShipRenameValue(e.target.value); },
                          onKeyDown: function(e) { if (e.key === "Enter") shipCommitRename(); else if (e.key === "Escape") shipCancelRename(); },
                          style: { flex: 1, minWidth: 0, padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,138,170,0.5)", color: "#b0c8d8", fontSize: 16, fontWeight: 700, fontFamily: "'Quicksand',sans-serif", outline: "none", boxSizing: "border-box" }
                        }),
                        React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: shipCommitRename,
                          title: "Save name",
                          style: { padding: "4px 8px", borderRadius: 4, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" } },
                          React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" },
                            React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
                        React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: shipCancelRename,
                          title: "Cancel rename",
                          style: { padding: "4px 8px", borderRadius: 4, background: "rgba(220,60,80,0.18)", border: "1px solid rgba(220,60,80,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" } },
                          React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" },
                            React.createElement("path", { d: "M6 6L18 18 M18 6L6 18", fill: "none", stroke: "#ff8088", strokeWidth: "2.5", strokeLinecap: "round" }))))
                    : React.createElement(React.Fragment, null,
                        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 } },
                          React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, design.name || "Untitled"),
                          React.createElement("div", { onClick: function() { shipStartRename(design); },
                            title: "Rename ship",
                            style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", color: "rgba(180,200,220,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", flex: "0 0 auto" } },
                            WsIconPencil(11))),
                        _shipDateStr && React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, _shipDateStr))),
                !setsSelMode && React.createElement("div", { onClick: function() { shipSetActive(design.id); }, style: isActive ? BTN_ISACTIVE : BTN_SETACTIVE }, isActive ? "★ Active" : "Set Active")),
              !setsSelMode && React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
                React.createElement("div", { onClick: function() { shipOpenEditor(design); }, style: BTN_EDIT }, WsIconPencil(), "EDIT"),
                React.createElement("div", { onClick: function() { shipDirtyRef.current = false; setShipEditId(null); setShipEdit(Object.assign({}, design, { name: (design.name || "My Ship") + " (copy)" })); setShipTab("list"); setShipView("editor"); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"),
                React.createElement("div", { onClick: function() { shipExportDesign(design); }, style: BTN_EXPORT }, WsIconShare(), "SHARE"),
                React.createElement("div", { style: { flex: 1 } }),
                React.createElement("div", { onClick: function() {
                  var _inSets = setsDesignInSets(design.id);
                  if (_inSets.length > 0) { setSetsDeleteWarn({ setNames: _inSets, onConfirm: function() { setShipDeletingId(design.id); setSetsDeleteWarn(null); } }); }
                  else { setShipDeletingId(design.id); }
                }, style: BTN_DELETE_ICON }, WsIconTrash()))));
          } return _shpi; }())),
        shipDeletingId && renderDeleteOverlay("Delete Ship Design?", function() { setShipDeletingId(null); }, function() { shipDeleteDesign(shipDeletingId); }),
        shipExportId && renderExportOverlay("Export Ship Design", shipExportText, shipCopied, function() { copyToClipboard(shipExportText, setShipCopied); }, function() { setShipExportId(null); }),
        shipShowImport && renderImportOverlay("Import Ship Design", shipImportText, setShipImportText, shipImportError, setShipImportError, shipHandleImport, function() { setShipShowImport(false); setShipImportText(""); setShipImportError(""); }, getShipImportPreview),
        renderSetsDeleteWarnOverlay()),

      // ── EDITOR VIEW ──
      shipView === "editor" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, {
          onBack: function() {
            if (shipDirtyRef.current) { setShipShowBackWarn(true); } else { setShipView("list"); }
          },
          backLabel: "My Ships", title: shipEditId ? "Edit Ship" : "New Ship", color: "#ff8aaa",
          rightContent: React.createElement("div", { style: { display: "flex", gap: 6 } },
            React.createElement("div", { onClick: shipUndo, title: "Undo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 8px", opacity: shipCanUndo ? 1 : 0.35, cursor: shipCanUndo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M9 14L4 9l5-5" }),
                React.createElement("path", { d: "M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-3" }))),
            React.createElement("div", { onClick: shipRedo, title: "Redo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 8px", opacity: shipCanRedo ? 1 : 0.35, cursor: shipCanRedo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M15 14l5-5-5-5" }),
                React.createElement("path", { d: "M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h3" }))),
            React.createElement("div", { onClick: function() {
              if (!shipEditId || shipDirtyRef.current) { setShipSaveStatus("Save the ship first"); setTimeout(function() { setShipSaveStatus(""); }, 2500); return; }
              shipEditId === shipActiveId ? shipSetActive(null) : shipSetActive(shipEditId);
            }, style: Object.assign({}, BTN_TOPBAR, { color: shipEditId === shipActiveId ? "#80dd90" : "rgba(200,210,220,0.7)", border: shipEditId === shipActiveId ? "2px solid rgba(80,200,100,0.5)" : PNLB }) }, shipEditId === shipActiveId ? "★ Active" : "Set Active"),
            React.createElement("div", { onClick: shipSaveCurrent, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #3a1030, #280820)", boxShadow: "0 0 8px rgba(255,138,170,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, shipSaveStatus || "Save"))
        }),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "0 16px 32px" } },
          // Name panel sits above the sticky preview so it scrolls away
          // once the user gets into editing — same shape as other modules.
          React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", marginBottom: 10 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 10, marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" } }, "Name"),
            React.createElement("input", { value: shipEdit.name || "", onChange: function(e) { shipUpdateEdit("name", e.target.value); },
              placeholder: "My Ship", style: { width: "100%", padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#b0c8d8", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none", boxSizing: "border-box" } })),
          // Sticky preview: pinned to the top of the scroll container so the
          // ship stays visible while editing controls farther down.
          React.createElement("div", { ref: shipPreviewStickyRef, style: { position: "sticky", top: 0, zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0 2px", margin: "0 -16px", background: "rgba(14,18,28,0.92)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" } },
            React.createElement("div", { style: { position: "relative", display: "inline-block" } },
              React.createElement("div", {
                style: { width: shipPreviewSize, height: shipPreviewSize, padding: 4, borderRadius: 12, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,138,170,0.15)", touchAction: "none", cursor: "crosshair" },
                onPointerDown: shipPreviewPointerDown,
                onPointerMove: shipPreviewPointerMove,
                onPointerUp:   shipPreviewPointerUp,
                onPointerCancel: shipPreviewPointerUp
              },
                React.createElement(ShipDesignSvg, { size: shipPreviewSize - 8, design: shipEdit, uid: "edit", selectedIndices: shipGetSelected(), style: shipEdit.glowEnabled ? { filter: "drop-shadow(0 0 " + (shipEdit.glowIntensity || 10) + "px " + (shipEdit.glowColor || "#ff88aa") + ")" } : {} })),
              React.createElement("div", {
                onPointerDown: shipResizePointerDown,
                onPointerMove: shipResizePointerMove,
                onPointerUp: shipResizePointerUp,
                onPointerCancel: shipResizePointerUp,
                title: shipPreviewFull ? "Tap to reset size" : "Drag to resize · Tap for full width",
                style: { position: "absolute", bottom: -1, right: -1, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: "rgba(14,18,28,0.85)", border: "1px solid rgba(255,138,170,0.5)", cursor: "nwse-resize", touchAction: "none", zIndex: 20 }
              },
                React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 12 12", style: { display: "block" } },
                  React.createElement("line", { x1: "2", y1: "10", x2: "10", y2: "2", stroke: "#ff8aaa", strokeWidth: "1.5", strokeLinecap: "round" }),
                  React.createElement("line", { x1: "6", y1: "10", x2: "10", y2: "6", stroke: "#ff8aaa", strokeWidth: "1.5", strokeLinecap: "round" }),
                  React.createElement("line", { x1: "10", y1: "10", x2: "10", y2: "10", stroke: "#ff8aaa", strokeWidth: "2.5", strokeLinecap: "round" })))),
            // ── Selection Bar: persistent toolbar for everything about the
            // current selection. Always visible in the sticky band so the
            // multi-select toggle is reachable from any tab. ──
            (function() {
              var selCount = shipGetSelected().length;
              return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "6px 8px", marginTop: 8, marginLeft: 14, marginRight: 14, background: "rgba(255,138,170,0.05)", border: "1px solid rgba(255,138,170,0.18)", borderRadius: 8, width: "calc(100% - 28px)", boxSizing: "border-box" } },
                // Title for the bar
                React.createElement("div", { style: { color: "rgba(180,200,220,0.55)", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "Select"),
                // Multi label + inline toggle. The inline toggle is sized to
                // match the chip heights so everything in the bar shares a
                // common vertical centerline.
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5 } },
                  React.createElement("div", { style: { color: "rgba(180,200,220,0.6)", fontSize: 9, letterSpacing: 0.4, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "Multi"),
                  React.createElement("button", { onClick: function() { setShipMultiSelectOn(!shipMultiSelectOn); },
                    title: shipMultiSelectOn ? "Turn off multi-select" : "Turn on multi-select (canvas taps add)",
                    style: { width: 32, height: 18, borderRadius: 9, border: "none", background: shipMultiSelectOn ? "#ff8aaa" : "rgba(255,255,255,0.18)", position: "relative", cursor: "pointer", transition: "background 0.18s", padding: 0, flex: "0 0 auto", WebkitTapHighlightColor: "transparent" } },
                    React.createElement("div", { style: { width: 14, height: 14, borderRadius: 7, background: "#fff", position: "absolute", top: 2, left: shipMultiSelectOn ? 16 : 2, transition: "left 0.18s", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" } }))),
                shipMultiSelectOn && React.createElement("div", { onClick: shipSelectAll, title: "Select all parts",
                  style: { padding: "3px 8px", borderRadius: 5, cursor: "pointer", background: "rgba(255,138,170,0.10)", border: "1px solid rgba(255,138,170,0.35)", color: "#ff8aaa", fontSize: 9, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "All"),
                selCount > 0 && React.createElement("div", { onClick: shipClearSelection, title: "Clear selection",
                  style: { padding: "3px 8px", borderRadius: 5, cursor: "pointer", background: "rgba(180,180,180,0.06)", border: "1px solid rgba(180,180,180,0.28)", color: "rgba(200,210,220,0.75)", fontSize: 9, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, "Clear"),
                // Single Group/Ungroup chip: when the selection contains any
                // grouped part it ungroups; otherwise (with 2+ selected) it
                // creates a group. Hidden when neither action applies.
                (function() {
                  var grouped = shipSelectionHasGroup();
                  if (!grouped && selCount < 2) return null;
                  return React.createElement("div", { onClick: grouped ? shipUngroupSelected : shipGroupSelected,
                    title: grouped ? "Ungroup" : "Group selected parts",
                    style: { padding: "3px 8px", borderRadius: 5, cursor: "pointer", background: grouped ? "rgba(180,180,180,0.06)" : "rgba(200,184,255,0.10)", border: grouped ? "1px solid rgba(180,180,180,0.28)" : "1px solid rgba(200,184,255,0.38)", color: grouped ? "rgba(200,210,220,0.75)" : "#c8b8ff", fontSize: 9, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, grouped ? "Ungroup" : "Group");
                })(),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } }),
                selCount > 0 && React.createElement("div", { onClick: shipDuplicateSelected, title: selCount > 1 ? ("Duplicate " + selCount + " parts") : "Duplicate",
                  style: { width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, cursor: "pointer", background: "rgba(128,221,255,0.10)", border: "1px solid rgba(128,221,255,0.38)" } },
                  shipCopySvg(12, "#80ddff")),
                selCount > 0 && React.createElement("div", { onClick: shipDeleteSelected, title: selCount > 1 ? ("Delete " + selCount + " parts") : "Delete",
                  style: { width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, cursor: "pointer", background: "rgba(220,60,80,0.10)", border: "1px solid rgba(220,60,80,0.38)" } },
                  shipTrashSvg(12, "#ff8088")));
            })(),
            // Tab bar + tongue: the active tab loses its bottom border /
            // bottom corner radius, then a 6px pink "tongue" below the
            // active tab's column visually drips into the content area.
            (function() {
              var tabs = [
                { id: "templates", label: "Models",
                  icon: React.createElement("svg", { width: 14, height: 10, viewBox: "0 0 24 18", fill: "currentColor" },
                    React.createElement("polygon", { points: "12,1 22,14 17,12 12,18 7,12 2,14" })) },
                { id: "add", label: "+ Part",
                  icon: React.createElement("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" },
                    React.createElement("line", { x1: 12, y1: 4, x2: 12, y2: 20 }),
                    React.createElement("line", { x1: 4, y1: 12, x2: 20, y2: 12 })) },
                { id: "color", label: "Color",
                  icon: React.createElement("svg", { width: 14, height: 10, viewBox: "0 0 28 20" },
                    React.createElement("circle", { cx: 8, cy: 10, r: 7, fill: "#ff7070", opacity: 0.85 }),
                    React.createElement("circle", { cx: 14, cy: 4, r: 7, fill: "#70aaff", opacity: 0.85 }),
                    React.createElement("circle", { cx: 20, cy: 10, r: 7, fill: "#70dd88", opacity: 0.85 })) },
                { id: "position", label: "Arrange",
                  icon: React.createElement("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                    React.createElement("path", { d: "M12 2l-3 4h6zM12 22l3-4H9zM2 12l4 3V9zM22 12l-4-3v6z" }),
                    React.createElement("circle", { cx: 12, cy: 12, r: 2, fill: "currentColor" })) },
                { id: "list", label: "List",
                  icon: React.createElement("svg", { width: 14, height: 10, viewBox: "0 0 22 14", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" },
                    React.createElement("line", { x1: 1, y1: 2, x2: 21, y2: 2 }),
                    React.createElement("line", { x1: 1, y1: 7, x2: 21, y2: 7 }),
                    React.createElement("line", { x1: 1, y1: 12, x2: 21, y2: 12 })) }
              ];
              return React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: "flex", gap: 3, padding: "8px 14px 0", marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.09)", width: "100%", boxSizing: "border-box" } },
                  tabs.map(function(t) {
                    var on = shipTab === t.id;
                    return React.createElement("div", { key: t.id, onClick: function() { setShipTab(t.id); },
                      style: { flex: 1, padding: "5px 4px 6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: on ? 0 : 8, borderBottomRightRadius: on ? 0 : 8, cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase", background: on ? "rgba(255,138,170,0.2)" : "rgba(255,255,255,0.04)", border: on ? "1px solid rgba(255,138,170,0.5)" : "1px solid rgba(255,255,255,0.08)", borderBottom: on ? "none" : "1px solid rgba(255,255,255,0.08)", color: on ? "#ff8aaa" : "rgba(180,200,220,0.55)" } },
                      t.icon, t.label);
                  })),
                React.createElement("div", { style: { display: "flex", gap: 3, padding: "0 14px", width: "100%", boxSizing: "border-box", height: 6 } },
                  tabs.map(function(t) {
                    var on = shipTab === t.id;
                    return React.createElement("div", { key: "tongue_" + t.id, style: { flex: 1, background: on ? "rgba(255,138,170,0.2)" : "transparent", borderLeft: on ? "1px solid rgba(255,138,170,0.5)" : "1px solid transparent", borderRight: on ? "1px solid rgba(255,138,170,0.5)" : "1px solid transparent" } });
                  })));
            })()),
          // ── TEMPLATES: preset hull thumbnails ──
          shipTab === "templates" && React.createElement(React.Fragment, null,
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 } },
              SHIP_HULLS.map(function(h) {
                var isSelected = (shipEdit.hull || "arrow") === h;
                var presetDesign = { parts: HULL_PRESETS[h] || [] };
                return React.createElement("div", { key: h, onClick: function() { shipOnHullTileTap(h); }, style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 6px", borderRadius: 8, cursor: "pointer", background: isSelected ? "rgba(255,138,170,0.12)" : "rgba(255,255,255,0.03)", border: isSelected ? "2px solid #ff8aaa" : "1px solid rgba(255,255,255,0.08)" } },
                  React.createElement(ShipDesignSvg, { size: 44, design: presetDesign }),
                  React.createElement("div", { style: { color: isSelected ? "#ff8aaa" : "rgba(180,200,220,0.5)", fontSize: 9, fontWeight: 700, letterSpacing: 0.5, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, SHIP_HULL_LABELS[h]));
              })),
            React.createElement("div", { onClick: function() { setShipResetConfirm(true); },
              style: { marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 14px", borderRadius: 8, cursor: "pointer", background: WS.brushed, backgroundBlendMode: "overlay", border: "1px solid rgba(255,100,80,0.3)", boxShadow: WS.ps } },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none" },
                React.createElement("path", { d: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", stroke: "rgba(255,120,100,0.75)", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })),
              React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "rgba(255,120,100,0.75)", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Exo 2', sans-serif" } }, "Reset — Clear All Parts"))),
          // ── ADD: per-shape add buttons ──
          shipTab === "add" && React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 12px" } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 11, marginBottom: 8, letterSpacing: 0.5 } }, "ADD PART"),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 } },
              SHIP_PART_TYPES.map(function(pt) {
                return React.createElement("div", { key: pt, onClick: function() { shipAddPart(pt); setShipTab("color"); },
                  style: { padding: "12px 6px", textAlign: "center", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase", background: "rgba(255,138,170,0.08)", border: "1px solid rgba(255,138,170,0.25)", color: "#ff8aaa", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } },
                  shipPartIcon(pt),
                  React.createElement("span", null, SHIP_PART_LABELS[pt]));
              }))),
          // ── COLOR: fill (color, opacity) + border for the selected part ──
          shipTab === "color" && (function() {
            var partsList = Array.isArray(shipEdit.parts) ? shipEdit.parts : [];
            var sel = (shipSelectedPart >= 0 && shipSelectedPart < partsList.length) ? partsList[shipSelectedPart] : null;
            // Ship-level glow lives at the top of the Color tab, always
            // visible regardless of which part is selected. It applies to
            // the whole rendered ship.
            var shipGlowPanel = React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,138,170,0.18)", borderRadius: 12, padding: "12px 16px", marginBottom: 10 } },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                React.createElement("div", { style: { color: "rgba(180,200,220,0.55)", fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", fontFamily: "'Exo 2', sans-serif", fontWeight: 700 } }, "Ship Glow"),
                React.createElement(BDToggle, { value: shipEdit.glowEnabled || false, onChange: function(v) { shipUpdateEdit("glowEnabled", v); } })),
              shipEdit.glowEnabled && React.createElement(React.Fragment, null,
                React.createElement(BDColorPicker, { label: "Glow Color", value: shipEdit.glowColor || "#ff88aa",
                  presets: ["#ff88aa", "#80ddff", "#ffd060", "#80ff80", "#cc70ff", "#ffffff", "#ff6040", "#40c8ff"],
                  onChange: function(v) { shipUpdateEdit("glowColor", v); } }),
                React.createElement(BDSlider, { label: "Glow Intensity", value: shipEdit.glowIntensity || 10, min: 2, max: 30, step: 1,
                  displayValue: (shipEdit.glowIntensity || 10) + "px",
                  onChange: function(v) { shipUpdateEdit("glowIntensity", v); } })));
            if (!sel) return React.createElement(React.Fragment, null, shipGlowPanel, renderShipSelectMessage());
            var fillMode = sel.fillMode || "solid";
            var fillModes = [
              { id: "solid",  label: "Solid" },
              { id: "linear", label: "Linear" },
              { id: "radial", label: "Radial" }
            ];
            return React.createElement(React.Fragment, null,
              shipGlowPanel,
              React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,138,170,0.25)", borderRadius: 12, padding: "12px 16px 8px" } },
              renderShipSelectedHeader(sel),
              React.createElement(BDSlider, { label: shipMixedLbl("opacity", "Opacity"), value: sel.opacity, min: 0, max: 1, step: 0.05, displayValue: Math.round((sel.opacity || 0) * 100) + "%",
                onChange: function(v) { shipUpdateSelected("opacity", v); } }),
              // Fill mode selector + gradient controls (color2, angle for linear).
              React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 10, marginTop: 12, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" } }, shipMixedLbl("fillMode", "Fill Mode")),
              React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 10 } },
                fillModes.map(function(m) {
                  var on = fillMode === m.id;
                  return React.createElement("div", { key: m.id, onClick: function() { shipUpdateSelected("fillMode", m.id); },
                    style: { flex: 1, padding: "7px 6px", textAlign: "center", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase", background: on ? "rgba(255,138,170,0.2)" : "rgba(255,255,255,0.04)", border: on ? "1px solid rgba(255,138,170,0.5)" : "1px solid rgba(255,255,255,0.1)", color: on ? "#ff8aaa" : "rgba(180,200,220,0.6)" } }, m.label);
                })),
              fillMode !== "radial" && React.createElement(BDColorPicker, { label: shipMixedLbl("color", fillMode === "solid" ? "Color" : "Color 1"), value: sel.color,
                presets: ["#80ddff", "#ffd060", "#ff8aaa", "#80ff80", "#cc70cc", "#a0a8b8", "#ffffff", "#222a3a"],
                onChange: function(v) { shipUpdateSelected("color", v); } }),
              fillMode !== "solid" && React.createElement(BDColorPicker, { label: shipMixedLbl("color2", fillMode === "radial" ? "Outer Color" : "Color 2"), value: sel.color2 || sel.color,
                presets: ["#80ddff", "#ffd060", "#ff8aaa", "#80ff80", "#cc70cc", "#a0a8b8", "#ffffff", "#222a3a"],
                onChange: function(v) { shipUpdateSelected("color2", v); } }),
              fillMode === "linear" && React.createElement(BDSlider, { label: shipMixedLbl("gradAngle", "Gradient Angle"), value: sel.gradAngle || 0, min: 0, max: 360, step: 15, displayValue: (sel.gradAngle || 0) + "°",
                onChange: function(v) { shipUpdateSelected("gradAngle", v); } }),
              fillMode === "radial" && React.createElement(BDColorPicker, { label: shipMixedLbl("color", "Center Color"), value: sel.color,
                presets: ["#80ddff", "#ffd060", "#ff8aaa", "#80ff80", "#cc70cc", "#a0a8b8", "#ffffff", "#222a3a"],
                onChange: function(v) { shipUpdateSelected("color", v); } }),
              fillMode === "radial" && React.createElement(BDSlider, { label: shipMixedLbl("gradStop", "Center Size"), value: sel.gradStop || 0, min: 0, max: 0.95, step: 0.05, displayValue: Math.round((sel.gradStop || 0) * 100) + "%",
                onChange: function(v) { shipUpdateSelected("gradStop", v); } }),
              React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 10, marginTop: 12, marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" } }, "Border"),
              React.createElement(BDColorPicker, { label: shipMixedLbl("bc", "Border Color"), value: sel.bc || "#000000",
                presets: ["#000000", "#222a3a", "#ffffff", "#80ddff", "#ffd060", "#ff8aaa", "#80ff80", "#cc70cc"],
                onChange: function(v) { shipUpdateSelected("bc", v); } }),
              React.createElement(BDSlider, { label: shipMixedLbl("bw", "Border Width"), value: sel.bw || 0, min: 0, max: 4, step: 0.1, displayValue: (sel.bw || 0).toFixed(1),
                onChange: function(v) { shipUpdateSelected("bw", v); } }),
              React.createElement(BDSlider, { label: shipMixedLbl("bo", "Border Opacity"), value: typeof sel.bo === "number" ? sel.bo : 1, min: 0, max: 1, step: 0.05, displayValue: Math.round((typeof sel.bo === "number" ? sel.bo : 1) * 100) + "%",
                onChange: function(v) { shipUpdateSelected("bo", v); } }),
              // ── Glow: per-part halo via CSS drop-shadow filter ──
              React.createElement("div", { style: { marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" } },
                React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" } }, shipMixedLbl("glowEnabled", "Glow")),
                React.createElement(BDToggle, { value: sel.glowEnabled || false, onChange: function(v) { shipUpdateSelected("glowEnabled", v); } })),
              sel.glowEnabled && React.createElement(React.Fragment, null,
                React.createElement(BDColorPicker, { label: shipMixedLbl("glowColor", "Glow Color"), value: sel.glowColor || "#80ddff",
                  presets: ["#80ddff", "#ffd060", "#ff8aaa", "#80ff80", "#cc70ff", "#ffffff", "#ff6040", "#40c8ff"],
                  onChange: function(v) { shipUpdateSelected("glowColor", v); } }),
                React.createElement(BDSlider, { label: shipMixedLbl("glowIntensity", "Glow Intensity"), value: sel.glowIntensity || 4, min: 1, max: 20, step: 0.5, displayValue: (sel.glowIntensity || 4) + "px",
                  onChange: function(v) { shipUpdateSelected("glowIntensity", v); } }))));
          })(),
          // ── POSITION: geometry for the selected part ──
          shipTab === "position" && (function() {
            var partsList = Array.isArray(shipEdit.parts) ? shipEdit.parts : [];
            var sel = (shipSelectedPart >= 0 && shipSelectedPart < partsList.length) ? partsList[shipSelectedPart] : null;
            if (!sel) return renderShipSelectMessage();
            var selCount = shipGetSelected().length;
            var multi = selCount >= 2;
            var selGroupId = multi ? shipAreSelectedSameGroup() : null;
            var selGroupBBox = selGroupId ? shipGroupVisualBBox(shipGetSelected()) : null;
            // Alignment buttons are SVG glyphs: a thick bar showing the
            // reference edge/axis plus two rectangles snapped against it.
            var alignBtns = [
              { mode: "left",    label: "Left",  svg: React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24" }, React.createElement("rect", { x: 1, y: 2, width: 2, height: 20, fill: "#ff8aaa" }), React.createElement("rect", { x: 5, y: 5, width: 12, height: 4, rx: 1, fill: "rgba(255,138,170,0.55)" }), React.createElement("rect", { x: 5, y: 15, width: 8, height: 4, rx: 1, fill: "rgba(255,138,170,0.55)" })) },
              { mode: "hcenter", label: "H-Cen", svg: React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24" }, React.createElement("rect", { x: 11, y: 2, width: 2, height: 20, fill: "#ff8aaa" }), React.createElement("rect", { x: 6, y: 5, width: 12, height: 4, rx: 1, fill: "rgba(255,138,170,0.55)" }), React.createElement("rect", { x: 8, y: 15, width: 8, height: 4, rx: 1, fill: "rgba(255,138,170,0.55)" })) },
              { mode: "right",   label: "Right", svg: React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24" }, React.createElement("rect", { x: 21, y: 2, width: 2, height: 20, fill: "#ff8aaa" }), React.createElement("rect", { x: 7, y: 5, width: 12, height: 4, rx: 1, fill: "rgba(255,138,170,0.55)" }), React.createElement("rect", { x: 11, y: 15, width: 8, height: 4, rx: 1, fill: "rgba(255,138,170,0.55)" })) },
              { mode: "top",     label: "Top",   svg: React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24" }, React.createElement("rect", { x: 2, y: 1, width: 20, height: 2, fill: "#ff8aaa" }), React.createElement("rect", { x: 5, y: 5, width: 4, height: 12, rx: 1, fill: "rgba(255,138,170,0.55)" }), React.createElement("rect", { x: 15, y: 5, width: 4, height: 8, rx: 1, fill: "rgba(255,138,170,0.55)" })) },
              { mode: "vcenter", label: "V-Cen", svg: React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24" }, React.createElement("rect", { x: 2, y: 11, width: 20, height: 2, fill: "#ff8aaa" }), React.createElement("rect", { x: 5, y: 6, width: 4, height: 12, rx: 1, fill: "rgba(255,138,170,0.55)" }), React.createElement("rect", { x: 15, y: 8, width: 4, height: 8, rx: 1, fill: "rgba(255,138,170,0.55)" })) },
              { mode: "bottom",  label: "Bot",   svg: React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24" }, React.createElement("rect", { x: 2, y: 21, width: 20, height: 2, fill: "#ff8aaa" }), React.createElement("rect", { x: 5, y: 7, width: 4, height: 12, rx: 1, fill: "rgba(255,138,170,0.55)" }), React.createElement("rect", { x: 15, y: 11, width: 4, height: 8, rx: 1, fill: "rgba(255,138,170,0.55)" })) }
            ];
            var alignPanel = multi && React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,138,170,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 8 } },
              React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 } }, "Align " + selCount + " parts"),
              React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 } },
                alignBtns.map(function(b) {
                  return React.createElement("div", { key: b.mode, onClick: function() { shipAlignSelected(b.mode); },
                    title: "Align " + b.label,
                    style: { padding: "6px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, borderRadius: 6, cursor: "pointer", background: "rgba(255,138,170,0.08)", border: "1px solid rgba(255,138,170,0.35)" } },
                    b.svg,
                    React.createElement("div", { style: { color: "#ff8aaa", fontSize: 9, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, b.label));
                })));
            var flipBtns = [
              { fn: function() { shipFlipSelected("h"); },   label: "Flip H",   title: "Flip selection horizontally (about its center)",
                svg: React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24" },
                  React.createElement("rect", { x: 11, y: 2, width: 2, height: 20, fill: "#8fd4ff" }),
                  React.createElement("path", { d: "M3 7 L9 12 L3 17 Z", fill: "rgba(143,212,255,0.55)" }),
                  React.createElement("path", { d: "M21 7 L15 12 L21 17 Z", fill: "rgba(143,212,255,0.55)" })) },
              { fn: function() { shipFlipSelected("v"); },   label: "Flip V",   title: "Flip selection vertically (about its center)",
                svg: React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24" },
                  React.createElement("rect", { x: 2, y: 11, width: 20, height: 2, fill: "#8fd4ff" }),
                  React.createElement("path", { d: "M7 3 L12 9 L17 3 Z", fill: "rgba(143,212,255,0.55)" }),
                  React.createElement("path", { d: "M7 21 L12 15 L17 21 Z", fill: "rgba(143,212,255,0.55)" })) },
              { fn: function() { shipMirrorSelected("h"); }, label: "Mir H",   title: "Mirror selection horizontally about canvas center",
                svg: React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24" },
                  React.createElement("rect", { x: 11, y: 2, width: 2, height: 20, fill: "rgba(143,212,255,0.4)", strokeDasharray: "3 2" }),
                  React.createElement("circle", { cx: 12, cy: 12, r: 1.5, fill: "#8fd4ff" }),
                  React.createElement("path", { d: "M3 7 L8 12 L3 17 Z", fill: "rgba(143,212,255,0.55)" }),
                  React.createElement("path", { d: "M21 7 L16 12 L21 17 Z", fill: "rgba(143,212,255,0.25)", stroke: "rgba(143,212,255,0.55)", strokeWidth: "1" })) },
              { fn: function() { shipMirrorSelected("v"); }, label: "Mir V",   title: "Mirror selection vertically about canvas center",
                svg: React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24" },
                  React.createElement("rect", { x: 2, y: 11, width: 20, height: 2, fill: "rgba(143,212,255,0.4)" }),
                  React.createElement("circle", { cx: 12, cy: 12, r: 1.5, fill: "#8fd4ff" }),
                  React.createElement("path", { d: "M7 3 L12 8 L17 3 Z", fill: "rgba(143,212,255,0.55)" }),
                  React.createElement("path", { d: "M7 21 L12 16 L17 21 Z", fill: "rgba(143,212,255,0.25)", stroke: "rgba(143,212,255,0.55)", strokeWidth: "1" })) }
            ];
            var flipPanel = React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(143,212,255,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 8 } },
              React.createElement("div", { style: { color: "rgba(143,212,255,0.5)", fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 } }, "Flip / Mirror"),
              React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 } },
                flipBtns.map(function(b) {
                  return React.createElement("div", { key: b.label, onClick: b.fn, title: b.title,
                    style: { padding: "6px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, borderRadius: 6, cursor: "pointer", background: "rgba(143,212,255,0.08)", border: "1px solid rgba(143,212,255,0.3)" } },
                    b.svg,
                    React.createElement("div", { style: { color: "#8fd4ff", fontSize: 9, fontWeight: 700, letterSpacing: 0.3, fontFamily: "'Exo 2', sans-serif", textTransform: "uppercase" } }, b.label));
                })));
            return React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,138,170,0.25)", borderRadius: 12, padding: "12px 16px 8px" } },
              renderShipSelectedHeader(sel),
              alignPanel,
              flipPanel,
              // Hide per-part Position X/Y while multi-selected — slamming all
              // selected parts to a single x or y would collapse them on top
              // of each other. For grouped selections show bbox-center sliders instead.
              (!multi || selGroupBBox) && React.createElement(BDSlider, { label: selGroupBBox ? "Position X (Group)" : "Position X", value: selGroupBBox ? selGroupBBox.cx : sel.x, min: 0, max: 40, step: 0.5, displayValue: (selGroupBBox ? selGroupBBox.cx : sel.x).toFixed(1),
                onChange: function(v) { if (selGroupBBox) { shipMoveGroupSelected("x", v); } else { shipUpdateSelected("x", v); } } }),
              (!multi || selGroupBBox) && React.createElement(BDSlider, { label: selGroupBBox ? "Position Y (Group)" : "Position Y", value: selGroupBBox ? selGroupBBox.cy : sel.y, min: 0, max: 40, step: 0.5, displayValue: (selGroupBBox ? selGroupBBox.cy : sel.y).toFixed(1),
                onChange: function(v) { if (selGroupBBox) { shipMoveGroupSelected("y", v); } else { shipUpdateSelected("y", v); } } }),
              React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 36px", gap: 8, alignItems: "stretch" } },
                React.createElement("div", null,
                  React.createElement(BDSlider, { label: selGroupBBox ? "Width (Group)" : shipMixedLbl("w", sel && sel.type === "line" ? "Length" : "Width"), value: selGroupBBox ? selGroupBBox.w : sel.w, min: 1, max: selGroupBBox ? 60 : 30, step: 0.5, displayValue: (selGroupBBox ? selGroupBBox.w : sel.w).toFixed(1),
                    onChange: function(v) { shipUpdatePartSizeSelected("w", v); } }),
                  React.createElement(BDSlider, { label: selGroupBBox ? "Height (Group)" : shipMixedLbl("h", sel && sel.type === "line" ? "Thickness" : "Height"), value: selGroupBBox ? selGroupBBox.h : sel.h, min: 0.5, max: selGroupBBox ? 60 : 30, step: 0.5, displayValue: (selGroupBBox ? selGroupBBox.h : sel.h).toFixed(1),
                    onChange: function(v) { shipUpdatePartSizeSelected("h", v); } })),
                React.createElement("div", {
                  onClick: function() { setShipWhLocked(!shipWhLocked); },
                  title: shipWhLocked ? "Width/Height locked" : "Lock width/height ratio",
                  style: { display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, cursor: "pointer",
                    background: shipWhLocked ? "rgba(255,138,170,0.15)" : "rgba(255,255,255,0.04)",
                    border: shipWhLocked ? "1px solid rgba(255,138,170,0.5)" : "1px solid rgba(255,255,255,0.1)" } },
                  shipLockSvg(18, shipWhLocked))),
              sel.type === "rect" && React.createElement(BDSlider, { label: selGroupId ? "Corner Radius" : shipMixedLbl("cr", "Corner Radius"), value: sel.cr || 0, min: 0, max: Math.min(sel.w, sel.h) / 2, step: 0.25, displayValue: (sel.cr || 0).toFixed(2),
                onChange: function(v) { shipUpdateSelected("cr", v); } }),
              sel.type === "trapezoid" && React.createElement(BDSlider, { label: selGroupId ? "Top Width" : shipMixedLbl("tw", "Top Width"), value: typeof sel.tw === "number" ? sel.tw : sel.w / 2, min: 0, max: sel.w * 1.5, step: 0.25, displayValue: (typeof sel.tw === "number" ? sel.tw : sel.w / 2).toFixed(2),
                onChange: function(v) { shipUpdateSelected("tw", v); } }),
              sel.type === "trapezoid" && React.createElement(BDSlider, { label: selGroupId ? "Top Offset" : shipMixedLbl("tofs", "Top Offset"), value: sel.tofs || 0, min: -sel.w / 2, max: sel.w / 2, step: 0.25, displayValue: (sel.tofs || 0).toFixed(2),
                onChange: function(v) { shipUpdateSelected("tofs", v); } }),
              React.createElement(BDSlider, { label: selGroupId ? "Rotation" : shipMixedLbl("rot", "Rotation"), value: sel.rot || 0, min: 0, max: 360, step: 5, displayValue: (sel.rot || 0) + "°",
                onChange: function(v) { if (selGroupId) { shipRotateGroupSelected(v, sel.rot || 0); } else { shipUpdateSelected("rot", v); } } }),
              !selGroupId && partsList.length > 1 && React.createElement(BDSlider, { label: "Z (layer)", value: shipSelectedPart, min: 0, max: partsList.length - 1, step: 1, displayValue: shipSelectedPart + " / " + (partsList.length - 1),
                onChange: function(v) { shipReorderPart(shipSelectedPart, Math.round(v)); } }));
          })(),
          // ── LIST: parts list ──
          shipTab === "list" && (function() {
            var partsList = Array.isArray(shipEdit.parts) ? shipEdit.parts : [];
            // ── Shared part-row renderer (standalone or inside a group) ──────
            function renderPartRow(idx, inGroup) {
              var p = partsList[idx]; if (!p) return null;
              var isPrimary = idx === shipSelectedPart;
              var isSel = shipIsSelected(idx);
              var displayName = p.name || SHIP_PART_LABELS[p.type];
              var isRenaming = shipPartRenamingIdx === idx;
              var hiddenVal = p.hidden || 0;
              var swatchBg = p.color || "#80ddff";
              if (p.color2 && p.fillMode === "linear") { swatchBg = "linear-gradient(90deg," + p.color + "," + p.color2 + ")"; }
              if (p.color2 && p.fillMode === "radial") { swatchBg = "radial-gradient(circle," + p.color + "," + p.color2 + ")"; }
              return React.createElement("div", Object.assign({ key: "pr-" + idx,
                onClick: function() { setShipSelectedPart(idx); setShipSelectedExtras([]); },
                style: { display: "flex", alignItems: "center", gap: 4,
                  padding: "6px 6px", paddingLeft: inGroup ? 18 : 6,
                  borderRadius: 6, cursor: "pointer",
                  background: isSel ? "rgba(255,138,170,0.12)" : "rgba(255,255,255,0.02)",
                  border: isPrimary ? "1px solid rgba(255,138,170,0.6)" : (isSel ? "1px solid rgba(255,138,170,0.3)" : "1px solid rgba(255,255,255,0.05)") } },
                { "data-shippart-row": "1", "data-shippart-actual-idx": String(idx), "data-shippart-gid": p.groupId || "" }),
                React.createElement("div", { onClick: function(e) { e.stopPropagation(); shipCyclePartVisibility(idx); },
                  title: hiddenVal === 1 ? "Hidden — click for ghost" : hiddenVal === 2 ? "Ghost — click to show" : "Visible — click to hide",
                  style: { width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto" } },
                  shipEyeSvg(12, hiddenVal)),
                React.createElement("div", { onClick: function(e) { e.stopPropagation(); shipToggleSelected(idx); },
                  title: isSel ? "Remove from selection" : "Add to selection",
                  style: { width: 16, height: 16, borderRadius: 3,
                    border: isSel ? "1.5px solid #ff8aaa" : "1.5px solid rgba(180,200,220,0.35)",
                    background: isSel ? "#ff8aaa" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flex: "0 0 auto" } },
                  isSel && React.createElement("svg", { width: 10, height: 10, viewBox: "0 0 24 24", fill: "none", stroke: "#1a0820", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" },
                    React.createElement("path", { d: "M5 12l5 5L20 7" }))),
                React.createElement("div", { style: { width: 18, height: 14, borderRadius: 3, background: swatchBg, border: "1px solid rgba(255,255,255,0.2)", flex: "0 0 auto" } }),
                isRenaming
                  ? React.createElement("input", { autoFocus: true, value: shipPartRenameVal,
                      onChange: function(e) { setShipPartRenameVal(e.target.value); },
                      onBlur: function() { shipUpdatePart(idx, "name", shipPartRenameVal.trim() || null); setShipPartRenamingIdx(null); },
                      onKeyDown: function(e) {
                        if (e.key === "Enter") { shipUpdatePart(idx, "name", shipPartRenameVal.trim() || null); setShipPartRenamingIdx(null); }
                        if (e.key === "Escape") { setShipPartRenamingIdx(null); }
                      },
                      onClick: function(e) { e.stopPropagation(); },
                      style: { flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,138,170,0.5)", borderRadius: 4, color: "#ff8aaa", padding: "2px 6px", outline: "none", boxSizing: "border-box", fontFamily: "'Exo 2', sans-serif", fontSize: 16 } })
                  : React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: 3, minWidth: 0 } },
                      React.createElement("div", { style: { flex: "0 1 auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isSel ? "#ff8aaa" : "rgba(200,210,220,0.7)", fontSize: 11, fontWeight: 600, fontFamily: "'Exo 2', sans-serif", letterSpacing: 0.4, minWidth: 0 } }, displayName),
                      React.createElement("div", { onClick: function(e) { e.stopPropagation(); setShipPartRenamingIdx(idx); setShipPartRenameVal(p.name || ""); },
                        title: "Rename part",
                        style: { flexShrink: 0, cursor: "pointer", color: "rgba(180,200,220,0.35)", display: "flex", alignItems: "center", padding: "2px" } },
                        WsIconPencil(10)),
                      React.createElement("div", { style: { flexShrink: 0, color: "rgba(140,160,180,0.5)", fontSize: 10, fontFamily: "'Exo 2', sans-serif", whiteSpace: "nowrap" } },
                        "(" + p.x.toFixed(0) + "," + p.y.toFixed(0) + ")"),
                      React.createElement("div", { style: { flex: 1 } })),
                React.createElement("div", { onClick: function(e) { e.stopPropagation(); shipDuplicatePart(idx); },
                  title: "Duplicate part",
                  style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", background: "rgba(128,221,255,0.1)", border: "1px solid rgba(128,221,255,0.3)", flex: "0 0 auto" } },
                  shipCopySvg(12, "#80ddff")),
                React.createElement("div", { onClick: function(e) { e.stopPropagation(); shipDeletePart(idx); },
                  title: "Delete part",
                  style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", background: "rgba(220,60,80,0.12)", border: "1px solid rgba(220,60,80,0.3)", flex: "0 0 auto" } },
                  shipTrashSvg(12, "#ff8088")),
                React.createElement("div", { style: { flex: "0 0 48px" } }),
                React.createElement("div", {
                  onPointerDown: function(e) { shipDragHandleStart(idx, e); },
                  onPointerMove: shipDragHandleMove,
                  onPointerUp: shipDragHandleEnd, onPointerCancel: shipDragHandleEnd,
                  title: "Drag to reorder",
                  style: { width: 16, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", touchAction: "none", flex: "0 0 auto", color: "rgba(180,200,220,0.5)" } },
                  React.createElement("svg", { width: "10", height: "16", viewBox: "0 0 10 16", fill: "currentColor" },
                    React.createElement("circle", { cx: 2.5, cy: 3,  r: 1.3 }), React.createElement("circle", { cx: 7.5, cy: 3,  r: 1.3 }),
                    React.createElement("circle", { cx: 2.5, cy: 8,  r: 1.3 }), React.createElement("circle", { cx: 7.5, cy: 8,  r: 1.3 }),
                    React.createElement("circle", { cx: 2.5, cy: 13, r: 1.3 }), React.createElement("circle", { cx: 7.5, cy: 13, r: 1.3 }))));
            }
            // ── Build displayItems (one entry per logical row, groups pre-expanded) ──
            // Pass 1: collect group membership in reverse Z order.
            var displayItems = [], seenGroups = {};
            for (var dri = partsList.length - 1; dri >= 0; dri--) {
              var drp = partsList[dri]; if (!drp) continue;
              if (drp.groupId) {
                if (!seenGroups[drp.groupId]) {
                  seenGroups[drp.groupId] = true;
                  var grpMems = [];
                  for (var gmi = partsList.length - 1; gmi >= 0; gmi--) {
                    if (partsList[gmi] && partsList[gmi].groupId === drp.groupId) grpMems.push(gmi);
                  }
                  displayItems.push({ type: "group", groupId: drp.groupId, members: grpMems, maxIdx: dri });
                }
              } else {
                displayItems.push({ type: "part", idx: dri });
              }
            }
            // Pass 2: flatten into renderItems — each entry maps to exactly one DOM row.
            var renderItems = [];
            for (var rii = 0; rii < displayItems.length; rii++) {
              var ritem = displayItems[rii];
              if (ritem.type === "part") {
                renderItems.push(ritem);
              } else {
                renderItems.push({ type: "grphdr", groupId: ritem.groupId, members: ritem.members, maxIdx: ritem.maxIdx });
                if (!shipCollapsedGroups[ritem.groupId]) {
                  for (var rmi = 0; rmi < ritem.members.length; rmi++) {
                    renderItems.push({ type: "grpmem", idx: ritem.members[rmi], groupId: ritem.groupId });
                  }
                }
              }
            }
            // Build displayRows: renderItems with a drop-zone entry injected at hover position.
            var displayRows = renderItems;
            if (shipDragHover) {
              var dzPos = Math.max(0, Math.min(renderItems.length, shipDragHover.displayPos));
              displayRows = renderItems.slice(0, dzPos)
                .concat([{ type: "dropzone", freeSlot: shipDragHover.freeSlot }])
                .concat(renderItems.slice(dzPos));
            }
            return React.createElement(React.Fragment, null,
              React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 12px" } },
                React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 11, marginBottom: 8, letterSpacing: 0.5 } }, "PARTS (" + partsList.length + ")"),
                partsList.length === 0
                  ? React.createElement("div", { style: { color: "rgba(180,200,220,0.4)", fontSize: 11, fontStyle: "italic", padding: "6px 0" } }, "No parts yet — add one from the ADD tab.")
                  : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
                      displayRows.map(function(item) {
                        if (item.type === "dropzone") return React.createElement("div", { key: "dz",
                          style: { height: 3, borderRadius: 2, margin: "1px 0",
                            background: item.freeSlot ? "rgba(80,200,255,0.45)" : "rgba(128,160,255,0.35)",
                            border: "1px solid " + (item.freeSlot ? "rgba(80,200,255,0.8)" : "rgba(100,140,255,0.55)") } });
                        if (item.type === "part") return renderPartRow(item.idx, false);
                        if (item.type === "grpmem") return renderPartRow(item.idx, true);
                        // ── Group header row ─────────────────────────────────
                        var gid = item.groupId;
                        var tint = shipGroupTint(gid);
                        var collapsed = !!shipCollapsedGroups[gid];
                        var anyMemberSel = false;
                        for (var gi = 0; gi < item.members.length; gi++) {
                          if (shipIsSelected(item.members[gi])) { anyMemberSel = true; break; }
                        }
                        var allMemberSel = item.members.length > 0;
                        for (var gj = 0; gj < item.members.length; gj++) {
                          if (!shipIsSelected(item.members[gj])) { allMemberSel = false; break; }
                        }
                        var gbbox = shipGroupVisualBBox(item.members);
                        var gbboxText = "(" + Math.round(gbbox.cx) + "," + Math.round(gbbox.cy) + ")";
                        var gGroupName = shipGroupDisplayName(gid);
                        var gIsRenaming = shipGroupRenamingId === gid;
                        var gHiddenAll = item.members.length > 0, gGhostAll = item.members.length > 0;
                        for (var ghi = 0; ghi < item.members.length; ghi++) {
                          var ghv = (partsList[item.members[ghi]] && partsList[item.members[ghi]].hidden) || 0;
                          if (ghv !== 1) gHiddenAll = false;
                          if (ghv !== 2) gGhostAll = false;
                        }
                        var gHiddenVal = gHiddenAll ? 1 : gGhostAll ? 2 : 0;
                        return React.createElement("div", Object.assign({ key: "grphdr-" + gid,
                          onClick: function() { shipSelectGroup(gid); },
                          style: { display: "flex", alignItems: "center", gap: 4, padding: "6px 6px",
                            borderRadius: 6, cursor: "pointer",
                            background: anyMemberSel ? "rgba(255,220,100,0.10)" : "rgba(255,220,100,0.05)",
                            border: anyMemberSel ? "1px solid rgba(255,220,100,0.40)" : "1px solid rgba(255,255,255,0.08)",
                            borderLeft: "3px solid " + tint } },
                          { "data-shippart-row": "1", "data-shippart-actual-idx": String(item.maxIdx), "data-shippart-gid": gid }),
                          // 0. Eye — cycles group visibility
                          React.createElement("div", { onClick: function(e) { e.stopPropagation(); shipCycleGroupVisibility(gid); },
                            title: gHiddenVal === 1 ? "All hidden — click for ghost" : gHiddenVal === 2 ? "All ghost — click to show" : "Visible — click to hide all",
                            style: { width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto" } },
                            shipEyeSvg(12, gHiddenVal)),
                          // 1. Collapse/expand triangle
                          React.createElement("div", {
                            onClick: function(e) { e.stopPropagation(); setShipCollapsedGroups(function(prev) { var n = Object.assign({}, prev); if (n[gid]) { delete n[gid]; } else { n[gid] = true; } return n; }); },
                            style: { width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", color: "rgba(220,200,140,0.7)", cursor: "pointer" } },
                            React.createElement("svg", { width: 10, height: 10, viewBox: "0 0 10 10", fill: "currentColor" },
                              collapsed
                                ? React.createElement("polygon", { points: "2,2 8,5 2,8" })
                                : React.createElement("polygon", { points: "2,2 8,2 5,8" }))),
                          // 2. Checkbox — selects/deselects all members
                          React.createElement("div", { onClick: function(e) { e.stopPropagation(); if (allMemberSel) { var cur = shipGetSelected(); var rem = cur.filter(function(c) { return item.members.indexOf(c) < 0; }); if (rem.length === 0) { setShipSelectedPart(-1); setShipSelectedExtras([]); } else { setShipSelectedPart(rem[rem.length - 1]); setShipSelectedExtras(rem.slice(0, rem.length - 1)); } } else { shipSelectGroup(gid); } },
                            title: allMemberSel ? "Deselect all in group" : "Select all in group",
                            style: { width: 16, height: 16, borderRadius: 3,
                              border: anyMemberSel ? "1.5px solid rgba(255,220,100,0.7)" : "1.5px solid rgba(180,200,220,0.35)",
                              background: allMemberSel ? "rgba(255,220,100,0.5)" : (anyMemberSel ? "rgba(255,220,100,0.2)" : "transparent"),
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", flex: "0 0 auto" } },
                            allMemberSel && React.createElement("svg", { width: 10, height: 10, viewBox: "0 0 24 24", fill: "none", stroke: "#1a0820", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" },
                              React.createElement("path", { d: "M5 12l5 5L20 7" }))),
                          // 3. Tint dot
                          React.createElement("div", { style: { width: 10, height: 10, borderRadius: "50%", background: tint, flex: "0 0 auto", border: "1.5px solid rgba(0,0,0,0.35)" } }),
                          // 4–6. Group name + pencil + bbox coords  OR  rename input
                          gIsRenaming
                            ? React.createElement("input", { autoFocus: true, value: shipGroupRenameVal,
                                onChange: function(e) { setShipGroupRenameVal(e.target.value); },
                                onBlur: function() { shipRenameGroup(gid, shipGroupRenameVal.trim() || null); setShipGroupRenamingId(null); },
                                onKeyDown: function(e) {
                                  if (e.key === "Enter") { shipRenameGroup(gid, shipGroupRenameVal.trim() || null); setShipGroupRenamingId(null); }
                                  if (e.key === "Escape") { setShipGroupRenamingId(null); }
                                },
                                onClick: function(e) { e.stopPropagation(); },
                                style: { flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,220,100,0.5)", borderRadius: 4, color: "rgba(255,220,100,0.9)", padding: "2px 6px", outline: "none", boxSizing: "border-box", fontFamily: "'Exo 2', sans-serif", fontSize: 16 } })
                            : React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: 3, minWidth: 0 } },
                                React.createElement("div", { style: { flex: "0 1 auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(220,200,140,0.85)", fontSize: 11, fontWeight: 700, fontFamily: "'Exo 2', sans-serif", letterSpacing: 0.4, minWidth: 0 } },
                                  gGroupName || ("Group \xB7 " + item.members.length)),
                                React.createElement("div", { onClick: function(e) { e.stopPropagation(); setShipGroupRenamingId(gid); setShipGroupRenameVal(gGroupName || ""); },
                                  title: "Rename group",
                                  style: { flexShrink: 0, cursor: "pointer", color: "rgba(180,200,220,0.35)", display: "flex", alignItems: "center", padding: "2px" } },
                                  WsIconPencil(10)),
                                React.createElement("div", { style: { flexShrink: 0, color: "rgba(140,160,180,0.5)", fontSize: 10, fontFamily: "'Exo 2', sans-serif", whiteSpace: "nowrap" } },
                                  gbboxText),
                                React.createElement("div", { style: { flex: 1 } })),
                          // Copy group
                          React.createElement("div", { onClick: function(e) { e.stopPropagation(); shipDuplicateGroup(gid); },
                            title: "Duplicate group",
                            style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", background: "rgba(128,221,255,0.1)", border: "1px solid rgba(128,221,255,0.3)", flex: "0 0 auto" } },
                            shipCopySvg(12, "#80ddff")),
                          // Delete group
                          React.createElement("div", { onClick: function(e) { e.stopPropagation(); shipDeleteGroup(gid); },
                            title: "Delete group",
                            style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", background: "rgba(220,60,80,0.12)", border: "1px solid rgba(220,60,80,0.3)", flex: "0 0 auto" } },
                            shipTrashSvg(12, "#ff8088")),
                          React.createElement("div", { style: { flex: "0 0 48px" } }),
                          // Drag handle
                          React.createElement("div", {
                            onPointerDown: function(e) { shipDragGroupHandleStart(gid, item.maxIdx, e); },
                            onPointerMove: shipDragHandleMove,
                            onPointerUp: shipDragHandleEnd, onPointerCancel: shipDragHandleEnd,
                            title: "Drag group to reorder",
                            style: { width: 16, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", touchAction: "none", flex: "0 0 auto", color: tint } },
                            React.createElement("svg", { width: "10", height: "16", viewBox: "0 0 10 16", fill: "currentColor" },
                              React.createElement("circle", { cx: 2.5, cy: 3,  r: 1.3 }), React.createElement("circle", { cx: 7.5, cy: 3,  r: 1.3 }),
                              React.createElement("circle", { cx: 2.5, cy: 8,  r: 1.3 }), React.createElement("circle", { cx: 7.5, cy: 8,  r: 1.3 }),
                              React.createElement("circle", { cx: 2.5, cy: 13, r: 1.3 }), React.createElement("circle", { cx: 7.5, cy: 13, r: 1.3 }))));
                      }))));
          })()),
        shipShowBackWarn && renderBackWarnOverlay(
          function() { setShipShowBackWarn(false); },
          function() { shipSaveCurrent(); setShipShowBackWarn(false); setShipView("list"); shipDirtyRef.current = false; },
          function() { setShipShowBackWarn(false); setShipView("list"); shipDirtyRef.current = false; }),
        shipHullPromptId && renderHullPresetOverlay(shipHullPromptId,
          function() { setShipHullPromptId(null); },
          function(mode) { shipApplyHullPreset(shipHullPromptId, mode); setShipHullPromptId(null); }),
        shipResetConfirm && React.createElement("div", { onClick: function() { setShipResetConfirm(false); },
          style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 } },
          React.createElement("div", { onClick: function(e) { e.stopPropagation(); },
            style: { background: WS.brushed, backgroundBlendMode: "overlay", border: "1px solid rgba(255,100,80,0.35)", borderRadius: 12, padding: "20px 18px 14px", maxWidth: 300, width: "100%", boxShadow: "0 8px 24px rgba(0,0,0,0.6), " + WS.ps } },
            React.createElement("div", { style: { color: "rgba(255,140,120,0.9)", fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Exo 2', sans-serif", marginBottom: 8 } }, "Clear All Parts?"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.65)", fontSize: 12, lineHeight: 1.5, marginBottom: 16 } }, "This will remove every part from your ship. The hull will be set to blank."),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
              React.createElement("div", { onClick: function() { shipApplyHullPreset("none", "replace"); setShipResetConfirm(false); },
                style: { padding: "10px 12px", textAlign: "center", borderRadius: 6, cursor: "pointer", background: "rgba(255,80,60,0.18)", border: "1px solid rgba(255,100,80,0.5)", color: "rgba(255,140,120,0.9)", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Exo 2', sans-serif" } }, "Clear All"),
              React.createElement("div", { onClick: function() { setShipResetConfirm(false); },
                style: { padding: "10px 12px", textAlign: "center", borderRadius: 6, cursor: "pointer", background: WS.brushed, backgroundBlendMode: "overlay", border: WS.pb, color: "rgba(180,200,220,0.7)", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Exo 2', sans-serif", boxShadow: WS.ps } }, "Cancel")))))
    ),

    // ═══ PLASMA LAB ═══
    screen === "plasma" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", background: WS.brushed, backgroundBlendMode: "overlay" } },
      WsRivet({ bottom: 5, left: 5 }), WsRivet({ bottom: 5, right: 5 }),

      // ── LIST VIEW ──
      plasmaView === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, {
          onBack: function() { if (setsSelMode) { setSetsSelMode(null); setScreen("sets"); setSetsView("editor"); } else { setScreen("splash"); setPlasmaView("list"); } }, backLabel: setsSelMode ? "Set" : "Workshop", title: "Plasma Lab", color: "#50c8ff",
          rightContent: !setsSelMode && React.createElement("div", { style: { display: "flex", gap: 4 } },
            React.createElement("div", { onClick: function() { setPlasmaShowImport(true); setPlasmaImportText(""); setPlasmaImportError(""); }, style: BTN_TOPBAR }, "Import"),
            React.createElement("div", { onClick: plasmaOpenNew, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #0a2040, #061828)", boxShadow: "0 0 8px rgba(80,200,255,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, "+ New"))
        }),
        renderSetsSelBar("plasma", plasmaSaved.map(function(d) { return d.id; })),
        !setsSelMode && plasmaSaved.length > 1 && renderSortBar(plasmaSortMode, setPlasmaSortMode, [["shape", "Shape"]]),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px" } },
          plasmaSaved.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 14, marginBottom: 8 } }, "No saved plasma designs"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Tap + New to design your first plasma.")),
          (function() { var _plss = sortItems(plasmaSaved, plasmaSortMode, "savedAt"); var _plsi = []; var _plslt = null; for (var _plsk = 0; _plsk < _plss.length; _plsk++) { var design = _plss[_plsk]; if (plasmaSortMode === "shape") { var _plst = PLASMA_SHAPE_LABELS[design.shape] || design.shape || "Ball"; if (_plst !== _plslt) { _plslt = _plst; _plsi.push(renderTypeHeader(_plst, "#50c8ff")); } }
            var isActive = design.id === plasmaActiveId;
            var _plasmaSel = setsSelMode && setsSelMode.selectedIds.indexOf(design.id) !== -1;
            var _plasmaDateStr = design.savedAt ? new Date(design.savedAt).toLocaleDateString() : "";
            _plsi.push(React.createElement("div", { key: design.id, style: Object.assign({}, CARD_STYLE, _plasmaSel ? { borderColor: "rgba(255,208,96,0.4)", background: "rgba(255,208,96,0.05)" } : {}) },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: setsSelMode ? 0 : 10 } },
                setsSelMode && React.createElement("div", { onClick: function() {
                  var _newIds = _plasmaSel ? [] : [design.id];
                  setSetsSelMode(Object.assign({}, setsSelMode, { selectedIds: _newIds }));
                }, style: { width: 20, height: 20, borderRadius: 4, border: _plasmaSel ? "1.5px solid #ffd060" : "1.5px solid rgba(255,208,96,0.3)", background: _plasmaSel ? "#ffd060" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 } },
                  _plasmaSel && React.createElement("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "#1a1400", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M5 12l5 5L20 7" }))),
                React.createElement("div", { style: { width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 } },
                  renderPlasmaShape(design, 28)),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  plasmaRenamingId === design.id
                    ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                        React.createElement("input", { value: plasmaRenameValue, autoFocus: true, onChange: function(e) { setPlasmaRenameValue(e.target.value); }, onKeyDown: function(e) { if (e.key === "Enter") plasmaCommitRename(); else if (e.key === "Escape") plasmaCancelRename(); }, style: { flex: 1, minWidth: 0, padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(80,200,255,0.5)", color: "#b0c8d8", fontSize: 16, fontWeight: 700, fontFamily: "'Quicksand',sans-serif", outline: "none", boxSizing: "border-box" } }),
                        React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: plasmaCommitRename, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
                        React.createElement("div", { onMouseDown: function(e) { e.preventDefault(); }, onClick: plasmaCancelRename, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(220,60,80,0.18)", border: "1px solid rgba(220,60,80,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M6 6L18 18 M18 6L6 18", fill: "none", stroke: "#ff8088", strokeWidth: "2.5", strokeLinecap: "round" }))))
                    : React.createElement(React.Fragment, null,
                        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 } },
                          React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, design.name || "Untitled"),
                          !setsSelMode && React.createElement("div", { onClick: function(e) { e.stopPropagation(); setPlasmaRenamingId(design.id); setPlasmaRenameValue(design.name || ""); }, title: "Rename plasma", style: { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, cursor: "pointer", color: "rgba(180,200,220,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 } }, WsIconPencil(11))),
                        React.createElement("div", { style: { color: "rgba(80,200,255,0.5)", fontSize: 11 } }, (PLASMA_SHAPE_LABELS[design.shape] || "Ball") + (_plasmaDateStr ? " · " + _plasmaDateStr : "")))),
                !setsSelMode && plasmaRenamingId !== design.id && React.createElement("div", { onClick: function() { plasmaSetActive(design.id); }, style: isActive ? BTN_ISACTIVE : BTN_SETACTIVE }, isActive ? "★ Active" : "Set Active")),
              !setsSelMode && plasmaRenamingId !== design.id && React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
                React.createElement("div", { onClick: function() { plasmaOpenEditor(design); }, style: BTN_EDIT }, WsIconPencil(), "EDIT"),
                React.createElement("div", { onClick: function() { plasmaEditCopy(design); }, style: BTN_EDIT }, WsIconCopy(), "Edit Copy"),
                React.createElement("div", { onClick: function() { plasmaExportDesign(design); }, style: BTN_EXPORT }, WsIconShare(), "SHARE"),
                React.createElement("div", { style: { flex: 1 } }),
                React.createElement("div", { onClick: function() {
                  var _inSets = setsDesignInSets(design.id);
                  if (_inSets.length > 0) { setSetsDeleteWarn({ setNames: _inSets, onConfirm: function() { setPlasmaDeletingId(design.id); setSetsDeleteWarn(null); } }); }
                  else { setPlasmaDeletingId(design.id); }
                }, style: BTN_DELETE_ICON }, WsIconTrash()))));
          } return _plsi; }())),
        plasmaDeletingId && renderDeleteOverlay("Delete Plasma Design?",
          function() { setPlasmaDeletingId(null); },
          function() { plasmaDeleteDesign(plasmaDeletingId); }),
        plasmaExportId && renderExportOverlay("Export Plasma Design", plasmaExportText, plasmaCopied, function() { copyToClipboard(plasmaExportText, setPlasmaCopied); }, function() { setPlasmaExportId(null); }),
        plasmaShowImport && renderImportOverlay("Import Plasma Design", plasmaImportText, setPlasmaImportText, plasmaImportError, setPlasmaImportError, plasmaHandleImport, function() { setPlasmaShowImport(false); setPlasmaImportText(""); setPlasmaImportError(""); }, getPlasmaImportPreview),
        renderSetsDeleteWarnOverlay()),

      // ── EDITOR VIEW ──
      plasmaView === "editor" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, {
          onBack: function() {
            if (plasmaEditDirtyRef.current) { setPlasmaShowBackWarn(true); } else { setPlasmaView("list"); }
          },
          backLabel: "My Plasma", title: plasmaEditId ? "Edit Plasma" : "New Plasma", color: "#50c8ff",
          rightContent: React.createElement("div", { style: { display: "flex", gap: 6 } },
            React.createElement("div", { onClick: plasmaUndo, title: "Undo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 8px", opacity: plasmaCanUndo ? 1 : 0.35, cursor: plasmaCanUndo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M9 14L4 9l5-5" }),
                React.createElement("path", { d: "M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-3" }))),
            React.createElement("div", { onClick: plasmaRedo, title: "Redo",
              style: Object.assign({}, BTN_TOPBAR, { padding: "6px 8px", opacity: plasmaCanRedo ? 1 : 0.35, cursor: plasmaCanRedo ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }) },
              React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                React.createElement("path", { d: "M15 14l5-5-5-5" }),
                React.createElement("path", { d: "M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h3" }))),
            React.createElement("div", {
              onClick: function() {
                if (!plasmaEditId) { setPlasmaSaveStatus("Save first"); setTimeout(function() { setPlasmaSaveStatus(""); }, 2500); return; }
                plasmaEditId === plasmaActiveId ? plasmaSetActive(null) : plasmaSetActive(plasmaEditId);
              },
              style: Object.assign({}, BTN_TOPBAR, { color: plasmaEditId === plasmaActiveId ? "#80dd90" : "rgba(200,210,220,0.7)", border: plasmaEditId === plasmaActiveId ? "2px solid rgba(80,200,100,0.5)" : PNLB })
            }, plasmaEditId === plasmaActiveId ? "★ Active" : "Set Active"),
            React.createElement("div", { onClick: plasmaSaveCurrent, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #0a2040, #061828)", boxShadow: "0 0 8px rgba(80,200,255,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, plasmaSaveStatus || "Save"))
        }),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "0 16px 32px" } },
          // Name (above preview, matching other module editors)
          React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", margin: "12px 0 10px" } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 11, marginBottom: 6, letterSpacing: 0.5 } }, "NAME"),
            React.createElement("input", { value: plasmaEditDesign.name || "", onChange: function(e) { plasmaUpdateEdit("name", e.target.value); },
              placeholder: "My Plasma", style: { width: "100%", padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#b0c8d8", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none", boxSizing: "border-box" } })),
          // ── DESIGN TAB ──
          plasmaEditTab === "design" && React.createElement(React.Fragment, null,
            React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 20px" } },
              renderPlasmaShape(plasmaEditDesign, 72)),
            React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 12, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 4 } },
              React.createElement("div", { onClick: function() { setPlasmaEditTab("design"); }, style: { flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 7, background: "linear-gradient(180deg,#0e2840,#081828)", color: "#50c8ff", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, cursor: "pointer", border: "1px solid rgba(80,200,255,0.25)" } }, "Design"),
              React.createElement("div", { onClick: function() { setPlasmaEditTab("range"); setPlasmaRangeKey(function(k) { return k + 1; }); }, style: { flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 7, background: "transparent", color: "rgba(180,200,220,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, cursor: "pointer", border: "1px solid transparent" } }, "Firing Range")),
            React.createElement("div", null,
              React.createElement("div", { style: { marginBottom: 10 } },
                React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 11, marginBottom: 8, letterSpacing: 0.5 } }, "SHAPE"),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                  ["circle", "blast", "torpedo"].map(function(shape) {
                    var isSelected = (plasmaEditDesign.shape || "circle") === shape;
                    return React.createElement("div", { key: shape, onClick: function() { plasmaUpdateEdit("shape", shape); },
                      style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "14px 8px", borderRadius: 10, background: isSelected ? "rgba(80,200,255,0.1)" : "rgba(0,0,0,0.2)", border: isSelected ? "2px solid rgba(80,200,255,0.5)" : "2px solid rgba(255,255,255,0.08)", cursor: "pointer", minHeight: 80, justifyContent: "center" } },
                      renderPlasmaShape(Object.assign({}, plasmaEditDesign, { shape: shape }), 22),
                      React.createElement("div", { style: { fontSize: 10, color: isSelected ? "#50c8ff" : "rgba(180,200,220,0.5)", fontWeight: 700, letterSpacing: 0.5 } }, PLASMA_SHAPE_LABELS[shape]));
                  }))),
              React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 16px 8px", marginBottom: 10 } },
                React.createElement(BDColorPicker, { label: "Color", value: plasmaEditDesign.color || "#50c8ff",
                  presets: ["#50c8ff", "#80ddff", "#4488ff", "#cc66ff", "#ff4488", "#44ffaa", "#ffcc44", "#ffffff"],
                  onChange: function(v) { plasmaUpdateEdit("color", v); } }),
                React.createElement(BDSlider, { label: "Opacity", value: plasmaEditDesign.colorOpacity != null ? plasmaEditDesign.colorOpacity : 1.0,
                  min: 0.1, max: 1.0, step: 0.05, displayValue: Math.round((plasmaEditDesign.colorOpacity != null ? plasmaEditDesign.colorOpacity : 1.0) * 100) + "%",
                  onChange: function(v) { plasmaUpdateEdit("colorOpacity", v); } }),
                React.createElement("div", { style: { marginBottom: 8 } },
                  React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 11, marginBottom: 6, letterSpacing: 0.5 } }, "STYLE"),
                  React.createElement("div", { style: { display: "flex", gap: 4, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 3 } },
                    ["standard", "linear", "radial"].map(function(mode) {
                      var modeLabel = mode === "standard" ? "Standard" : mode === "linear" ? "Linear" : "Radial";
                      var isModeActive = (plasmaEditDesign.colorMode || "radial") === mode;
                      return React.createElement("div", { key: mode, onClick: function() { plasmaUpdateEdit("colorMode", mode); },
                        style: { flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: isModeActive ? "linear-gradient(180deg,#0e2840,#081828)" : "transparent", color: isModeActive ? "#50c8ff" : "rgba(180,200,220,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, cursor: "pointer", border: isModeActive ? "1px solid rgba(80,200,255,0.25)" : "1px solid transparent" } }, modeLabel);
                    })))),
              React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 16px 8px", marginBottom: 10 } },
                React.createElement(BDColorPicker, { label: "Glow Color", value: plasmaEditDesign.glowColor || "#80ddff",
                  presets: ["#80ddff", "#50c8ff", "#ffffff", "#cc66ff", "#ff4488", "#44ffaa", "#ffcc44", "#4488ff"],
                  onChange: function(v) { plasmaUpdateEdit("glowColor", v); } }),
                React.createElement(BDSlider, { label: "Glow Size", value: plasmaEditDesign.glowSize != null ? plasmaEditDesign.glowSize : 8,
                  min: 0, max: 24, step: 1, displayValue: String(Math.round(plasmaEditDesign.glowSize != null ? plasmaEditDesign.glowSize : 8)) + "px",
                  onChange: function(v) { plasmaUpdateEdit("glowSize", v); } })))),

          // ── FIRING RANGE TAB ──
          plasmaEditTab === "range" && React.createElement(React.Fragment, null,
            // Sticky block: arena + tab bar pinned to top while controls scroll
            React.createElement("div", { style: { position: "sticky", top: 0, zIndex: 5, margin: "0 -16px", background: "rgba(8,12,22,0.97)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", paddingBottom: 8 } },
              // Arena
              React.createElement("div", { style: { position: "relative", height: 260, background: "linear-gradient(180deg, #050810 0%, #0a0e1a 100%)", overflow: "hidden", border: "none", borderBottom: "1px solid rgba(80,200,255,0.08)" } },
                React.createElement("div", { style: { position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" } },
                  [10, 25, 40, 60, 75, 90, 15, 50, 80, 35].map(function(lx, si) {
                    var ly = [15, 8, 22, 5, 18, 12, 30, 25, 7, 35][si];
                    return React.createElement("div", { key: si, style: { position: "absolute", left: lx + "%", top: ly + "%", width: si % 3 === 0 ? 2 : 1, height: si % 3 === 0 ? 2 : 1, borderRadius: "50%", background: "#fff" } });
                  })),
                [0,1,2,3,4,5,6,7].map(function(j) {
                  return React.createElement("div", { key: "col" + j, style: { position: "absolute", top: 0, bottom: 0, width: 1, left: "calc(" + (j + 0.5) + " * (100% - 55px) / 8 + " + (7.5 + (j + 0.5) * 5) + "px)", background: "rgba(80,200,255,0.1)", pointerEvents: "none", zIndex: 1 } });
                }),
                !plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", top: 0, bottom: plasmaOriginBottom, left: "calc(50% + " + plasmaSourceOffsetPx + "px)", width: 1, transform: "translateX(-50%)", background: "linear-gradient(to bottom, " + plasmaIndicatorColor + "00 0%, " + plasmaIndicatorColor + "50 100%)", pointerEvents: "none", zIndex: 3 } }),
                !!plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", top: 0, bottom: plasmaOriginBottom, left: "calc(50% + " + (plasmaSourceOffsetPx - plasmaSplitDist) + "px)", width: 1, transform: "translateX(-50%)", background: "linear-gradient(to bottom, " + plasmaIndicatorColor + "00 0%, " + plasmaIndicatorColor + "50 100%)", pointerEvents: "none", zIndex: 3 } }),
                !!plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", top: 0, bottom: plasmaOriginBottom, left: "calc(50% + " + (plasmaSourceOffsetPx + plasmaSplitDist) + "px)", width: 1, transform: "translateX(-50%)", background: "linear-gradient(to bottom, " + plasmaIndicatorColor + "00 0%, " + plasmaIndicatorColor + "50 100%)", pointerEvents: "none", zIndex: 3 } }),
                React.createElement("div", { onClick: function() { setPlasmaRangeKey(function(k) { return k + 1; }); }, style: { position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", cursor: "pointer", zIndex: 2 } },
                  React.createElement(ShipDesignSvg, { size: plasmaShipSize, design: plasmaGetPreviewShipDesign(), uid: "plasma-range" })),
                !plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", bottom: plasmaFlashBottom, left: "calc(50% + " + plasmaSourceOffsetPx + "px)", transform: "translate(-50%, 50%)", width: 7, height: 7, borderRadius: "50%", background: plasmaIndicatorColor, boxShadow: plasmaIndicatorGlow, animation: "pulse 1.5s ease-in-out infinite", pointerEvents: "none", zIndex: 4 } }),
                !!plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", bottom: plasmaFlashBottom, left: "calc(50% + " + (plasmaSourceOffsetPx - plasmaSplitDist) + "px)", transform: "translate(-50%, 50%)", width: 6, height: 6, borderRadius: "50%", background: plasmaIndicatorColor, boxShadow: plasmaIndicatorGlow, animation: "pulse 1.5s ease-in-out infinite", pointerEvents: "none", zIndex: 4 } }),
                !!plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", bottom: plasmaFlashBottom, left: "calc(50% + " + (plasmaSourceOffsetPx + plasmaSplitDist) + "px)", transform: "translate(-50%, 50%)", width: 6, height: 6, borderRadius: "50%", background: plasmaIndicatorColor, boxShadow: plasmaIndicatorGlow, animation: "pulse 1.5s ease-in-out infinite", pointerEvents: "none", zIndex: 4 } }),
                React.createElement("div", { key: String(plasmaRangeKey) + "_" + (plasmaEditDesign.shape || "circle") + "_" + String(Math.round((plasmaEditDesign.speed || 1) * 10)), style: { position: "absolute", inset: 0, pointerEvents: "none" } },
                  !plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", bottom: plasmaShotBottom, left: "calc(50% + " + plasmaSourceOffsetPx + "px)", transform: "translateX(-50%)" } },
                    React.createElement("div", { style: { animation: plasmaAnimDur, "--endX": "0px", "--endY": plasmaEndY } },
                      renderPlasmaSingle(plasmaEditDesign, 20))),
                  !!plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", bottom: plasmaShotBottom, left: "calc(50% + " + (plasmaSourceOffsetPx - plasmaSplitDist) + "px)", transform: "translateX(-50%)" } },
                    React.createElement("div", { style: { animation: plasmaAnimDur, animationDelay: "0.05s", "--endX": "0px", "--endY": plasmaEndY } },
                      renderPlasmaSingle(plasmaEditDesign, 15))),
                  !!plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", bottom: plasmaShotBottom, left: "calc(50% + " + (plasmaSourceOffsetPx + plasmaSplitDist) + "px)", transform: "translateX(-50%)" } },
                    React.createElement("div", { style: { animation: plasmaAnimDur, animationDelay: "0.05s", "--endX": "0px", "--endY": plasmaEndY } },
                      renderPlasmaSingle(plasmaEditDesign, 15))),
                  !!plasmaEditDesign.flashEnabled && !plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", bottom: plasmaFlashBottom, left: "calc(50% + " + plasmaSourceOffsetPx + "px)", transform: "translate(-50%, 0)" } },
                    React.createElement("div", { style: { width: plasmaFlashSize, height: plasmaFlashSize, borderRadius: "50%", background: plasmaEditDesign.flashColor || "#ffffff", marginLeft: -(plasmaFlashSize / 2), opacity: plasmaFlashOpacity, animation: plasmaFlashAnimStr } })),
                  !!plasmaEditDesign.flashEnabled && !!plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", bottom: plasmaFlashBottom, left: "calc(50% + " + (plasmaSourceOffsetPx - plasmaSplitDist) + "px)", transform: "translate(-50%, 0)" } },
                    React.createElement("div", { style: { width: plasmaSplitFlashSize, height: plasmaSplitFlashSize, borderRadius: "50%", background: plasmaEditDesign.flashColor || "#ffffff", marginLeft: -(plasmaSplitFlashSize / 2), opacity: plasmaFlashOpacity, animation: plasmaFlashAnimStr } })),
                  !!plasmaEditDesign.flashEnabled && !!plasmaEditDesign.splitEnabled && React.createElement("div", { style: { position: "absolute", bottom: plasmaFlashBottom, left: "calc(50% + " + (plasmaSourceOffsetPx + plasmaSplitDist) + "px)", transform: "translate(-50%, 0)" } },
                    React.createElement("div", { style: { width: plasmaSplitFlashSize, height: plasmaSplitFlashSize, borderRadius: "50%", background: plasmaEditDesign.flashColor || "#ffffff", marginLeft: -(plasmaSplitFlashSize / 2), opacity: plasmaFlashOpacity, animation: plasmaFlashAnimStr } }))),
              React.createElement("div", { onClick: function(e) { e.stopPropagation(); if (plasmaShipSizeTouchRef.current && plasmaShipSizeTouchRef.current.didMove) { plasmaShipSizeTouchRef.current = null; return; } plasmaShipSizeTouchRef.current = null; setShowPlasmaShipSizeSlider(function(v) { return !v; }); }, onTouchStart: function(e) { plasmaShipSizeTouchRef.current = { startY: e.touches[0].clientY, startVal: plasmaShipSize, didMove: false }; }, onTouchMove: function(e) { if (!plasmaShipSizeTouchRef.current) return; var dy = plasmaShipSizeTouchRef.current.startY - e.touches[0].clientY; if (Math.abs(dy) > 4) { plasmaShipSizeTouchRef.current.didMove = true; if (!showPlasmaShipSizeSlider) setShowPlasmaShipSizeSlider(true); var nv = Math.min(204, Math.max(34, Math.round(plasmaShipSizeTouchRef.current.startVal + dy * 170 / 140))); setPlasmaShipSize(nv); try { window.storage.set("cosmic_drift_ship_size", String(nv)); } catch(ex) {} } e.preventDefault(); }, style: { position: "absolute", bottom: 10, right: 10, width: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "4px 4px", borderRadius: 6, background: showPlasmaShipSizeSlider ? "rgba(30,60,100,0.97)" : "rgba(8,14,28,0.9)", border: showPlasmaShipSizeSlider ? "2px solid rgba(80,180,255,0.5)" : "1px solid rgba(80,180,255,0.2)", borderTop: showPlasmaShipSizeSlider ? "none" : undefined, cursor: "pointer", zIndex: 10, minHeight: 48 } },
                showPlasmaShipSizeSlider && React.createElement("div", { onClick: function(e) { e.stopPropagation(); }, style: { position: "absolute", bottom: "calc(100% - 4px)", left: -2, right: -2, background: "rgba(30,60,100,0.97)", border: "2px solid rgba(80,180,255,0.5)", borderBottom: "none", borderRadius: "6px 6px 0 0", padding: "0 2px 4px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "-4px -8px 20px rgba(0,0,0,0.7), 4px -8px 20px rgba(0,0,0,0.7), 0 0 16px rgba(80,180,255,0.15)" } },
                  React.createElement("style", null, ".plasma-sz-sl::-webkit-slider-runnable-track{background:transparent!important;box-shadow:none!important;border:none!important}.plasma-sz-sl::-moz-range-track{background:transparent!important;border:none!important}"),
                  React.createElement("input", { className: "plasma-sz-sl", type: "range", min: -204, max: -34, step: 2, value: -plasmaShipSize, onChange: function(e) { var v = -Math.round(Number(e.target.value)); setPlasmaShipSize(v); try { window.storage.set("cosmic_drift_ship_size", String(v)); } catch(ex) {} }, style: { writingMode: "vertical-lr", height: 140, width: 28, cursor: "ns-resize", fontSize: 16, accentColor: "#50c8ff" } })),
                React.createElement("div", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 7, fontWeight: 700, color: showPlasmaShipSizeSlider ? "#80ddff" : "rgba(140,180,210,0.6)", letterSpacing: 0.3, lineHeight: 1 } }, Math.round(plasmaShipSize / 68 * 100) + "%"),
                React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24" },
                  React.createElement("path", { d: "M15 3h6v6l-2.3-2.3-3.4 3.4-1.4-1.4 3.4-3.4L15 3z", fill: showPlasmaShipSizeSlider ? "rgba(80,200,255,0.85)" : "rgba(140,160,180,0.5)" }),
                  React.createElement("path", { d: "M9 21H3v-6l2.3 2.3 3.4-3.4 1.4 1.4-3.4 3.4L9 21z", fill: showPlasmaShipSizeSlider ? "rgba(80,200,255,0.85)" : "rgba(140,160,180,0.5)" })))),
              // Tab bar — BELOW the arena
              React.createElement("div", { style: { display: "flex", gap: 4, margin: "8px 16px 0", background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 4 } },
                React.createElement("div", { onClick: function() { setPlasmaEditTab("design"); }, style: { flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 7, background: "transparent", color: "rgba(180,200,220,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, cursor: "pointer", border: "1px solid transparent" } }, "Design"),
                React.createElement("div", { onClick: function() { setPlasmaRangeKey(function(k) { return k + 1; }); }, style: { flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 7, background: "linear-gradient(180deg,#0e2840,#081828)", color: "#50c8ff", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, cursor: "pointer", border: "1px solid rgba(80,200,255,0.25)" } }, "Firing Range"))),
            // Scrollable controls
            React.createElement("div", { style: { paddingTop: 14 } },
              React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 16px 8px", marginBottom: 10 } },
                React.createElement(BDToggle, { label: "Muzzle Flash", value: !!plasmaEditDesign.flashEnabled,
                  onChange: function(v) { plasmaUpdateEdit("flashEnabled", v); } }),
                !!plasmaEditDesign.flashEnabled && React.createElement("div", null,
                  React.createElement(BDColorPicker, { label: "Flash Color", value: plasmaEditDesign.flashColor || "#ffffff",
                    presets: ["#ffffff", "#80ddff", "#50c8ff", "#ffcc44", "#ff8844", "#cc66ff", "#44ffaa", "#ff4488"],
                    onChange: function(v) { plasmaUpdateEdit("flashColor", v); } }),
                  React.createElement(BDSlider, { label: "Flash Size", value: plasmaFlashSize,
                    min: 8, max: 60, step: 2, displayValue: String(Math.round(plasmaFlashSize)) + "px",
                    onChange: function(v) { plasmaUpdateEdit("flashSize", Math.round(v)); } }),
                  React.createElement(BDSlider, { label: "Flash Opacity", value: plasmaFlashOpacity,
                    min: 0.05, max: 1.0, step: 0.05, displayValue: Math.round(plasmaFlashOpacity * 100) + "%",
                    onChange: function(v) { plasmaUpdateEdit("flashOpacity", v); } }))),
              React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 16px 8px", marginBottom: 10 } },
                React.createElement(BDSlider, { label: "Source X", value: plasmaEditDesign.sourceOffsetX != null ? plasmaEditDesign.sourceOffsetX : 50,
                  min: 0, max: 100, step: 1, displayValue: Math.round(plasmaEditDesign.sourceOffsetX != null ? plasmaEditDesign.sourceOffsetX : 50) + "%",
                  onChange: function(v) { plasmaUpdateEdit("sourceOffsetX", Math.round(v)); } }),
                React.createElement(BDSlider, { label: "Source Y", value: plasmaEditDesign.sourceOffsetY != null ? plasmaEditDesign.sourceOffsetY : 0,
                  min: 0, max: 100, step: 1, displayValue: Math.round(plasmaEditDesign.sourceOffsetY != null ? plasmaEditDesign.sourceOffsetY : 0) + "%",
                  onChange: function(v) { plasmaUpdateEdit("sourceOffsetY", Math.round(v)); } }),
                React.createElement(BDSlider, { label: "Speed", value: plasmaEditDesign.speed || 1.0,
                  min: 0.3, max: 2.5, step: 0.1, displayValue: (plasmaEditDesign.speed || 1.0).toFixed(1) + "x",
                  onChange: function(v) { plasmaUpdateEdit("speed", v); } }),
                shipSaved.length > 1 && React.createElement("div", { style: { marginTop: 8, marginBottom: 4 } },
                  React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 11, marginBottom: 6, letterSpacing: 0.5 } }, "SHIP"),
                  React.createElement("div", { style: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 } },
                    shipSaved.map(function(ship) {
                      var isPickedShip = plasmaPreviewShipId ? (plasmaPreviewShipId === ship.id) : (ship.id === shipActiveId);
                      var isShipActive = ship.id === shipActiveId;
                      return React.createElement("div", { key: ship.id, style: { flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 } },
                        React.createElement("div", { onClick: function() { setPlasmaPreviewShipId(ship.id); },
                          style: { width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: isPickedShip ? "rgba(80,200,255,0.1)" : "rgba(0,0,0,0.2)", border: isPickedShip ? "2px solid rgba(80,200,255,0.5)" : "2px solid rgba(255,255,255,0.08)", cursor: "pointer" } },
                          React.createElement(ShipDesignSvg, { size: 38, design: shipMigrateDesign(ship), uid: "plasma-pick-" + ship.id })),
                        React.createElement("div", { onClick: function() { shipSetActive(ship.id); },
                          style: Object.assign({}, BTN_BASE, { padding: "3px 6px", fontSize: 8, background: isShipActive ? "linear-gradient(180deg, #2a5a3a, #1a3a28)" : PNL, border: isShipActive ? "1px solid rgba(80,220,120,0.7)" : "1px solid rgba(120,200,140,0.4)", color: isShipActive ? "#80dd90" : "rgba(150,220,170,0.8)", whiteSpace: "nowrap" }) },
                          isShipActive ? "★ Active" : "Set Active"));
                    })))),
              React.createElement("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 16px 8px", marginBottom: 10 } },
                React.createElement(BDToggle, { label: "Split Shot", value: !!plasmaEditDesign.splitEnabled,
                  onChange: function(v) { plasmaUpdateEdit("splitEnabled", v); } }),
                !!plasmaEditDesign.splitEnabled && React.createElement(BDSlider, { label: "Split Distance", value: plasmaEditDesign.splitDistance != null ? plasmaEditDesign.splitDistance : 30,
                  min: 0, max: 100, step: 1, displayValue: String(Math.round(plasmaEditDesign.splitDistance != null ? plasmaEditDesign.splitDistance : 30)) + "%",
                  onChange: function(v) { plasmaUpdateEdit("splitDistance", Math.round(v)); } })))),

          // Reset button
          React.createElement("div", { style: { display: "flex", justifyContent: "center", marginTop: 20 } },
            React.createElement("div", {
              onClick: function() { plasmaEditDirtyRef.current = true; setPlasmaEditDesign(Object.assign({}, PLASMA_DEFAULT_DESIGN, { name: plasmaEditDesign.name || "" })); },
              style: { padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", color: "rgba(180,200,220,0.5)", fontSize: 11, fontFamily: "'Exo 2', sans-serif", cursor: "pointer", letterSpacing: 0.5 }
            }, "Reset to Defaults"))),
        plasmaShowBackWarn && renderBackWarnOverlay(
          function() { setPlasmaShowBackWarn(false); },
          function() { plasmaSaveCurrent(); setPlasmaShowBackWarn(false); setPlasmaView("list"); plasmaEditDirtyRef.current = false; },
          function() { setPlasmaShowBackWarn(false); setPlasmaView("list"); plasmaEditDirtyRef.current = false; }))
    )
  );
}
