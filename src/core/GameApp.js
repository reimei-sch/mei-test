import * as THREE from "../lib/three.js";
import { EventBus } from "./EventBus.js";
import { GameState } from "./GameState.js";
import { InputManager } from "./InputManager.js";
import { SceneController } from "./SceneController.js";
import { Hud } from "../ui/Hud.js";
import { GardenLevel } from "../levels/GardenLevel.js";

export class GameApp {
  constructor({ canvas, hudRoot }) {
    this.canvas = canvas;
    this.hudRoot = hudRoot;

    this.renderer = null;
    this.events = null;
    this.input = null;
    this.state = null;
    this.hud = null;
    this.sceneController = null;

    this.lastFrameTime = 0;
    this.rafId = null;

    this.onResize = this.onResize.bind(this);
    this.frame = this.frame.bind(this);
  }

  getAspect() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    return width / Math.max(1, height);
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.events = new EventBus();
    this.input = new InputManager(window);
    this.state = new GameState(this.events);
    this.hud = new Hud(this.hudRoot, this.state, this.events);

    this.sceneController = new SceneController(this);
    await this.sceneController.loadLevel(new GardenLevel(this));

    window.addEventListener("resize", this.onResize);
    this.onResize();

    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.sceneController.onResize();
  }

  frame(nowMs) {
    const rawDelta = (nowMs - this.lastFrameTime) / 1000;
    const deltaSeconds = Math.min(rawDelta, 0.05);
    this.lastFrameTime = nowMs;

    this.state.updateTime(deltaSeconds);
    this.sceneController.update(deltaSeconds);
    this.hud.update(deltaSeconds);

    if (this.sceneController.scene && this.sceneController.camera) {
      this.renderer.render(this.sceneController.scene, this.sceneController.camera);
    }

    this.input.endFrame();
    this.rafId = requestAnimationFrame(this.frame);
  }

  dispose() {
    window.removeEventListener("resize", this.onResize);
    cancelAnimationFrame(this.rafId);
    this.input.dispose();
    this.sceneController.dispose();
    this.renderer.dispose();
  }
}
