import * as THREE from "../lib/three.js";
import { COLORS } from "../config/gameConfig.js";
import { Entity } from "./Entity.js";

function createPickupMesh(type) {
  const colorByType = {
    coin: COLORS.coin,
    xp: COLORS.xp,
    heal: COLORS.heal,
  };

  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.35, 0),
    new THREE.MeshStandardMaterial({
      color: colorByType[type] || COLORS.coin,
      roughness: 0.25,
      metalness: type === "coin" ? 0.45 : 0.1,
      emissive: colorByType[type] || COLORS.coin,
      emissiveIntensity: 0.2,
    })
  );

  root.add(body);
  return root;
}

export class Pickup extends Entity {
  constructor(type, value) {
    super(createPickupMesh(type), 0.45);
    this.type = type;
    this.value = value;
    this.time = Math.random() * Math.PI * 2;
  }

  update(deltaSeconds) {
    this.time += deltaSeconds;
    this.mesh.position.y = 0.6 + Math.sin(this.time * 4) * 0.18;
    this.mesh.rotation.y += deltaSeconds * 2.6;
  }

  collect(level) {
    if (!this.isAlive) {
      return;
    }

    if (this.type === "coin") {
      level.currencySystem.addCoins(this.value);
      level.app.state.addScore(this.value * 2);
    } else if (this.type === "xp") {
      level.progressionSystem.addXp(this.value);
    } else if (this.type === "heal") {
      level.app.state.healPlayer(this.value);
    }

    this.isAlive = false;
  }
}
