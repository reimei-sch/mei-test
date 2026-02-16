import { System } from "./System.js";

export class ProgressionSystem extends System {
  constructor(level, state, events) {
    super(level);
    this.state = state;
    this.events = events;
  }

  addXp(amount) {
    this.state.addXp(amount);
    this.state.addScore(amount);

    let leveled = false;
    while (this.state.xp >= this.state.xpToNext) {
      this.state.xp -= this.state.xpToNext;
      this.state.playerLevel += 1;
      this.state.xpToNext = Math.floor(this.state.xpToNext * 1.35 + 12);
      this.state.playerMaxHp += 6;
      this.state.healPlayer(6);
      leveled = true;
      this.events.emit("player:levelUp", {
        level: this.state.playerLevel,
      });
    }

    if (leveled) {
      this.events.emit("progression:changed", {
        level: this.state.playerLevel,
        xp: this.state.xp,
        xpToNext: this.state.xpToNext,
      });
      return;
    }

    this.events.emit("progression:changed", {
      level: this.state.playerLevel,
      xp: this.state.xp,
      xpToNext: this.state.xpToNext,
    });
  }
}
