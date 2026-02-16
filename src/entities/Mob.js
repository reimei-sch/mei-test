import * as THREE from "../lib/three.js";
import { COLORS, GAME_CONFIG } from "../config/gameConfig.js";
import { Entity } from "./Entity.js";

function createMobMesh(color) {
  const root = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 20, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.45 })
  );
  body.position.y = 0.6;
  root.add(body);

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: "#2f1842" });
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMaterial);
  leftEye.position.set(-0.16, 0.72, 0.44);
  root.add(leftEye);

  const rightEye = leftEye.clone();
  rightEye.position.x *= -1;
  root.add(rightEye);

  return root;
}

export class Mob extends Entity {
  constructor({ speed, health, contactDamage, xpReward, coinReward, color = COLORS.mobBody }) {
    super(createMobMesh(color), 0.52);
    this.speed = speed;
    this.health = health;
    this.contactDamage = contactDamage ?? GAME_CONFIG.mobBaseContactDamage;
    this.xpReward = xpReward;
    this.coinReward = coinReward;
    this.bobTime = Math.random() * Math.PI * 2;
  }

  update(deltaSeconds, level) {
    if (!this.isAlive) {
      return;
    }

    const target = level.player.mesh.position;
    const dx = target.x - this.mesh.position.x;
    const dz = target.z - this.mesh.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.001) {
      this.mesh.position.x += (dx / dist) * this.speed * deltaSeconds;
      this.mesh.position.z += (dz / dist) * this.speed * deltaSeconds;
      this.mesh.rotation.y = Math.atan2(dx, dz);
    }

    this.bobTime += deltaSeconds * 6;
    this.mesh.position.y = 0.1 + Math.sin(this.bobTime) * 0.08;
  }

  applyDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isAlive = false;
    }
  }
}
