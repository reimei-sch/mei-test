import * as THREE from "../lib/three.js";
import { BaseLevel } from "./BaseLevel.js";
import { GAME_CONFIG, COLORS } from "../config/gameConfig.js";
import { Player } from "../entities/Player.js";
import { Mob } from "../entities/Mob.js";
import { Pickup } from "../entities/Pickup.js";
import { CurrencySystem } from "../systems/CurrencySystem.js";
import { ProgressionSystem } from "../systems/ProgressionSystem.js";
import { MobDirector } from "../systems/MobDirector.js";
import { distanceXZ, randomAroundEdge, randomPointInCircle } from "../utils/math.js";

function disposeNode(node) {
  node.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (Array.isArray(child.material)) {
      for (const material of child.material) {
        material.dispose();
      }
      return;
    }

    if (child.material) {
      child.material.dispose();
    }
  });
}

export class GardenLevel extends BaseLevel {
  constructor(app) {
    super(app, { name: "Sparkle Garden" });

    this.arenaRadius = GAME_CONFIG.arenaRadius;
    this.player = null;
    this.mobs = [];
    this.pickups = [];

    this.currencySystem = null;
    this.progressionSystem = null;
    this.mobDirector = null;

    this.fxBursts = [];
    this.staticGroup = new THREE.Group();
    this.unsubscribeLevelUp = null;
  }

  async load(scene, camera) {
    await super.load(scene, camera);

    this.scene.background = new THREE.Color(COLORS.sky);
    this.scene.fog = new THREE.Fog(COLORS.sky, 20, 65);

    this.scene.add(this.staticGroup);
    this.addLighting();
    this.addArena();
    this.addDecor();

    this.player = this.trackEntity(new Player(this.app.state, this.app.input));
    this.scene.add(this.player.mesh);
    this.player.mesh.position.set(0, 0, 0);

    this.currencySystem = new CurrencySystem(this, this.app.state, this.app.events);
    this.progressionSystem = new ProgressionSystem(this, this.app.state, this.app.events);
    this.mobDirector = new MobDirector(this, this.app.state);
    this.systems = [this.mobDirector];

    this.unsubscribeLevelUp = this.app.events.on("player:levelUp", () => {
      this.spawnCelebrationBurst();
    });

    for (let i = 0; i < 7; i += 1) {
      this.spawnRandomPickup(i % 2 === 0 ? "coin" : "xp");
    }

    this.spawnMob(1);
    this.spawnMob(1.1);

    this.camera.position.set(0, GAME_CONFIG.cameraHeight, GAME_CONFIG.cameraDistance);
    this.camera.lookAt(this.player.mesh.position);
  }

  addLighting() {
    const ambient = new THREE.HemisphereLight("#fff4fa", "#f2b3de", 0.85);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight("#fff8ff", 1.1);
    key.position.set(6, 14, 5);
    key.castShadow = false;
    this.scene.add(key);

    const fill = new THREE.PointLight("#ffc5e5", 0.8, 35);
    fill.position.set(-8, 9, -4);
    this.scene.add(fill);
  }

  addArena() {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(this.arenaRadius + 2, 64),
      new THREE.MeshStandardMaterial({
        color: COLORS.ground,
        roughness: 0.8,
        metalness: 0,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    this.staticGroup.add(ground);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(this.arenaRadius - 0.15, this.arenaRadius + 0.15, 96),
      new THREE.MeshStandardMaterial({
        color: COLORS.boundary,
        roughness: 0.5,
        metalness: 0.15,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.staticGroup.add(ring);
  }

  addDecor() {
    const flowerColors = ["#f48ebf", "#f9d463", "#9be89f", "#8ab8ff"];

    for (let i = 0; i < 52; i += 1) {
      const point = randomPointInCircle(this.arenaRadius - 1.3);

      if (Math.hypot(point.x, point.z) < 2.4) {
        continue;
      }

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.52, 8),
        new THREE.MeshStandardMaterial({ color: "#69c27e", roughness: 0.8 })
      );
      stem.position.set(point.x, 0.25, point.z);
      this.staticGroup.add(stem);

      const petals = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 10, 10),
        new THREE.MeshStandardMaterial({
          color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
          roughness: 0.7,
        })
      );
      petals.position.set(point.x, 0.57, point.z);
      this.staticGroup.add(petals);
    }
  }

