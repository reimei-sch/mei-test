export class BaseLevel {
  constructor(app, options = {}) {
    this.app = app;
    this.name = options.name || "Unnamed Level";
    this.scene = null;
    this.camera = null;

    this.entities = [];
    this.systems = [];
  }

  async load(scene, camera) {
    this.scene = scene;
    this.camera = camera;
  }

  start() {}

  update(deltaSeconds) {
    for (const system of this.systems) {
      system.update(deltaSeconds);
    }

    for (const entity of this.entities) {
      entity.update(deltaSeconds, this);
    }
  }

  onResize() {}

  trackEntity(entity) {
    this.entities.push(entity);
    return entity;
  }

  removeDeadEntities() {
    const survivors = [];

    for (const entity of this.entities) {
      if (entity.isAlive) {
        survivors.push(entity);
        continue;
      }

      entity.dispose(this.scene);
    }

    this.entities = survivors;
  }

  clearEntities() {
    for (const entity of this.entities) {
      entity.dispose(this.scene);
    }
    this.entities = [];
  }

  dispose() {
    this.clearEntities();
    this.systems = [];
  }
}
