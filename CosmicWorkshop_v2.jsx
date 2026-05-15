import { useState, useRef, useCallback, useEffect, memo } from "react";

/* ============================================================
   COSMIC WORKSHOP v2.0
   Creative suite for Cosmic Drift: Level Builder + Block Designer
   Shares storage with the game via window.storage.
   Created by Dan Medwin and Claude (Opus 4.6), 2026
   ============================================================ */

var WORKSHOP_VERSION = "v2.0";

// ═══════════════════════════════════════════════════════════════
// SHARED CONSTANTS (duplicated from game for independence)
// ═══════════════════════════════════════════════════════════════

var COLS = 8, ROWS = 6, GAP = 5, BOARD_PAD = 10, START_PLASMA = 10;

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
var BLOCK_DESC = { 1: "1 pt. Destroyed by any hit.", 2: "Fires plasma in 4 directions. +3 pts.", 3: "Lightning upward through the column. +3 pts.", 4: "Adds an extra reactor core. +2 pts.", 5: "Recharges plasma (+3). +2 pts.", 6: "Drone targets densest 3x3 area. +5 pts.", 7: "Cannot be destroyed. Blocks plasma and lightning.", 8: "Ooze melts down the column. No points. Drains plasma if ship is below.", 9: "Contains one random power-up for your inventory.", 10: "Protected by an energy shield. Takes 3 hits to destroy. +5 pts.", 11: "Contains a Drone power-up.", 12: "Contains a Lightning power-up.", 13: "Contains a Cross Shot power-up.", 14: "Contains a Split power-up.", 15: "Contains a Smash power-up.", 16: "Contains a Reactor Core.", 17: "Warps every 2 plasma shots. Drops EMP that drains 25% plasma in 3 columns." };
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
var PNLS = "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.4), 0 2px 3px rgba(0,0,0,0.3)";
var SCRN = "linear-gradient(180deg, #0a0a14 0%, #12121e 100%)";
var SCRNB = "2px solid #3a3a45";
var SCRNS = "inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)";

// ── Animation CSS (subset needed for Workshop) ──
var ANIM_CSS = "@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&family=Exo+2:wght@400;600;700&display=swap');\n@keyframes starDrift{0%{transform:translateY(-50%)}100%{transform:translateY(0)}}\n@keyframes introFadeIn{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}\n@keyframes pulse{0%{opacity:0.6}50%{opacity:1}100%{opacity:0.6}}\n@keyframes ufoWarpOut{0%{transform:scale(1);opacity:1}100%{transform:scale(2.2);opacity:0}}\n@keyframes ufoWarpIn{0%{transform:scale(0.05);opacity:0}60%{transform:scale(1.08);opacity:0.9}100%{transform:scale(1);opacity:1}}\n@keyframes ufoLightSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}\n@keyframes splashFloat{0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)}}\n@keyframes splashGlow{0%{opacity:0.4}50%{opacity:0.8}100%{opacity:0.4}}\n* { box-sizing: border-box; }\ninput[type=range] { -webkit-appearance: none; appearance: none; background: rgba(255,255,255,0.1); border-radius: 4px; height: 6px; outline: none; }\ninput[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 32px; height: 32px; border-radius: 50%; background: #4488ff; border: 3px solid #88bbff; cursor: pointer; box-shadow: 0 0 8px rgba(68,136,255,0.4); }\ninput[type=range]::-moz-range-thumb { width: 32px; height: 32px; border-radius: 50%; background: #4488ff; border: 3px solid #88bbff; cursor: pointer; box-shadow: 0 0 8px rgba(68,136,255,0.4); }@keyframes vfxOozeDrip{0%{transform:scaleY(0);opacity:0}100%{transform:scaleY(1);opacity:0.85}}@keyframes vfxOozeWave{0%{transform:translateY(0)}100%{transform:translateY(50%)}}@keyframes vfxBurst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0);opacity:0}}@keyframes vfxRing{0%{transform:scale(0.1);opacity:1}100%{transform:scale(2.2);opacity:0}}@keyframes vfxFlash{0%{transform:scale(0.2);opacity:1}100%{transform:scale(1.8);opacity:0}}@keyframes vfxPop{0%{transform:scale(1);filter:brightness(1)}30%{transform:scale(1.2);filter:brightness(1.8)}100%{transform:scale(0);opacity:0}}@keyframes vfxBubble{0%{transform:translateY(0) scale(0.5);opacity:0}15%{opacity:0.55}85%{opacity:0.55}100%{transform:translateY(88px) scale(1);opacity:0}}@keyframes vfxSpark{0%{transform:translate(0,0) scale(1);opacity:1}35%{transform:translate(calc(var(--sx)*0.45),calc(var(--sy)*0.25 - 7px));opacity:0.9}100%{transform:translate(var(--sx),var(--sy)) scale(0.3);opacity:0}}@keyframes vfxBurnBlock{0%{opacity:1;filter:brightness(1)}10%{opacity:1;filter:brightness(2.3)}55%{opacity:0;filter:brightness(1)}100%{opacity:0;filter:brightness(1)}}@keyframes vfxShatter{0%{transform:translate(0,0) scale(1);opacity:0}15%{opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0);opacity:0}}@keyframes vfxDroneShard{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0.2);opacity:0}}";

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
function ufoAdjustColor(hex, factor) {
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.min(255, Math.round(r * factor)); g = Math.min(255, Math.round(g * factor)); b = Math.min(255, Math.round(b * factor));
  return "#" + ("0"+r.toString(16)).slice(-2) + ("0"+g.toString(16)).slice(-2) + ("0"+b.toString(16)).slice(-2);
}
function UFOBlockSvg(props) {
  var size = props.size || 48;
  var animPhase = props.animPhase || "idle";
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
      React.createElement("radialGradient", { id: "ufo-h", cx: "50%", cy: "26%" },
        React.createElement("stop", { offset: "0%", stopColor: hullLight }),
        React.createElement("stop", { offset: "55%", stopColor: d.hullColor }),
        React.createElement("stop", { offset: "100%", stopColor: hullDark })),
      React.createElement("radialGradient", { id: "ufo-d", cx: "33%", cy: "25%" },
        React.createElement("stop", { offset: "0%", stopColor: "#ffffff", stopOpacity: "0.92" }),
        React.createElement("stop", { offset: "38%", stopColor: d.domeColor, stopOpacity: "0.55" }),
        React.createElement("stop", { offset: "100%", stopColor: hullDark, stopOpacity: "0.22" })),
      glowOp > 0 ? React.createElement("radialGradient", { id: "ufo-g", cx: "50%", cy: "40%" },
        React.createElement("stop", { offset: "0%", stopColor: d.hullColor, stopOpacity: glowOp }),
        React.createElement("stop", { offset: "45%", stopColor: d.hullColor, stopOpacity: glowOp * 0.5 }),
        React.createElement("stop", { offset: "100%", stopColor: d.hullColor, stopOpacity: 0 })) : null,
      React.createElement("clipPath", { id: "ufo-dc" },
        React.createElement("rect", { x: hx - dRx - 3, y: 0, width: dRx * 2 + 6, height: hy }))),
    React.createElement("g", { style: gStyle },
      glowOp > 0 ? React.createElement("ellipse", { cx: hx, cy: hy + 15, rx: 72, ry: 35, fill: "url(#ufo-g)" }) : null,
      React.createElement("ellipse", { cx: hx, cy: hy, rx: 48, ry: 14, fill: "url(#ufo-h)" }),
      React.createElement("ellipse", { cx: hx, cy: hy - 1, rx: 46.5, ry: 10, fill: "url(#ufo-h)" }),
      lights.map(function(lp, li2) {
        return React.createElement("g", { key: li2, style: { animation: "ufoLightSpin " + lp.dur + "s linear infinite", transformOrigin: hx + "px " + hy + "px" } },
          React.createElement("circle", { cx: lp.x, cy: lp.y, r: 3.5 * pSize, fill: lp.c, style: { animation: "pulse " + lp.pulse + "s ease-in-out infinite" } }));
      }),
      showAlien ? React.createElement("g", { clipPath: "url(#ufo-dc)" },
        React.createElement("ellipse", { cx: hx, cy: hy - 10, rx: 5, ry: 5.5, fill: "#70b870", opacity: "0.9" }),
        React.createElement("ellipse", { cx: hx, cy: hy - 22, rx: 9, ry: 9, fill: "#70b870", opacity: "0.9" }),
        React.createElement("ellipse", { cx: hx - 4, cy: hy - 23, rx: 3.5, ry: 2.5, fill: "#152215", opacity: "0.95", transform: "rotate(-15," + (hx - 4) + "," + (hy - 23) + ")" }),
        React.createElement("ellipse", { cx: hx + 4, cy: hy - 23, rx: 3.5, ry: 2.5, fill: "#152215", opacity: "0.95", transform: "rotate(15," + (hx + 4) + "," + (hy - 23) + ")" })) : null,
      React.createElement("ellipse", { cx: hx, cy: dY, rx: dRx, ry: dRy, fill: "url(#ufo-d)", clipPath: "url(#ufo-dc)" }),
      React.createElement("ellipse", { cx: hx - dRx * 0.22, cy: dY - dRy * 0.28, rx: dRx * 0.27, ry: dRy * 0.22, fill: "white", opacity: "0.25", transform: "rotate(-20," + (hx - dRx * 0.22) + "," + (dY - dRy * 0.28) + ")", clipPath: "url(#ufo-dc)" })));
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
  return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: PNL, borderBottom: PNLB, boxShadow: "0 3px 6px rgba(0,0,0,0.4)", position: "relative", zIndex: 2 } },
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
    name: "", shape: "square", shapeRotation: 0, cornerRadius: 0,
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

