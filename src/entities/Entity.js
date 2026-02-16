export class Entity {
  constructor(mesh, radius = 1) {
    this.mesh = mesh;
    this.radius = radius;
    this.isAlive = true;
  }

  update() {}

  dispose(scene) {
    if (!this.mesh) {
      return;
    }

    scene.remove(this.mesh);
    this.mesh.traverse((node) => {
      if (node.geometry) {
        node.geometry.dispose();
      }

      if (Array.isArray(node.material)) {
        for (const material of node.material) {
          material.dispose();
        }
        return;
      }

      if (node.material) {
        node.material.dispose();
      }
    });
  }
}
