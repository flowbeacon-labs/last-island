# Last Island 3D — Expanded Island Update

The game map was expanded from **128 × 128** game units to **256 × 256** (four times the playable land area).

## Improvements
- **14 houses** across central and outer settlements, up from four, along with new decorative plateaus, four corner beacons, more rocky cover and forests.
- **40 loot pickups** in an expanded network of camps and **14 health kits**, spread into new outer districts.
- **12 bots** now spawn across the larger island and use a resized **6-unit A* navigation grid** (43 × 43 cells).
- Minimap scales its player, opponent, cover, loot, and storm markers to the expanded land area.
- The storm begins at 122 units and closes over **330 seconds (5 minutes 30 seconds)** instead of 195 seconds.
- Existing third-person controls, aim assist, weapon slots, parachute, combat, and mobile UI remain intact.

## Playing
Open `index.html` in a WebGL-enabled browser, or visit https://flowbeacon-labs.github.io/last-island/ once GitHub Pages finishes deployment. No game server is needed.

## Publishing
Repository: https://github.com/flowbeacon-labs/last-island
GitHub Pages: Settings → Pages → Deploy from branch → main → /(root).

## Validation notes
The source constants, map references, navigation bounds, and minimap scaling can be checked statically. A real browser/GPU playtest is still needed to verify frame rate, bot routes, pickup access and the difficulty balance over a full match.

---

# Last Island 3D — Phase 5: Weapon Inventory & Cover Navigation

This build includes all Phase 1–4 features plus **three persistent weapon slots** and **A* cover navigation for bots**.

## New features

- The three slots (Blaster / Rapid / Heavy) are independently unlocked through loot. Weapon pickups unlock or replenish the corresponding slot; picking up a new weapon automatically equips it.
- Each slot preserves its own magazine and reserve ammunition while you switch. Reload works on the equipped weapon only; switching cancels an unfinished reload without changing the saved ammo. Ammo boxes replenish the currently equipped weapon.
- Switch by clicking/tapping a slot, pressing `1`, `2`, or `3` on desktop, mouse-wheel, or the on-screen **SWITCH** button. Locked slots are disabled.
- Bots use a bounded **A* 6-unit navigation grid** for routing around buildings and rocks when direct movement would be blocked. Waypoints are cached and refreshed periodically; diagonal corner cutting is disabled, and stuck bots trigger replanning. Bots still strafe, flank, retreat and prioritize the safe zone.
- This is lightweight obstacle navigation, not a full NavMesh or strategic squad AI.

## Run and testing

Extract the ZIP and open `index.html` using a modern WebGL-compatible browser. `node --check game.js` validates syntax. `python tests/smoke.py` runs the existing simulated-WebGL browser smoke tests (Python Playwright + Chromium required). The updated `tests/smoke.py` also exercises all three inventory slots, magazine retention across swaps, and A* waypoints that avoid buildings. A real GPU/iPhone test is still required.

## Publish

Upload `index.html`, `game.js`, `style.css`, and `README.md` to the root of a public `last-island-3d` repository; configure GitHub Pages **Settings → Pages → Deploy from branch → main → /(root)**. The expected URL is `https://flowbeacon-labs.github.io/last-island/`. The build is offline-capable and needs no server.

---

# Last Island 3D — Phase 4: Parachute & Tactical Combat

Original colorful single-player WebGL battle royale browser game. **13 contestants (you + 12 bots)**, no game server, accounts, external CDNs or third-party JavaScript libraries. Phase 4 includes all Phase 1–3 features plus a playable parachute landing, tactical AI movement, optional gentle aim assist, and new visual terrain landmarks.

## New in Phase 4

1. **Parachute drop:** Each match starts with the player descending from 23 world units above the island. Steer with WASD or the mobile joystick to choose a landing spot. Bots, weapons and the storm timer become active after touchdown, so beginners can learn to land without taking damage. A visible orange canopy and tether lines appear during descent.
2. **Smarter bot tactics:** Bots periodically select advance, strafe, evade, flank or retreat behavior based on distance, sight lines, their health and the storm. Low-health bots try to disengage; bots blocked by cover take flanking angles. This is heuristic AI rather than pathfinding.
3. **Optional aim assistance:** When enabled, shots receive a modest horizontal steering correction toward a nearby bot within approximately 14° of the aim direction, up to 32 world units away and not blocked by obstacles. This is on by default for family-friendly play, but can be disabled on the setup screen. Your setting persists locally.
4. **New island landmarks:** Decorative rocky plateaus, a glowing beacon, and a lookout hut add distinct visual regions without disrupting existing ground movement or combat collision.
5. **Compatibility:** Phase 3 radar, 3 heroes, 3 AI difficulty modes, 20 loot crates, 3 weapons, armor and reloading are retained.

