import { System } from "./System.js";

export class CurrencySystem extends System {
  constructor(level, state, events) {
    super(level);
    this.state = state;
    this.events = events;
  }

  addCoins(amount) {
    this.state.addCurrency(amount);
    this.events.emit("currency:changed", this.state.currency);
  }

  spendCoins(amount) {
    const didSpend = this.state.spendCurrency(amount);
    if (didSpend) {
      this.events.emit("currency:changed", this.state.currency);
    }
    return didSpend;
  }
}
