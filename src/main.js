import { GameApp } from "./core/GameApp.js";

const canvas = document.getElementById("game-canvas");
const hudRoot = document.getElementById("hud-root");

const app = new GameApp({ canvas, hudRoot });

app.init();

window.__sparkleGame = app;