## Phase 3 additions

1. **Character selection** before you drop in: Explorer (blue), Ranger (green), and Space Scout (purple). All costumes have equal speed, health, and damage; this is cosmetic only. Your last choice is remembered in browser storage when supported.
2. **Bot difficulty**: Easy (less aggressive, lower damage/health), Normal (balanced), Hard (faster, more accurate/aggressive, more health/damage). Select before a match; your last choice is saved where browser storage permits. The bots still use lightweight steering AI, not a full navigation mesh.
3. **Live 2D minimap**: shows your player position/facing, surviving opponents, remaining loot, healing supplies, cover obstacles and the shrinking blue storm ring. Tap the radar's square icon to minimize/restore it on smaller screens. This is intentionally a gameplay aid, not a realistic fog-of-war simulation.
4. **Expanded loot**: 12 more loot camps in addition to the 8 original glowing crates, for **20 total loot pickups**, spread throughout the island. Camps have colored ground markers and posts. Each contains a weapon, ammunition, or armor.
5. **Returning essentials**: third-person camera, keyboard/mouse and touch joystick, 12 bots that fight, collision, cover, shooting, three weapon types, magazines, reloads, armor, healing kits, storm damage, win/loss screens, sound and pause.

## How to play

Open `index.html` in a desktop browser with WebGL enabled, or publish the files via GitHub Pages and visit on your iPhone. On the start screen, choose a hero and bot difficulty and press **DROP IN & PLAY**. Steer the parachute toward a clear area, land, then fight. Look at the radar to find supplies and stay within the storm. Last contestant standing wins. The pause button can be used at any time.

### Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Steer parachute / move | WASD / arrow keys | Virtual joystick (left) |
| Aim / rotate | Drag mouse on 3D scene | Drag open area of screen |
| Shoot | Mouse click / Space / F | Hold FIRE |
| Jump | E | JUMP |
| Reload | R | RELOAD |
| Pick up loot | Walk through glowing crate | Walk through glowing crate |
| Radar size | Radar square button | Radar square button |
| Pause | P / pause button | Pause button |
| Hero, difficulty and aim assist | Start or post-match screen | Start or post-match screen |

## Run tests

```bash
node --check game.js
python tests/smoke.py
```

The included Playwright smoke test requires Chromium and Python Playwright and currently uses `/usr/bin/chromium`. It mocks the WebGL API where hardware rendering is unavailable. It validates game initialization, parachute landing, optional aim assist, hero picker, all 3 bot difficulty choices, Hard-mode bot HP, 20 loot pickups, visible/toggleable radar, weapon firing, ammo/reloading, armor, shrinking storm, pause, victory/defeat and desktop/mobile controls. **It does not verify actual GPU rendering, FPS, sound quality, or iPhone Safari behavior.** Test on real devices before sharing widely.

## Publish via GitHub Pages

1. Create a **public** GitHub repository named `last-island-3d` in account or organization `flowbeacon-labs` if not already created.
2. Upload the four root files (`index.html`, `game.js`, `style.css`, `README.md`) to the repository's `main` branch. You may also upload `tests/smoke.py` for your own reference. Files must remain in the root, not within an extra nested folder.
3. Under **Settings → Pages**, select **Deploy from a branch**, choose `main`, folder `/(root)`, and save.
4. After Pages deployment succeeds, open `https://flowbeacon-labs.github.io/last-island/`.
5. Once published, add this URL as a card to Flowbeacon Arcade.

## Limitations and next steps

This is **single-player with local AI**, not real-player multiplayer. Native WebGL is implemented without external assets, but 3D visual performance on older mobile devices should be checked. There is no advanced loot inventory, cover navigation mesh, vehicles, server-side matchmaking, or multiplayer. The new raised plateaus are decorative rather than climbable height-field terrain. Suggested Phase 5: weapon inventory slots, persistent match stats, advanced bot navigation, quality settings, and optional training mode.