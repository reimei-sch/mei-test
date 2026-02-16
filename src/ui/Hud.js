function formatTime(seconds) {
  const safe = Math.floor(Math.max(0, seconds));
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export class Hud {
  constructor(root, state, events) {
    this.root = root;
    this.state = state;
    this.events = events;

    this.levelToastTimer = 0;

    this.root.innerHTML = `
      <section class="hud-card">
        <h1 class="hud-title">Sparkle Garden Defense</h1>
        <p class="hud-subtitle">WASD/Arrows move | Space attacks | Enter restarts</p>
        <div class="stat-grid">
          <span>HP</span><strong id="hud-hp"></strong>
          <span>Level</span><strong id="hud-level"></strong>
          <span>XP</span><strong id="hud-xp"></strong>
          <span>Coins</span><strong id="hud-coins"></strong>
          <span>Difficulty</span><strong id="hud-difficulty"></strong>
          <span>Score</span><strong id="hud-score"></strong>
          <span>Time</span><strong id="hud-time"></strong>
        </div>
        <div class="xp-track"><div id="hud-xp-bar"></div></div>
        <div id="hud-level-toast" class="hud-toast">Level Up!</div>
      </section>
      <section id="hud-game-over" class="game-over hidden">
        <h2>Run Over</h2>
        <p>Press Enter to try again.</p>
      </section>
    `;

    this.hpEl = this.root.querySelector("#hud-hp");
    this.levelEl = this.root.querySelector("#hud-level");
    this.xpEl = this.root.querySelector("#hud-xp");
    this.coinsEl = this.root.querySelector("#hud-coins");
    this.difficultyEl = this.root.querySelector("#hud-difficulty");
    this.scoreEl = this.root.querySelector("#hud-score");
    this.timeEl = this.root.querySelector("#hud-time");
    this.xpBarEl = this.root.querySelector("#hud-xp-bar");
    this.levelToastEl = this.root.querySelector("#hud-level-toast");
    this.gameOverEl = this.root.querySelector("#hud-game-over");

    this.events.on("player:levelUp", () => {
      this.levelToastTimer = 1.4;
      this.levelToastEl.classList.add("visible");
    });

    this.events.on("game:over", () => {
      this.gameOverEl.classList.remove("hidden");
    });

    this.events.on("state:reset", () => {
      this.gameOverEl.classList.add("hidden");
    });
  }

  update(deltaSeconds = 1 / 60) {
    const hp = `${Math.ceil(this.state.playerHp)} / ${Math.ceil(this.state.playerMaxHp)}`;
    const xpPct = this.state.xpToNext > 0 ? this.state.xp / this.state.xpToNext : 0;

    this.hpEl.textContent = hp;
    this.levelEl.textContent = String(this.state.playerLevel);
    this.xpEl.textContent = `${this.state.xp} / ${this.state.xpToNext}`;
    this.coinsEl.textContent = String(this.state.currency);
    this.difficultyEl.textContent = this.state.difficulty.toFixed(2);
    this.scoreEl.textContent = String(this.state.score);
    this.timeEl.textContent = formatTime(this.state.runTime);
    this.xpBarEl.style.width = `${Math.max(0, Math.min(1, xpPct)) * 100}%`;

    if (this.levelToastTimer > 0) {
      this.levelToastTimer -= deltaSeconds;
      if (this.levelToastTimer <= 0) {
        this.levelToastEl.classList.remove("visible");
      }
    }
  }
}
