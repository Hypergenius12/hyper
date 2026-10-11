// Seleste In-Game Level Builder & Room Editor
// Allows players to visually modify, draw, and test levels in real-time,
// persists custom layouts to localStorage, and exports clean code to give to the AI assistant.

import { sfx } from './audio.js';
import { LEVEL_DATA } from './levels.js';

export const DEFAULT_CUSTOM_LEVEL = {
  name: "My Custom Level",
  sub: "CUSTOM ASCENT",
  biome: 0,
  wind: 0,
  featherTime: 2.5,
  movingPlatforms: [],
  map: [
    "################################",
    "#..............................#",
    "#.............................E#",
    "#............................###",
    "#..............................#",
    "#..............................#",
    "#..............................#",
    "#..............................#",
    "#..............................#",
    "#..............................#",
    "#..............................#",
    "#...P..........................#",
    "#..###.........................#",
    "######.........................#",
    "######.........................#",
    "######^^^^^^^^^^^^^^^^^^^^^^^^^#",
    "################################",
    "################################"
  ]
};

export const TILE_DEFINITIONS = [
  { char: '#', name: 'Solid', color: '#5e7c9f', desc: 'Stone wall & floor' },
  { char: '=', name: 'Lift Platform', color: '#ffb703', desc: 'Moving mag-lev lift' },
  { char: 'M', name: 'Dream', color: '#00f0ff', desc: 'Dash-phasing star block' },
  { char: 'C', name: 'Crumble', color: '#c2a070', desc: 'Crumbles under weight' },
  { char: 'S', name: 'Spring', color: '#ffea00', desc: 'Super bounce pad' },
  { char: 'D', name: 'Dash Crystal', color: '#00e436', desc: 'Refills dash mid-air' },
  { char: '*', name: 'Strawberry', color: '#ff2a55', desc: 'Trailing collectible' },
  { char: '^', name: 'Floor Spike', color: '#ff3b56', desc: 'Upward hazard' },
  { char: 'v', name: 'Ceiling Spike', color: '#ff3b56', desc: 'Downward hazard' },
  { char: '<', name: 'Spike (L)', color: '#ff3b56', desc: 'Left wall hazard' },
  { char: '>', name: 'Spike (R)', color: '#ff3b56', desc: 'Right wall hazard' },
  { char: 'I', name: 'Icicle', color: '#90d7f2', desc: 'Falling stalactite' },
  { char: 'B', name: 'Bumper', color: '#ff6b00', desc: 'Elastic repulsor orb' },
  { char: 'G', name: 'Feather', color: '#ffd166', desc: '360 DEG flight' },
  { char: '1', name: 'Beat A', color: '#29adff', desc: 'Phase 1 & 2 solid' },
  { char: '2', name: 'Beat B', color: '#ff3377', desc: 'Phase 3 & 4 solid' },
  { char: 'H', name: 'Heart', color: '#00bbf9', desc: 'Crystal heart secret' },
  { char: 'P', name: 'Spawn (P)', color: '#00f5d4', desc: 'Player spawn point' },
  { char: 'E', name: 'Exit (E)', color: '#ffffff', desc: 'Level exit portal' },
  { char: 'F', name: 'Flag (F)', color: '#ffd166', desc: 'Summit flag & fire' },
  { char: '.', name: 'Air / Erase', color: '#0b0e14', desc: 'Empty airspace' }
];

export class LevelEditor {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('editor-modal');
    this.canvas = document.getElementById('editor-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    if (this.ctx) this.ctx.imageSmoothingEnabled = false;

    // Mode toggle button
    this.btnModeToggle = document.getElementById('btn-editor-mode-toggle');

    // Room navigation
    this.roomSelect = document.getElementById('editor-room-select');
    this.btnRoomPrev = document.getElementById('btn-editor-room-prev');
    this.btnRoomNext = document.getElementById('btn-editor-room-next');
    this.btnNewLevel = document.getElementById('btn-editor-new-level');
    this.btnDeleteLevel = document.getElementById('btn-editor-delete-level');

    // Saved levels browser elements
    this.btnOpenSaved = document.getElementById('btn-editor-open-saved');
    this.btnSavedBottom = document.getElementById('btn-editor-saved-levels-bottom');
    this.savedLevelsBox = document.getElementById('editor-saved-levels-box');
    this.savedLevelsList = document.getElementById('editor-saved-levels-list');
    this.btnCloseSaved = document.getElementById('btn-close-saved-levels');
    this.btnSavedClose = document.getElementById('btn-saved-levels-close');
    this.btnSavedNew = document.getElementById('btn-saved-levels-new');

    // Room metadata
    this.nameInput = document.getElementById('editor-room-name');
    this.biomeSelect = document.getElementById('editor-biome-select');
    this.windSelect = document.getElementById('editor-wind-select');
    this.colsInput = document.getElementById('editor-room-cols');
    this.rowsInput = document.getElementById('editor-room-rows');
    this.featherInput = document.getElementById('editor-room-feather');

    // Zoom controls
    this.btnZoomIn = document.getElementById('btn-editor-zoom-in');
    this.btnZoomOut = document.getElementById('btn-editor-zoom-out');
    this.zoomLevelEl = document.getElementById('editor-zoom-level');

    // Tools & status
    this.tileButtonsContainer = document.getElementById('editor-tile-buttons');
    this.hoverCoordEl = document.getElementById('editor-hover-coord');
    this.statusMsgEl = document.getElementById('editor-status-msg');

    // Moving platform management elements
    this.platformCountEl = document.getElementById('editor-platform-count');
    this.platformsListEl = document.getElementById('editor-platforms-list');
    this.btnAddPlatform = document.getElementById('btn-editor-add-platform');
    this.selectedPlatformIndex = -1;
    this.liftStart = null;

    // Actions
    this.btnPlaytest = document.getElementById('btn-editor-playtest');
    this.btnCopy = document.getElementById('btn-editor-copy');
    this.btnExportAll = document.getElementById('btn-editor-export-all');
    this.btnExportImport = document.getElementById('btn-editor-export-import');
    this.btnReset = document.getElementById('btn-editor-reset');
    this.btnClose = document.getElementById('btn-close-editor');
    this.btnDone = document.getElementById('btn-editor-done');

    // Export drawer
    this.exportBox = document.getElementById('editor-export-box');
    this.exportTitle = document.getElementById('editor-export-title');
    this.exportText = document.getElementById('editor-export-text');
    this.btnCopyRaw = document.getElementById('btn-editor-copy-raw');
    this.btnDownloadFile = document.getElementById('btn-editor-download-file');
    this.btnDownloadJson = document.getElementById('btn-editor-download-json');
    this.btnImportApply = document.getElementById('btn-editor-import-apply');
    this.btnImportFile = document.getElementById('btn-editor-import-file');
    this.fileInputEl = document.getElementById('editor-file-input');
    this.btnCloseDrawer = document.getElementById('btn-editor-close-drawer');

    // Editor state (supports Dev Editor for 40 campaign levels and Custom Level Builder)
    this.isDevMode = localStorage.getItem('seleste_is_dev_editor') === 'true';
    this.currentRoomIndex = 0;
    this.originalCampaignData = JSON.parse(JSON.stringify(LEVEL_DATA));
    this.loadDevCampaignOverrides();

    this.customLevels = this.loadCustomLevelsFromStorage();
    this.currentCustomIndex = 0;
    this.selectedTile = '#';
    this.zoomLevels = [8, 10, 12, 14, 16];
    this.zoomIndex = 2; // Default 12px (fits 32x18 and 40x18 without overflow)
    this.tileSize = this.zoomLevels[this.zoomIndex];
    this.map = [];
    this.roomName = '';
    this.roomSub = '';
    this.biome = 0;
    this.wind = 0;
    this.featherTime = 2.5;
    this.movingPlatforms = [];
    this.isDrawing = false;
    this.drawButton = 0; // 0 = left (paint), 2 = right (erase)
    this.hoverCol = -1;
    this.hoverRow = -1;
    this.undoStack = [];

    this.setupUI();
    this.setupCanvasEvents();
    this.updateModeUI();
  }

  loadCustomLevelsFromStorage() {
    // Purge legacy monkey-patching of campaign levels
    try {
      localStorage.removeItem('seleste_custom_rooms');
    } catch (_) {}

    try {
      const saved = JSON.parse(localStorage.getItem('seleste_custom_user_levels') || '[]');
      if (Array.isArray(saved) && saved.length > 0) {
        const valid = saved.filter(lvl => lvl && Array.isArray(lvl.map) && lvl.map.length > 0);
        if (valid.length > 0) return valid;
      }
    } catch (_) {}

    return [JSON.parse(JSON.stringify(DEFAULT_CUSTOM_LEVEL))];
  }

  saveCustomLevelsToStorage() {
    try {
      localStorage.setItem('seleste_custom_user_levels', JSON.stringify(this.customLevels));
    } catch (e) {
      console.warn('Failed to save custom user levels to localStorage', e);
    }
  }

