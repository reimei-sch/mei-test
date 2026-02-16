import { GAME_CONFIG } from "../config/gameConfig.js";
import { System } from "./System.js";

export class MobDirector extends System {
  constructor(level, state) {
    super(level);
    this.state = state;
    this.spawnTimer = 1.4;
    this.pickupTimer = 3.8;
  }

  update(deltaSeconds) {
    if (this.state.isGameOver) {
      return;
    }

    const runDifficulty = 1 + this.state.runTime / 35;
    const levelDifficulty = 1 + (this.state.playerLevel - 1) * 0.45;
    const difficulty = runDifficulty * levelDifficulty;
    this.state.setDifficulty(difficulty);

    const maxMobs = Math.min(
      GAME_CONFIG.maxSpawnedMobs,
      Math.floor(5 + difficulty * 1.8)
    );

    this.spawnTimer -= deltaSeconds;
    if (this.spawnTimer <= 0 && this.level.mobs.length < maxMobs) {
      this.level.spawnMob(difficulty);
      const spawnInterval = Math.max(
        GAME_CONFIG.minSpawnInterval,
        2.9 - difficulty * 0.18
      );
      this.spawnTimer = spawnInterval;
    }

    this.pickupTimer -= deltaSeconds;
    if (this.pickupTimer <= 0 && this.level.pickups.length < 18) {
      this.level.spawnRandomPickup();
      this.pickupTimer = 4 + Math.random() * 2.5;
    }
  }
}