  update(deltaSeconds) {
    if (this.app.state.isGameOver) {
      this.updateFx(deltaSeconds);
      this.updateCamera(deltaSeconds);

      if (this.app.input.wasPressed("Enter")) {
        this.restartRun();
      }

      return;
    }

    this.mobDirector.update(deltaSeconds);
    this.player.update(deltaSeconds, this);

    for (const mob of this.mobs) {
      mob.update(deltaSeconds, this);
    }

    for (const pickup of this.pickups) {
      pickup.update(deltaSeconds, this);
    }

    this.handleAttack();
    this.handleContacts();
    this.cleanupDeadEntities();
    this.updateFx(deltaSeconds);
    this.updateCamera(deltaSeconds);
  }

  updateCamera() {
    const offset = new THREE.Vector3(0, GAME_CONFIG.cameraHeight, GAME_CONFIG.cameraDistance);
    const targetPos = this.player.mesh.position.clone().add(offset);

    this.camera.position.lerp(targetPos, 0.08);
    this.camera.lookAt(
      this.player.mesh.position.x,
      this.player.mesh.position.y + 1,
      this.player.mesh.position.z
    );
  }

  spawnMob(difficulty) {
    const color = new THREE.Color(COLORS.mobBody);
    color.offsetHSL((Math.random() - 0.5) * 0.08, 0, 0);

    const mob = new Mob({
      speed: 1.4 + difficulty * (0.28 + Math.random() * 0.14),
      health: 1 + Math.floor(difficulty * 0.32),
      contactDamage: GAME_CONFIG.mobBaseContactDamage + Math.floor(difficulty * 0.6),
      xpReward: 4 + Math.floor(difficulty * 1.4),
      coinReward: 1 + Math.floor(difficulty * 0.75),
      color: color.getHex(),
    });

    const point = randomAroundEdge(this.arenaRadius, 0.9 + Math.random() * 0.06);
    mob.mesh.position.set(point.x, 0.05, point.z);

    this.mobs.push(mob);
    this.trackEntity(mob);
    this.scene.add(mob.mesh);
  }

  spawnRandomPickup(forcedType) {
    const roll = Math.random();
    let type = forcedType;

    if (!type) {
      if (roll < 0.62) {
        type = "coin";
      } else if (roll < 0.9) {
        type = "xp";
      } else {
        type = "heal";
      }
    }

    const values = {
      coin: 2 + Math.floor(Math.random() * 3),
      xp: 4 + Math.floor(Math.random() * 4),
      heal: 8,
    };

    const pickup = new Pickup(type, values[type]);
    const pos = randomPointInCircle(this.arenaRadius * 0.78);
    pickup.mesh.position.set(pos.x, 0.6, pos.z);

    this.pickups.push(pickup);
    this.trackEntity(pickup);
    this.scene.add(pickup.mesh);
  }

  spawnPickupAt(type, x, z) {
    const value = type === "xp" ? 6 : 2;
    const pickup = new Pickup(type, value);
    pickup.mesh.position.set(x, 0.6, z);

    this.pickups.push(pickup);
    this.trackEntity(pickup);
    this.scene.add(pickup.mesh);
  }