  loadDevCampaignOverrides() {
    try {
      const overrides = JSON.parse(localStorage.getItem('seleste_dev_campaign_overrides') || '{}');
      if (overrides && typeof overrides === 'object') {
        for (const idxStr in overrides) {
          const idx = parseInt(idxStr, 10);
          if (!isNaN(idx) && idx >= 0 && idx < LEVEL_DATA.length) {
            const data = overrides[idxStr];
            if (data && Array.isArray(data.map)) {
              LEVEL_DATA[idx] = {
                name: data.name || LEVEL_DATA[idx].name,
                sub: data.sub || LEVEL_DATA[idx].sub,
                biome: typeof data.biome === 'number' ? data.biome : LEVEL_DATA[idx].biome,
                wind: typeof data.wind === 'number' ? data.wind : LEVEL_DATA[idx].wind,
                featherTime: typeof data.featherTime === 'number' ? data.featherTime : (LEVEL_DATA[idx].featherTime || 2.5),
                movingPlatforms: Array.isArray(data.movingPlatforms) ? data.movingPlatforms : (LEVEL_DATA[idx].movingPlatforms || []),
                map: data.map
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load dev campaign overrides', e);
    }
  }

  saveDevCampaignOverrides() {
    try {
      const overrides = JSON.parse(localStorage.getItem('seleste_dev_campaign_overrides') || '{}');
      overrides[this.currentRoomIndex] = this.getRoomData();
      localStorage.setItem('seleste_dev_campaign_overrides', JSON.stringify(overrides));
    } catch (e) {
      console.warn('Failed to save dev campaign overrides', e);
    }
  }

  setDevMode(isDev) {
    this.saveCurrentToStorage();
    this.isDevMode = !!isDev;
    try {
      localStorage.setItem('seleste_is_dev_editor', this.isDevMode ? 'true' : 'false');
    } catch (_) {}
    this.updateModeUI();
    this.refreshRoomSelect();
    this.loadRoom(this.isDevMode ? this.currentRoomIndex : this.currentCustomIndex);
  }

  toggleDevMode() {
    this.setDevMode(!this.isDevMode);
    sfx.playClick();
    this.updateStatusMsg(this.isDevMode ? 'SWITCHED TO DEV MODE (40 CAMPAIGN ROOMS)' : 'SWITCHED TO CUSTOM LEVEL BUILDER', true);
  }

  updateModeUI() {
    const titleEl = this.modal ? this.modal.querySelector('.modal-title') : null;
    if (titleEl) {
      titleEl.textContent = this.isDevMode ? 'DEV LEVEL BUILDER (CAMPAIGN)' : 'CUSTOM LEVEL BUILDER';
    }
    if (this.btnModeToggle) {
      this.btnModeToggle.textContent = this.isDevMode ? 'DEV MODE' : 'CUSTOM MODE';
      this.btnModeToggle.style.background = this.isDevMode ? 'var(--p6)' : 'var(--p2)';
      this.btnModeToggle.style.color = this.isDevMode ? '#000000' : '#ffffff';
    }
    if (this.btnNewLevel) this.btnNewLevel.style.display = this.isDevMode ? 'none' : '';
    if (this.btnDeleteLevel) this.btnDeleteLevel.style.display = this.isDevMode ? 'none' : '';
    if (this.btnOpenSaved) this.btnOpenSaved.style.display = this.isDevMode ? 'none' : '';
    if (this.btnSavedBottom) this.btnSavedBottom.style.display = this.isDevMode ? 'none' : '';
    if (this.btnCopy) this.btnCopy.style.display = this.isDevMode ? 'none' : '';
    if (this.btnExportAll) this.btnExportAll.textContent = this.isDevMode ? 'EXPORT CAMPAIGN' : 'EXPORT CUSTOM';
  }

  setupUI() {
    if (!this.modal) return;

    if (this.btnModeToggle) {
      this.btnModeToggle.addEventListener('click', () => {
        this.toggleDevMode();
      });
    }

    // Populate levels selector
    if (this.roomSelect) {
      this.refreshRoomSelect();

      this.roomSelect.addEventListener('change', () => {
        sfx.playClick();
        this.saveCurrentToStorage();
        this.loadRoom(parseInt(this.roomSelect.value, 10));
      });
    }

    // Room prev/next buttons
    if (this.btnRoomPrev) {
      this.btnRoomPrev.addEventListener('click', () => {
        sfx.playClick();
        this.saveCurrentToStorage();
        if (this.isDevMode) {
          const prevIdx = (this.currentRoomIndex - 1 + LEVEL_DATA.length) % LEVEL_DATA.length;
          this.loadRoom(prevIdx);
        } else {
          const prevIdx = (this.currentCustomIndex - 1 + this.customLevels.length) % this.customLevels.length;
          this.loadRoom(prevIdx);
        }
      });
    }

    if (this.btnRoomNext) {
      this.btnRoomNext.addEventListener('click', () => {
        sfx.playClick();
        this.saveCurrentToStorage();
        if (this.isDevMode) {
          const nextIdx = (this.currentRoomIndex + 1) % LEVEL_DATA.length;
          this.loadRoom(nextIdx);
        } else {
          const nextIdx = (this.currentCustomIndex + 1) % this.customLevels.length;
          this.loadRoom(nextIdx);
        }
      });
    }

    // Add new custom level button
    if (this.btnNewLevel) {
      this.btnNewLevel.addEventListener('click', () => {
        sfx.playBerryCollect();
        this.saveCurrentToStorage();
        const newLvl = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_LEVEL));
        newLvl.name = `Custom Level ${this.customLevels.length + 1}`;
        this.customLevels.push(newLvl);
        this.currentCustomIndex = this.customLevels.length - 1;
        this.saveCustomLevelsToStorage();
        this.refreshRoomSelect();
        this.renderSavedLevelsList();
        this.loadRoom(this.currentCustomIndex);
        this.updateStatusMsg(`CREATED NEW CUSTOM LEVEL #${this.currentCustomIndex + 1}!`, true);
      });
    }

    // Delete custom level button
    if (this.btnDeleteLevel) {
      this.btnDeleteLevel.addEventListener('click', () => {
        if (!confirm(`Delete custom level "${this.roomName}"?`)) return;
        sfx.playDeath();
        if (this.customLevels.length <= 1) {
          this.customLevels[0] = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_LEVEL));
          this.currentCustomIndex = 0;
          this.updateStatusMsg('RESET SINGLE CUSTOM LEVEL TO TEMPLATE.', true);
        } else {
          this.customLevels.splice(this.currentCustomIndex, 1);
          this.currentCustomIndex = Math.max(0, this.currentCustomIndex - 1);
          this.updateStatusMsg('DELETED CUSTOM LEVEL.', true);
        }
        this.saveCustomLevelsToStorage();
        this.refreshRoomSelect();
        this.renderSavedLevelsList();
        this.loadRoom(this.currentCustomIndex);
      });
    }

    // Zoom in / out
    if (this.btnZoomIn) {
      this.btnZoomIn.addEventListener('click', () => {
        sfx.playClick();
        if (this.zoomIndex < this.zoomLevels.length - 1) {
          this.zoomIndex++;
          this.setTileSize(this.zoomLevels[this.zoomIndex]);
        }
      });
    }

    if (this.btnZoomOut) {
      this.btnZoomOut.addEventListener('click', () => {
        sfx.playClick();
        if (this.zoomIndex > 0) {
          this.zoomIndex--;
          this.setTileSize(this.zoomLevels[this.zoomIndex]);
        }
      });
    }

    // Populate tile palette buttons
    if (this.tileButtonsContainer) {
      this.tileButtonsContainer.innerHTML = '';
      TILE_DEFINITIONS.forEach(def => {
        const btn = document.createElement('button');
        btn.className = `editor-tile-btn ${def.char === this.selectedTile ? 'active-tile' : ''}`;
        btn.dataset.char = def.char;
        btn.title = `${def.name} [${def.char}]: ${def.desc}`;
        btn.innerHTML = `<span class="tile-swatch" style="background:${def.color};"></span><span class="tile-label">${def.char === '.' ? 'AIR' : def.char}</span>`;

        btn.addEventListener('click', () => {
          sfx.playClick();
          this.selectedTile = def.char;
          this.updateTileButtons();
          this.updateStatusMsg(`TOOL: ${def.name} [${def.char}] - ${def.desc}`);
        });

        this.tileButtonsContainer.appendChild(btn);
      });
    }

    if (this.nameInput) {
      this.nameInput.addEventListener('input', () => {
        this.roomName = this.nameInput.value;
        this.saveCurrentToStorage();
      });
    }

    if (this.biomeSelect) {
      this.biomeSelect.addEventListener('change', () => {
        this.biome = parseInt(this.biomeSelect.value, 10);
        this.saveCurrentToStorage();
        this.render();
      });
    }

    if (this.windSelect) {
      this.windSelect.addEventListener('change', () => {
        this.wind = parseInt(this.windSelect.value, 10);
        this.saveCurrentToStorage();
        this.render();
      });
    }

    if (this.colsInput) {
      this.colsInput.addEventListener('change', () => {
        const newCols = parseInt(this.colsInput.value, 10);
        if (!isNaN(newCols) && newCols >= 16 && newCols <= 120) {
          this.setDimensions(newCols, this.rows);
        } else {
          this.colsInput.value = this.cols;
        }
      });
    }

    if (this.rowsInput) {
      this.rowsInput.addEventListener('change', () => {
        const newRows = parseInt(this.rowsInput.value, 10);
        if (!isNaN(newRows) && newRows >= 12 && newRows <= 60) {
          this.setDimensions(this.cols, newRows);
        } else {
          this.rowsInput.value = this.rows;
        }
      });
    }

    if (this.featherInput) {
      this.featherInput.addEventListener('change', () => {
        const val = parseFloat(this.featherInput.value);
        if (!isNaN(val) && val >= 0.5 && val <= 30) {
          this.featherTime = val;
          this.saveCurrentToStorage();
          this.updateStatusMsg(`ROOM FEATHER FLIGHT TIME SET TO ${val.toFixed(1)}s!`, true);
        } else {
          this.featherInput.value = this.featherTime;
        }
      });
    }

    // Add moving platform button
    if (this.btnAddPlatform) {
      this.btnAddPlatform.addEventListener('click', () => {
        sfx.playClick();
        this.selectedTile = '=';
        this.updateTileButtons();
        this.liftStart = null;
        this.updateStatusMsg('LIFT TOOL SELECTED: CLICK START TILE ON CANVAS, THEN END TILE!', true);
      });
    }

    if (this.btnClose) this.btnClose.addEventListener('click', () => this.close());
    if (this.btnDone) this.btnDone.addEventListener('click', () => this.close());

    // Saved Levels modal triggers
    if (this.btnOpenSaved) {
      this.btnOpenSaved.addEventListener('click', () => {
        sfx.playClick();
        this.openSavedLevels();
      });
    }

    if (this.btnSavedBottom) {
      this.btnSavedBottom.addEventListener('click', () => {
        sfx.playClick();
        this.openSavedLevels();
      });
    }

    if (this.btnCloseSaved) {
      this.btnCloseSaved.addEventListener('click', () => {
        sfx.playClick();
        this.closeSavedLevels();
      });
    }

    if (this.btnSavedClose) {
      this.btnSavedClose.addEventListener('click', () => {
        sfx.playClick();
        this.closeSavedLevels();
      });
    }

    if (this.btnSavedNew) {
      this.btnSavedNew.addEventListener('click', () => {
        sfx.playBerryCollect();
        this.saveCurrentToStorage();
        const newLvl = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_LEVEL));
        newLvl.name = `Custom Level ${this.customLevels.length + 1}`;
        this.customLevels.push(newLvl);
        this.currentCustomIndex = this.customLevels.length - 1;
        this.saveCustomLevelsToStorage();
        this.refreshRoomSelect();
        this.renderSavedLevelsList();
        this.loadRoom(this.currentCustomIndex);
        this.updateStatusMsg(`CREATED NEW CUSTOM LEVEL #${this.currentCustomIndex + 1}!`, true);
      });
    }