// Effect type registry: drives the type-picker buttons, sorting, the editor.
var VFX_EFFECT_TYPES = [
  { id: "acid_ooze",     label: "Acid Ooze",     color: "#35a035" },
  { id: "burn",          label: "Burn",          color: "#ff6633" },
  { id: "block_destroy", label: "Block Destroy", color: "#80ddff" },
  { id: "drone_explode", label: "Drone Explode", color: "#ffe066" }
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
  drone_explode: { coreColor: "#ffe066", coreOpacity: 1.0, blastColor: "#ff6633", blastOpacity: 1.0, speed: 1.0, spread: 1.0, count: 1.0, particleSize: 1.0 }
};

// Factory presets: the built-in look per effect type (Defaults tab + fallback
// when no custom design is active). Acid Ooze uses the in-game-matching values.
var VFX_FACTORY_PRESETS = [
  { id: "factory_acid_ooze",     name: "Default Acid Ooze",     effectType: "acid_ooze",     isFactory: true, color1: "#1a6a1a", color2: "#35a035", width: 1.3, waveSize: 0.8, freq: 8, speed: 0.5, splash: 1.8 },
  { id: "factory_burn",          name: "Default Burn",          effectType: "burn",          isFactory: true, emberColor: "#ff6633", emberOpacity: 1.0, sparkColor: "#ffffff", sparkOpacity: 0.85, speed: 1.0, spread: 1.0, density: 1.0, emberSize: 1.0 },
  { id: "factory_block_destroy", name: "Default Block Destroy", effectType: "block_destroy", isFactory: true, burstColor: "#c8b8ff", burstOpacity: 1.0, accentColor: "#80ddff", accentOpacity: 1.0, speed: 1.0, spread: 1.0, count: 1.0, particleSize: 1.0 },
  { id: "factory_drone_explode", name: "Default Drone Explode", effectType: "drone_explode", isFactory: true, coreColor: "#ffe066", coreOpacity: 1.0, blastColor: "#ff6633", blastOpacity: 1.0, speed: 1.0, spread: 1.0, count: 1.0, particleSize: 1.0 }
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
  return React.createElement("div", { style: { marginBottom: 12 } },
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#889", marginBottom: 4, fontFamily: "'Exo 2', sans-serif" } },
      React.createElement("span", null, label),
      React.createElement("span", { style: { color: "#bbc" } }, displayValue != null ? displayValue : value)),
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

function BDHeaderBtn(props) {
  var bg = props.accent ? "linear-gradient(135deg, #4488ff, #44ddcc)" : props.active ? "rgba(68,136,255,0.2)" : "rgba(255,255,255,0.06)";
  var clr = props.accent ? "#fff" : props.active ? "#88bbff" : "#889";
  var brd = props.accent ? "none" : props.active ? "1px solid rgba(68,136,255,0.4)" : "1px solid rgba(255,255,255,0.08)";
  return React.createElement("button", { onClick: props.onClick, style: { padding: "8px 14px", borderRadius: 8, border: brd, background: bg, color: clr, fontSize: 12, fontFamily: "'Exo 2', sans-serif", fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent", letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap" } }, props.label);
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI STYLES
// ═══════════════════════════════════════════════════════════════

// Unified button style for list cards
var BTN_BASE = { borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Quicksand',sans-serif" };
var BTN_EDIT = Object.assign({}, BTN_BASE, { padding: "5px 12px", background: PNL, border: "1px solid rgba(80,200,255,0.3)", color: "#80ddff" });
var BTN_RENAME = Object.assign({}, BTN_BASE, { padding: "5px 10px", background: PNL, border: PNLB, color: "rgba(200,210,220,0.6)" });
var BTN_EXPORT = Object.assign({}, BTN_BASE, { padding: "5px 10px", background: PNL, border: "1px solid rgba(200,184,255,0.3)", color: "#c8b8ff" });
var BTN_DELETE = Object.assign({}, BTN_BASE, { padding: "5px 10px", background: "rgba(80,20,20,0.4)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff8866" });
var BTN_TOPBAR = Object.assign({}, BTN_BASE, { padding: "6px 8px", borderRadius: 4, background: PNL, border: PNLB, color: "rgba(200,210,220,0.8)", fontSize: 9, letterSpacing: 1, boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" });
var BTN_TOPBAR_ACCENT = Object.assign({}, BTN_TOPBAR, { border: "2px solid rgba(80,200,255,0.3)", color: "#80ddff" });
var BTN_TOPBAR_PURPLE = Object.assign({}, BTN_TOPBAR, { border: "1px solid rgba(200,184,255,0.3)", color: "#c8b8ff" });
var BTN_SAVE = Object.assign({}, BTN_TOPBAR, { background: "linear-gradient(180deg, #2a5a3a, #1a3a28)", border: "2px solid rgba(80,200,100,0.4)", color: "#80dd90" });
var BTN_PLAY = Object.assign({}, BTN_BASE, { padding: "5px 12px", background: "linear-gradient(180deg, #2a5a3a, #1a3a28)", border: "1px solid rgba(80,200,100,0.45)", color: "#80dd90" });
var BTN_SETACTIVE = Object.assign({}, BTN_BASE, { padding: "5px 10px", background: PNL, border: "1px solid rgba(120,200,140,0.4)", color: "rgba(150,220,170,0.8)" });
var BTN_ISACTIVE = Object.assign({}, BTN_BASE, { padding: "5px 10px", background: "linear-gradient(180deg, #2a5a3a, #1a3a28)", border: "1px solid rgba(80,220,120,0.7)", color: "#80dd90" });

// Navigate to the game, optionally auto-playing a custom level by id.
// Hosted detection matches cosmicdriftapp.com (and localhost); the Claude
// artifact sandbox has no real origin, so there we just inform the user.
function navigateToGame(levelId) {
  var url = "index.html";
  if (levelId != null) url = url + "?play=" + encodeURIComponent(levelId);
  try {
    var h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h.indexOf("cosmicdriftapp.com") >= 0) {
      window.location.href = url;
    } else {
      alert("Play is available at your hosted site: cosmicdriftapp.com");
    }
  } catch (e) {
    alert("Play is available at your hosted site: cosmicdriftapp.com");
  }
}

// Unified card style for list items
var CARD_STYLE = { background: "rgba(20,20,35,0.6)", border: "1px solid rgba(60,60,80,0.4)", borderRadius: 8, padding: "10px 12px", marginBottom: 8 };

// Overlay background
var OVERLAY_BG = { position: "fixed", inset: 0, zIndex: 500, background: "rgba(5,5,20,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" };
var OVERLAY_BOX = { background: "linear-gradient(170deg,#151040,#1a0a2e)", borderRadius: 16, padding: "20px 24px", textAlign: "center", maxWidth: 300, animation: "introFadeIn 0.25s ease-out" };

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

// ═══════════════════════════════════════════════════════════════
// MAIN WORKSHOP COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CosmicWorkshop() {
  // ── Screen state ──
  var _scr = useState("splash"), screen = _scr[0], setScreen = _scr[1];

  // ══ BLOCK DESIGNER STATE ══
  var _bdDesign = useState(function() { return bdDefaultDesign(); }), bdDesign = _bdDesign[0], setBdDesign = _bdDesign[1];
  var _bdSaved = useState([]), bdSaved = _bdSaved[0], setBdSaved = _bdSaved[1];
  var _bdActive = useState({}), bdActiveMap = _bdActive[0], setBdActiveMap = _bdActive[1];
  var _bdEditId = useState(null), bdEditId = _bdEditId[0], setBdEditId = _bdEditId[1];
  var _bdActivePanel = useState(null), bdActivePanel = _bdActivePanel[0], setBdActivePanel = _bdActivePanel[1];
  var _bdPhase = useState(1), bdPhase = _bdPhase[0], setBdPhase = _bdPhase[1];
  var _bdLoaded = useState(false), bdLoaded = _bdLoaded[0], setBdLoaded = _bdLoaded[1];
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
  var _vfxEditDesign = useState(function() { return vfxDefaultDesign(null); }), vfxEditDesign = _vfxEditDesign[0], setVfxEditDesign = _vfxEditDesign[1];
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
  var _ufoSaveStatus = useState(""), ufoSaveStatus = _ufoSaveStatus[0], setUfoSaveStatus = _ufoSaveStatus[1];
  var _ufoDeletingId = useState(null), ufoDeletingId = _ufoDeletingId[0], setUfoDeletingId = _ufoDeletingId[1];
  var _ufoBackWarn = useState(false), ufoShowBackWarn = _ufoBackWarn[0], setUfoShowBackWarn = _ufoBackWarn[1];
  var ufoEditDirtyRef = useRef(false);
  var bdScrollRef = useRef(null);

  // ══ LEVEL BUILDER STATE ══
  var _lbScreen = useState("list"), lbScreen = _lbScreen[0], setLbScreen = _lbScreen[1];
  var _bg = useState(function() { return new Array(COLS * ROWS).fill(0); }), builderGrid = _bg[0], setBuilderGrid = _bg[1];
  var _bss = useState(3), builderShipStart = _bss[0], setBuilderShipStart = _bss[1];
  var _sbt = useState(null), selectedBlockType = _sbt[0], setSelectedBlockType = _sbt[1];
  var _cratePanel = useState(false), crateSubPanelOpen = _cratePanel[0], setCrateSubPanelOpen = _cratePanel[1];
  var _crateType = useState(9), selectedCrateType = _crateType[0], setSelectedCrateType = _crateType[1];
  var _eli = useState(null), editingLevelId = _eli[0], setEditingLevelId = _eli[1];
  var _bln = useState(""), builderLevelName = _bln[0], setBuilderLevelName = _bln[1];
  var _bdr = useState(false), builderDirty = _bdr[0], setBuilderDirty = _bdr[1];
  var _bwarn = useState(null), builderWarn = _bwarn[0], setBuilderWarn = _bwarn[1];
  var _erase = useState(false), eraserActive = _erase[0], setEraserActive = _erase[1];
  var _bplasma = useState(START_PLASMA), builderPlasma = _bplasma[0], setBuilderPlasma = _bplasma[1];
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
  var _sortMode = useState("date_new"), sortMode = _sortMode[0], setSortMode = _sortMode[1];
  var _showImp = useState(false), showImport = _showImp[0], setShowImport = _showImp[1];
  var _impText = useState(""), importText = _impText[0], setImportText = _impText[1];
  var _impErr = useState(""), importError = _impErr[0], setImportError = _impErr[1];
  var _backWarn = useState(false), showBackWarn = _backWarn[0], setShowBackWarn = _backWarn[1];
  var savingRef = useRef(false);
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
      setBdSaved(designs);
      setBdLoaded(true);
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
          }
        }).catch(function() {}); } catch(e) {}
      }
    });
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

  function loadSavedLevels() {
    setLevelsLoading(true);
    if (!window.storage || !window.storage.get) { setSavedLevels([SAMPLE_LEVEL]); setLevelsLoading(false); return; }
    window.storage.get(LEVEL_STORAGE_KEY).then(function(r) {
      if (r && r.value) {
        var levels = JSON.parse(r.value);
        levels.sort(function(a, b) { return (b.modified || 0) - (a.modified || 0); });
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

  function openBuilder(levelData) {
    if (levelData) {
      setBuilderGrid(levelData.grid.slice());
      setBuilderShipStart(levelData.shipStart != null ? levelData.shipStart : 3);
      setEditingLevelId(levelData.id || null);
      setBuilderLevelName(levelData.name || "");
      setBuilderPlasma(levelData.startPlasma || START_PLASMA);
    } else {
      setBuilderGrid(new Array(COLS * ROWS).fill(0));
      setBuilderShipStart(3);
      setEditingLevelId(null);
      setBuilderLevelName("");
      setBuilderPlasma(START_PLASMA);
    }
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
  function handleBuilderGridTM(e) { e.preventDefault(); if (!builderDragRef.current || !builderDragRef.current.active) return; var t = e.touches[0]; var idx = getBuilderIdxFromTouch(t); if (idx >= 0 && idx !== builderDragRef.current.lastIdx) { setBuilderGrid(function(prev) { var g = prev.slice(); if (eraserActive) { g[idx] = 0; } else if (selectedBlockType !== null && g[idx] !== selectedBlockType) { if (selectedBlockType === 17 && g.indexOf(17) >= 0) return prev; g[idx] = selectedBlockType; } return g; }); setBuilderDirty(true); builderDragRef.current.lastIdx = idx; } }
  function handleBuilderGridTE(e) { e.preventDefault(); builderDragRef.current = null; setTimeout(function() { builderTouchUsedRef.current = false; }, 300); }
  function handleBuilderGridMD(e) { if (builderTouchUsedRef.current) return; builderTouchUsedRef.current = true; var canDrag = selectedBlockType !== null || eraserActive; builderDragRef.current = { lastIdx: -1, active: canDrag }; var idx = getBuilderIdxFromTouch(e); if (idx >= 0) { builderCellAction(idx); builderDragRef.current.lastIdx = idx; } }
  function handleBuilderGridMM(e) { if (!builderDragRef.current || !builderDragRef.current.active) return; var idx = getBuilderIdxFromTouch(e); if (idx >= 0 && idx !== builderDragRef.current.lastIdx) { setBuilderGrid(function(prev) { var g = prev.slice(); if (eraserActive) { g[idx] = 0; } else if (selectedBlockType !== null && g[idx] !== selectedBlockType) { if (selectedBlockType === 17 && g.indexOf(17) >= 0) return prev; g[idx] = selectedBlockType; } return g; }); setBuilderDirty(true); builderDragRef.current.lastIdx = idx; } }
  function handleBuilderGridMU() { builderDragRef.current = null; setTimeout(function() { builderTouchUsedRef.current = false; }, 100); }
  function handleBuilderGridClick(e) { if (builderTouchUsedRef.current) return; if (!builderGridRef.current) return; var r = builderGridRef.current.getBoundingClientRect(); var x = e.clientX - r.left, y = e.clientY - r.top; var col = Math.floor(x / (r.width / COLS)); var row = Math.floor(y / (r.height / ROWS)); if (col >= 0 && col < COLS && row >= 0 && row < ROWS) { builderCellAction(row * COLS + col); } }

  function validateBuilderGrid(g) { var hasDestructible = false; for (var i = 0; i < g.length; i++) { if (g[i] > 0 && !WIN_EXEMPT[g[i]]) { hasDestructible = true; break; } } return hasDestructible; }

  function doSaveLevel(id, name) {
    if (savingRef.current) return;
    savingRef.current = true;
    var levelId = id || genUUID();
    var now = Date.now();
    var nowStr = new Date().toLocaleString();
    var entry = { id: levelId, name: name || "Untitled Level", grid: builderGrid.slice(), shipStart: builderShipStart, startPlasma: builderPlasma, created: now, modified: now, savedAt: nowStr };
    setSavedLevels(function(prev) {
      var levels = prev.slice();
      var found = false;
      for (var i = 0; i < levels.length; i++) { if (levels[i].id === levelId) { entry.created = levels[i].created || now; levels[i] = entry; found = true; break; } }
      if (!found) levels.push(entry);
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

  function bdUpdateDesign(key, value) {
    setBdDesign(function(prev) {
      var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
      if (bdPhase > 1 && PHASE_PROPS.indexOf(key) >= 0 && next.phases) {
        var newPhases = {}; Object.keys(next.phases).forEach(function(p) { newPhases[p] = {}; Object.keys(next.phases[p]).forEach(function(pk) { newPhases[p][pk] = next.phases[p][pk]; }); });
        if (!newPhases[bdPhase]) newPhases[bdPhase] = {};
        newPhases[bdPhase][key] = value; next.phases = newPhases;
      } else { next[key] = value; }
      return next;
    });
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
    if (design) {
      var loaded = {}; Object.keys(design).forEach(function(k) { loaded[k] = design[k]; });
      setBdDesign(loaded);
      setBdEditId(design.id || null);
    } else {
      setBdDesign(bdDefaultDesign());
      setBdEditId(null);
    }
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
  function vfxUpdateDesign(key, value) {
    setVfxEditDesign(function(prev) {
      var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
      next[key] = value; return next;
    });
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
    if (design) {
      var loaded = {}; Object.keys(design).forEach(function(k) { loaded[k] = design[k]; });
      setVfxEditDesign(loaded);
      setVfxEditId(design.id || null);
    } else {
      setVfxEditDesign(vfxDefaultDesign(null));
      setVfxEditId(null);
    }
    setVfxDirty(false);
    setVfxSaveStatus("");
    setVfxCurrentView("editor");
  }
  function vfxCopyPreset(preset) {
    var copy = {}; Object.keys(preset).forEach(function(k) { if (k !== "isFactory" && k !== "id") copy[k] = preset[k]; });
    copy.name = preset.name + " (custom)";
    setVfxEditDesign(copy);
    setVfxEditId(null);
    setVfxDirty(true);
    setVfxSaveStatus("");
    setVfxCurrentView("editor");
  }
  function vfxResetDesign() {
    var params = VFX_DEFAULTS[vfxEditDesign.effectType] || {};
    setVfxEditDesign(function(prev) {
      var next = { name: prev.name, effectType: prev.effectType };
      if (prev.id) next.id = prev.id;
      if (prev.createdAt) next.createdAt = prev.createdAt;
      Object.keys(params).forEach(function(k) { next[k] = params[k]; });
      return next;
    });
    setVfxDirty(true);
    setVfxPrevKey(function(k) { return k + 1; });
  }
  // Pick (or switch) the effect type in the editor. Switching resets the
  // type-specific params to that type's defaults, since each effect's controls
  // are entirely different; the name and ids are kept.
  function vfxPickEffectType(type) {
    if (vfxEditDesign.effectType === type) return;
    var params = VFX_DEFAULTS[type] || {};
    setVfxEditDesign(function(prev) {
      var next = { name: prev.name, effectType: type };
      if (prev.id) next.id = prev.id;
      if (prev.createdAt) next.createdAt = prev.createdAt;
      Object.keys(params).forEach(function(k) { next[k] = params[k]; });
      return next;
    });
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

  function renderImportOverlay(title, text, setText, error, setError, onImport, onClose) {
    return React.createElement("div", { style: OVERLAY_BG, onClick: function(e) { e.stopPropagation(); } },
      React.createElement("div", { onClick: function(e) { e.stopPropagation(); }, style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(80,200,255,0.3)", maxWidth: 320, width: "90%" }) },
        React.createElement("div", { style: { color: "#80ddff", fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Quicksand',sans-serif" } }, title),
        React.createElement("div", { style: { color: "rgba(180,200,220,0.4)", fontSize: 11, marginBottom: 12 } }, "Paste an exported code:"),
        React.createElement("textarea", { value: text, onChange: function(e) { setText(e.target.value); setError(""); }, placeholder: "Paste JSON here...", style: { width: "100%", height: 90, padding: 8, borderRadius: 6, background: SCRN, border: error ? "2px solid rgba(255,80,60,0.5)" : SCRNB, color: "#b0c8d8", fontSize: 16, fontFamily: "monospace", resize: "none", outline: "none", boxSizing: "border-box" } }),
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

  function renderBackWarnOverlay(onStay, onLeave) {
    return React.createElement("div", { style: OVERLAY_BG },
      React.createElement("div", { style: Object.assign({}, OVERLAY_BOX, { border: "1px solid rgba(120,80,255,0.3)", maxWidth: 280 }) },
        React.createElement("div", { style: { color: "#c8b8ff", fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Quicksand',sans-serif" } }, "Unsaved Changes"),
        React.createElement("div", { style: { color: "rgba(200,184,255,0.5)", fontSize: 12, marginBottom: 16 } }, "You have unsaved changes. Leave anyway?"),
        React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "center" } },
          React.createElement("div", { onClick: onStay, style: { padding: "8px 20px", borderRadius: 16, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "Stay"),
          React.createElement("div", { onClick: onLeave, style: { padding: "8px 20px", borderRadius: 16, background: "rgba(255,60,60,0.3)", border: "1px solid rgba(255,80,80,0.35)", color: "#ff8866", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Leave"))));
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
  function ufoOpenNew() {
    ufoEditDirtyRef.current = false;
    setUfoEditId(null);
    setUfoEditDesign(Object.assign({}, UFO_DEFAULT_DESIGN, { name: "" }));
    setUfoView("editor");
  }
  function ufoOpenEditor(design) {
    ufoEditDirtyRef.current = false;
    setUfoEditId(design.id);
    setUfoEditDesign(Object.assign({}, design));
    setUfoView("editor");
  }
  function ufoUpdateEdit(key, val) {
    ufoEditDirtyRef.current = true;
    setUfoEditDesign(function(prev) { var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; }); next[key] = val; return next; });
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

  // RENDER
  // ═══════════════════════════════════════

  return React.createElement("div", { style: { position: "fixed", inset: 0, background: "#0b0c1a", fontFamily: "'Quicksand',sans-serif", overflow: "hidden" } },
    React.createElement("style", null, ANIM_CSS),
    React.createElement("div", { style: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" } }, React.createElement(Stars, null)),

    // ═══ SPLASH SCREEN ═══
    screen === "splash" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 24 } },
      React.createElement("div", { style: { textAlign: "center", marginBottom: 40 } },
        React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: 4, color: "rgba(180,200,220,0.3)", textTransform: "uppercase", marginBottom: 8 } }, "COSMIC DRIFT"),
        React.createElement("div", { style: { fontSize: 28, fontWeight: 700, letterSpacing: 3, color: "#80ddff", textTransform: "uppercase", textShadow: "0 0 20px rgba(80,200,255,0.3)" } }, "WORKSHOP"),
        React.createElement("div", { style: { fontSize: 10, color: "rgba(180,200,220,0.2)", marginTop: 8, letterSpacing: 1 } }, WORKSHOP_VERSION)),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 320 } },
        // Play card
        React.createElement("div", { onClick: function() { navigateToGame(); }, style: { background: "linear-gradient(135deg, rgba(80,220,120,0.1), rgba(80,220,120,0.02))", border: "1px solid rgba(80,220,120,0.3)", borderRadius: 12, padding: "20px 20px", cursor: "pointer" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } },
            React.createElement("div", { style: { width: 48, height: 48, borderRadius: 10, background: "rgba(80,220,120,0.1)", border: "1px solid rgba(80,220,120,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M7 4 L20 12 L7 20 Z", fill: "#80dd90" }))),
            React.createElement("div", null,
              React.createElement("div", { style: { color: "#80dd90", fontSize: 16, fontWeight: 700, letterSpacing: 1 } }, "Play Cosmic Drift"),
              React.createElement("div", { style: { color: "rgba(180,200,220,0.35)", fontSize: 11, marginTop: 3 } }, "Jump into the game")))),
        // Level Builder card
        React.createElement("div", { onClick: function() { loadSavedLevels(); setScreen("builder"); setLbScreen("list"); }, style: { background: "linear-gradient(135deg, rgba(80,200,255,0.08), rgba(80,200,255,0.02))", border: "1px solid rgba(80,200,255,0.2)", borderRadius: 12, padding: "20px 20px", cursor: "pointer" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } },
            React.createElement("div", { style: { width: 48, height: 48, borderRadius: 10, background: "rgba(80,200,255,0.1)", border: "1px solid rgba(80,200,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24" }, React.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1", fill: "none", stroke: "#80ddff", strokeWidth: "1.5" }), React.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1", fill: "#80ddff", opacity: "0.4" }), React.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1", fill: "#80ddff", opacity: "0.4" }), React.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1", fill: "none", stroke: "#80ddff", strokeWidth: "1.5", strokeDasharray: "2 2" }))),
            React.createElement("div", null,
              React.createElement("div", { style: { color: "#80ddff", fontSize: 16, fontWeight: 700, letterSpacing: 1 } }, "Level Builder"),
              React.createElement("div", { style: { color: "rgba(180,200,220,0.35)", fontSize: 11, marginTop: 3 } }, savedLevels.length > 0 ? savedLevels.length + " saved level" + (savedLevels.length !== 1 ? "s" : "") : "Design custom levels")))),
        // Block Designer card
        React.createElement("div", { onClick: function() { setScreen("designer"); setBdCurrentView("list"); }, style: { background: "linear-gradient(135deg, rgba(200,184,255,0.08), rgba(200,184,255,0.02))", border: "1px solid rgba(200,184,255,0.2)", borderRadius: 12, padding: "20px 20px", cursor: "pointer" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } },
            React.createElement("div", { style: { width: 48, height: 48, borderRadius: 10, background: "rgba(200,184,255,0.1)", border: "1px solid rgba(200,184,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24" }, React.createElement("rect", { x: "4", y: "4", width: "16", height: "16", rx: "3", fill: "none", stroke: "#c8b8ff", strokeWidth: "1.5" }), React.createElement("circle", { cx: "12", cy: "12", r: "4", fill: "#c8b8ff", opacity: "0.4" }), React.createElement("path", { d: "M8 4v16M16 4v16M4 8h16M4 16h16", stroke: "#c8b8ff", strokeWidth: "0.5", opacity: "0.2" }))),
            React.createElement("div", null,
              React.createElement("div", { style: { color: "#c8b8ff", fontSize: 16, fontWeight: 700, letterSpacing: 1 } }, "Block Designer"),
              React.createElement("div", { style: { color: "rgba(180,200,220,0.35)", fontSize: 11, marginTop: 3 } }, bdSaved.length > 0 ? bdSaved.length + " saved design" + (bdSaved.length !== 1 ? "s" : "") : "Create custom block skins")))),
        // Coming soon
        React.createElement("div", { onClick: function() { setScreen("vfx"); }, style: { background: "linear-gradient(135deg, rgba(255,180,60,0.08), rgba(255,140,40,0.02))", border: "1px solid rgba(255,180,60,0.2)", borderRadius: 12, padding: "20px 20px", cursor: "pointer" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } },
            React.createElement("div", { style: { width: 48, height: 48, borderRadius: 10, background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24" },
                React.createElement("circle", { cx: "12", cy: "12", r: "3", fill: "#ffb43c" }),
                React.createElement("path", { d: "M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l-2.1 2.1M7.7 16.3l-2.1 2.1", stroke: "#ffb43c", strokeWidth: "1.8", strokeLinecap: "round" }))),
            React.createElement("div", null,
              React.createElement("div", { style: { color: "#ffb43c", fontSize: 16, fontWeight: 700, letterSpacing: 1 } }, "VFX Studio"),
              React.createElement("div", { style: { color: "rgba(180,200,220,0.35)", fontSize: 11, marginTop: 3 } }, "Customize visual effects")))),
        // UFO Customizer card
        React.createElement("div", { onClick: function() { setScreen("ufo"); }, style: { background: "linear-gradient(135deg, rgba(100,220,180,0.08), rgba(60,200,160,0.02))", border: "1px solid rgba(100,220,180,0.2)", borderRadius: 12, padding: "20px 20px", cursor: "pointer" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } },
            React.createElement("div", { style: { width: 48, height: 48, borderRadius: 10, background: "rgba(100,220,180,0.1)", border: "1px solid rgba(100,220,180,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              React.createElement(UFOBlockSvg, { size: 38, design: ufoGetActiveDesign() })),
            React.createElement("div", null,
              React.createElement("div", { style: { color: "#64dcb4", fontSize: 16, fontWeight: 700, letterSpacing: 1 } }, "UFO Customizer"),
              React.createElement("div", { style: { color: "rgba(180,200,220,0.35)", fontSize: 11, marginTop: 3 } }, "Customize your UFO's appearance")))),
      React.createElement("div", { style: { position: "absolute", bottom: 16, color: "rgba(180,200,220,0.15)", fontSize: 9, letterSpacing: 1 } }, "Created by Dan Medwin and Claude"))),

    // ═══ LEVEL BUILDER ═══
    screen === "builder" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" } },

      // ── MY LEVELS LIST ──
      lbScreen === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: function() { setScreen("splash"); }, backLabel: "Workshop", title: "My Levels", color: "#80ddff",
          rightContent: React.createElement("div", { style: { display: "flex", gap: 4 } },
            React.createElement("div", { onClick: function() { setShowImport(true); setImportText(""); setImportError(""); }, style: BTN_TOPBAR_PURPLE }, "Import"),
            savedLevels.length > 0 && React.createElement("div", { onClick: exportAllLevels, style: Object.assign({}, BTN_TOPBAR, { color: "rgba(200,184,255,0.6)", fontSize: 8 }) }, "Exp All"),
            React.createElement("div", { onClick: function() { openBuilder(); }, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #1a3a4a, #0f2a38)", boxShadow: "0 0 8px rgba(80,200,255,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, "+ New")) }),
        savedLevels.length > 1 && renderSortBar(sortMode, setSortMode),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px", position: "relative", zIndex: 1 } },
          levelsLoading && React.createElement("div", { style: { textAlign: "center", padding: 40, color: "rgba(180,200,220,0.4)", fontSize: 14 } }, "Loading..."),
          !levelsLoading && savedLevels.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 14, marginBottom: 8 } }, "No saved levels yet"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Build a new level or tap Import to paste a level code.")),
          !levelsLoading && sortItems(savedLevels, sortMode, "modified").map(function(lv) {
            var dateStr = lv.savedAt || (lv.modified ? new Date(lv.modified).toLocaleString() : "");
            return React.createElement("div", { key: lv.id, style: CARD_STYLE },
              renamingId === lv.id ? React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8, alignItems: "center" } },
                React.createElement("input", { value: renamingName, onChange: function(e) { setRenamingName(e.target.value); }, style: { flex: 1, padding: "4px 8px", borderRadius: 4, background: SCRN, border: SCRNB, color: "#b0c8d8", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none" } }),
                React.createElement("div", { onClick: function() { renameLevel(lv.id, renamingName); }, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
                React.createElement("div", { onClick: function() { setRenamingId(null); }, style: { padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "X"))
              : React.createElement("div", { style: { marginBottom: 8 } },
                React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, lv.name || "Untitled"),
                React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, dateStr)),
              React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
                React.createElement("div", { onClick: function() { navigateToGame(lv.id); }, style: BTN_PLAY }, "PLAY"),
                React.createElement("div", { onClick: function() { openBuilder(lv); }, style: BTN_EDIT }, "EDIT"),
                React.createElement("div", { onClick: function() { setRenamingId(lv.id); setRenamingName(lv.name || ""); }, style: BTN_RENAME }, "RENAME"),
                React.createElement("div", { onClick: function() { exportLevel(lv); }, style: BTN_EXPORT }, "EXPORT"),
                React.createElement("div", { onClick: function() { setDeletingId(lv.id); }, style: BTN_DELETE }, "DELETE")));
          })),
        deletingId && renderDeleteOverlay("Delete Level?", function() { setDeletingId(null); }, function() { deleteLevel(deletingId); }),
        exportId && renderExportOverlay("Export Level", exportText, copied, function() { copyToClipboard(exportText, setCopied); }, function() { setExportId(null); }),
        showImport && renderImportOverlay("Import Level", importText, setImportText, importError, setImportError, handleImport, function() { setShowImport(false); setImportText(""); setImportError(""); }),
        showExportAll && renderExportOverlay("Export All Levels (" + savedLevels.length + ")", exportAllText, copied, function() { copyToClipboard(exportAllText, setCopied); }, function() { setShowExportAll(false); })),

      // ── BUILDER EDITOR ──
      lbScreen === "editor" && React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, padding: "6px 8px", background: PNL, borderBottom: PNLB, boxShadow: "0 3px 6px rgba(0,0,0,0.4)", position: "relative", zIndex: 2 } },
          React.createElement("div", { onClick: handleBuilderBack, style: Object.assign({}, BTN_TOPBAR, { display: "flex", alignItems: "center", gap: 3 }) }, React.createElement("svg", { width: "8", height: "8", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M15 18l-6-6 6-6", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" })), "My Levels"),
          React.createElement("div", { ref: tourSaveRef, style: { display: "flex", gap: 5 } },
            React.createElement("div", { onClick: handleBuilderSave, style: BTN_SAVE }, "Save"),
            React.createElement("div", { onClick: handleBuilderSaveAndPlay, style: Object.assign({}, BTN_SAVE, { display: "flex", alignItems: "center", gap: 3 }) }, React.createElement("svg", { width: "8", height: "8", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 3 L20 12 L5 21 Z", fill: "currentColor" })), "Save & Play")),
          React.createElement("div", { style: { flex: 1, background: SCRN, border: SCRNB, borderRadius: 4, padding: "4px 8px", boxShadow: SCRNS } },
            React.createElement("input", { value: builderLevelName, onChange: function(e) { setBuilderLevelName(e.target.value); setBuilderDirty(true); }, placeholder: "Level name...", style: { width: "100%", background: "transparent", border: "none", outline: "none", color: "#b0c8d8", fontSize: 16, fontWeight: 600, fontFamily: "'Quicksand',sans-serif", letterSpacing: 0.5 } })),
          React.createElement("div", { onClick: function() { setBuilderTourStep(0); }, style: { width: 28, height: 28, borderRadius: 4, background: PNL, border: PNLB, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" } }, React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 16 16" }, React.createElement("circle", { cx: "8", cy: "8", r: "7", fill: "none", stroke: "rgba(180,200,220,0.5)", strokeWidth: "1.5" }), React.createElement("text", { x: "8", y: "12", textAnchor: "middle", fill: "rgba(180,200,220,0.5)", fontSize: "10", fontWeight: "700" }, "?")))),
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
              return React.createElement("div", { key: c, onClick: function() { setBuilderShipStart(c); setBuilderDirty(true); }, style: { position: "absolute", left: (c / COLS * 100) + "%", width: (100 / COLS) + "%", top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" } },
                isSelected ? React.createElement("svg", { viewBox: "0 0 36 40", width: "28", height: "32" }, React.createElement("defs", null, React.createElement("linearGradient", { id: "bsg", x1: "0", y1: "0", x2: "0", y2: "1" }, React.createElement("stop", { offset: "0%", stopColor: "#ffd0ff" }), React.createElement("stop", { offset: "100%", stopColor: "#cc70cc" }))), React.createElement("path", { d: "M18 0L4 32L12 27L18 40L24 27L32 32Z", fill: "url(#bsg)" })) : React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: "rgba(255,168,255,0.15)", border: "1px solid rgba(255,168,255,0.1)" } }));
            })),
          React.createElement("div", { ref: tourPlasmaRef, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 6, marginBottom: 2 } },
            React.createElement("div", { onClick: function() { var n = Math.max(1, builderPlasma - 1); setBuilderPlasma(n); setBuilderDirty(true); }, style: { width: 28, height: 28, borderRadius: 4, background: PNL, border: PNLB, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#b0c8d8", fontSize: 16, fontWeight: 700 } }, "-"),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
              React.createElement(PlasmaContainer, { current: builderPlasma, max: 20 }),
              React.createElement("div", { style: { color: "rgba(180,200,220,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 } }, "Plasma")),
            React.createElement("div", { onClick: function() { var n = Math.min(20, builderPlasma + 1); setBuilderPlasma(n); setBuilderDirty(true); }, style: { width: 28, height: 28, borderRadius: 4, background: PNL, border: PNLB, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#b0c8d8", fontSize: 16, fontWeight: 700 } }, "+"))),
        crateSubPanelOpen && React.createElement("div", { style: { position: "relative", zIndex: 3, background: "linear-gradient(180deg, #1a1a2e, #151528)", borderTop: "2px solid rgba(212,168,67,0.3)", padding: "8px 8px 6px", boxShadow: "0 -2px 8px rgba(0,0,0,0.3)" } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } },
            React.createElement("div", { style: { color: "rgba(212,168,67,0.7)", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" } }, "Crate Reward"),
            React.createElement("div", { onClick: function() { setCrateSubPanelOpen(false); }, style: { color: "rgba(180,200,220,0.4)", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "0 4px" } }, "\u2715")),
          React.createElement("div", { style: { display: "flex", gap: 4, justifyContent: "center" } },
            CRATE_VARIANTS.map(function(cv) {
              var isActive2 = selectedCrateType === cv.type;
              return React.createElement("div", { key: cv.type, onClick: function() { setSelectedCrateType(cv.type); setSelectedBlockType(cv.type); setEraserActive(false); setCrateSubPanelOpen(false); }, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 2px 4px", borderRadius: 4, background: isActive2 ? "rgba(100,80,30,0.5)" : "rgba(30,30,50,0.6)", border: isActive2 ? "2px solid rgba(212,168,67,0.6)" : "1px solid rgba(80,80,100,0.3)", cursor: "pointer" } },
                React.createElement("div", { style: { width: 28, height: 28 } }, renderBuilderBlock(cv.type, 28, 0)),
                React.createElement("div", { style: { fontSize: 7, fontWeight: 700, color: isActive2 ? "rgba(212,168,67,0.9)" : "rgba(180,200,220,0.4)", textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center", lineHeight: 1.2 } }, cv.name));
            }))),
        React.createElement("div", { style: { position: "relative", zIndex: 2, background: PNL, borderTop: "3px solid #505058", padding: "8px 6px 10px", boxShadow: "0 -3px 8px rgba(0,0,0,0.3)" } },
          React.createElement("div", { ref: tourPaletteRef, style: { display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" } },
            [1,2,3,5,9,6,7,8,10,17].map(function(t) {
              if (t === 9) {
                var isCrateActive = isCrate(selectedBlockType);
                return React.createElement("div", { key: t, ref: tourCrateRef, onClick: function() { if (isCrateActive && !crateSubPanelOpen) { setCrateSubPanelOpen(true); } else if (crateSubPanelOpen) { return; } else { setSelectedBlockType(selectedCrateType); setEraserActive(false); setCrateSubPanelOpen(true); } }, style: { width: "18%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "5px 2px 4px", borderRadius: crateSubPanelOpen ? "0 0 4px 4px" : 4, background: crateSubPanelOpen ? "rgba(100,80,30,0.35)" : isCrateActive ? "rgba(40,100,120,0.4)" : PNL, border: crateSubPanelOpen ? "2px solid rgba(212,168,67,0.4)" : isCrateActive ? "2px solid rgba(80,200,255,0.5)" : PNLB, cursor: "pointer", boxShadow: crateSubPanelOpen ? "inset 0 0 10px rgba(212,168,67,0.15), 0 0 6px rgba(212,168,67,0.15)" : isCrateActive ? "inset 0 0 10px rgba(80,200,255,0.15), 0 0 8px rgba(80,200,255,0.2)" : "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" } },
                  React.createElement("div", { style: { width: 28, height: 28 } }, renderBuilderBlock(selectedCrateType, 28, 0)),
                  React.createElement("div", { style: { fontSize: 7, fontWeight: 700, color: crateSubPanelOpen ? "rgba(212,168,67,0.8)" : isCrateActive ? "#80ddff" : "rgba(180,200,220,0.5)", textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center", lineHeight: 1.2 } }, crateSubPanelOpen ? "OPEN" : isCrateActive ? "ACTIVE" : "Crate"));
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
            React.createElement("div", { onClick: function() { setBuilderGrid(new Array(COLS * ROWS).fill(0)); setBuilderDirty(true); }, style: { padding: "6px 14px", borderRadius: 4, background: PNL, border: PNLB, cursor: "pointer", color: "rgba(200,210,220,0.5)", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" } }, "Clear All"))),
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
        showBackWarn && renderBackWarnOverlay(function() { setShowBackWarn(false); }, function() { setShowBackWarn(false); loadSavedLevels(); setLbScreen("list"); }))),

    // ═══ BLOCK DESIGNER ═══
    screen === "designer" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" } },

      // ── MY DESIGNS LIST ──
      bdCurrentView === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: function() { setScreen("splash"); }, backLabel: "Workshop", title: "My Blocks", color: "#c8b8ff",
          rightContent: React.createElement("div", { style: { display: "flex", gap: 4 } },
            React.createElement("div", { onClick: function() { setBdShowImport(true); setBdImportText(""); setBdImportError(""); }, style: BTN_TOPBAR_PURPLE }, bdSavedTab === "active" ? "Import Set" : "Import"),
            ((bdSavedTab === "active" && Object.keys(bdActiveMap).length > 0) || (bdSavedTab !== "active" && bdSaved.length > 0)) && React.createElement("div", { onClick: bdSavedTab === "active" ? bdExportActiveBlocks : bdExportAllDesigns, style: Object.assign({}, BTN_TOPBAR, { color: "rgba(200,184,255,0.6)", fontSize: 8 }) }, "Exp All"),
            React.createElement("div", { onClick: function() { bdOpenEditor(null); }, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #1a3a4a, #0f2a38)", boxShadow: "0 0 8px rgba(80,200,255,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, "+ New")) }),
        // Tabs: My Designs / Game Blocks
        React.createElement("div", { style: { display: "flex", margin: "0 10px", borderBottom: "1px solid rgba(60,60,80,0.3)", position: "relative", zIndex: 1 } },
          [["custom", "My Designs (" + bdSaved.length + ")"], ["factory", "Game Blocks"], ["active", "Active Blocks"]].map(function(tab) {
            var active = bdSavedTab === tab[0];
            return React.createElement("div", { key: tab[0], onClick: function() { setBdSavedTab(tab[0]); }, style: { flex: 1, textAlign: "center", padding: "10px 0 8px", color: active ? "#c8b8ff" : "rgba(180,200,220,0.3)", fontSize: 11, fontWeight: active ? 700 : 600, cursor: "pointer", borderBottom: active ? "2px solid #c8b8ff" : "2px solid transparent", letterSpacing: 0.2 } }, tab[1]);
          })),
        bdSavedTab === "custom" && bdSaved.length > 1 && renderSortBar(bdSortMode, setBdSortMode, [["type", "Type"]]),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px", position: "relative", zIndex: 1 } },
          // My Designs tab
          bdSavedTab === "custom" && bdSaved.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 14, marginBottom: 8 } }, "No saved designs yet"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Create a new design or copy a Game Block to start.")),
          bdSavedTab === "custom" && sortItems(bdSaved, bdSortMode, "modifiedAt").map(function(saved) {
            var bt = null; for (var bi = 0; bi < BD_BLOCK_TYPES.length; bi++) { if (BD_BLOCK_TYPES[bi].id === saved.assignedTo) { bt = BD_BLOCK_TYPES[bi]; break; } }
            var dateStr = saved.modifiedAt ? new Date(saved.modifiedAt).toLocaleString() : (saved.createdAt ? new Date(saved.createdAt).toLocaleString() : "");
            return React.createElement("div", { key: saved.id, style: CARD_STYLE },
              bdRenamingId === saved.id ? React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8, alignItems: "center" } },
                React.createElement("input", { value: bdRenamingName, onChange: function(e) { setBdRenamingName(e.target.value); }, style: { flex: 1, padding: "4px 8px", borderRadius: 4, background: SCRN, border: SCRNB, color: "#b0c8d8", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none" } }),
                React.createElement("div", { onClick: function() { bdRenameDesign(saved.id, bdRenamingName); }, style: { padding: "4px 8px", borderRadius: 4, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24" }, React.createElement("path", { d: "M5 13l4 4L19 7", fill: "none", stroke: "#80dd90", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
                React.createElement("div", { onClick: function() { setBdRenamingId(null); }, style: { padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(120,80,255,0.3)", color: "#c8b8ff", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "X"))
              : React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 8, alignItems: "center" } },
                React.createElement(BDBlockPreview, { design: saved, size: 38 }),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, saved.name || "Unnamed"),
                  React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, (bt ? bt.label + " \u00B7 " : "") + saved.shape + (saved.pattern !== "none" ? " \u00B7 " + saved.pattern : "") + (dateStr ? " \u00B7 " + dateStr : "")))),
              React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
                saved.assignedTo && React.createElement("div", { onClick: function() { bdToggleActive(saved); }, style: bdActiveMap[saved.assignedTo] === saved.id ? BTN_ISACTIVE : BTN_SETACTIVE }, bdActiveMap[saved.assignedTo] === saved.id ? "★ Active" : "Set Active"),
                React.createElement("div", { onClick: function() { bdOpenEditor(saved); }, style: BTN_EDIT }, "EDIT"),
                React.createElement("div", { onClick: function() { setBdRenamingId(saved.id); setBdRenamingName(saved.name || ""); }, style: BTN_RENAME }, "RENAME"),
                React.createElement("div", { onClick: function() { bdExportDesign(saved); }, style: BTN_EXPORT }, "EXPORT"),
                React.createElement("div", { onClick: function() { setBdDeletingId(saved.id); }, style: BTN_DELETE }, "DELETE")));
          }),
          // Game Blocks tab
          bdSavedTab === "factory" && BD_FACTORY_PRESETS.map(function(preset) {
            return React.createElement("div", { key: preset.id, style: Object.assign({}, CARD_STYLE, { display: "flex", alignItems: "center", gap: 10 }) },
              React.createElement(BDBlockPreview, { design: preset, size: 38 }),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, preset.name)),
              React.createElement("div", { onClick: function() { bdCopyPreset(preset); }, style: BTN_EDIT }, "Edit Copy"));
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
              customActive && React.createElement("div", { onClick: function() { bdToggleActive(customActive); }, style: BTN_RENAME }, "Use Default"),
              customActive && React.createElement("div", { onClick: function() { bdOpenEditor(customActive); }, style: BTN_EDIT }, "Edit"),
              !customActive && factory && React.createElement("div", { onClick: function() { bdCopyPreset(factory); }, style: BTN_EDIT }, "Edit Copy"));
          })),
        bdDeletingId && renderDeleteOverlay("Delete Design?", function() { setBdDeletingId(null); }, function() { bdDeleteDesign(bdDeletingId); }),
        bdExportId && renderExportOverlay("Export Design", bdExportText, bdCopied, function() { copyToClipboard(bdExportText, setBdCopied); }, function() { setBdExportId(null); }),
        bdShowImport && renderImportOverlay("Import Design", bdImportText, setBdImportText, bdImportError, setBdImportError, bdHandleImport, function() { setBdShowImport(false); setBdImportText(""); setBdImportError(""); }),
        bdImportConfirm && renderImportConfirmOverlay(bdImportConfirm, bdConfirmImport, function() { setBdImportConfirm(null); }),
        bdShowExportAll && renderExportOverlay("Export All Designs (" + bdSaved.length + ")", bdExportAllText, bdCopied, function() { copyToClipboard(bdExportAllText, setBdCopied); }, function() { setBdShowExportAll(false); })),

      // ── DESIGN EDITOR ──
      bdCurrentView === "editor" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: bdHandleBack, backLabel: "My Blocks", title: "Block Designer", color: "#c8b8ff", fontFamily: "'Exo 2', sans-serif",
          rightContent: React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "center" } },
            React.createElement("div", { onClick: bdSaveCurrentDesign, style: BTN_SAVE }, "Save"),
            React.createElement("div", { onClick: function() {
              if (!bdDesign.assignedTo) { setBdSaveStatus("Choose a Block type first"); setTimeout(function() { setBdSaveStatus(""); }, 2500); return; }
              if (!bdEditId || bdDirty) { setBdSaveStatus("Save the design first"); setTimeout(function() { setBdSaveStatus(""); }, 2500); return; }
              bdToggleActive({ id: bdEditId, assignedTo: bdDesign.assignedTo });
            }, style: Object.assign({}, BTN_TOPBAR, { color: bdIsActive ? "#80dd90" : "rgba(200,210,220,0.7)", border: bdIsActive ? "2px solid rgba(80,200,100,0.5)" : PNLB }) }, bdIsActive ? "★ Active" : "Set Active"),
            React.createElement("div", { style: { marginLeft: 4 } }, React.createElement(BDBlockPreview, { design: bdDisplayDesign, size: 36 }))) }),
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
                React.createElement(BDSlider, { label: "Rotation", value: bdDesign.shapeRotation, onChange: function(v) { bdUpdateDesign("shapeRotation", v); }, min: 0, max: 360, step: 5, displayValue: bdDesign.shapeRotation + "\u00b0" }),
                CORNER_SHAPES[bdDesign.shape] && React.createElement(BDSlider, { label: "Corner Radius", value: bdDesign.cornerRadius, onChange: function(v) { bdUpdateDesign("cornerRadius", v); }, min: 0, max: 46, step: 1 })),
              bdActivePanel === "color" && React.createElement(React.Fragment, null,
                React.createElement(BDColorPicker, { value: bdDesign.color, onChange: function(v) { bdUpdateDesign("color", v); }, presets: BD_COLOR_PRESETS }),
                React.createElement(BDSlider, { label: "Fill Opacity", value: bdDesign.fillOpacity != null ? bdDesign.fillOpacity : 1, onChange: function(v) { bdUpdateDesign("fillOpacity", v); }, min: 0, max: 1, step: 0.05, displayValue: Math.round((bdDesign.fillOpacity != null ? bdDesign.fillOpacity : 1) * 100) + "%" })),
              bdActivePanel === "border" && React.createElement(React.Fragment, null,
                React.createElement(BDColorPicker, { value: bdDisplayDesign.borderColor, onChange: function(v) { bdUpdateDesign("borderColor", v); }, label: "Color", presets: BD_COLOR_PRESETS }),
                React.createElement(BDSlider, { label: "Thickness", value: bdDisplayDesign.borderWidth, onChange: function(v) { bdUpdateDesign("borderWidth", v); }, min: 0, max: 8, step: 0.5 }),
                React.createElement(BDSlider, { label: "Border Opacity", value: bdDisplayDesign.borderOpacity != null ? bdDisplayDesign.borderOpacity : 1, onChange: function(v) { bdUpdateDesign("borderOpacity", v); }, min: 0, max: 1, step: 0.05, displayValue: Math.round((bdDisplayDesign.borderOpacity != null ? bdDisplayDesign.borderOpacity : 1) * 100) + "%" }),
                React.createElement(BDToggle, { label: "Glow", value: bdDisplayDesign.glowEnabled, onChange: function(v) { bdUpdateDesign("glowEnabled", v); } }),
                bdDisplayDesign.glowEnabled && React.createElement(React.Fragment, null,
                  React.createElement(BDColorPicker, { value: bdDisplayDesign.glowColor, onChange: function(v) { bdUpdateDesign("glowColor", v); }, label: "Glow Color" }),
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
                    React.createElement(BDSlider, { label: "Opacity", value: bdDesign.patternOpacity, onChange: function(v) { bdUpdateDesign("patternOpacity", v); }, min: 0.1, max: 1, step: 0.05, displayValue: Math.round(bdDesign.patternOpacity * 100) + "%" }),
                    bdDesign.pattern !== "rings" && (function() {
                      var isCraters = bdDesign.pattern === "craters";
                      var sMin = isCraters ? 3 : 0.3, sMax = isCraters ? 10 : 3, sStep = isCraters ? 0.5 : 0.1;
                      var sVal = bdDesign.patternScale == null ? (isCraters ? 10 : 1) : Math.max(sMin, Math.min(sMax, bdDesign.patternScale));
                      return React.createElement(BDSlider, { label: "Scale", value: sVal, onChange: function(v) { bdUpdateDesign("patternScale", v); }, min: sMin, max: sMax, step: sStep, displayValue: sVal.toFixed(1) + "x" });
                    })(),
                    bdDesign.pattern !== "rings" && React.createElement(BDSlider, { label: "Rotation", value: bdDesign.patternRotation, onChange: function(v) { bdUpdateDesign("patternRotation", v); }, min: 0, max: 360, step: 5, displayValue: bdDesign.patternRotation + "\u00b0" }),
                    caps.lineWidth && React.createElement(BDSlider, { label: "Line Width", value: bdDesign.patternLineWidth, onChange: function(v) { bdUpdateDesign("patternLineWidth", v); }, min: 0.5, max: 4, step: 0.25 }),
                    caps.spacing && React.createElement(BDSlider, { label: "Spacing", value: bdDesign.patternSpacing == null ? 10 : bdDesign.patternSpacing, onChange: function(v) { bdUpdateDesign("patternSpacing", v); }, min: 4, max: 30, step: 1, displayValue: String(Math.round(bdDesign.patternSpacing == null ? 10 : bdDesign.patternSpacing)) }),
                    caps.ringSpacing && React.createElement(BDSlider, { label: "Ring Spacing", value: bdDesign.patternRingSpacing == null ? 6 : bdDesign.patternRingSpacing, onChange: function(v) { bdUpdateDesign("patternRingSpacing", v); }, min: 2, max: 30, step: 1, displayValue: String(Math.round(bdDesign.patternRingSpacing == null ? 6 : bdDesign.patternRingSpacing)) }),
                    caps.filled && React.createElement(BDToggle, { label: "Filled", value: bdDesign.patternFilled, onChange: function(v) { bdUpdateDesign("patternFilled", v); } }));
                })()),
              bdActivePanel === "icon" && React.createElement(React.Fragment, null,
                React.createElement(BDOptionGrid, { options: BD_ICONS.map(function(ic) { return { id: ic.id, label: ic.label }; }), value: bdDisplayDesign.icon, onChange: function(v) { bdUpdateDesign("icon", v); }, columns: 4 }),
                bdDisplayDesign.icon !== "none" && React.createElement(React.Fragment, null,
                  React.createElement(BDColorPicker, { value: bdDisplayDesign.iconColor, onChange: function(v) { bdUpdateDesign("iconColor", v); }, label: "Color" }),
                  React.createElement(BDSlider, { label: "Opacity", value: bdDisplayDesign.iconOpacity, onChange: function(v) { bdUpdateDesign("iconOpacity", v); }, min: 0.1, max: 1, step: 0.05, displayValue: Math.round(bdDisplayDesign.iconOpacity * 100) + "%" }),
                  React.createElement(BDSlider, { label: "Rotation", value: bdDisplayDesign.iconRotation || 0, onChange: function(v) { bdUpdateDesign("iconRotation", v); }, min: 0, max: 360, step: 5, displayValue: (bdDisplayDesign.iconRotation || 0) + "°" }),
                  React.createElement(BDToggle, { label: "Icon Glow", value: bdDisplayDesign.iconGlow, onChange: function(v) { bdUpdateDesign("iconGlow", v); } }),
                  bdDisplayDesign.iconGlow && React.createElement(React.Fragment, null,
                    React.createElement(BDColorPicker, { value: bdDisplayDesign.iconGlowColor, onChange: function(v) { bdUpdateDesign("iconGlowColor", v); }, label: "Glow Color" }),
                    React.createElement(BDSlider, { label: "Glow Spread", value: bdDisplayDesign.iconGlowIntensity, onChange: function(v) { bdUpdateDesign("iconGlowIntensity", v); }, min: 1, max: 12, step: 0.5 }))))))),
        bdShowBackWarn && renderBackWarnOverlay(function() { setBdShowBackWarn(false); }, function() { setBdShowBackWarn(false); setBdCurrentView("list"); }))),

    screen === "vfx" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" } },

      // ── VFX EFFECTS LIST ──
      vfxCurrentView === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: function() { setScreen("splash"); }, backLabel: "Workshop", title: "VFX Studio", color: "#ffb43c",
          rightContent: React.createElement("div", { style: { display: "flex", gap: 4 } },
            React.createElement("div", { onClick: function() { setVfxShowImport(true); setVfxImportText(""); setVfxImportError(""); }, style: BTN_TOPBAR_PURPLE }, "Import"),
            vfxSaved.length > 0 && React.createElement("div", { onClick: vfxExportAllDesigns, style: Object.assign({}, BTN_TOPBAR, { color: "rgba(255,180,60,0.7)", fontSize: 8 }) }, "Exp All"),
            React.createElement("div", { onClick: function() { vfxOpenEditor(null); }, style: Object.assign({}, BTN_TOPBAR_ACCENT, { border: "2px solid rgba(255,180,60,0.4)", color: "#ffb43c" }) }, "+ New")) }),
        // Tabs
        React.createElement("div", { style: { display: "flex", margin: "8px 10px 0", borderBottom: "1px solid rgba(60,60,80,0.3)", position: "relative", zIndex: 1 } },
          [["custom", "My Effects (" + vfxSaved.length + ")"], ["factory", "Defaults"], ["active", "Active"]].map(function(tab) {
            var tabActive = vfxSavedTab === tab[0];
            return React.createElement("div", { key: tab[0], onClick: function() { setVfxSavedTab(tab[0]); }, style: { flex: 1, textAlign: "center", padding: "10px 0 8px", color: tabActive ? "#ffb43c" : "rgba(180,200,220,0.3)", fontSize: 11, fontWeight: tabActive ? 700 : 600, cursor: "pointer", borderBottom: tabActive ? "2px solid #ffb43c" : "2px solid transparent" } }, tab[1]);
          })),
        vfxSavedTab === "custom" && vfxSaved.length > 1 && renderSortBar(vfxSortMode, setVfxSortMode, [["effect", "Effect"]]),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px", position: "relative", zIndex: 1 } },
          vfxSavedTab === "custom" && vfxSaved.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 14, marginBottom: 8 } }, "No saved effects yet"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Create a new effect or copy a Default to start.")),
          vfxSavedTab === "custom" && sortItems(vfxSaved, vfxSortMode, "modifiedAt").map(function(saved) {
            var etInfo = vfxTypeInfo(saved.effectType);
            var dateStr = saved.modifiedAt ? new Date(saved.modifiedAt).toLocaleString() : (saved.createdAt ? new Date(saved.createdAt).toLocaleString() : "");
            var isAct = vfxActiveMap[saved.effectType] === saved.id;
            return React.createElement("div", { key: saved.id, style: CARD_STYLE },
              vfxRenamingId === saved.id ? React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8, alignItems: "center" } },
                React.createElement("input", { value: vfxRenamingName, onChange: function(e) { setVfxRenamingName(e.target.value); }, style: { flex: 1, padding: "4px 8px", borderRadius: 4, background: SCRN, border: SCRNB, color: "#b0c8d8", fontSize: 16, fontFamily: "'Quicksand',sans-serif", outline: "none" } }),
                React.createElement("div", { onClick: function() { vfxRenameDesign(saved.id, vfxRenamingName); }, style: { padding: "4px 10px", borderRadius: 4, background: "rgba(80,200,100,0.2)", border: "1px solid rgba(80,200,100,0.4)", color: "#80dd90", fontWeight: 700, cursor: "pointer" } }, "OK"),
                React.createElement("div", { onClick: function() { setVfxRenamingId(null); }, style: { padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(255,180,60,0.3)", color: "#ffb43c", fontWeight: 700, cursor: "pointer" } }, "X"))
              : React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 8, alignItems: "center" } },
                renderVfxIcon(saved),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, saved.name || "Unnamed"),
                  React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, etInfo.label + (dateStr ? " · " + dateStr : "")))),
              React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
                React.createElement("div", { onClick: function() { vfxToggleActive(saved); }, style: isAct ? BTN_ISACTIVE : BTN_SETACTIVE }, isAct ? "★ Active" : "Set Active"),
                React.createElement("div", { onClick: function() { vfxOpenEditor(saved); }, style: BTN_EDIT }, "EDIT"),
                React.createElement("div", { onClick: function() { setVfxRenamingId(saved.id); setVfxRenamingName(saved.name || ""); }, style: BTN_RENAME }, "RENAME"),
                React.createElement("div", { onClick: function() { vfxExportDesign(saved); }, style: BTN_EXPORT }, "EXPORT"),
                React.createElement("div", { onClick: function() { setVfxDeletingId(saved.id); }, style: BTN_DELETE }, "DELETE")));
          }),
          vfxSavedTab === "factory" && VFX_FACTORY_PRESETS.map(function(preset) {
            return React.createElement("div", { key: preset.id, style: Object.assign({}, CARD_STYLE, { display: "flex", alignItems: "center", gap: 10 }) },
              renderVfxIcon(preset),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700 } }, preset.name),
                React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 10 } }, vfxTypeInfo(preset.effectType).label + " · built-in")),
              React.createElement("div", { onClick: function() { vfxCopyPreset(preset); }, style: BTN_EDIT }, "Edit Copy"));
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
              customActive && React.createElement("div", { onClick: function() { vfxToggleActive(customActive); }, style: BTN_RENAME }, "Use Default"),
              customActive && React.createElement("div", { onClick: function() { vfxOpenEditor(customActive); }, style: BTN_EDIT }, "Edit"),
              !customActive && shown && React.createElement("div", { onClick: function() { vfxCopyPreset(shown); }, style: BTN_EDIT }, "Edit Copy"));
          })),
        vfxDeletingId && renderDeleteOverlay("Delete Effect?", function() { setVfxDeletingId(null); }, function() { vfxDeleteDesign(vfxDeletingId); }),
        vfxExportId && renderExportOverlay("Export Effect", vfxExportText, vfxCopied, function() { copyToClipboard(vfxExportText, setVfxCopied); }, function() { setVfxExportId(null); }),
        vfxShowImport && renderImportOverlay("Import Effect", vfxImportText, setVfxImportText, vfxImportError, setVfxImportError, vfxHandleImport, function() { setVfxShowImport(false); setVfxImportText(""); setVfxImportError(""); }),
        vfxShowExportAll && renderExportOverlay("Export All Effects (" + vfxSaved.length + ")", vfxExportAllText, vfxCopied, function() { copyToClipboard(vfxExportAllText, setVfxCopied); }, function() { setVfxShowExportAll(false); })),

      // ── VFX EFFECT EDITOR ──
      vfxCurrentView === "editor" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, { onBack: vfxHandleBack, backLabel: "VFX Studio", title: "VFX Studio", color: "#ffb43c",
          rightContent: React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "center" } },
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
              React.createElement(BDSlider, { label: "Width", value: vfxEditDesign.width, onChange: function(v) { vfxUpdateDesign("width", v); }, min: 0.5, max: 2, step: 0.1, displayValue: (vfxEditDesign.width || 1).toFixed(1) + "x" }),
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
            React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 8, justifyContent: "center" } },
              React.createElement("div", { onClick: vfxResetDesign, style: Object.assign({}, BTN_RENAME, { padding: "8px 18px", fontSize: 11 }) }, "Reset to Default")))),
        vfxShowBackWarn && renderBackWarnOverlay(function() { setVfxShowBackWarn(false); }, function() { setVfxShowBackWarn(false); setVfxCurrentView("list"); }))),

    // ═══ UFO CUSTOMIZER ═══
    screen === "ufo" && React.createElement("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" } },

      // ── LIST VIEW ──
      ufoView === "list" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, {
          onBack: function() { setScreen("splash"); setUfoView("list"); }, backLabel: "Workshop", title: "UFO Customizer", color: "#64dcb4",
          rightContent: React.createElement("div", { onClick: ufoOpenNew, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #1a3a30, #0f2a22)", boxShadow: "0 0 8px rgba(100,220,180,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, "+ New")
        }),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "6px 10px 20px" } },
          ufoSaved.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: 40 } },
            React.createElement("div", { style: { color: "rgba(180,200,220,0.3)", fontSize: 14, marginBottom: 8 } }, "No saved UFO designs"),
            React.createElement("div", { style: { color: "rgba(180,200,220,0.2)", fontSize: 12 } }, "Tap + New to design your first UFO.")),
          ufoSaved.map(function(design) {
            var isActive = design.id === ufoActiveId;
            return React.createElement("div", { key: design.id, style: CARD_STYLE },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 } },
                React.createElement("div", { style: { width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 } },
                  React.createElement(UFOBlockSvg, { size: 56, design: design })),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { color: "#b0c8d8", fontSize: 14, fontWeight: 700, marginBottom: 3 } }, design.name || "Untitled"),
                  isActive && React.createElement("div", { style: { display: "inline-block", background: "rgba(100,220,180,0.15)", border: "1px solid rgba(100,220,180,0.35)", borderRadius: 4, padding: "1px 6px", fontSize: 10, color: "#64dcb4", fontWeight: 700 } }, "ACTIVE"))),
              React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
                React.createElement("div", { onClick: function() { ufoOpenEditor(design); }, style: BTN_EDIT }, "EDIT"),
                !isActive && React.createElement("div", { onClick: function() { ufoSetActive(design.id); }, style: Object.assign({}, BTN_TOPBAR, { padding: "5px 10px", fontSize: 10, color: "#64dcb4", border: "1px solid rgba(100,220,180,0.3)" }) }, "SET ACTIVE"),
                React.createElement("div", { onClick: function() { setUfoDeletingId(design.id); }, style: BTN_DELETE }, "DELETE")));
          })),
        ufoDeletingId && renderDeleteOverlay("Delete UFO Design?", function() { setUfoDeletingId(null); }, function() { ufoDeleteDesign(ufoDeletingId); })),

      // ── EDITOR VIEW ──
      ufoView === "editor" && React.createElement(React.Fragment, null,
        React.createElement(WorkshopTopBar, {
          onBack: function() {
            if (ufoEditDirtyRef.current) { setUfoShowBackWarn(true); } else { setUfoView("list"); }
          },
          backLabel: "My UFOs", title: ufoEditId ? "Edit UFO" : "New UFO", color: "#64dcb4",
          rightContent: React.createElement("div", { onClick: ufoSaveCurrent, style: Object.assign({}, BTN_TOPBAR_ACCENT, { background: "linear-gradient(180deg, #1a3a30, #0f2a22)", boxShadow: "0 0 8px rgba(100,220,180,0.25), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }) }, ufoSaveStatus || "Save")
        }),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "0 16px 32px" } },
          // Live preview
          React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0 24px" } },
            React.createElement(UFOBlockSvg, { size: 140, design: ufoEditDesign })),
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
            React.createElement(BDSlider, { label: "Glow Intensity", value: ufoEditDesign.glowOpacity || 0,
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
          function() { setUfoShowBackWarn(false); setUfoView("list"); ufoEditDirtyRef.current = false; })))
  );
}
