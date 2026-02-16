import { clamp } from "../utils/math.js";

export class GameState {
  constructor(events) {
    this.events = events;
    this.resetRun();
  }

  resetRun() {
    this.runTime = 0;
    this.score = 0;
    this.currency = 0;
    this.playerLevel = 1;
    this.xp = 0;
    this.xpToNext = 20;
    this.difficulty = 1;
    this.playerMaxHp = 100;
    this.playerHp = this.playerMaxHp;
    this.isGameOver = false;
    this.events.emit("state:reset", this.snapshot());
  }

  snapshot() {
    return {
      runTime: this.runTime,
      score: this.score,
      currency: this.currency,
      playerLevel: this.playerLevel,
      xp: this.xp,
      xpToNext: this.xpToNext,
      difficulty: this.difficulty,
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      isGameOver: this.isGameOver,
    };
  }

  updateTime(deltaSeconds) {
    if (this.isGameOver) {
      return;
    }

    this.runTime += deltaSeconds;
  }

  addScore(points) {
    this.score += points;
  }

  addCurrency(amount) {
    this.currency += Math.max(0, Math.floor(amount));
  }

  spendCurrency(amount) {
    const normalizedAmount = Math.max(0, Math.floor(amount));
    if (this.currency < normalizedAmount) {
      return false;
    }

    this.currency -= normalizedAmount;
    return true;
  }

  setDifficulty(difficulty) {
    this.difficulty = Math.max(1, difficulty);
  }

  addXp(amount) {
    this.xp += Math.max(0, Math.floor(amount));
  }

  setPlayerHp(nextHp) {
    this.playerHp = clamp(nextHp, 0, this.playerMaxHp);
    if (this.playerHp <= 0 && !this.isGameOver) {
      this.setGameOver();
    }
  }

  damagePlayer(amount) {
    this.setPlayerHp(this.playerHp - amount);
  }

  healPlayer(amount) {
    this.setPlayerHp(this.playerHp + amount);
  }

  setGameOver() {
    this.isGameOver = true;
    this.events.emit("game:over", this.snapshot());
  }
}