    // Playtest button
    if (this.btnPlaytest) {
      this.btnPlaytest.addEventListener('click', () => {
        sfx.playJump();
        this.saveCurrentToStorage();
        if (this.isDevMode) {
          this.game.warpToLevel(this.currentRoomIndex);
        } else {
          this.game.playtestCustomLevel(this.getRoomData());
        }
        this.close();
      });
    }

    // Copy single level button
    if (this.btnCopy) {
      this.btnCopy.addEventListener('click', () => {
        if (this.isDevMode) return;
        sfx.playBerryCollect();
        this.saveCurrentToStorage();
        const copyLvl = JSON.parse(JSON.stringify(this.getRoomData()));
        copyLvl.name = `${this.roomName} (Copy)`;
        this.customLevels.push(copyLvl);
        this.currentCustomIndex = this.customLevels.length - 1;
        this.saveCustomLevelsToStorage();
        this.refreshRoomSelect();
        this.renderSavedLevelsList();
        this.loadRoom(this.currentCustomIndex);
        this.updateStatusMsg(`DUPLICATED LEVEL TO #${this.currentCustomIndex + 1}!`, true);
      });
    }

    // Export ALL levels button
    if (this.btnExportAll) {
      this.btnExportAll.addEventListener('click', () => {
        sfx.playClick();
        this.copyAllLevelsToClipboard();
      });
    }

    // Open/toggle code drawer
    if (this.btnExportImport) {
      this.btnExportImport.addEventListener('click', () => {
        sfx.playClick();
        if (this.exportBox) {
          this.exportBox.classList.toggle('hidden');
          if (!this.exportBox.classList.contains('hidden')) {
            const title = this.isDevMode ? `ROOM ${this.currentRoomIndex + 1} CODE:` : `CUSTOM LEVEL ${this.currentCustomIndex + 1} CODE:`;
            if (this.exportTitle) this.exportTitle.textContent = title;
            this.exportText.value = this.generateLevelCode();
            this.exportText.select();
          }
        }
      });
    }

    // Close export drawer
    if (this.btnCloseDrawer) {
      this.btnCloseDrawer.addEventListener('click', () => {
        sfx.playClick();
        if (this.exportBox) this.exportBox.classList.add('hidden');
      });
    }

    // Copy raw from drawer textarea
    if (this.btnCopyRaw && this.exportText) {
      this.btnCopyRaw.addEventListener('click', () => {
        sfx.playClick();
        this.exportText.select();
        navigator.clipboard.writeText(this.exportText.value).then(() => {
          this.updateStatusMsg('TEXT COPIED TO CLIPBOARD!', true);
        });
      });
    }

    // Download levels file
    if (this.btnDownloadFile) {
      this.btnDownloadFile.addEventListener('click', () => {
        sfx.playClick();
        if (this.isDevMode) {
          const fullCode = this.generateCampaignCode();
          this.downloadFile(fullCode, 'levels.js', 'text/javascript');
          this.updateStatusMsg('DOWNLOADED levels.js SUCCESSFULLY!', true);
        } else {
          const fullCode = this.generateAllLevelsCode();
          this.downloadFile(fullCode, 'custom_levels.js', 'text/javascript');
          this.updateStatusMsg('DOWNLOADED custom_levels.js SUCCESSFULLY!', true);
        }
      });
    }

    // Download json file
    if (this.btnDownloadJson) {
      this.btnDownloadJson.addEventListener('click', () => {
        sfx.playClick();
        if (this.isDevMode) {
          this.downloadFile(JSON.stringify(LEVEL_DATA, null, 2), 'levels.json', 'application/json');
          this.updateStatusMsg('DOWNLOADED levels.json SUCCESSFULLY!', true);
        } else {
          const allData = this.getAllRoomsData();
          this.downloadFile(JSON.stringify(allData, null, 2), 'custom_levels.json', 'application/json');
          this.updateStatusMsg('DOWNLOADED custom_levels.json SUCCESSFULLY!', true);
        }
      });
    }

    // Import code button
    if (this.btnImportApply && this.exportText) {
      this.btnImportApply.addEventListener('click', () => {
        sfx.playClick();
        this.importFromText(this.exportText.value);
      });
    }

