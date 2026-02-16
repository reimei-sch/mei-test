import * as THREE from "../lib/three.js";
import { GAME_CONFIG, COLORS } from "../config/gameConfig.js";
import { Entity } from "./Entity.js";

function createPlayerMesh() {
  const root = new THREE.Group();

  const dress = new THREE.Mesh(
    new THREE.ConeGeometry(0.75, 1.4, 24),
    new THREE.MeshStandardMaterial({ color: COLORS.playerDress, roughness: 0.55 })
  );
  dress.position.y = 0.75;
  root.add(dress);

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 0.5, 4, 12),
    new THREE.MeshStandardMaterial({ color: "#ffe5ec", roughness: 0.55 })
  );
  torso.position.y = 1.5;
  root.add(torso);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 16, 16),
    new THREE.MeshStandardMaterial({ color: COLORS.playerHair, roughness: 0.6 })
  );
  hair.position.y = 2.02;
  hair.scale.set(1.04, 0.95, 1.04);
  root.add(hair);

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 16),
    new THREE.MeshStandardMaterial({ color: "#ffd7e0", roughness: 0.5 })
  );
  face.position.y = 1.95;
  root.add(face);

  return root;
}

export class Player extends Entity {
  constructor(state, input) {
    super(createPlayerMesh(), 0.65);

    this.state = state;
    this.input = input;

    this.speed = GAME_CONFIG.playerBaseSpeed;
    this.attackCooldown = 0;
    this.invulnTimer = 0;
    this.attackQueued = false;
  }

  update(deltaSeconds, level) {
    const direction = new THREE.Vector3();

    if (this.input.isDown("KeyW") || this.input.isDown("ArrowUp")) {
      direction.z -= 1;
    }
    if (this.input.isDown("KeyS") || this.input.isDown("ArrowDown")) {
      direction.z += 1;
    }
    if (this.input.isDown("KeyA") || this.input.isDown("ArrowLeft")) {
      direction.x -= 1;
    }
    if (this.input.isDown("KeyD") || this.input.isDown("ArrowRight")) {
      direction.x += 1;
    }

    if (direction.lengthSq() > 0) {
      direction.normalize();
      const speedBonus = 1 + (this.state.playerLevel - 1) * 0.06;
      this.mesh.position.addScaledVector(direction, this.speed * speedBonus * deltaSeconds);
      this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }

    const bound = level.arenaRadius - this.radius;
    this.mesh.position.x = Math.max(-bound, Math.min(bound, this.mesh.position.x));
    this.mesh.position.z = Math.max(-bound, Math.min(bound, this.mesh.position.z));

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaSeconds;
    }
    if (this.invulnTimer > 0) {
      this.invulnTimer -= deltaSeconds;
      const flash = Math.sin(this.invulnTimer * 40) > 0;
      this.mesh.visible = flash;
    } else {
      this.mesh.visible = true;
    }

    if (this.input.wasPressed("Space") && this.attackCooldown <= 0 && !this.state.isGameOver) {
      this.attackQueued = true;
      const cooldownReduction = Math.min(0.4, (this.state.playerLevel - 1) * 0.03);
      this.attackCooldown = GAME_CONFIG.playerBaseAttackCooldown - cooldownReduction;
    }
  }

  consumeAttack() {
    if (!this.attackQueued) {
      return null;
    }

    this.attackQueued = false;
    return {
      radius: 2 + (this.state.playerLevel - 1) * 0.1,
      damage: 1 + Math.floor((this.state.playerLevel - 1) / 3),
    };
  }

  takeDamage(amount) {
    if (this.invulnTimer > 0 || this.state.isGameOver) {
      return false;
    }

    this.state.damagePlayer(amount);
    this.invulnTimer = GAME_CONFIG.playerInvulnSeconds;
    return true;
  }
}
