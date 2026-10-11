// Main Entry Point - Streamlined UI Controller & Game Initialization

import { Game } from './game.js';
import { sfx } from './audio.js';
import { DEFAULT_PALETTES } from './palettes.js';
import { LEVEL_DATA } from './levels.js';
import { drawSprite } from './sprites.js';
import { LevelEditor } from './editor.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const game = new Game(canvas);
  const editor = new LevelEditor(game);

  // Level Editor Trigger Elements & Unlock State
  const btnOpenEditor = document.getElementById('btn-open-editor');
  const btnSettingsEditor = document.getElementById('btn-settings-editor');

  function isEditorUnlocked() {
    return localStorage.getItem('seleste_editor_unlocked') === 'true' || (game.completedRooms && game.completedRooms.size >= LEVEL_DATA.length);
  }

  function updateEditorVisibility() {
    const unlocked = isEditorUnlocked();
    if (btnOpenEditor) {
      btnOpenEditor.style.display = unlocked ? '' : 'none';
    }
    if (btnSettingsEditor) {
      btnSettingsEditor.style.display = unlocked ? '' : 'none';
    }
  }

  function unlockEditor(fromCheat = false) {
    localStorage.setItem('seleste_editor_unlocked', 'true');
    updateEditorVisibility();
    if (fromCheat) {
      sfx.playHeartCollect();
      if (game.screenShake) game.screenShake.add(6);
      if (game.particles) {
        game.particles.emitBerryCollect(160, 90);
        game.particles.addFloater('LEVEL BUILDER UNLOCKED!', 85, 60, 8);
      }
      closeSettings();
      closeChapters();
      closeRoster();
      closeStudio();
      editor.open();
    }
  }

  window.addEventListener('editorUnlocked', () => {
    updateEditorVisibility();
  });

  if (btnOpenEditor) {
    btnOpenEditor.addEventListener('click', () => {
      if (isEditorUnlocked()) editor.open();
    });
  }
  if (btnSettingsEditor) {
    btnSettingsEditor.addEventListener('click', () => {
      if (isEditorUnlocked()) {
        closeSettings();
        editor.open();
      }
    });
  }

  // Rolling buffer for secret cheat code: "leveleditor"
  let secretCheatBuffer = '';
  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      secretCheatBuffer = (secretCheatBuffer + e.key.toLowerCase()).slice(-15);
      if (secretCheatBuffer.endsWith('leveleditor')) {
        secretCheatBuffer = '';
        unlockEditor(true);
      }
    }
  });

  // 5-Hero Roster Modal Elements
  const btnOpenRoster = document.getElementById('btn-open-roster');
  const btnSettingsRoster = document.getElementById('btn-settings-roster');
  const rosterModal = document.getElementById('roster-modal');
  const btnCloseRoster = document.getElementById('btn-close-roster');
  const btnRosterDone = document.getElementById('btn-roster-done');
  const rosterListGrid = document.getElementById('roster-list-grid');

  // Chapter Select Modal Elements
  const btnOpenChapters = document.getElementById('btn-open-chapters');
  const btnSettingsChapters = document.getElementById('btn-settings-chapters');
  const chaptersModal = document.getElementById('chapters-modal');
  const btnCloseChapters = document.getElementById('btn-close-chapters');
  const btnChaptersDone = document.getElementById('btn-chapters-done');
  const chapterListGrid = document.getElementById('chapter-list-grid');

  // Settings Modal Elements
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const settingsModal = document.getElementById('settings-modal');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnSettingsDone = document.getElementById('btn-settings-done');

  // Controls inside Settings
  const btnSound = document.getElementById('btn-sound');
  const btnMusic = document.getElementById('btn-music');
  const btnCrt = document.getElementById('btn-crt');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const crtOverlay = document.getElementById('crt-overlay');

  // Quick Palette Switcher in Top Bar
  const btnPalPrev = document.getElementById('btn-pal-prev');
  const btnPalNext = document.getElementById('btn-pal-next');
  const activePalName = document.getElementById('active-palette-name');
  const swatchesContainer = document.getElementById('palette-swatches');

  // Palette Studio Modal Elements
  const btnOpenStudio = document.getElementById('btn-open-palette-studio');
  const paletteModal = document.getElementById('palette-modal');
  const btnClosePaletteModal = document.getElementById('btn-close-palette-modal');
  const btnPaletteDone = document.getElementById('btn-palette-done');
  const presetList = document.getElementById('preset-list');
  const hexGrid = document.getElementById('hex-inputs-grid');
  const customPalNameInput = document.getElementById('custom-palette-name');
  const btnTestCustom = document.getElementById('btn-test-custom');
  const btnSaveCustom = document.getElementById('btn-save-custom');
  const btnDeletePal = document.getElementById('btn-delete-palette');

  // --- Settings Modal Handler ---
  function openSettings() {
    sfx.playClick();
    sfx.setLowPass(true);
    settingsModal.classList.remove('hidden');
  }

  function closeSettings() {
    sfx.playClick();
    sfx.setLowPass(false);
    settingsModal.classList.add('hidden');
  }

  btnOpenSettings.addEventListener('click', openSettings);
  btnCloseSettings.addEventListener('click', closeSettings);
  btnSettingsDone.addEventListener('click', closeSettings);
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSettings();
      closeChapters();
      closeRoster();
      closeStudio();
      editor.close();
    } else if ((e.key === 'KeyE' || e.key === 'e') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement ? document.activeElement.tagName : '';
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        if (!isEditorUnlocked()) return;
        if (editor.modal && !editor.modal.classList.contains('hidden')) {
          editor.close();
        } else {
          closeSettings();
          closeChapters();
          closeRoster();
          closeStudio();
          editor.open();
        }
      }
    }
  });

  // --- Chapter Select & Level Hub Handler ---
  const BIOME_NAMES = [
    'CYBER SKYLINE',
    'COSMIC NEBULAE',
    'ALPINE RIDGE',
    'AURORA SUMMIT',
    'MIRROR TEMPLE',
    'THE CHASM ABYSS',
    'THE MOLTEN CORE',
    'CELESTIAL APEX 4000M'
  ];

  function renderChapterList() {
    chapterListGrid.innerHTML = '';
    const currentIdx = game.level.currentRoomIndex;

    LEVEL_DATA.forEach((lvl, idx) => {
      const card = document.createElement('div');
      card.className = `chapter-card ${idx === currentIdx ? 'active-chapter' : ''}`;

      // Check if berry in room was collected
      const berryPrefix = `berry-${idx}`;
      let hasBerry = false;
      for (const collected of game.level.collectedBerries) {
        if (collected.startsWith(berryPrefix)) {
          hasBerry = true;
          break;
        }
      }

      const isCompleted = game.completedRooms && game.completedRooms.has(idx);
      const biomeName = BIOME_NAMES[lvl.biome] || 'EXPEDITION';
      const isHeartRoom = lvl.map.some(r => r.includes('H'));
      const heartStatus = isHeartRoom ? (game.level.collectedHeart ? '<span class="pixel-icon icon-heart"></span>HEART FOUND' : '<span class="pixel-icon icon-heart"></span>SECRET HEART') : '';

      card.innerHTML = `
        <div class="chapter-info">
          <div class="chapter-header-row">
            <span class="chapter-name">${lvl.name}</span>
            <span class="chapter-badge">${biomeName}</span>
            ${isCompleted ? '<span class="chapter-badge badge-completed">COMPLETED</span>' : ''}
          </div>
          <div class="chapter-stats">
            ${isCompleted ? '<span style="color: #29ffb6; font-size: 9px; font-weight: bold; display: inline-flex; align-items: center; gap: 3px;">&#10003; COMPLETED</span>' : ''}
            <span style="color: ${hasBerry ? 'var(--p7)' : 'var(--p6)'}; font-size: 9px; display: inline-flex; align-items: center;">
              <span class="pixel-icon icon-strawberry"></span>${hasBerry ? 'COLLECTED' : 'STRAWBERRY'}
            </span>
            ${heartStatus ? `<span style="color: var(--p6); font-size: 9px; display: inline-flex; align-items: center;">${heartStatus}</span>` : ''}
          </div>
        </div>
        <button class="pixel-btn chapter-warp-btn" style="background: ${idx === currentIdx ? 'var(--p5)' : 'var(--p3)'};">
          ${idx === currentIdx ? 'RETRY' : 'WARP >>'}
        </button>
      `;

      const warpBtn = card.querySelector('.chapter-warp-btn');
      warpBtn.addEventListener('click', () => {
        closeChapters();
        closeSettings();
        game.warpToLevel(idx);
      });

      chapterListGrid.appendChild(card);
    });
  }

  function openChapters() {
    sfx.playClick();
    sfx.setLowPass(true);
    renderChapterList();
    chaptersModal.classList.remove('hidden');
  }

  function closeChapters() {
    sfx.playClick();
    sfx.setLowPass(false);
    chaptersModal.classList.add('hidden');
  }

  btnOpenChapters.addEventListener('click', openChapters);
  if (btnSettingsChapters) {
    btnSettingsChapters.addEventListener('click', () => {
      closeSettings();
      openChapters();
    });
  }
  btnCloseChapters.addEventListener('click', closeChapters);
  btnChaptersDone.addEventListener('click', closeChapters);
  chaptersModal.addEventListener('click', (e) => {
    if (e.target === chaptersModal) closeChapters();
  });

  // Hook title screen chapter button
  game.onOpenChapterSelect = openChapters;

  // --- 5-Hero Character Roster Handler ---
  let previewAnimInterval = null;
  let previewAnimFrame = 0;

  function renderRosterList() {
    if (!rosterListGrid) return;
    rosterListGrid.innerHTML = '';
    const curHero = game.characters.getCurrent();

    game.characters.getAll().forEach((hero) => {
      const card = document.createElement('div');
      const isSelected = hero.id === curHero.id;
      card.className = `hero-card ${isSelected ? 'active-hero' : ''}`;
      card.dataset.heroId = hero.id;

      card.innerHTML = `
        <div class="hero-preview-box">
          <canvas class="hero-preview-canvas" width="36" height="36" data-hero="${hero.id}"></canvas>
        </div>
        <div class="hero-info">
          <div class="hero-header-row">
            <span class="hero-name">${hero.name}</span>
            <span class="hero-badge">${hero.badge}</span>
          </div>
          <div class="hero-title">${hero.title}</div>
          <div class="hero-desc">${hero.desc}</div>
        </div>
        <button class="pixel-btn hero-select-btn" style="background: ${isSelected ? 'var(--p5)' : 'var(--p3)'}; color: ${isSelected ? '#000000' : '#ffffff'};">
          ${isSelected ? '[ACTIVE]' : 'SELECT >>'}
        </button>
      `;

      card.addEventListener('click', () => {
        sfx.playClick();
        game.selectCharacter(hero.id);
        updateRosterUI();
      });

      rosterListGrid.appendChild(card);
    });

    drawPreviewCanvases();
  }

  function drawPreviewCanvases() {
    if (!rosterListGrid) return;
    const canvases = rosterListGrid.querySelectorAll('.hero-preview-canvas');
    canvases.forEach(cvs => {
      const heroId = cvs.dataset.hero;
      const hero = game.characters.getAll().find(h => h.id === heroId);
      if (!hero) return;
      const ctx = cvs.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 36, 36);
      const sprite = hero.sprites.idle[previewAnimFrame % hero.sprites.idle.length];
      drawSprite(ctx, sprite, 0, 0, game.palette, false, 3);
    });
  }

  function updateRosterUI() {
    const curHero = game.characters.getCurrent();
    if (btnOpenRoster) {
      btnOpenRoster.innerHTML = `<span class="pixel-icon icon-hero"></span>${curHero.name.toUpperCase()}`;
    }
    if (!rosterListGrid) return;
    const cards = rosterListGrid.querySelectorAll('.hero-card');
    cards.forEach(card => {
      const isSelected = card.dataset.heroId === curHero.id;
      card.classList.toggle('active-hero', isSelected);
      const btn = card.querySelector('.hero-select-btn');
      if (btn) {
        btn.textContent = isSelected ? '[ACTIVE]' : 'SELECT >>';
        btn.style.background = isSelected ? 'var(--p5)' : 'var(--p3)';
        btn.style.color = isSelected ? '#000000' : '#ffffff';
      }
    });
  }

  function startRosterAnimation() {
    if (previewAnimInterval) clearInterval(previewAnimInterval);
    previewAnimInterval = setInterval(() => {
      if (rosterModal && rosterModal.classList.contains('hidden')) {
        clearInterval(previewAnimInterval);
        previewAnimInterval = null;
        return;
      }
      previewAnimFrame = (previewAnimFrame + 1) % 4;
      drawPreviewCanvases();
    }, 150);
  }

  function openRoster() {
    sfx.playClick();
    sfx.setLowPass(true);
    renderRosterList();
    if (rosterModal) rosterModal.classList.remove('hidden');
    startRosterAnimation();
  }

  function closeRoster() {
    sfx.playClick();
    sfx.setLowPass(false);
    if (previewAnimInterval) {
      clearInterval(previewAnimInterval);
      previewAnimInterval = null;
    }
    if (rosterModal) rosterModal.classList.add('hidden');
  }

  if (btnOpenRoster) btnOpenRoster.addEventListener('click', openRoster);
  if (btnSettingsRoster) {
    btnSettingsRoster.addEventListener('click', () => {
      closeSettings();
      openRoster();
    });
  }
  if (btnCloseRoster) btnCloseRoster.addEventListener('click', closeRoster);
  if (btnRosterDone) btnRosterDone.addEventListener('click', closeRoster);
  if (rosterModal) {
    rosterModal.addEventListener('click', (e) => {
      if (e.target === rosterModal) closeRoster();
    });
  }

  // Hook game character changes from title screen / hotkey V
  game.onOpenRosterSelect = openRoster;
  game.onCharacterChanged = (char) => {
    if (btnOpenRoster) {
      btnOpenRoster.innerHTML = `<span class="pixel-icon icon-hero"></span>${char.name.toUpperCase()}`;
    }
    updateRosterUI();
  };

  // --- Sound & CRT Controls ---
  btnSound.addEventListener('click', () => {
    sfx.playClick();
    const muted = sfx.toggleMute();
    btnSound.innerHTML = `<span class="pixel-icon ${muted ? 'icon-sound-off' : 'icon-sound'}"></span>SFX: ${muted ? 'OFF' : 'ON'}`;
  });

  btnMusic.addEventListener('click', () => {
    sfx.playClick();
    const musicOn = sfx.toggleMusic();
    btnMusic.innerHTML = `<span class="pixel-icon ${musicOn ? 'icon-music' : 'icon-music-off'}"></span>BGM: ${musicOn ? 'ON' : 'OFF'}`;
  });

  btnCrt.addEventListener('click', () => {
    sfx.playClick();
    crtOverlay.classList.toggle('hidden');
    const isVisible = !crtOverlay.classList.contains('hidden');
    btnCrt.innerHTML = `<span class="pixel-icon icon-crt"></span>CRT: ${isVisible ? 'ON' : 'OFF'}`;
  });

  btnFullscreen.addEventListener('click', () => {
    sfx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // --- Badeline Mirror Doppelganger Setting ---
  const btnDoppelganger = document.getElementById('btn-doppelganger');
  if (btnDoppelganger) {
    const updateBadelineBtn = (on) => {
      btnDoppelganger.innerHTML = `<span class="pixel-icon icon-shadow"></span>BADELINE: ${on ? 'ON' : 'OFF'}`;
      btnDoppelganger.classList.toggle('btn-badeline-active', on);
    };
    updateBadelineBtn(game.doppelgangerEnabled);
    btnDoppelganger.addEventListener('click', () => {
      sfx.playClick();
      const on = game.toggleDoppelganger();
      updateBadelineBtn(on);
    });
  }

  // --- Speedrun Splits HUD Setting ---
  const btnSpeedrunHud = document.getElementById('btn-speedrun-hud');
  if (btnSpeedrunHud) {
    btnSpeedrunHud.textContent = game.speedrunHUD ? 'SPLITS HUD: ON' : 'SPLITS HUD: OFF';
    btnSpeedrunHud.addEventListener('click', () => {
      sfx.playClick();
      const on = game.toggleSpeedrunHUD();
      btnSpeedrunHud.textContent = on ? 'SPLITS HUD: ON' : 'SPLITS HUD: OFF';
    });
  }

  // --- Gamepad / Controller UI Wiring ---
  const btnControllerIndicator = document.getElementById('btn-controller-indicator');
  const controllerIndicatorText = document.getElementById('controller-indicator-text');
  const btnRumble = document.getElementById('btn-rumble');
  const btnGamepadStatus = document.getElementById('btn-gamepad-status');
  const gamepadStatusText = document.getElementById('gamepad-status-text');

  function updateGamepadUI(connected, name) {
    if (btnControllerIndicator) {
      if (connected) {
        btnControllerIndicator.style.display = 'inline-flex';
        btnControllerIndicator.classList.add('pad-connected');
        if (controllerIndicatorText) {
          const shortName = (name || 'PAD').split(' ')[0];
          controllerIndicatorText.textContent = shortName;
        }
      } else {
        btnControllerIndicator.style.display = 'none';
        btnControllerIndicator.classList.remove('pad-connected');
        if (controllerIndicatorText) controllerIndicatorText.textContent = 'PAD';
      }
    }
    if (gamepadStatusText) {
      gamepadStatusText.textContent = connected ? (name || 'CONNECTED') : 'NO PAD';
    }
    if (btnGamepadStatus) {
      btnGamepadStatus.classList.toggle('btn-badeline-active', connected);
    }
  }

  if (game.gamepad) {
    game.gamepad.onStateChange = (connected, name) => {
      updateGamepadUI(connected, name);
    };
    if (game.gamepad.connected) {
      updateGamepadUI(true, game.gamepad.displayName);
    }
  }

  if (btnControllerIndicator) {
    btnControllerIndicator.addEventListener('click', () => {
      openSettings();
    });
  }

  if (btnRumble && game.gamepad) {
    const updateRumbleBtn = () => {
      btnRumble.innerHTML = `<span class="pixel-icon icon-gamepad"></span>RUMBLE: ${game.gamepad.rumbleEnabled ? 'ON' : 'OFF'}`;
    };
    updateRumbleBtn();
    btnRumble.addEventListener('click', () => {
      sfx.playClick();
      game.gamepad.toggleRumble();
      updateRumbleBtn();
    });
  }

  if (btnGamepadStatus && game.gamepad) {
    btnGamepadStatus.addEventListener('click', () => {
      sfx.playClick();
      if (game.gamepad.connected) {
        game.gamepad.vibrate(150, 0.6, 0.6);
        if (game.particles) {
          game.particles.addFloater('TEST RUMBLE OK!', 80, 50, 7);
        }
      } else {
        if (game.particles) {
          game.particles.addFloater('PRESS ANY BUTTON ON CONTROLLER', 40, 50, 6);
        }
      }
    });
  }

  // --- Palette Bar Update ---
  function updatePaletteUI() {
    const cur = game.palette.getCurrent();
    activePalName.textContent = cur.name;

    // Render 9 mini swatch chips
    swatchesContainer.innerHTML = '';
    cur.colors.forEach((hex, idx) => {
      const chip = document.createElement('div');
      chip.className = 'swatch-chip';
      chip.style.backgroundColor = hex;
      chip.title = `Color [${idx}]: ${hex}`;
      swatchesContainer.appendChild(chip);
    });

    // Check delete button visibility in modal
    const isCustom = !DEFAULT_PALETTES.some(p => p.id === cur.id);
    btnDeletePal.style.display = isCustom ? 'inline-flex' : 'none';

    // Redraw preview canvases if roster modal is open
    if (rosterModal && !rosterModal.classList.contains('hidden')) {
      drawPreviewCanvases();
    }
  }

  btnPalPrev.addEventListener('click', () => {
    sfx.playClick();
    game.palette.prev();
    updatePaletteUI();
    renderPresetList();
  });

  btnPalNext.addEventListener('click', () => {
    sfx.playClick();
    game.palette.next();
    updatePaletteUI();
    renderPresetList();
  });

  // --- Palette Studio Modal ---
  function openStudio() {
    sfx.playClick();
    sfx.setLowPass(true);
    paletteModal.classList.remove('hidden');
    renderPresetList();
    initHexInputs();
  }

  function closeStudio() {
    sfx.playClick();
    sfx.setLowPass(false);
    paletteModal.classList.add('hidden');
  }

  btnOpenStudio.addEventListener('click', openStudio);
  btnClosePaletteModal.addEventListener('click', closeStudio);
  btnPaletteDone.addEventListener('click', closeStudio);
  if (paletteModal) {
    paletteModal.addEventListener('click', (e) => {
      if (e.target === paletteModal) closeStudio();
    });
  }

  function renderPresetList() {
    presetList.innerHTML = '';
    const all = game.palette.getAll();
    const current = game.palette.getCurrent();

    all.forEach((pal, idx) => {
      const item = document.createElement('div');
      item.className = 'preset-item' + (pal.id === current.id ? ' active' : '');

      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${idx + 1}. ${pal.name}`;
      nameSpan.style.fontSize = '9px';
      nameSpan.style.color = pal.id === current.id ? '#ffffff' : 'var(--p7)';

      const chipsBox = document.createElement('div');
      chipsBox.className = 'preset-chips-mini';
      pal.colors.forEach(hex => {
        const mini = document.createElement('div');
        mini.className = 'mini-chip';
        mini.style.backgroundColor = hex;
        chipsBox.appendChild(mini);
      });

      item.appendChild(nameSpan);
      item.appendChild(chipsBox);

      item.addEventListener('click', () => {
        sfx.playClick();
        game.palette.setIndex(idx);
        updatePaletteUI();
        renderPresetList();
        initHexInputs();
      });

      presetList.appendChild(item);
    });
  }

  // 9 Hex input boxes with native color pickers
  function initHexInputs() {
    const cur = game.palette.getCurrent();
    hexGrid.innerHTML = '';

    cur.colors.forEach((hex, i) => {
      const group = document.createElement('div');
      group.className = 'hex-input-group';

      const colorPicker = document.createElement('input');
      colorPicker.type = 'color';
      colorPicker.value = hex;
      colorPicker.id = `picker-${i}`;

      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.value = hex;
      textInput.id = `hex-${i}`;
      textInput.className = 'hex-text-input';
      textInput.maxLength = 7;

      colorPicker.addEventListener('input', () => {
        textInput.value = colorPicker.value.toUpperCase();
      });

      textInput.addEventListener('input', () => {
        let val = textInput.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          colorPicker.value = val;
        }
      });

      group.appendChild(colorPicker);
      group.appendChild(textInput);
      hexGrid.appendChild(group);
    });

    customPalNameInput.value = cur.name.startsWith('Custom') ? cur.name : `${cur.name} (Mod)`;
  }

  function getHexesFromInputs() {
    const hexes = [];
    for (let i = 0; i < 9; i++) {
      const txt = document.getElementById(`hex-${i}`);
      let hex = txt ? txt.value.trim() : '#000000';
      if (!hex.startsWith('#')) hex = '#' + hex;
      hexes.push(hex);
    }
    return hexes;
  }

  btnTestCustom.addEventListener('click', () => {
    sfx.playClick();
    const hexes = getHexesFromInputs();
    const cur = game.palette.getCurrent();
    cur.colors = hexes;
    game.palette.applyToCSS();
    updatePaletteUI();
  });

  btnSaveCustom.addEventListener('click', () => {
    sfx.playClick();
    const hexes = getHexesFromInputs();
    const name = customPalNameInput.value.trim() || 'Custom Palette';
    try {
      game.palette.addCustomPalette(name, hexes);
      updatePaletteUI();
      renderPresetList();
      alert(`Palette "${name}" saved!`);
    } catch (e) {
      alert(e.message);
    }
  });

  btnDeletePal.addEventListener('click', () => {
    sfx.playClick();
    if (confirm('Delete this custom palette preset?')) {
      game.palette.deleteCurrentIfCustom();
      updatePaletteUI();
      renderPresetList();
      initHexInputs();
    }
  });

  // Dynamic Palette listener
  game.onPaletteChanged = () => {
    updatePaletteUI();
  };

  // Initial UI Render
  updatePaletteUI();
  updateEditorVisibility();
  const initialHero = game.characters.getCurrent();
  if (btnOpenRoster && initialHero) {
    btnOpenRoster.innerHTML = `<span class="pixel-icon icon-hero"></span>${initialHero.name.toUpperCase()}`;
  }
});