    // Import from file button
    if (this.btnImportFile && this.fileInputEl) {
      this.btnImportFile.addEventListener('click', () => {
        sfx.playClick();
        this.fileInputEl.value = '';
        this.fileInputEl.click();
      });

      this.fileInputEl.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target.result;
          if (this.exportText) this.exportText.value = content;
          this.importFromText(content);
        };
        reader.readAsText(file);
      });
    }

    // Reset room
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        if (confirm('Reset this room back to the original default layout?')) {
          sfx.playDeath();
          this.resetRoomToDefault();
        }
      });
    }
  }

  setTileSize(size) {
    this.tileSize = size;
    if (this.zoomLevelEl) this.zoomLevelEl.textContent = `${size}px`;
    if (this.canvas) {
      this.canvas.width = this.cols * this.tileSize;
      this.canvas.height = this.rows * this.tileSize;
    }
    this.render();
  }

  updateTileButtons() {
    if (!this.tileButtonsContainer) return;
    const btns = this.tileButtonsContainer.querySelectorAll('.editor-tile-btn');
    btns.forEach(b => {
      b.classList.toggle('active-tile', b.dataset.char === this.selectedTile);
    });
  }

  updateStatusMsg(msg, isSuccess = false) {
    if (!this.statusMsgEl) return;
    this.statusMsgEl.textContent = msg;
    this.statusMsgEl.style.color = isSuccess ? 'var(--p8)' : 'var(--p7)';
  }

  setupCanvasEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / this.tileSize);
      const row = Math.floor(y / this.tileSize);

      // Check right-click to delete moving platform
      if (e.button === 2) {
        const platIdx = this.getPlatformAtCanvas(x, y);
        if (platIdx !== -1) {
          this.saveUndoState();
          this.removePlatform(platIdx);
          return;
        }
        if (this.selectedTile === '=') {
          this.liftStart = null;
          this.render();
          this.updateStatusMsg('CANCELLED LIFT PLACEMENT');
          return;
        }
      }

      // Check Lift Tool placement (Left Click)
      if (this.selectedTile === '=' && e.button === 0) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
          if (!this.liftStart) {
            this.liftStart = { col, row };
            this.updateStatusMsg(`LIFT START AT (${col}, ${row}). NOW CLICK DESTINATION TILE!`, true);
            sfx.playClick();
            this.render();
          } else {
            this.saveUndoState();
            const sx = this.liftStart.col * 10;
            const sy = this.liftStart.row * 10;
            let ex = col * 10;
            let ey = row * 10;
            if (sx === ex && sy === ey) {
              ex = sx + 80;
            }
            this.movingPlatforms.push({
              startX: sx,
              startY: sy,
              endX: ex,
              endY: ey,
              w: 24,
              h: 6,
              speed: 55
            });
            this.liftStart = null;
            this.saveCurrentToStorage();
            this.renderPlatformList();
            this.render();
            this.updateStatusMsg(`CREATED MOVING PLATFORM #${this.movingPlatforms.length}!`, true);
            sfx.playJump();
          }
        }
        return;
      }

      this.isDrawing = true;
      this.drawButton = e.button; // 0 = paint, 2 = erase
      this.saveUndoState();
      this.handlePointerAction(e);
    });

    window.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / this.tileSize);
      const row = Math.floor(y / this.tileSize);

      if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
        this.hoverCol = col;
        this.hoverRow = row;
        const curChar = this.map[row][col];
        const def = TILE_DEFINITIONS.find(t => t.char === curChar) || { name: 'Unknown' };

        const platIdx = this.getPlatformAtCanvas(x, y);
        if (platIdx !== -1) {
          const mp = this.movingPlatforms[platIdx];
          if (this.hoverCoordEl) {
            this.hoverCoordEl.textContent = `LIFT #${platIdx + 1}: (${Math.round(mp.startX / 10)},${Math.round(mp.startY / 10)}) -> (${Math.round(mp.endX / 10)},${Math.round(mp.endY / 10)}) | RIGHT-CLICK TO REMOVE`;
          }
        } else if (this.hoverCoordEl) {
          this.hoverCoordEl.textContent = `COL: ${col}, ROW: ${row} | TILE: ${def.name} [${curChar}]`;
        }
      } else {
        this.hoverCol = -1;
        this.hoverRow = -1;
      }

      if (this.isDrawing) {
        this.handlePointerAction(e);
      } else {
        this.render();
      }
    });

    window.addEventListener('pointerup', () => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.saveCurrentToStorage();
      }
    });
  }

  handlePointerAction(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

    // Right-clicking over platform removes it
    if (this.drawButton === 2) {
      const platIdx = this.getPlatformAtCanvas(x, y);
      if (platIdx !== -1) {
        this.removePlatform(platIdx);
        return;
      }
    }

    const placeChar = (this.drawButton === 2) ? '.' : this.selectedTile;
    this.setTileAt(col, row, placeChar);
  }

  setTileAt(col, row, char) {
    if (char === '=') return; // Handled separately by lift placement
    if (this.map[row][col] === char) return;

    // Single-instance constraints (Spawn, Exit, Flag)
    if (char === 'P') {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.map[r][c] === 'P') this.map[r][c] = '.';
        }
      }
    } else if (char === 'E') {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.map[r][c] === 'E') this.map[r][c] = '.';
        }
      }
    } else if (char === 'F') {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.map[r][c] === 'F') this.map[r][c] = '.';
        }
      }
    }

    this.map[row][col] = char;
    this.render();
  }

  saveUndoState() {
    this.undoStack.push({
      map: this.map.map(r => [...r]),
      platforms: JSON.parse(JSON.stringify(this.movingPlatforms))
    });
    if (this.undoStack.length > 20) this.undoStack.shift();
  }

  renderPlatformList() {
    if (this.platformCountEl) {
      this.platformCountEl.textContent = this.movingPlatforms.length;
    }
    if (!this.platformsListEl) return;
    this.platformsListEl.innerHTML = '';
    if (this.movingPlatforms.length === 0) {
      const emptySpan = document.createElement('span');
      emptySpan.style.color = 'var(--p6)';
      emptySpan.style.fontSize = '7px';
      emptySpan.textContent = 'NO LIFTS IN ROOM (CLICK "+ ADD LIFT" OR LIFT TOOL)';
      this.platformsListEl.appendChild(emptySpan);
      return;
    }

    this.movingPlatforms.forEach((mp, idx) => {
      const chip = document.createElement('div');
      chip.className = `platform-chip ${this.selectedPlatformIndex === idx ? 'selected' : ''}`;
      chip.title = `Lift #${idx + 1}: (${mp.startX}, ${mp.startY}) to (${mp.endX}, ${mp.endY})`;
      chip.innerHTML = `
        <span>#${idx + 1}: (${Math.round(mp.startX / 10)},${Math.round(mp.startY / 10)})&rarr;(${Math.round(mp.endX / 10)},${Math.round(mp.endY / 10)})</span>
        <div style="display:inline-flex;align-items:center;gap:3px;" onclick="event.stopPropagation()">
          <span style="color:var(--p6);font-size:7px;">SPD:</span>
          <input type="number" min="10" max="300" step="5" value="${mp.speed || 55}" class="platform-speed-input" data-idx="${idx}" style="width:38px;font-size:7px;background:var(--p0);color:var(--p7);border:1px solid var(--p5);padding:1px 2px;text-align:center;">
          <span style="font-size:7px;color:var(--p6)">px/s</span>
        </div>
        <button class="platform-chip-del" title="Delete lift" data-idx="${idx}">X</button>
      `;

      const speedInput = chip.querySelector('.platform-speed-input');
      if (speedInput) {
        speedInput.addEventListener('change', (ev) => {
          const val = parseInt(ev.target.value, 10);
          if (!isNaN(val) && val > 0) {
            mp.speed = val;
            this.saveCurrentToStorage();
            this.updateStatusMsg(`LIFT #${idx + 1} SPEED SET TO ${val} PX/S`, true);
          }
        });
      }

      chip.addEventListener('click', (e) => {
        if (e.target.classList.contains('platform-chip-del')) {
          e.stopPropagation();
          this.removePlatform(idx);
        } else if (!e.target.classList.contains('platform-speed-input')) {
          this.selectedPlatformIndex = (this.selectedPlatformIndex === idx) ? -1 : idx;
          this.renderPlatformList();
          this.render();
        }
      });

      this.platformsListEl.appendChild(chip);
    });
  }

  removePlatform(idx) {
    if (idx < 0 || idx >= this.movingPlatforms.length) return;
    this.movingPlatforms.splice(idx, 1);
    if (this.selectedPlatformIndex === idx) this.selectedPlatformIndex = -1;
    this.saveCurrentToStorage();
    this.renderPlatformList();
    this.render();
    this.updateStatusMsg('REMOVED MOVING PLATFORM!', true);
    sfx.playClick();
  }

  getPlatformAtCanvas(cx, cy) {
    const ts = this.tileSize;
    for (let i = this.movingPlatforms.length - 1; i >= 0; i--) {
      const mp = this.movingPlatforms[i];
      const sx = (mp.startX / 10) * ts;
      const sy = (mp.startY / 10) * ts;
      const ex = (mp.endX / 10) * ts;
      const ey = (mp.endY / 10) * ts;
      const w = (mp.w / 10) * ts;
      const h = Math.max(4, (mp.h / 10) * ts);

      if (cx >= sx - 4 && cx <= sx + w + 4 && cy >= sy - 4 && cy <= sy + h + 4) return i;
      if (cx >= ex - 4 && cx <= ex + w + 4 && cy >= ey - 4 && cy <= ey + h + 4) return i;
      const lineDist = this.distToSegment(cx, cy, sx + w / 2, sy + h / 2, ex + w / 2, ey + h / 2);
      if (lineDist < 6) return i;
    }
    return -1;
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  refreshRoomSelect() {
    if (!this.roomSelect) return;
    this.roomSelect.innerHTML = '';
    if (this.isDevMode) {
      LEVEL_DATA.forEach((lvl, idx) => {
        const opt = document.createElement('option');
        opt.value = idx.toString();
        const c = (lvl.map && lvl.map[0]) ? lvl.map[0].length : 32;
        const r = lvl.map ? lvl.map.length : 18;
        opt.textContent = `Room ${idx + 1}: ${lvl.name || 'Untitled'} (${c}x${r})`;
        this.roomSelect.appendChild(opt);
      });
      this.roomSelect.value = this.currentRoomIndex.toString();
    } else {
      this.customLevels.forEach((lvl, idx) => {
        const opt = document.createElement('option');
        opt.value = idx.toString();
        const c = (lvl.map && lvl.map[0]) ? lvl.map[0].length : 32;
        const r = lvl.map ? lvl.map.length : 18;
        opt.textContent = `Custom ${idx + 1}: ${lvl.name || 'Untitled'} (${c}x${r})`;
        this.roomSelect.appendChild(opt);
      });
      this.roomSelect.value = this.currentCustomIndex.toString();
    }
  }

  open(index = null) {
    sfx.playClick();
    sfx.setLowPass(true);
    this.customLevels = this.loadCustomLevelsFromStorage();
    this.updateModeUI();
    if (this.isDevMode) {
      if (index !== null) {
        this.currentRoomIndex = Math.max(0, Math.min(LEVEL_DATA.length - 1, index));
      } else {
        this.currentRoomIndex = Math.max(0, Math.min(LEVEL_DATA.length - 1, this.currentRoomIndex));
      }
      this.refreshRoomSelect();
      this.loadRoom(this.currentRoomIndex);
    } else {
      if (index !== null) {
        this.currentCustomIndex = Math.max(0, Math.min(this.customLevels.length - 1, index));
      } else {
        this.currentCustomIndex = Math.max(0, Math.min(this.customLevels.length - 1, this.currentCustomIndex));
      }
      this.refreshRoomSelect();
      this.loadRoom(this.currentCustomIndex);
    }
    if (this.modal) this.modal.classList.remove('hidden');
  }

  close() {
    sfx.playClick();
    sfx.setLowPass(false);
    if (this.modal) this.modal.classList.add('hidden');
    if (this.exportBox) this.exportBox.classList.add('hidden');
    this.closeSavedLevels();
  }

  loadRoom(index) {
    let lvl;
    if (this.isDevMode) {
      this.currentRoomIndex = Math.max(0, Math.min(LEVEL_DATA.length - 1, index));
      if (this.roomSelect) this.roomSelect.value = this.currentRoomIndex.toString();
      lvl = LEVEL_DATA[this.currentRoomIndex];
    } else {
      this.currentCustomIndex = Math.max(0, Math.min(this.customLevels.length - 1, index));
      if (this.roomSelect) this.roomSelect.value = this.currentCustomIndex.toString();
      lvl = this.customLevels[this.currentCustomIndex] || DEFAULT_CUSTOM_LEVEL;
    }

    this.roomName = lvl.name || (this.isDevMode ? `Room ${this.currentRoomIndex + 1}` : `Custom Level ${this.currentCustomIndex + 1}`);
    this.roomSub = lvl.sub || (this.isDevMode ? 'EXPEDITION' : 'CUSTOM ASCENT');
    this.biome = typeof lvl.biome === 'number' ? lvl.biome : 0;
    this.wind = typeof lvl.wind === 'number' ? lvl.wind : 0;
    this.featherTime = (typeof lvl.featherTime === 'number' && lvl.featherTime > 0) ? lvl.featherTime : 2.5;
    this.movingPlatforms = lvl.movingPlatforms ? JSON.parse(JSON.stringify(lvl.movingPlatforms)) : [];

    if (this.nameInput) this.nameInput.value = this.roomName;
    if (this.biomeSelect) this.biomeSelect.value = this.biome.toString();
    if (this.featherInput) this.featherInput.value = this.featherTime;
    if (this.windSelect) {
      let closest = '0';
      const w = this.wind;
      if (w >= 30) closest = '35';
      else if (w > 0) closest = '20';
      else if (w <= -30) closest = '-35';
      else if (w < 0) closest = '-20';
      this.windSelect.value = closest;
    }

    this.rows = lvl.map.length;
    this.cols = lvl.map[0].length;
    if (this.colsInput) this.colsInput.value = this.cols;
    if (this.rowsInput) this.rowsInput.value = this.rows;
    this.map = lvl.map.map(r => r.split(''));

    if (this.canvas) {
      this.canvas.width = this.cols * this.tileSize;
      this.canvas.height = this.rows * this.tileSize;
    }

    this.liftStart = null;
    this.selectedPlatformIndex = -1;
    this.undoStack = [];
    this.renderPlatformList();
    this.render();
    if (this.isDevMode) {
      this.updateStatusMsg(`LOADED DEV CAMPAIGN ROOM #${this.currentRoomIndex + 1}: ${this.roomName} (${this.cols}x${this.rows})`);
    } else {
      this.updateStatusMsg(`LOADED CUSTOM LEVEL #${this.currentCustomIndex + 1}: ${this.roomName} (${this.cols}x${this.rows})`);
    }
  }

  setDimensions(newCols, newRows) {
    if (newCols === this.cols && newRows === this.rows) return;
    this.saveUndoState();

    const oldMap = this.map;
    const oldRows = this.rows;
    const oldCols = this.cols;

    const newMap = [];
    for (let r = 0; r < newRows; r++) {
      const row = [];
      for (let c = 0; c < newCols; c++) {
        if (r < oldRows && c < oldCols) {
          row.push(oldMap[r][c]);
        } else {
          // Fill new borders with solids if on outer edges, otherwise air
          const isBorder = (r === 0 || r === newRows - 1 || c === 0 || c === newCols - 1);
          row.push(isBorder ? '#' : '.');
        }
      }
      newMap.push(row);
    }

    this.cols = newCols;
    this.rows = newRows;
    this.map = newMap;

    if (this.colsInput) this.colsInput.value = this.cols;
    if (this.rowsInput) this.rowsInput.value = this.rows;

    if (this.canvas) {
      this.canvas.width = this.cols * this.tileSize;
      this.canvas.height = this.rows * this.tileSize;
    }

    this.saveCurrentToStorage();
    this.render();
    this.updateStatusMsg(`RESIZED ROOM TO ${this.cols}x${this.rows} TILES!`, true);
    sfx.playClick();
  }

  saveCurrentToStorage() {
    if (this.isDevMode) {
      if (this.currentRoomIndex < 0 || this.currentRoomIndex >= LEVEL_DATA.length) return;
      LEVEL_DATA[this.currentRoomIndex] = {
        name: this.roomName,
        sub: this.roomSub,
        biome: this.biome,
        wind: this.wind,
        featherTime: this.featherTime,
        movingPlatforms: this.movingPlatforms,
        map: this.map.map(r => r.join(''))
      };
      this.saveDevCampaignOverrides();
      if (this.roomSelect && this.roomSelect.options[this.currentRoomIndex]) {
        this.roomSelect.options[this.currentRoomIndex].textContent = `Room ${this.currentRoomIndex + 1}: ${this.roomName || 'Untitled'} (${this.cols}x${this.rows})`;
      }
    } else {
      if (!this.customLevels[this.currentCustomIndex]) return;
      this.customLevels[this.currentCustomIndex] = {
        name: this.roomName,
        sub: this.roomSub,
        biome: this.biome,
        wind: this.wind,
        featherTime: this.featherTime,
        movingPlatforms: this.movingPlatforms,
        map: this.map.map(r => r.join(''))
      };
      this.saveCustomLevelsToStorage();
      if (this.roomSelect && this.roomSelect.options[this.currentCustomIndex]) {
        this.roomSelect.options[this.currentCustomIndex].textContent = `Custom ${this.currentCustomIndex + 1}: ${this.roomName || 'Untitled'} (${this.cols}x${this.rows})`;
      }
    }
  }

  resetRoomToDefault() {
    this.saveUndoState();
    if (this.isDevMode) {
      const orig = this.originalCampaignData[this.currentRoomIndex];
      if (orig) {
        LEVEL_DATA[this.currentRoomIndex] = JSON.parse(JSON.stringify(orig));
        try {
          const overrides = JSON.parse(localStorage.getItem('seleste_dev_campaign_overrides') || '{}');
          delete overrides[this.currentRoomIndex];
          localStorage.setItem('seleste_dev_campaign_overrides', JSON.stringify(overrides));
        } catch (_) {}
        this.loadRoom(this.currentRoomIndex);
        this.updateStatusMsg(`RESET CAMPAIGN ROOM #${this.currentRoomIndex + 1} TO ORIGINAL CODE!`, true);
      }
    } else {
      this.customLevels[this.currentCustomIndex] = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_LEVEL));
      this.saveCustomLevelsToStorage();
      this.refreshRoomSelect();
      this.loadRoom(this.currentCustomIndex);
      this.updateStatusMsg('CUSTOM LEVEL RESTORED TO TEMPLATE!', true);
    }
  }

  getRoomData() {
    return {
      name: this.roomName,
      sub: this.roomSub,
      biome: this.biome,
      wind: this.wind,
      featherTime: this.featherTime,
      movingPlatforms: this.movingPlatforms,
      map: this.map.map(r => r.join(''))
    };
  }

  generateLevelCode() {
    const mapStrings = this.map.map(r => `      "${r.join('')}"`).join(',\n');
    const moving = JSON.stringify(this.movingPlatforms || [], null, 2).replace(/\n/g, '\n    ');
    const featherLine = (typeof this.featherTime === 'number' && this.featherTime > 0) ? `\n    featherTime: ${this.featherTime},` : '';
    if (this.isDevMode) {
      return `  // ROOM ${this.currentRoomIndex + 1}: ${this.roomName.toUpperCase()} (${this.cols}x${this.rows})
  {
    name: ${JSON.stringify(this.roomName)},
    sub: ${JSON.stringify(this.roomSub)},
    biome: ${this.biome},
    wind: ${this.wind},${featherLine}
    movingPlatforms: ${moving},
    map: [
${mapStrings}
    ]
  }`;
    }
    return `  // CUSTOM LEVEL ${this.currentCustomIndex + 1}: ${this.roomName.toUpperCase()} (${this.cols}x${this.rows})
  {
    name: ${JSON.stringify(this.roomName)},
    sub: ${JSON.stringify(this.roomSub)},
    biome: ${this.biome},
    wind: ${this.wind},${featherLine}
    movingPlatforms: ${moving},
    map: [
${mapStrings}
    ]
  }`;
  }

  generateCampaignCode() {
    this.saveCurrentToStorage();
    const roomsFormatted = LEVEL_DATA.map((room, idx) => {
      const rows = room.map.map(r => `      "${r}"`).join(',\n');
      const moving = JSON.stringify(room.movingPlatforms || [], null, 2).replace(/\n/g, '\n    ');
      const featherLine = (typeof room.featherTime === 'number' && room.featherTime > 0) ? `\n    featherTime: ${room.featherTime},` : '';
      return `  // ROOM ${idx + 1}: ${(room.name || `Room ${idx + 1}`).toUpperCase()} (${(room.map[0] || '').length}x${room.map.length})
  {
    name: ${JSON.stringify(room.name || `Room ${idx + 1}`)},
    sub: ${JSON.stringify(room.sub || 'EXPEDITION')},
    biome: ${room.biome || 0},
    wind: ${room.wind || 0},${featherLine}
    movingPlatforms: ${moving},
    map: [
${rows}
    ]
  }`;
    }).join(',\n\n');

    return `// Handcrafted Level Rooms with Scrolling, Multi-Biomes & Celeste Mechanics
// Grid: 10x10 pixel tiles. Supports arbitrary width and height for horizontal/vertical scrolling!

export const LEVEL_DATA = [
${roomsFormatted}
];
`;
  }

  getAllRoomsData() {
    this.saveCurrentToStorage();
    return this.isDevMode ? LEVEL_DATA : this.customLevels;
  }

  generateAllLevelsCode() {
    this.saveCurrentToStorage();
    if (this.isDevMode) return this.generateCampaignCode();

    const roomsFormatted = this.customLevels.map((room, idx) => {
      const rows = room.map.map(r => `      "${r}"`).join(',\n');
      const moving = JSON.stringify(room.movingPlatforms || [], null, 2).replace(/\n/g, '\n    ');
      const featherLine = (typeof room.featherTime === 'number' && room.featherTime > 0) ? `\n    featherTime: ${room.featherTime},` : '';
      return `  // CUSTOM LEVEL ${idx + 1}: ${(room.name || `Custom Level ${idx + 1}`).toUpperCase()} (${(room.map[0] || '').length}x${room.map.length})
  {
    name: ${JSON.stringify(room.name || `Custom Level ${idx + 1}`)},
    sub: ${JSON.stringify(room.sub || 'CUSTOM ASCENT')},
    biome: ${room.biome || 0},
    wind: ${room.wind || 0},${featherLine}
    movingPlatforms: ${moving},
    map: [
${rows}
    ]
  }`;
    }).join(',\n\n');

    return `// Exported Custom User Levels
export const CUSTOM_LEVELS = [
${roomsFormatted}
];
`;
  }

  copyLevelCodeToClipboard() {
    const code = this.generateLevelCode();
    const titleText = this.isDevMode ? `ROOM ${this.currentRoomIndex + 1} CODE:` : `CUSTOM LEVEL ${this.currentCustomIndex + 1} CODE:`;
    if (this.exportTitle) this.exportTitle.textContent = titleText;
    if (this.exportText) this.exportText.value = code;

    navigator.clipboard.writeText(code).then(() => {
      this.updateStatusMsg(this.isDevMode ? 'ROOM CODE COPIED!' : 'CUSTOM LEVEL CODE COPIED!', true);
    }).catch(() => {
      if (this.exportBox) {
        this.exportBox.classList.remove('hidden');
        this.exportText.select();
      }
      this.updateStatusMsg('PLEASE COPY THE CODE FROM THE TEXTBOX BELOW:');
    });
  }

  copyAllLevelsToClipboard() {
    const allCode = this.isDevMode ? this.generateCampaignCode() : this.generateAllLevelsCode();
    const titleText = this.isDevMode ? `ALL CAMPAIGN ROOMS (${LEVEL_DATA.length} ROOMS):` : `ALL CUSTOM LEVELS (${this.customLevels.length} LEVELS):`;
    if (this.exportTitle) this.exportTitle.textContent = titleText;
    if (this.exportText) this.exportText.value = allCode;
    if (this.exportBox) this.exportBox.classList.remove('hidden');

    navigator.clipboard.writeText(allCode).then(() => {
      this.updateStatusMsg(this.isDevMode ? 'CAMPAIGN LEVEL_DATA COPIED!' : 'CUSTOM LEVELS COPIED!', true);
    }).catch(() => {
      this.exportText.select();
      this.updateStatusMsg('CODE READY BELOW - PLEASE COPY OR DOWNLOAD:');
    });
  }

  downloadFile(content, fileName, mimeType = 'text/javascript') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  openSavedLevels() {
    this.saveCurrentToStorage();
    this.renderSavedLevelsList();
    if (this.savedLevelsBox) {
      this.savedLevelsBox.classList.remove('hidden');
    }
  }

  closeSavedLevels() {
    if (this.savedLevelsBox) {
      this.savedLevelsBox.classList.add('hidden');
    }
  }

  renderSavedLevelsList() {
    if (!this.savedLevelsList) return;
    this.savedLevelsList.innerHTML = '';

    const BIOME_NAMES = [
      'FORSAKEN CITY',
      'OLD SITE',
      'RESORT',
      'GOLDEN RIDGE',
      'MIRROR TEMPLE',
      'CHASM ABYSS',
      'MOLTEN CORE',
      'CELESTIAL APEX'
    ];

    if (this.customLevels.length === 0) {
      this.customLevels = [JSON.parse(JSON.stringify(DEFAULT_CUSTOM_LEVEL))];
      this.saveCustomLevelsToStorage();
    }

    this.customLevels.forEach((lvl, idx) => {
      const card = document.createElement('div');
      card.className = `saved-level-card ${idx === this.currentCustomIndex ? 'active-level' : ''}`;

      const cols = (lvl.map && lvl.map[0]) ? lvl.map[0].length : 32;
      const rows = lvl.map ? lvl.map.length : 18;
      const berries = (lvl.map || []).reduce((acc, r) => acc + (r.split('*').length - 1), 0);
      const lifts = (lvl.movingPlatforms && lvl.movingPlatforms.length) || 0;
      const crystals = (lvl.map || []).reduce((acc, r) => acc + (r.split('D').length - 1), 0);
      const biomeName = BIOME_NAMES[lvl.biome] || 'FORSAKEN CITY';

      card.innerHTML = `
        <div class="saved-level-info">
          <div class="saved-level-header-row">
            <span class="saved-level-name">#${idx + 1}: ${lvl.name || 'Untitled'}</span>
            <span class="saved-level-badge">${cols}x${rows} TILES</span>
          </div>
          <div class="saved-level-sub">${lvl.sub || 'CUSTOM ASCENT'}</div>
          <div class="saved-level-meta">
            <span>BIOME: ${biomeName}</span>
            <span>•</span>
            <span>${berries} BERRY${berries === 1 ? '' : 'IES'}</span>
            <span>•</span>
            <span>${lifts} LIFT${lifts === 1 ? '' : 'S'}</span>
            <span>•</span>
            <span>${crystals} CRYSTAL${crystals === 1 ? '' : 'S'}</span>
          </div>
        </div>
        <div class="saved-level-actions">
          <button class="pixel-btn saved-level-play-btn" data-idx="${idx}">PLAY &gt;&gt;</button>
          <button class="pixel-btn saved-level-edit-btn" data-idx="${idx}">EDIT</button>
          <button class="pixel-mini-btn saved-level-del-btn" data-idx="${idx}" style="background: var(--p5); color: #fff;">DEL</button>
        </div>
      `;

      const playBtn = card.querySelector('.saved-level-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sfx.playJump();
          this.saveCurrentToStorage();
          this.currentCustomIndex = idx;
          const levelToPlay = this.customLevels[idx];
          this.closeSavedLevels();
          this.close();
          this.game.playtestCustomLevel(levelToPlay);
        });
      }

      const editBtn = card.querySelector('.saved-level-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sfx.playClick();
          this.saveCurrentToStorage();
          this.loadRoom(idx);
          this.closeSavedLevels();
          this.updateStatusMsg(`LOADED CUSTOM LEVEL #${idx + 1} (${lvl.name}) TO EDIT!`, true);
        });
      }

      const delBtn = card.querySelector('.saved-level-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sfx.playDeath();
          if (!confirm(`Delete custom level "${lvl.name}"?`)) return;
          if (this.customLevels.length <= 1) {
            this.customLevels[0] = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_LEVEL));
            this.currentCustomIndex = 0;
            this.updateStatusMsg('RESET SINGLE CUSTOM LEVEL TO TEMPLATE.', true);
          } else {
            this.customLevels.splice(idx, 1);
            this.currentCustomIndex = Math.max(0, Math.min(this.customLevels.length - 1, this.currentCustomIndex));
            this.updateStatusMsg('DELETED CUSTOM LEVEL.', true);
          }
          this.saveCustomLevelsToStorage();
          this.refreshRoomSelect();
          this.renderSavedLevelsList();
          this.loadRoom(this.currentCustomIndex);
        });
      }

      this.savedLevelsList.appendChild(card);
    });
  }

  parseCampaign(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;
    const trimmed = rawText.trim();

    // 1. Direct JSON (Array, Object with CUSTOM_LEVELS / LEVEL_DATA, or Record)
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].map) {
        return parsed;
      }
      if (parsed && Array.isArray(parsed.CUSTOM_LEVELS)) {
        return parsed.CUSTOM_LEVELS;
      }
      if (parsed && Array.isArray(parsed.LEVEL_DATA)) {
        return parsed.LEVEL_DATA;
      }
      if (parsed && typeof parsed === 'object') {
        const list = Object.values(parsed).filter(rm => rm && Array.isArray(rm.map));
        if (list.length > 0) return list;
      }
    } catch (_) {}

    // 2. JS Array slice evaluation: e.g. export const CUSTOM_LEVELS = [ ... ];
    const firstBracket = trimmed.indexOf('[');
    const lastBracket = trimmed.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      const arraySlice = trimmed.substring(firstBracket, lastBracket + 1);
      try {
        const evalArr = new Function(`"use strict"; return (${arraySlice});`)();
        if (Array.isArray(evalArr) && evalArr.length > 0 && evalArr[0].map) {
          return evalArr;
        }
      } catch (_) {}
    }

    // 3. Fallback regex room objects
    try {
      const roomBlocks = trimmed.match(/\{[\s\S]*?map\s*:\s*\[[\s\S]*?\][\s\S]*?\}(?=\s*(?:,|\n|$|\]))/g);
      if (roomBlocks && roomBlocks.length > 0) {
        const rooms = [];
        for (const block of roomBlocks) {
          try {
            const r = new Function(`"use strict"; return (${block});`)();
            if (r && Array.isArray(r.map)) rooms.push(r);
          } catch (_) {}
        }
        if (rooms.length > 0) return rooms;
      }
    } catch (_) {}

    return null;
  }

  importFromText(rawText) {
    try {
      if (!rawText || !rawText.trim()) {
        alert('Please paste code or select a file to import!');
        return;
      }
      const trimmed = rawText.trim();

      // 1. Check if importing multiple rooms
      const parsedRooms = this.parseCampaign(trimmed);
      if (parsedRooms && parsedRooms.length > 0) {
        if (this.isDevMode) {
          const count = Math.min(LEVEL_DATA.length, parsedRooms.length);
          for (let i = 0; i < count; i++) {
            const rm = parsedRooms[i];
            if (rm && Array.isArray(rm.map)) {
              LEVEL_DATA[i] = {
                name: rm.name || LEVEL_DATA[i].name,
                sub: rm.sub || LEVEL_DATA[i].sub,
                biome: typeof rm.biome === 'number' ? rm.biome : (LEVEL_DATA[i].biome || 0),
                wind: typeof rm.wind === 'number' ? rm.wind : (LEVEL_DATA[i].wind || 0),
                featherTime: typeof rm.featherTime === 'number' ? rm.featherTime : (LEVEL_DATA[i].featherTime || 2.5),
                movingPlatforms: Array.isArray(rm.movingPlatforms) ? rm.movingPlatforms : (LEVEL_DATA[i].movingPlatforms || []),
                map: rm.map
              };
            }
          }
          this.saveDevCampaignOverrides();
          this.refreshRoomSelect();
          this.loadRoom(this.currentRoomIndex);
          sfx.playBerryCollect();
          this.updateStatusMsg(`SUCCESSFULLY IMPORTED ${count} CAMPAIGN ROOMS!`, true);
          alert(`Success! Imported ${count} campaign rooms into LEVEL_DATA.`);
          return;
        }

        const imported = parsedRooms.filter(rm => rm && Array.isArray(rm.map)).map((rm, i) => ({
          name: rm.name || `Custom Level ${i + 1}`,
          sub: rm.sub || 'CUSTOM ASCENT',
          biome: typeof rm.biome === 'number' ? rm.biome : 0,
          wind: typeof rm.wind === 'number' ? rm.wind : 0,
          featherTime: typeof rm.featherTime === 'number' ? rm.featherTime : 2.5,
          movingPlatforms: Array.isArray(rm.movingPlatforms) ? rm.movingPlatforms : [],
          map: rm.map
        }));

        if (imported.length > 0) {
          this.customLevels = imported;
          this.currentCustomIndex = 0;
          this.saveCustomLevelsToStorage();
          this.refreshRoomSelect();
          this.renderSavedLevelsList();
          this.loadRoom(0);
          sfx.playBerryCollect();
          this.updateStatusMsg(`SUCCESSFULLY IMPORTED ${imported.length} CUSTOM LEVELS!`, true);
          alert(`Success! Imported ${imported.length} custom levels.`);
          return;
        }
      }

      // 2. Check for single room block
      let singleRoom = null;
      try {
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          singleRoom = new Function(`"use strict"; return (${trimmed.substring(firstBrace, lastBrace + 1)});`)();
        }
      } catch (_) {}

      if (singleRoom && Array.isArray(singleRoom.map)) {
        this.roomName = singleRoom.name || this.roomName;
        this.roomSub = singleRoom.sub || this.roomSub;
        this.biome = typeof singleRoom.biome === 'number' ? singleRoom.biome : this.biome;
        this.wind = typeof singleRoom.wind === 'number' ? singleRoom.wind : this.wind;
        this.featherTime = typeof singleRoom.featherTime === 'number' ? singleRoom.featherTime : 2.5;
        this.movingPlatforms = Array.isArray(singleRoom.movingPlatforms) ? singleRoom.movingPlatforms : [];
        this.map = singleRoom.map.map(r => r.split(''));
        this.rows = this.map.length;
        this.cols = this.map[0].length;
        if (this.canvas) {
          this.canvas.width = this.cols * this.tileSize;
          this.canvas.height = this.rows * this.tileSize;
        }
        if (this.nameInput) this.nameInput.value = this.roomName;
        if (this.biomeSelect) this.biomeSelect.value = this.biome.toString();
        if (this.windSelect) this.windSelect.value = this.wind.toString();
        if (this.featherInput) this.featherInput.value = this.featherTime;
        this.saveCurrentToStorage();
        this.refreshRoomSelect();
        this.renderSavedLevelsList();
        this.renderPlatformList();
        this.render();
        sfx.playBerryCollect();
        this.updateStatusMsg(`IMPORTED SINGLE CUSTOM LEVEL "${this.roomName}" (${this.cols}x${this.rows})!`, true);
        return;
      }

      // 3. Check for raw map array
      const mapMatch = rawText.match(/map:\s*\[([\s\S]*?)\]/);
      if (mapMatch) {
        const rows = mapMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('"') || line.startsWith("'"))
          .map(line => line.replace(/^["']|["'],?$/g, ''));

        if (rows.length > 0) {
          this.map = rows.map(r => r.split(''));
          this.rows = this.map.length;
          this.cols = this.map[0].length;
          if (this.canvas) {
            this.canvas.width = this.cols * this.tileSize;
            this.canvas.height = this.rows * this.tileSize;
          }
          this.saveCurrentToStorage();
          this.refreshRoomSelect();
          this.renderSavedLevelsList();
          this.render();
          sfx.playBerryCollect();
          this.updateStatusMsg(`IMPORTED ${this.cols}x${this.rows} MAP SUCCESSFULLY!`, true);
          return;
        }
      }

      alert('Could not parse level code. Make sure it contains an array of rooms or a single room object with map: ["...", ...]!');
    } catch (e) {
      alert('Import error: ' + e.message);
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ts = this.tileSize;
    const p = this.game.palette;

    // Room biome background
    ctx.fillStyle = p.getColor(0);
    ctx.fillRect(0, 0, w, h);

    // Subtle background checker grid
    ctx.fillStyle = p.getColor(1);
    ctx.globalAlpha = 0.2;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillRect(c * ts, r * ts, ts, ts);
        }
      }
    }
    ctx.globalAlpha = 1.0;

    // Render tiles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const char = this.map[r][c];
        const x = c * ts;
        const y = r * ts;

        if (char === '#') {
          // Solid block
          ctx.fillStyle = p.getColor(2);
          ctx.fillRect(x, y, ts, ts);
          ctx.fillStyle = p.getColor(4);
          ctx.fillRect(x, y, ts, 2);
          ctx.fillStyle = p.getColor(1);
          ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
        } else if (char === 'M') {
          // Dream block
          ctx.fillStyle = '#050414';
          ctx.fillRect(x, y, ts, ts);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + Math.floor(ts / 2) - 1, y + Math.floor(ts / 2) - 1, 2, 2);
        } else if (char === 'C') {
          // Crumble block
          ctx.fillStyle = '#8a6240';
          ctx.fillRect(x, y, ts, ts);
          ctx.fillStyle = '#c2a070';
          ctx.fillRect(x, y, ts, 2);
          ctx.fillStyle = '#3a2210';
          ctx.fillRect(x + 3, y + 4, 3, 1);
          ctx.fillRect(x + 5, y + 5, 1, 4);
        } else if (char === 'S') {
          // Spring
          ctx.fillStyle = '#333333';
          ctx.fillRect(x + 2, y + ts - 3, ts - 4, 3);
          ctx.fillStyle = '#ffea00';
          ctx.fillRect(x + 1, y + ts - 5, ts - 2, 2);
        } else if (char === 'D') {
          // Dash Crystal
          ctx.fillStyle = '#00e436';
          ctx.beginPath();
          ctx.arc(x + ts / 2, y + ts / 2, Math.max(2, ts / 3), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + ts / 2 - 1, y + ts / 2 - 1, 2, 2);
        } else if (char === '*') {
          // Strawberry
          ctx.fillStyle = '#ff2a55';
          ctx.fillRect(x + 2, y + 4, ts - 4, ts - 6);
          ctx.fillStyle = '#00e436';
          ctx.fillRect(x + 3, y + 2, ts - 6, 2);
        } else if (char === '^') {
          // Floor spike
          ctx.fillStyle = '#ff3b56';
          ctx.beginPath();
          ctx.moveTo(x + 1, y + ts);
          ctx.lineTo(x + ts / 2, y + 2);
          ctx.lineTo(x + ts - 1, y + ts);
          ctx.closePath();
          ctx.fill();
        } else if (char === 'v') {
          // Ceiling spike
          ctx.fillStyle = '#ff3b56';
          ctx.beginPath();
          ctx.moveTo(x + 1, y);
          ctx.lineTo(x + ts / 2, y + ts - 2);
          ctx.lineTo(x + ts - 1, y);
          ctx.closePath();
          ctx.fill();
        } else if (char === '<') {
          // Left wall spike
          ctx.fillStyle = '#ff3b56';
          ctx.beginPath();
          ctx.moveTo(x + ts, y + 1);
          ctx.lineTo(x + 2, y + ts / 2);
          ctx.lineTo(x + ts, y + ts - 1);
          ctx.closePath();
          ctx.fill();
        } else if (char === '>') {
          // Right wall spike
          ctx.fillStyle = '#ff3b56';
          ctx.beginPath();
          ctx.moveTo(x, y + 1);
          ctx.lineTo(x + ts - 2, y + ts / 2);
          ctx.lineTo(x, y + ts - 1);
          ctx.closePath();
          ctx.fill();
        } else if (char === 'I') {
          // Icicle
          ctx.fillStyle = '#90d7f2';
          ctx.beginPath();
          ctx.moveTo(x + 2, y);
          ctx.lineTo(x + ts - 2, y);
          ctx.lineTo(x + ts / 2, y + ts);
          ctx.closePath();
          ctx.fill();
        } else if (char === 'B') {
          // Bumper
          ctx.fillStyle = '#ff6b00';
          ctx.beginPath();
          ctx.arc(x + ts / 2, y + ts / 2, Math.max(2, ts / 2 - 1), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + ts / 2 - 1, y + ts / 2 - 1, 2, 2);
        } else if (char === 'G') {
          // Feather (curved golden quill & vane)
          ctx.save();
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 2, y + ts - 2);
          ctx.quadraticCurveTo(x + ts / 2, y + ts / 2, x + ts - 2, y + 2);
          ctx.stroke();
          ctx.fillStyle = '#ffea00';
          ctx.fillRect(x + ts / 2 - 1, y + 3, ts / 3, ts / 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + ts - 4, y + 2, 2, 2);
          ctx.restore();
        } else if (char === '1') {
          // Beat Block A
          ctx.fillStyle = '#1c4e8f';
          ctx.fillRect(x, y, ts, ts);
          ctx.fillStyle = '#ffffff';
          ctx.font = '7px monospace';
          ctx.fillText('1', x + 3, y + ts - 3);
        } else if (char === '2') {
          // Beat Block B
          ctx.fillStyle = '#ab3671';
          ctx.fillRect(x, y, ts, ts);
          ctx.fillStyle = '#ffffff';
          ctx.font = '7px monospace';
          ctx.fillText('2', x + 3, y + ts - 3);
        } else if (char === 'H') {
          // Heart
          ctx.fillStyle = '#00bbf9';
          ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + ts / 2 - 1, y + 3, 2, 2);
        } else if (char === 'P') {
          // Spawn
          ctx.fillStyle = '#00f5d4';
          ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
          ctx.fillStyle = '#ff2a55';
          ctx.fillRect(x + 3, y + 1, ts - 6, 2);
          ctx.fillStyle = '#000000';
          ctx.font = '7px monospace';
          ctx.fillText('P', x + 3, y + ts - 3);
        } else if (char === 'E') {
          // Exit door
          ctx.fillStyle = '#ffffff';
          ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
          ctx.fillStyle = '#000000';
          ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(x + 3, y + 3, ts - 6, ts - 6);
        } else if (char === 'F') {
          // Flag
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 2, y + 1, 2, ts - 2);
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(x + 4, y + 2, 5, 4);
        } else if (char === '.') {
          // Air dot
          ctx.fillStyle = p.getColor(2);
          ctx.globalAlpha = 0.25;
          ctx.fillRect(x + Math.floor(ts / 2), y + Math.floor(ts / 2), 1, 1);
          ctx.globalAlpha = 1.0;
        }

        // Faint grid lines
        ctx.strokeStyle = p.getColor(1);
        ctx.globalAlpha = 0.2;
        ctx.strokeRect(x + 0.5, y + 0.5, ts, ts);
        ctx.globalAlpha = 1.0;
      }
    }

    // Render Moving Platforms (Rails, End Pulleys, Ghost Destination, and Platform Body)
    for (let i = 0; i < this.movingPlatforms.length; i++) {
      const mp = this.movingPlatforms[i];
      const csx = (mp.startX / 10) * ts;
      const csy = (mp.startY / 10) * ts;
      const cex = (mp.endX / 10) * ts;
      const cey = (mp.endY / 10) * ts;
      const cw = (mp.w / 10) * ts;
      const ch = Math.max(3, (mp.h / 10) * ts);
      const isSel = (this.selectedPlatformIndex === i);

      // Track Guide Rail
      ctx.save();
      ctx.setLineDash([4, 2]);
      ctx.strokeStyle = isSel ? '#00f5d4' : '#ffd166';
      ctx.lineWidth = isSel ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(csx + cw / 2, csy + ch / 2);
      ctx.lineTo(cex + cw / 2, cey + ch / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // End Mounts / Pulleys
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(csx + cw / 2 - 2, csy + ch / 2 - 2, 4, 4);
      ctx.fillRect(cex + cw / 2 - 2, cey + ch / 2 - 2, 4, 4);

      // Ghost Destination Platform
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cex, cey, cw, ch);

      // Main Start Platform Body
      ctx.fillStyle = isSel ? '#00f5d4' : '#ffb703';
      ctx.fillRect(csx, csy, cw, ch);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(csx, csy, cw, 1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(csx, csy + ch - 1, cw, 1);

      // Lift Label
      ctx.fillStyle = isSel ? '#00f5d4' : '#ffffff';
      ctx.font = '7px monospace';
      ctx.fillText(`LIFT #${i + 1}`, csx, Math.max(8, csy - 2));
      ctx.restore();
    }

    // Rubber-band placement line for new lift
    if (this.liftStart && this.hoverCol >= 0 && this.hoverRow >= 0) {
      const sx = this.liftStart.col * ts + ts / 2;
      const sy = this.liftStart.row * ts + ts / 2;
      const ex = this.hoverCol * ts + ts / 2;
      const ey = this.hoverRow * ts + ts / 2;
      ctx.save();
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
      ctx.fillRect(ex - 2, ey - 2, 4, 4);
      ctx.restore();
    }

    // Wind indicator badge in canvas corner
    if (this.wind !== 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(4, 4, 68, 12);
      ctx.fillStyle = '#00f5d4';
      ctx.font = '7px monospace';
      const arrow = this.wind > 0 ? `WIND >> (+${this.wind})` : `<< WIND (${this.wind})`;
      ctx.fillText(arrow, 7, 13);
      ctx.restore();
    }

    // Hover outline
    if (this.hoverCol >= 0 && this.hoverRow >= 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        this.hoverCol * ts + 0.5,
        this.hoverRow * ts + 0.5,
        ts - 1,
        ts - 1
      );
    }
  }
}
