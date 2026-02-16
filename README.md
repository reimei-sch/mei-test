# Sparkle Garden Defense (Three.js Framework)

A modular Three.js game framework with one playable level.

## Run

Use any static file server from the project root. Example:

```bash
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

## Controls

- `WASD` or arrow keys: move
- `Space`: attack pulse
- `Enter`: restart after game over

## Architecture

- `src/core/`: app lifecycle and engine plumbing
- `src/levels/`: level classes (`BaseLevel` + concrete levels)
- `src/entities/`: object-oriented game actors
- `src/systems/`: progression, economy, and directors
- `src/ui/`: HUD and overlays
- `src/config/`: constants and theme values

## Scaling Hooks

- Add a new level by extending `BaseLevel` and loading it in `SceneController`.
- Add new mobs by extending `Entity` and spawning through a new director system.
- Dynamic difficulty is isolated in `MobDirector`.
- Currency and player leveling are isolated in `CurrencySystem` and `ProgressionSystem`.
- Cross-system communication goes through `EventBus`.
