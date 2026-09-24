---
name: hypergenius-guide
description: >-
  Comprehensive developer guide, runbook, and project directory for hypergenius12.com.
  Use when asked about games or tools on hypergenius12, adding a new project/game,
  configuring global leaderboard telemetry, or executing headless Puppeteer tests.
---

# Hypergenius12 Development Guide & Runbook

This skill provides direct workflows and reference material for maintaining and extending **[hypergenius12.com](https://hypergenius12.com/)**.

---

## 1. Quick Workflows

### A. Adding a New Game or Tool to Hypergenius12

When adding a new interactive experiment:
1. **Create the Project Folder:**
   Create a dedicated subdirectory at the workspace root (e.g., `my-game/`) containing `index.html`, any stylesheets, and scripts.
2. **Wire the Central Playtime Tracker:**
   In `my-game/index.html` right before `</body>`, include:
   ```html
   <script type="module" src="../js/firebase-config.js"></script>
   <script type="module" src="../js/tracker.js"></script>
   ```
3. **Register Title in Tracker:**
   In [js/tracker.js](file:///c:/Users/Caleb.Abbe/Downloads/hyper-main/hyper-main/js/tracker.js), add the folder mapping to `PROJECT_NAMES`:
   ```javascript
   'my-game': 'My Awesome Game Title',
   ```
4. **Add Preview Card to Hub:**
   In [index.html](file:///c:/Users/Caleb.Abbe/Downloads/hyper-main/hyper-main/index.html), add a card within `.projects-grid`:
   ```html
   <a href="my-game/index.html" class="project-card">
       <img src="screenshot_my_game.png" alt="My Awesome Game" class="project-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22160%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23e4e4e7%22/%3E%3C/svg%3E'">
       <div class="project-content">
           <h2 class="project-title">My Awesome Game Title</h2>
           <p class="project-desc">A brief, compelling description of the game or sandbox.</p>
           <div class="project-arrow">&rarr;</div>
       </div>
   </a>
   ```
5. **Generate Thumbnail:**
   Capture a 280x160 thumbnail and save it to the root directory as `screenshot_my_game.png`.

---

### B. Dual-Remote Git Push Routine

Every commit to `main` must be synchronized across both remotes:
```powershell
git add .
git commit -m "Your descriptive commit message"
git push incredible main
git push origin main
```

---

### C. Running Headless Verification Scripts

Puppeteer is pre-configured in the root `package.json`. You can create or run automated headless test scripts directly:
```powershell
node test_browser.js
node screenshot.js
```

---

## 2. Project Catalog

For a complete inventory of all 22 active subprojects, engine designs, and controls, see:
👉 [Project Catalog Reference](file:///c:/Users/Caleb.Abbe/Downloads/hyper-main/hyper-main/.agents/skills/hypergenius-guide/references/catalog.md)
