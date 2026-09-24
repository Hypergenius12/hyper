# Hypergenius12 Workspace Guidelines

This repository hosts **[hypergenius12.com](https://hypergenius12.com/)**, a curated collection of standalone interactive web projects, games, 3D simulations, and creative tools deployed on GitHub Pages.

---

## 1. Dual-Remote Git Push Protocol

Whenever any code changes are committed and pushed to git, they **MUST ALWAYS** be pushed to both configured remotes on the `main` branch:

```bash
git push incredible main
git push origin main
```

- **`incredible` remote:** `https://github.com/incredible-gaemz/hypergenius.git`
- **`origin` remote:** `https://github.com/Hypergenius12/hyper.git`
- Maintain branch hygiene on `main`. Do not push partial or broken builds.

---

## 2. Architecture & Tech Stack Constraints

1. **Zero-Build Static Architecture:**
   - The site is hosted purely on GitHub Pages.
   - Do **NOT** introduce heavy build pipelines (Vite, Webpack, rollup) that break direct static file serving.
   - All projects must execute directly in standard modern web browsers using native ES Modules, Vanilla JavaScript, HTML5 Canvas, Three.js (via CDN/modules), and Web Audio API.
2. **Directory Isolation:**
   - Every game/sandbox lives in its own root subdirectory (e.g., `neurotrack/`, `snake/`, `puzzley/`, `slopcraft 3D/`) with its own `index.html`, style sheets, and scripts.
   - Projects can reference shared assets from `js/` (`firebase-config.js`, `tracker.js`) via relative paths `../js/`.
3. **Design System & Aesthetics:**
   - Preserve CSS variable tokens for dark/light theme switching:
     - `--bg-color`, `--text-color`, `--card-bg`, `--card-hover`, `--border-color`.
   - Typography: Google Fonts `Space Grotesk` (headings/UI) and `JetBrains Mono` (code/monospaced HUDs).
   - Glassmorphism & backdrop blur (`backdrop-filter: blur(10px)`).

---

## 3. Global Telemetry & Leaderboard (`js/tracker.js`)

All interactive sub-projects are connected to a unified Firestore database (`hypergenius12`):

- **Script Tag Integration:** When adding or modifying a project, include:
  ```html
  <script type="module" src="../js/firebase-config.js"></script>
  <script type="module" src="../js/tracker.js"></script>
  ```
- **Name Registration:** Register any new folder name in `PROJECT_NAMES` inside `js/tracker.js` so it displays a friendly human-readable title on the global leaderboard.
- **Heartbeat & Storage:** Telemetry logs active playtime every 15 seconds to `users/{username}.totalTime` and `users/{username}.projects.{projectName}`.
- **Leaderboard Safeguards:**
  - Spoof protection: Sessions with > 365 days of playtime are ignored.
  - Public filter: Users with < 15 seconds are hidden from public ranking.
  - Profanity filtering via `censorName()` and HTML sanitization via `sanitizeHTML()`.
  - Admin inspection: Pressing `Shift + L` when logged in as `hypergenius12` toggles viewing all users including <15s sessions.

---

## 4. Hub (`index.html`) Integration

When adding or updating a game:
- Add a corresponding card inside `.projects-grid` in `index.html`.
- Maintain the 3D tilt card hover interaction and thumbnail fallback (`onerror`).
- Capture and place a screenshot in the root (e.g. `screenshot_<name>.png`).
- Respect Formspree bug report and feedback modal integrations.

---

## 5. Local Testing & Verification

- Headless browser verification is supported via `puppeteer` (`package.json`).
- Run local headless checks or screenshots with Node.js scripts (e.g., `screenshot.js`, `test_browser.js`).
