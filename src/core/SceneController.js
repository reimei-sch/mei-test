import * as THREE from "../lib/three.js";

export class SceneController {
  constructor(app) {
    this.app = app;
    this.scene = null;
    this.camera = null;
    this.currentLevel = null;
  }

  async loadLevel(level) {
    if (this.currentLevel) {
      this.currentLevel.dispose();
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, this.app.getAspect(), 0.1, 500);
    this.camera.position.set(0, 10, 10);

    this.currentLevel = level;
    await this.currentLevel.load(this.scene, this.camera);
    this.currentLevel.start();
  }

  update(deltaSeconds) {
    if (!this.currentLevel) {
      return;
    }

    this.currentLevel.update(deltaSeconds);
  }

  onResize() {
    if (!this.camera) {
      return;
    }

    this.camera.aspect = this.app.getAspect();
    this.camera.updateProjectionMatrix();
    this.currentLevel?.onResize();
  }

  dispose() {
    this.currentLevel?.dispose();
  }
}