  spawnAttackBurst(radius, color = COLORS.accent) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.65, radius, 32),
      new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.56,
      })
    );

    ring.rotation.x = -Math.PI / 2;
    ring.position.set(this.player.mesh.position.x, 0.12, this.player.mesh.position.z);
    this.scene.add(ring);

    this.fxBursts.push({
      mesh: ring,
      ttl: 0.24,
      maxTtl: 0.24,
    });
  }

  spawnCelebrationBurst() {
    this.spawnAttackBurst(3.3, "#ffe37f");
  }

  handleAttack() {
    const attack = this.player.consumeAttack();
    if (!attack) {
      return;
    }

    this.spawnAttackBurst(attack.radius, COLORS.accent);

    for (const mob of this.mobs) {
      if (!mob.isAlive) {
        continue;
      }

      const hitDist = distanceXZ(this.player.mesh.position, mob.mesh.position);
      if (hitDist > attack.radius + mob.radius) {
        continue;
      }

      const dx = mob.mesh.position.x - this.player.mesh.position.x;
      const dz = mob.mesh.position.z - this.player.mesh.position.z;
      const len = Math.hypot(dx, dz) || 1;
      mob.mesh.position.x += (dx / len) * 0.9;
      mob.mesh.position.z += (dz / len) * 0.9;

      mob.applyDamage(attack.damage);

      if (!mob.isAlive) {
        this.onMobDefeated(mob);
      }
    }
  }

  onMobDefeated(mob) {
    this.app.state.addScore(15);
    this.currencySystem.addCoins(mob.coinReward);
    this.progressionSystem.addXp(mob.xpReward);

    if (Math.random() < 0.28) {
      this.spawnPickupAt("coin", mob.mesh.position.x, mob.mesh.position.z);
    }
  }

  handleContacts() {
    for (const mob of this.mobs) {
      if (!mob.isAlive) {
        continue;
      }

      const dist = distanceXZ(this.player.mesh.position, mob.mesh.position);
      if (dist > this.player.radius + mob.radius) {
        continue;
      }

      const didHitPlayer = this.player.takeDamage(mob.contactDamage);
      if (!didHitPlayer) {
        continue;
      }

      const dx = mob.mesh.position.x - this.player.mesh.position.x;
      const dz = mob.mesh.position.z - this.player.mesh.position.z;
      const len = Math.hypot(dx, dz) || 1;
      mob.mesh.position.x += (dx / len) * 1.35;
      mob.mesh.position.z += (dz / len) * 1.35;
    }

    for (const pickup of this.pickups) {
      if (!pickup.isAlive) {
        continue;
      }

      const dist = distanceXZ(this.player.mesh.position, pickup.mesh.position);
      if (dist <= this.player.radius + pickup.radius) {
        pickup.collect(this);
      }
    }
  }

  cleanupDeadEntities() {
    this.removeDeadEntities();
    this.mobs = this.mobs.filter((mob) => mob.isAlive);
    this.pickups = this.pickups.filter((pickup) => pickup.isAlive);
  }

  updateFx(deltaSeconds) {
    const aliveFx = [];

    for (const burst of this.fxBursts) {
      burst.ttl -= deltaSeconds;

      if (burst.ttl <= 0) {
        this.scene.remove(burst.mesh);
        burst.mesh.geometry.dispose();
        burst.mesh.material.dispose();
        continue;
      }

      const normalized = burst.ttl / burst.maxTtl;
      burst.mesh.scale.setScalar(1 + (1 - normalized) * 0.45);
      burst.mesh.material.opacity = normalized * 0.56;
      aliveFx.push(burst);
    }

    this.fxBursts = aliveFx;
  }

  restartRun() {
    this.app.state.resetRun();
    this.mobDirector.spawnTimer = 1.4;
    this.mobDirector.pickupTimer = 3.8;

    for (const mob of this.mobs) {
      mob.isAlive = false;
    }

    for (const pickup of this.pickups) {
      pickup.isAlive = false;
    }

    this.cleanupDeadEntities();

    for (const burst of this.fxBursts) {
      this.scene.remove(burst.mesh);
      burst.mesh.geometry.dispose();
      burst.mesh.material.dispose();
    }

    this.fxBursts = [];

    this.player.mesh.position.set(0, 0, 0);
    this.player.attackCooldown = 0;
    this.player.invulnTimer = 0;
    this.player.attackQueued = false;

    for (let i = 0; i < 6; i += 1) {
      this.spawnRandomPickup(i % 3 === 0 ? "xp" : "coin");
    }

    this.spawnMob(1);
    this.spawnMob(1.15);
  }

  dispose() {
    this.unsubscribeLevelUp?.();
    this.unsubscribeLevelUp = null;

    for (const burst of this.fxBursts) {
      this.scene.remove(burst.mesh);
      burst.mesh.geometry.dispose();
      burst.mesh.material.dispose();
    }
    this.fxBursts = [];

    super.dispose();

    this.scene.remove(this.staticGroup);
    disposeNode(this.staticGroup);
  }
}
