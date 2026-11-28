# AGENTS.md — last-island

## Required Flowbeacon Arcade Quality Rules

This game is independently hosted but belongs to Flowbeacon Arcade. **Read and follow this mandatory shared release standard** before coding or testing:
https://github.com/flowbeacon-labs/flowbeacon-arcade/blob/main/docs/GAME_QUALITY_STANDARD.md

### iPhone Safari input — nonnegotiable

- No long-press context menu, text-selection handle, copy/share popup or link preview while holding or using game controls.
- Scope `-webkit-touch-callout:none`, `-webkit-user-select:none`, `user-select:none`, `-webkit-tap-highlight-color:transparent` to **game control elements and descendants**. Use `touch-action:none` for joystick/held gestures and `touch-action:manipulation` for normal tap buttons. Do **not** globally disable text selection, touch events, browser zoom, forms or links.
- Use Pointer Events with `preventDefault` for actual game gestures; suppress `contextmenu` and `selectstart` on these surfaces. Clear held state on `pointerup`, `pointercancel`, `lostpointercapture`, tab visibility change and window blur. Support simultaneous movement + action touches without input sticking.
- Distinguish continuous held actions from single-tap toggles. Preserve mouse, keyboard and accessibility behaviors.
- Make icon controls accessible: descriptive `aria-label`, visible focus, practical >=44x44 CSS px targets and an in-game help legend. Never erase SVG icons by rewriting button `textContent`/ `innerHTML` on toggles.

### Visual, lifecycle and release standards

- Verify iPhone portrait and landscape and responsive widths **375/590/768/1280 CSS px**. No clipping, HUD overlap or invisible playfield; respect safe-area insets.
- Preserve existing gameplay, save data, scores, navigation, controls and audio while adding functionality.
- Validate **real browser startup**, Play button, gameplay, pause, resume, restart, and mobile interaction. Report errors on screen rather than silently fail.
- For Canvas/WebGL games validate player/scenery visibility, finite camera transforms, shader compile/link status, context loss and resource lifecycle.
- Add a regression test for every reported bug. Test holding controls >1.5s, long-press contextmenu suppressed, cancellation, multitouch and repeated state changes.
- Run syntax/unit/browser checks when available and verify GitHub Actions and **successful GitHub Pages deployment**. Desktop Chromium passing is not proof of physical iPhone Safari behavior.
- **Never claim iPhone QA passed without actually testing on an iPhone.** State pending limitations explicitly.

### Permanent high-risk defect list

1. iPhone long-press popup over buttons/joystick.
2. Controls staying held after cancel/focus loss or repeated toggles.
3. Stats, menus or controls overlapping gameplay.
4. Blank/inert Start button or invisible game after graphics changes.
5. Icons disappearing when UI state changes.
6. Mock-only testing failing to catch real browser errors.

Before marking done: explain changed files, test results, untested device/browser coverage, remaining risks and live URL. Read the central policy and this file at the start of every Codex implementation session.

Each game is a separate repository: the central Arcade file does **not** automatically apply here. Keep this file synchronized with policy updates.
