import { PUZZLES, PUZZLE_CATEGORIES } from './src/puzzles.js';
import { REBUS_PUZZLES } from './src/rebusPuzzles.js';
import { renderRebusVisual } from './src/rebusRenderer.js';
import { WORDLE_DICTIONARY } from './src/wordleDictionary.js';
import { CONNECTIONS_BOARDS } from './src/connectionsPuzzles.js';
import { CONTEXTO_GAMES, getContextoRank } from './src/contextoPuzzles.js';
import { SPELLING_BEE_HIVES } from './src/spellingBeePuzzles.js';
import { sound } from './src/audio.js';
import { launchConfetti } from './src/confetti.js';

class WordplayArcadeApp {
  constructor() {
    this.storageKey = 'wordplay_arcade_v2';
    this.state = this.loadState();

    // Active Navigation / Gameplay State
    this.activeScreen = 'home'; // 'home' | 'game'
    this.gameMode = 'emoji'; // 'emoji' | 'rebus' | 'wordle' | 'connections' | 'contexto' | 'spellingBee'
    this.currentCategory = 'all';
    this.currentList = [];
    this.currentPuzzle = null;
    this.placedLetters = [];
    this.keyboardPool = [];
    this.clueRevealed = false;
    this.archiveTab = 'emoji';

    // Wordle State
    this.wordleGuesses = [];
    this.wordleCurrentGuess = '';
    this.wordleMaxGuesses = 6;

    // Connections State
    this.connectionsCurrentBoard = null;
    this.connectionsSelectedTiles = [];
    this.connectionsRemainingTiles = [];
    this.connectionsSolvedGroups = [];
    this.connectionsMistakes = 4;
    this.connectionsMaxMistakes = 4;
    this.connectionsIsGameOver = false;

    // Contexto State
    this.contextoCurrentGame = null;
    this.contextoGuesses = [];
    this.contextoSortMode = 'rank'; // 'rank' | 'time'
    this.contextoIsGameOver = false;

    // Spelling Bee State
    this.beeCurrentHive = null;
    this.beeInputWord = '';
    this.beeScore = 0;
    this.beeFoundWords = new Set();
    this.beeShelfOpen = false;

    // Admire Board State
    this.isAdmiring = false;

    this.cacheDom();
    this.bindEvents();
    this.initApp();
  }

  loadState() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return {
          coins: typeof p.coins === 'number' ? p.coins : 100,
          streak: p.streak || 0,
          bestStreak: p.bestStreak || 0,
          solvedEmojiIds: Array.isArray(p.solvedEmojiIds) ? p.solvedEmojiIds : (Array.isArray(p.solvedIds) ? p.solvedIds : []),
          solvedRebusIds: Array.isArray(p.solvedRebusIds) ? p.solvedRebusIds : [],
          theme: p.theme || 'paper',
          emojiIndex: p.emojiIndex || 0,
          rebusIndex: p.rebusIndex || 0
        };
      } catch (e) {
        console.error('Save parse error', e);
      }
    }
    return {
      coins: 100,
      streak: 0,
      bestStreak: 0,
      solvedEmojiIds: [],
      solvedRebusIds: [],
      theme: 'paper',
      emojiIndex: 0,
      rebusIndex: 0
    };
  }

  saveState() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    this.updateStatsUI();
  }

  cacheDom() {
    // Navigation & Global HUD
    this.homeNavBtn = document.getElementById('homeNavBtn');
    this.coinCountEl = document.getElementById('coinCount');
    this.streakCountEl = document.getElementById('streakCount');
    this.bookBtn = document.getElementById('bookBtn');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');

    // Screens
    this.homeScreen = document.getElementById('homeScreen');
    this.gameScreen = document.getElementById('gameScreen');

    // Home Screen elements
    this.startEmojiBtn = document.getElementById('startEmojiBtn');
    this.startRebusBtn = document.getElementById('startRebusBtn');
    this.startWordleBtn = document.getElementById('startWordleBtn');
    this.startConnectionsBtn = document.getElementById('startConnectionsBtn');
    this.startContextoBtn = document.getElementById('startContextoBtn');
    this.quickPlayBtn = document.getElementById('quickPlayBtn');
    this.heroArchiveBtn = document.getElementById('heroArchiveBtn');
    this.solveTeaserBtn = document.getElementById('solveTeaserBtn');
    this.homeCurrentStreak = document.getElementById('homeCurrentStreak');
    this.homeBestStreak = document.getElementById('homeBestStreak');
    this.homeCoins = document.getElementById('homeCoins');
    this.homeVaultBtn = document.getElementById('homeVaultBtn');
    this.homeVaultCount = document.getElementById('homeVaultCount');

    // In-game bar
    this.backToLobbyBtn = document.getElementById('backToLobbyBtn');
    this.switchEmojiModeBtn = document.getElementById('switchEmojiModeBtn');
    this.switchRebusModeBtn = document.getElementById('switchRebusModeBtn');
    this.switchWordleModeBtn = document.getElementById('switchWordleModeBtn');
    this.switchConnectionsModeBtn = document.getElementById('switchConnectionsModeBtn');
    this.puzzleProgressPill = document.getElementById('puzzleProgressPill');
    this.categoryNav = document.getElementById('categoryNav');

    // Playboard Card
    this.playboardCard = document.querySelector('.playboard-card');
    this.puzzleTypeBadge = document.getElementById('puzzleTypeBadge');
    this.puzzleIdLabel = document.getElementById('puzzleIdLabel');
    this.modeDescriptor = document.getElementById('modeDescriptor');
    this.exhibitionStage = document.getElementById('exhibitionStage');
    this.hintBanner = document.getElementById('hintBanner');
    this.hintBodyText = document.getElementById('hintBodyText');
    this.wordleBoard = document.getElementById('wordleBoard');

    // Connections Elements
    this.connectionsBoard = document.getElementById('connectionsBoard');
    this.connectionsSolvedContainer = document.getElementById('connectionsSolvedContainer');
    this.connectionsTilesGrid = document.getElementById('connectionsTilesGrid');
    this.connectionsMistakesDots = document.getElementById('connectionsMistakesDots');
    this.connectionsShuffleBtn = document.getElementById('connectionsShuffleBtn');
    this.connectionsDeselectBtn = document.getElementById('connectionsDeselectBtn');
    this.connectionsSubmitBtn = document.getElementById('connectionsSubmitBtn');

    // Contexto Elements
    this.startContextoBtn = document.getElementById('startContextoBtn');
    this.switchContextoModeBtn = document.getElementById('switchContextoModeBtn');
    this.contextoBoard = document.getElementById('contextoBoard');
    this.contextoInputField = document.getElementById('contextoInputField');
    this.contextoSubmitBtn = document.getElementById('contextoSubmitBtn');
    this.contextoGuessCount = document.getElementById('contextoGuessCount');
    this.contextoBestRank = document.getElementById('contextoBestRank');
    this.contextoSortBtn = document.getElementById('contextoSortBtn');
    this.contextoHintBtn = document.getElementById('contextoHintBtn');
    this.contextoGiveUpBtn = document.getElementById('contextoGiveUpBtn');
    this.contextoGuessesContainer = document.getElementById('contextoGuessesContainer');

    // Spelling Bee Elements
    this.startSpellingBeeBtn = document.getElementById('startSpellingBeeBtn');
    this.switchSpellingBeeModeBtn = document.getElementById('switchSpellingBeeModeBtn');
    this.spellingBeeBoard = document.getElementById('spellingBeeBoard');
    this.beeRankBadge = document.getElementById('beeRankBadge');
    this.beeScoreVal = document.getElementById('beeScoreVal');
    this.beeGeniusTarget = document.getElementById('beeGeniusTarget');
    this.beeProgressFill = document.getElementById('beeProgressFill');
    this.beeWordsShelf = document.getElementById('beeWordsShelf');
    this.beeShelfToggle = document.getElementById('beeShelfToggle');
    this.beeToggleIcon = document.getElementById('beeToggleIcon');
    this.beeFoundCountLabel = document.getElementById('beeFoundCountLabel');
    this.beeFoundChipsList = document.getElementById('beeFoundChipsList');
    this.beeInputText = document.getElementById('beeInputText');
    this.beeCellCenter = document.getElementById('beeCellCenter');
    this.beeHexButtons = [
      document.getElementById('beeCell0'),
      document.getElementById('beeCell1'),
      document.getElementById('beeCell2'),
      document.getElementById('beeCell3'),
      document.getElementById('beeCell4'),
      document.getElementById('beeCell5')
    ];
    this.beeDeleteBtn = document.getElementById('beeDeleteBtn');
    this.beeShuffleBtn = document.getElementById('beeShuffleBtn');
    this.beeHintBtn = document.getElementById('beeHintBtn');
    this.beeEnterBtn = document.getElementById('beeEnterBtn');

    this.standardSlotsAssembly = document.getElementById('standardSlotsAssembly');
    this.slotsContainer = document.getElementById('slotsContainer');
    this.answerFeedback = document.getElementById('answerFeedback');

    // Tactical Hint Tools
    this.tacticalActionBar = document.getElementById('tacticalActionBar');
    this.clueHintBtn = document.getElementById('clueHintBtn');
    this.revealLetterBtn = document.getElementById('revealLetterBtn');
    this.clearDistractorsBtn = document.getElementById('clearDistractorsBtn');
    this.shuffleKeyboardBtn = document.getElementById('shuffleKeyboardBtn');
    this.skipBtn = document.getElementById('skipBtn');

    // Keyboard & Direct Input
    this.keyboardBoard = document.querySelector('.keyboard-board');
    this.keyboardTiles = document.getElementById('keyboardTiles');
    this.rackControls = document.querySelector('.rack-controls');
    this.backspaceBtn = document.getElementById('backspaceBtn');
    this.clearAllBtn = document.getElementById('clearAllBtn');
    this.toggleTypeInputBtn = document.getElementById('toggleTypeInputBtn');
    this.directInputSection = document.getElementById('directInputSection');
    this.directInputField = document.getElementById('directInputField');
    this.submitDirectBtn = document.getElementById('submitDirectBtn');

    // Victory Modal
    this.winModal = document.getElementById('winModal');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalEquation = document.getElementById('modalEquation');
    this.modalAnswer = document.getElementById('modalAnswer');
    this.modalExplanation = document.getElementById('modalExplanation');
    this.modalCoinReward = document.getElementById('modalCoinReward');
    this.modalStreakItem = document.getElementById('modalStreakItem');
    this.modalStreakReward = document.getElementById('modalStreakReward');
    this.nextPuzzleBtn = document.getElementById('nextPuzzleBtn');
    this.admirePuzzleBtn = document.getElementById('admirePuzzleBtn');
    this.admireBoardBar = document.getElementById('admireBoardBar');
    this.admireBarLabel = document.getElementById('admireBarLabel');
    this.admireReopenModalBtn = document.getElementById('admireReopenModalBtn');
    this.admireNextBtn = document.getElementById('admireNextBtn');

    // Archive Modal
    this.bookModal = document.getElementById('bookModal');
    this.closeBookBtn = document.getElementById('closeBookBtn');
    this.archiveTabEmoji = document.getElementById('archiveTabEmoji');
    this.archiveTabRebus = document.getElementById('archiveTabRebus');
    this.bookGrid = document.getElementById('bookGrid');
  }

  bindEvents() {
    this.homeNavBtn.addEventListener('click', () => this.showScreen('home'));
    this.backToLobbyBtn.addEventListener('click', () => this.showScreen('home'));

    this.startEmojiBtn.addEventListener('click', () => { sound.playPop(520); this.launchMode('emoji'); });
    this.startRebusBtn.addEventListener('click', () => { sound.playPop(520); this.launchMode('rebus'); });
    this.startWordleBtn.addEventListener('click', () => { sound.playPop(520); this.launchMode('wordle'); });
    if (this.startConnectionsBtn) {
      this.startConnectionsBtn.addEventListener('click', () => { sound.playPop(520); this.launchMode('connections'); });
    }
    if (this.startContextoBtn) {
      this.startContextoBtn.addEventListener('click', () => { sound.playPop(520); this.launchMode('contexto'); });
    }
    if (this.startSpellingBeeBtn) {
      this.startSpellingBeeBtn.addEventListener('click', () => { sound.playPop(520); this.launchMode('spellingBee'); });
    }
    if (this.quickPlayBtn) {
      this.quickPlayBtn.addEventListener('click', () => this.handleQuickPlay());
    }
    if (this.heroArchiveBtn) {
      this.heroArchiveBtn.addEventListener('click', () => this.openArchive());
    }
    if (this.solveTeaserBtn) {
      this.solveTeaserBtn.addEventListener('click', () => this.handleSolveTeaser());
    }
    if (this.homeVaultBtn) {
      this.homeVaultBtn.addEventListener('click', () => this.openArchive());
    }

    this.switchEmojiModeBtn.addEventListener('click', () => this.launchMode('emoji'));
    this.switchRebusModeBtn.addEventListener('click', () => this.launchMode('rebus'));
    this.switchWordleModeBtn.addEventListener('click', () => this.launchMode('wordle'));
    if (this.switchConnectionsModeBtn) {
      this.switchConnectionsModeBtn.addEventListener('click', () => this.launchMode('connections'));
    }
    if (this.switchContextoModeBtn) {
      this.switchContextoModeBtn.addEventListener('click', () => this.launchMode('contexto'));
    }
    if (this.switchSpellingBeeModeBtn) {
      this.switchSpellingBeeModeBtn.addEventListener('click', () => this.launchMode('spellingBee'));
    }

    if (this.connectionsShuffleBtn) {
      this.connectionsShuffleBtn.addEventListener('click', () => this.handleConnectionsShuffle());
    }
    if (this.connectionsDeselectBtn) {
      this.connectionsDeselectBtn.addEventListener('click', () => this.handleConnectionsDeselect());
    }
    if (this.connectionsSubmitBtn) {
      this.connectionsSubmitBtn.addEventListener('click', () => this.handleConnectionsSubmit());
    }

    // Contexto controls
    if (this.contextoSubmitBtn) {
      this.contextoSubmitBtn.addEventListener('click', () => this.handleContextoSubmit());
    }
    if (this.contextoInputField) {
      this.contextoInputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleContextoSubmit();
        }
      });
    }
    if (this.contextoSortBtn) {
      this.contextoSortBtn.addEventListener('click', () => this.handleContextoSortToggle());
    }
    if (this.contextoHintBtn) {
      this.contextoHintBtn.addEventListener('click', () => this.handleContextoHint());
    }
    if (this.contextoGiveUpBtn) {
      this.contextoGiveUpBtn.addEventListener('click', () => this.handleContextoGiveUp());
    }

    // Spelling Bee controls
    if (this.beeCellCenter) {
      this.beeCellCenter.addEventListener('click', () => {
        const text = (this.beeCellCenter.querySelector('.bee-hex-letter') || this.beeCellCenter).textContent.trim();
        this.handleBeeLetter(text);
      });
    }
    if (this.beeHexButtons) {
      this.beeHexButtons.forEach(btn => {
        if (btn) {
          btn.addEventListener('click', () => {
            const text = (btn.querySelector('.bee-hex-letter') || btn).textContent.trim();
            this.handleBeeLetter(text);
          });
        }
      });
    }
    if (this.beeDeleteBtn) {
      this.beeDeleteBtn.addEventListener('click', () => this.handleBeeDelete());
    }
    if (this.beeShuffleBtn) {
      this.beeShuffleBtn.addEventListener('click', () => this.handleBeeShuffle());
    }
    if (this.beeHintBtn) {
      this.beeHintBtn.addEventListener('click', () => this.handleBeeHint());
    }
    if (this.beeEnterBtn) {
      this.beeEnterBtn.addEventListener('click', () => this.handleBeeSubmit());
    }
    if (this.beeShelfToggle) {
      this.beeShelfToggle.addEventListener('click', () => this.toggleBeeShelf());
    }

    // Top HUD controls
    this.soundToggleBtn.addEventListener('click', () => {
      const active = sound.toggle();
      this.soundToggleBtn.textContent = active ? '🔊' : '🔇';
    });

    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    this.bookBtn.addEventListener('click', () => this.openArchive());
    this.closeBookBtn.addEventListener('click', () => this.bookModal.classList.add('hidden'));
    this.bookModal.addEventListener('click', (e) => {
      if (e.target === this.bookModal) this.bookModal.classList.add('hidden');
    });

    this.archiveTabEmoji.addEventListener('click', () => {
      this.archiveTab = 'emoji';
      this.archiveTabEmoji.classList.add('active');
      this.archiveTabRebus.classList.remove('active');
      this.renderArchiveGrid();
    });

    this.archiveTabRebus.addEventListener('click', () => {
      this.archiveTab = 'rebus';
      this.archiveTabRebus.classList.add('active');
      this.archiveTabEmoji.classList.remove('active');
      this.renderArchiveGrid();
    });

    // Hint tool buttons
    this.clueHintBtn.addEventListener('click', () => this.handleClueHint());
    this.revealLetterBtn.addEventListener('click', () => this.handleRevealLetter());
    this.clearDistractorsBtn.addEventListener('click', () => this.handleClearDistractors());
    this.shuffleKeyboardBtn.addEventListener('click', () => this.handleShuffleKeyboard());
    this.skipBtn.addEventListener('click', () => this.handleSkip());

    // Keyboard action buttons
    this.backspaceBtn.addEventListener('click', () => this.removeLastLetter());
    this.clearAllBtn.addEventListener('click', () => this.clearAllPlacedLetters());
    this.toggleTypeInputBtn.addEventListener('click', () => {
      this.directInputSection.classList.toggle('hidden');
      if (!this.directInputSection.classList.contains('hidden')) {
        this.directInputField.focus();
      }
    });

    this.submitDirectBtn.addEventListener('click', () => this.submitDirectText());
    this.directInputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submitDirectText();
    });

    // Win Modal Advance & Admire Actions
    this.nextPuzzleBtn.addEventListener('click', () => {
      this.winModal.classList.add('hidden');
      this.nextPuzzle();
    });
    if (this.admirePuzzleBtn) {
      this.admirePuzzleBtn.addEventListener('click', () => this.handleAdmirePuzzle());
    }
    if (this.admireNextBtn) {
      this.admireNextBtn.addEventListener('click', () => {
        sound.playPop(520);
        this.nextPuzzle();
      });
    }
    if (this.admireReopenModalBtn) {
      this.admireReopenModalBtn.addEventListener('click', () => this.reopenWinModal());
    }

    // Global Physical Keyboard Listener
    window.addEventListener('keydown', (e) => {
      if (!this.bookModal.classList.contains('hidden')) {
        if (e.key === 'Escape') this.bookModal.classList.add('hidden');
        return;
      }

      if (!this.winModal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.handleAdmirePuzzle();
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.winModal.classList.add('hidden');
          this.nextPuzzle();
          return;
        }
        return;
      }

      if (this.activeScreen !== 'game') return;

      if (document.activeElement === this.directInputField || document.activeElement === this.contextoInputField) return;

      if (this.isAdmiring) {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.nextPuzzle();
          return;
        }
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          this.reopenWinModal();
          return;
        }
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (this.gameMode === 'spellingBee') {
          this.handleBeeDelete();
        } else {
          this.removeLastLetter();
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.gameMode === 'wordle') {
          this.submitWordleGuess();
        } else if (this.gameMode === 'connections') {
          this.handleConnectionsSubmit();
        } else if (this.gameMode === 'contexto') {
          this.handleContextoSubmit();
        } else if (this.gameMode === 'spellingBee') {
          this.handleBeeSubmit();
        } else {
          this.checkAnswer();
        }
        return;
      }

      if (e.key === ' ' && this.gameMode === 'spellingBee') {
        e.preventDefault();
        this.handleBeeShuffle();
        return;
      }

      const letter = e.key.toUpperCase();
      if (/^[A-Z]$/.test(letter)) {
        if (this.gameMode === 'spellingBee') {
          if (!this.beeCurrentHive) return;
          const allowed = [this.beeCurrentHive.centerLetter, ...this.beeCurrentHive.outerLetters];
          if (allowed.includes(letter)) {
            this.handleBeeLetter(letter);
          } else {
            sound.playWrong();
            this.showNotice(`"${letter}" is not in this hive!`);
          }
        } else {
          this.handleKeyPressLetter(letter);
        }
      }
    });
  }

  initApp() {
    this.applyTheme(this.state.theme);
    this.soundToggleBtn.textContent = sound.enabled ? '🔊' : '🔇';
    this.renderCategoryChips();
    this.showScreen('home');
    this.updateStatsUI();
  }

  // ================= THEME & STATS =================
  toggleTheme() {
    this.state.theme = this.state.theme === 'paper' ? 'arcade' : 'paper';
    this.applyTheme(this.state.theme);
    this.saveState();
  }

  applyTheme(theme) {
    document.body.className = `theme-${theme}`;
  }

  updateStatsUI() {
    this.coinCountEl.textContent = this.state.coins;
    this.streakCountEl.textContent = this.state.streak;

    if (this.homeCurrentStreak) {
      this.homeCurrentStreak.textContent = `${this.state.streak}🔥`;
    }
    if (this.homeBestStreak) {
      this.homeBestStreak.textContent = `${this.state.bestStreak}x`;
    }
    if (this.homeCoins) {
      this.homeCoins.textContent = `${this.state.coins}🪙`;
    }
    if (this.homeVaultCount) {
      const solved = (this.state.solvedEmojiIds?.length || 0) + (this.state.solvedRebusIds?.length || 0);
      const total = PUZZLES.length + REBUS_PUZZLES.length;
      this.homeVaultCount.textContent = `${solved} / ${total} 📖`;
    }
  }

  handleQuickPlay() {
    sound.playBonus();
    const modes = ['emoji', 'rebus', 'wordle', 'connections', 'contexto', 'spellingBee'];
    const chosen = modes[Math.floor(Math.random() * modes.length)];
    this.launchMode(chosen);
  }

  handleSolveTeaser() {
    sound.playPop(520);
    this.launchMode('emoji');
    const target = PUZZLES.find(p => p.answer === 'RAINBOW') || PUZZLES[0];
    this.currentPuzzle = target;
    this.renderCurrentPuzzle();
  }

  // ================= SCREEN & MODE ROUTING =================
  showScreen(screen) {
    this.activeScreen = screen;
    sound.playPop(520);

    if (screen === 'home') {
      this.homeScreen.classList.add('active');
      this.gameScreen.classList.remove('active');
      this.updateStatsUI();
    } else {
      this.homeScreen.classList.remove('active');
      this.gameScreen.classList.add('active');
    }
  }

  launchMode(mode) {
    this.gameMode = mode;
    this.showScreen('game');

    // Update segmented toggle
    this.switchEmojiModeBtn.classList.toggle('active', mode === 'emoji');
    this.switchRebusModeBtn.classList.toggle('active', mode === 'rebus');
    this.switchWordleModeBtn.classList.toggle('active', mode === 'wordle');
    if (this.switchConnectionsModeBtn) {
      this.switchConnectionsModeBtn.classList.toggle('active', mode === 'connections');
    }
    if (this.switchContextoModeBtn) {
      this.switchContextoModeBtn.classList.toggle('active', mode === 'contexto');
    }
    if (this.switchSpellingBeeModeBtn) {
      this.switchSpellingBeeModeBtn.classList.toggle('active', mode === 'spellingBee');
    }

    // Reset Wordle state on mode change
    this.wordleGuesses = [];
    this.wordleCurrentGuess = '';

    // Clear feedback & admire state
    this.answerFeedback.textContent = '';
    this.answerFeedback.className = 'validation-message';
    this.hideAdmireBar();

    // Toggle specific boards and controls with strict display isolation
    const isStandard = (mode === 'emoji' || mode === 'rebus');

    // 1. Exhibition Stage (Emoji & Rebus only)
    this.exhibitionStage.style.display = isStandard ? 'flex' : 'none';

    // 2. Hint Banner
    this.hintBanner.classList.add('hidden');
    this.hintBanner.style.display = 'none';

    // 3. Wordle Board (Wordle only)
    this.wordleBoard.classList.toggle('hidden', mode !== 'wordle');
    this.wordleBoard.style.display = mode === 'wordle' ? 'flex' : 'none';

    // 4. Connections Board (Connections only)
    if (this.connectionsBoard) {
      this.connectionsBoard.classList.toggle('hidden', mode !== 'connections');
      this.connectionsBoard.style.display = mode === 'connections' ? 'flex' : 'none';
    }

    // 5. Contexto Board (Contexto only)
    if (this.contextoBoard) {
      this.contextoBoard.classList.toggle('hidden', mode !== 'contexto');
      this.contextoBoard.style.display = mode === 'contexto' ? 'flex' : 'none';
    }

    // 5b. Spelling Bee Board (Spelling Bee only)
    if (this.spellingBeeBoard) {
      this.spellingBeeBoard.classList.toggle('hidden', mode !== 'spellingBee');
      this.spellingBeeBoard.style.display = mode === 'spellingBee' ? 'flex' : 'none';
    }

    // 6. Standard Slots Assembly (Emoji & Rebus only)
    if (this.standardSlotsAssembly) {
      this.standardSlotsAssembly.classList.toggle('hidden', !isStandard);
      this.standardSlotsAssembly.style.display = isStandard ? 'flex' : 'none';
    }

    // 7. Tactical Action Bar (Emoji & Rebus only)
    if (this.tacticalActionBar) {
      this.tacticalActionBar.style.display = isStandard ? 'flex' : 'none';
    }

    // 8. Keyboard Board (Emoji, Rebus, and Wordle only - NEVER Connections, Contexto, or Spelling Bee)
    if (this.keyboardBoard) {
      this.keyboardBoard.style.display = (isStandard || mode === 'wordle') ? 'flex' : 'none';
    }

    // 9. Rack Controls (Emoji & Rebus only)
    if (this.rackControls) {
      this.rackControls.style.display = isStandard ? 'flex' : 'none';
    }

    // 10. Direct Input Section (Always reset on mode switch)
    if (this.directInputSection) {
      this.directInputSection.classList.add('hidden');
      this.directInputSection.style.display = 'none';
    }

    // Playboard Card class modifier
    if (this.playboardCard) {
      this.playboardCard.classList.toggle('is-wordle', mode === 'wordle');
      this.playboardCard.classList.toggle('is-connections', mode === 'connections');
      this.playboardCard.classList.toggle('is-contexto', mode === 'contexto');
      this.playboardCard.classList.toggle('is-spelling-bee', mode === 'spellingBee');
    }

    // Show or hide category chips bar
    if (mode === 'emoji') {
      this.categoryNav.style.display = 'flex';
      this.modeDescriptor.textContent = 'Emoji Alchemy Mode';
      this.loadCategory('all');
    } else if (mode === 'rebus') {
      this.categoryNav.style.display = 'none';
      this.modeDescriptor.textContent = 'Rebus Wordplay Mode';
      this.currentList = [...REBUS_PUZZLES];
      this.pickRandomPuzzle();
    } else if (mode === 'wordle') {
      this.categoryNav.style.display = 'none';
      this.modeDescriptor.textContent = 'Wordle Mode';
      this.currentList = WORDLE_DICTIONARY;
      this.pickRandomPuzzle();
    } else if (mode === 'connections') {
      this.categoryNav.style.display = 'none';
      this.modeDescriptor.textContent = 'Connections Mode';
      this.currentList = CONNECTIONS_BOARDS;
      this.pickRandomPuzzle();
    } else if (mode === 'contexto') {
      this.categoryNav.style.display = 'none';
      this.modeDescriptor.textContent = 'Contexto Mode';
      this.currentList = CONTEXTO_GAMES;
      this.pickRandomPuzzle();
    } else if (mode === 'spellingBee') {
      this.categoryNav.style.display = 'none';
      this.modeDescriptor.textContent = 'Word Hive • Honeycomb Discovery';
      this.loadSpellingBeeGame();
    }
  }

  renderCategoryChips() {
    this.categoryNav.innerHTML = '';
    PUZZLE_CATEGORIES.forEach((cat) => {
      const chip = document.createElement('button');
      chip.className = `cat-chip ${cat.id === this.currentCategory ? 'active' : ''}`;
      chip.innerHTML = `${cat.icon} <span>${cat.name}</span>`;
      chip.addEventListener('click', () => {
        sound.playPop(580);
        this.loadCategory(cat.id);
      });
      this.categoryNav.appendChild(chip);
    });
  }

  loadCategory(catId) {
    this.currentCategory = catId;
    document.querySelectorAll('.cat-chip').forEach((ch, idx) => {
      ch.classList.toggle('active', PUZZLE_CATEGORIES[idx].id === catId);
    });

    if (catId === 'all') {
      this.currentList = [...PUZZLES];
    } else {
      this.currentList = PUZZLES.filter((p) => p.category === catId);
    }

    this.pickRandomPuzzle();
  }

  pickRandomPuzzle() {
    if (!this.currentList || this.currentList.length === 0) return;

    if (this.gameMode === 'wordle') {
      const randomIdx = Math.floor(Math.random() * this.currentList.length);
      this.loadPuzzleAtIndex(randomIdx);
      return;
    }

    if (this.gameMode === 'connections') {
      const candidatePool = this.currentList.filter(b => !this.connectionsCurrentBoard || b.id !== this.connectionsCurrentBoard.id);
      const pool = candidatePool.length > 0 ? candidatePool : this.currentList;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      this.loadConnectionsBoard(chosen);
      return;
    }

    if (this.gameMode === 'contexto') {
      const candidatePool = this.currentList.filter(g => !this.contextoCurrentGame || g.id !== this.contextoCurrentGame.id);
      const pool = candidatePool.length > 0 ? candidatePool : this.currentList;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      this.loadContextoGame(chosen);
      return;
    }

    const isRebus = this.gameMode === 'rebus';
    const solvedSet = new Set(isRebus ? this.state.solvedRebusIds : this.state.solvedEmojiIds);

    // Filter out current puzzle so we don't pick the exact same one twice in a row
    const candidatePool = this.currentList.filter(p => !this.currentPuzzle || p.id !== this.currentPuzzle.id);
    
    // Prioritize unsolved puzzles in this category/mode
    const unsolved = candidatePool.filter(p => !solvedSet.has(p.id));
    const pool = unsolved.length > 0 ? unsolved : (candidatePool.length > 0 ? candidatePool : this.currentList);

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const chosenIdx = this.currentList.indexOf(chosen);
    this.loadPuzzleAtIndex(chosenIdx >= 0 ? chosenIdx : 0);
  }

  loadPuzzleAtIndex(index) {
    if (index >= this.currentList.length) {
      index = 0;
    }
    const item = this.currentList[index];
    if (this.gameMode === 'wordle') {
      this.currentPuzzle = {
        id: `w${index+1}`,
        category: 'wordle',
        answer: item,
        hint: 'Crack the 5-letter code'
      };
      this.cleanAnswer = this.currentPuzzle.answer;
      this.renderWordlePuzzle();
      return;
    }

    this.currentPuzzle = item;
    this.renderCurrentPuzzle();
  }

  // ================= RENDER PUZZLE ON BOARD =================
  renderCurrentPuzzle() {
    if (!this.currentPuzzle) return;
    this.clueRevealed = false;
    this.hintBanner.classList.add('hidden');
    this.hintBanner.style.display = 'none';
    this.hintBodyText.textContent = '';
    this.answerFeedback.textContent = '';
    this.answerFeedback.className = 'validation-message';
    this.directInputField.value = '';

    const isRebus = this.currentPuzzle.category === 'rebus';

    // Header metadata
    this.puzzleTypeBadge.textContent = isRebus ? 'REBUS WORDPLAY' : (this.currentPuzzle.category.toUpperCase());
    this.puzzleIdLabel.textContent = `#${this.currentPuzzle.id}`;

    this.puzzleProgressPill.textContent = this.state.streak > 0 ? `🔥 Streak: ${this.state.streak}` : '🎲 Random Play';

    // Render Exhibition Canvas
    this.exhibitionStage.innerHTML = '';
    if (isRebus) {
      this.exhibitionStage.innerHTML = renderRebusVisual(this.currentPuzzle.visual);
    } else {
      // Emojis Equation
      const eqRow = document.createElement('div');
      eqRow.className = 'emoji-equation-row';
      this.currentPuzzle.emojis.forEach((emoji, idx) => {
        const brick = document.createElement('div');
        brick.className = 'emoji-brick';
        brick.textContent = emoji;
        eqRow.appendChild(brick);

        if (idx < this.currentPuzzle.emojis.length - 1) {
          const op = document.createElement('span');
          op.className = 'math-operator';
          op.textContent = '+';
          eqRow.appendChild(op);
        }
      });
      this.exhibitionStage.appendChild(eqRow);
    }

    // Set up word letter slots
    this.cleanAnswer = this.currentPuzzle.answer.toUpperCase();
    this.words = this.cleanAnswer.split(' ');
    this.totalLetterSlots = this.cleanAnswer.replace(/[^A-Z]/g, '').length;
    this.placedLetters = new Array(this.totalLetterSlots).fill(null);

    this.renderSlots();
    this.generateKeyboardPool();
    this.renderKeyboard();
  }

  renderWordlePuzzle() {
    this.puzzleTypeBadge.textContent = 'WORDLE';
    this.puzzleIdLabel.textContent = `#${this.currentPuzzle.id}`;
    this.puzzleProgressPill.textContent = `Attempt ${this.wordleGuesses.length + 1} of ${this.wordleMaxGuesses}`;
    
    // Clean canvas without any extraneous elements
    this.exhibitionStage.innerHTML = '';
    
    this.answerFeedback.textContent = '';
    this.answerFeedback.className = 'validation-message';

    this.renderWordleBoard();
    
    // QWERTY keyboard layout for authentic, comfortable word deduction
    const qwertyChars = "QWERTYUIOPASDFGHJKLZXCVBNM".split('');
    this.keyboardPool = qwertyChars.map((char, id) => ({
      id: `w_${char}`,
      char: char,
      isUsed: false,
      isDisabled: false
    }));
    
    this.renderKeyboard();
  }

  renderWordleBoard() {
    let html = '';
    for (let r = 0; r < this.wordleMaxGuesses; r++) {
      const isCurrentRow = r === this.wordleGuesses.length;
      html += `<div class="wordle-row ${isCurrentRow ? 'active-row' : ''}">`;
      const rowGuess = r < this.wordleGuesses.length ? this.wordleGuesses[r] : (isCurrentRow ? this.wordleCurrentGuess : '');
      const feedback = r < this.wordleGuesses.length ? this.getWordleFeedback(this.wordleGuesses[r]) : null;
      
      for (let c = 0; c < 5; c++) {
        const char = rowGuess[c] || '';
        let slotClass = char ? 'filled' : '';
        if (feedback) {
          slotClass += ' ' + feedback[c];
        }
        html += `<div class="wordle-slot ${slotClass}">${char}</div>`;
      }
      html += '</div>';
    }
    this.wordleBoard.innerHTML = html;
  }

  getWordleFeedback(guess) {
    const target = this.cleanAnswer.split('');
    const guessArr = guess.split('');
    const feedback = Array(5).fill('gray');
    
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === target[i]) {
        feedback[i] = 'green';
        target[i] = null;
        guessArr[i] = null;
      }
    }
    
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] !== null) {
        const idx = target.indexOf(guessArr[i]);
        if (idx > -1) {
          feedback[i] = 'yellow';
          target[idx] = null;
        }
      }
    }
    
    return feedback;
  }

  renderSlots() {
    this.slotsContainer.innerHTML = '';
    let globalSlotIndex = 0;

    this.words.forEach((word) => {
      const wordChunk = document.createElement('div');
      wordChunk.className = 'word-chunk';

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (/[A-Z]/.test(char)) {
          const slotIdx = globalSlotIndex;
          const slot = document.createElement('div');
          slot.className = 'press-slot';
          slot.dataset.slotIndex = slotIdx;

          const currentPlaced = this.placedLetters[slotIdx];
          if (currentPlaced) {
            slot.textContent = currentPlaced.char;
            slot.classList.add('filled');
            if (currentPlaced.isRevealed) {
              slot.classList.add('revealed');
            }
          }

          slot.addEventListener('click', () => this.handleSlotClick(slotIdx));
          wordChunk.appendChild(slot);
          globalSlotIndex++;
        } else {
          const punct = document.createElement('span');
          punct.style.fontFamily = 'var(--font-heading)';
          punct.style.fontSize = '1.8rem';
          punct.style.fontWeight = '800';
          punct.style.alignSelf = 'center';
          punct.textContent = char;
          wordChunk.appendChild(punct);
        }
      }

      this.slotsContainer.appendChild(wordChunk);
    });
  }

  generateKeyboardPool() {
    const lettersNeeded = this.cleanAnswer.replace(/[^A-Z]/g, '').split('');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const targetCount = Math.max(12, lettersNeeded.length + 3);
    const distractorCount = targetCount - lettersNeeded.length;

    const distractors = [];
    for (let i = 0; i < distractorCount; i++) {
      distractors.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }

    const allTiles = [
      ...lettersNeeded.map((char) => ({ char, isDistractor: false })),
      ...distractors.map((char) => ({ char, isDistractor: true }))
    ];

    for (let i = allTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
    }

    this.keyboardPool = allTiles.map((t, idx) => ({
      id: `tile_${idx}`,
      char: t.char,
      isDistractor: t.isDistractor,
      isUsed: false,
      isDisabled: false
    }));
  }

  renderKeyboard() {
    this.keyboardTiles.innerHTML = '';
    
    let keyColors = {};
    if (this.gameMode === 'wordle') {
      this.wordleGuesses.forEach(g => {
        const fb = this.getWordleFeedback(g);
        for(let i = 0; i < 5; i++) {
          const ch = g[i];
          if (fb[i] === 'green') keyColors[ch] = 'green';
          else if (fb[i] === 'yellow' && keyColors[ch] !== 'green') keyColors[ch] = 'yellow';
          else if (fb[i] === 'gray' && !keyColors[ch]) keyColors[ch] = 'gray';
        }
      });
    }

    if (this.gameMode === 'wordle') {
      const qwertyKeys = this.keyboardPool;
      const row1 = qwertyKeys.slice(0, 10);
      const row2 = qwertyKeys.slice(10, 19);
      const row3 = qwertyKeys.slice(19, 26);

      const createTileBtn = (tile) => {
        const btn = document.createElement('button');
        btn.className = `physical-tile pool-tile ${keyColors[tile.char] || ''}`;
        btn.dataset.tileId = tile.id;
        btn.textContent = tile.char;
        btn.addEventListener('click', () => this.handleTileClick(tile.id));
        return btn;
      };

      const row1Div = document.createElement('div');
      row1Div.className = 'wordle-keyboard-row';
      row1.forEach(t => row1Div.appendChild(createTileBtn(t)));
      this.keyboardTiles.appendChild(row1Div);

      const row2Div = document.createElement('div');
      row2Div.className = 'wordle-keyboard-row';
      row2.forEach(t => row2Div.appendChild(createTileBtn(t)));
      this.keyboardTiles.appendChild(row2Div);

      const row3Div = document.createElement('div');
      row3Div.className = 'wordle-keyboard-row';

      const enterBtn = document.createElement('button');
      enterBtn.className = 'physical-tile utility-tile wordle-special-key';
      enterBtn.textContent = 'ENTER';
      enterBtn.title = 'Submit 5-letter guess';
      enterBtn.addEventListener('click', () => this.submitWordleGuess());
      row3Div.appendChild(enterBtn);

      row3.forEach(t => row3Div.appendChild(createTileBtn(t)));

      const backBtn = document.createElement('button');
      backBtn.className = 'physical-tile utility-tile wordle-special-key';
      backBtn.textContent = '⌫';
      backBtn.title = 'Backspace';
      backBtn.addEventListener('click', () => this.removeLastLetter());
      row3Div.appendChild(backBtn);

      this.keyboardTiles.appendChild(row3Div);
      return;
    }

    this.keyboardPool.forEach((tile) => {
      const btn = document.createElement('button');
      btn.className = `physical-tile ${tile.isUsed ? 'used' : ''} ${tile.isDisabled ? 'disabled' : ''}`;
      btn.dataset.tileId = tile.id;
      btn.textContent = tile.char;

      btn.addEventListener('click', () => this.handleTileClick(tile.id));
      this.keyboardTiles.appendChild(btn);
    });
  }

  // ================= TILE & SLOT INTERACTION =================
  handleTileClick(tileId) {
    const tile = this.keyboardPool.find((t) => t.id === tileId);
    if (!tile || tile.isDisabled) return;
    
    if (this.gameMode === 'wordle') {
      if (this.wordleCurrentGuess.length < 5) {
        this.wordleCurrentGuess += tile.char;
        sound.playPop(480 + this.wordleCurrentGuess.length * 24);
        this.renderWordleBoard();
      }
      return;
    }

    if (tile.isUsed) return;
    const emptyIndex = this.placedLetters.findIndex((item) => item === null);
    if (emptyIndex === -1) return;

    tile.isUsed = true;
    this.placedLetters[emptyIndex] = {
      char: tile.char,
      tileId: tile.id,
      isRevealed: false
    };

    sound.playPop(480 + emptyIndex * 24);
    this.renderSlots();
    this.renderKeyboard();

    if (!this.placedLetters.includes(null)) {
      this.checkAnswer();
    }
  }

  handleSlotClick(slotIndex) {
    const item = this.placedLetters[slotIndex];
    if (!item || item.isRevealed) return;

    const tile = this.keyboardPool.find((t) => t.id === item.tileId);
    if (tile) tile.isUsed = false;

    this.placedLetters[slotIndex] = null;
    sound.playRemove();
    this.renderSlots();
    this.renderKeyboard();
    this.answerFeedback.textContent = '';
  }

  handleKeyPressLetter(char) {
    if (this.gameMode === 'wordle') {
      const tile = this.keyboardPool.find((t) => t.char === char);
      if (tile) this.handleTileClick(tile.id);
      return;
    }
    const tile = this.keyboardPool.find((t) => t.char === char && !t.isUsed && !t.isDisabled);
    if (tile) {
      this.handleTileClick(tile.id);
    }
  }

  removeLastLetter() {
    if (this.gameMode === 'wordle') {
      if (this.wordleCurrentGuess.length > 0) {
        this.wordleCurrentGuess = this.wordleCurrentGuess.slice(0, -1);
        sound.playRemove();
        this.renderWordleBoard();
      }
      return;
    }
    for (let i = this.placedLetters.length - 1; i >= 0; i--) {
      const item = this.placedLetters[i];
      if (item && !item.isRevealed) {
        this.handleSlotClick(i);
        break;
      }
    }
  }

  clearAllPlacedLetters() {
    if (this.gameMode === 'wordle') {
      this.wordleCurrentGuess = '';
      sound.playRemove();
      this.renderWordleBoard();
      return;
    }
    let cleared = false;
    for (let i = 0; i < this.placedLetters.length; i++) {
      const item = this.placedLetters[i];
      if (item && !item.isRevealed) {
        const tile = this.keyboardPool.find((t) => t.id === item.tileId);
        if (tile) tile.isUsed = false;
        this.placedLetters[i] = null;
        cleared = true;
      }
    }
    if (cleared) {
      sound.playRemove();
      this.renderSlots();
      this.renderKeyboard();
      this.answerFeedback.textContent = '';
    }
  }

  submitDirectText() {
    const text = this.directInputField.value.trim().toUpperCase();
    if (!text) return;

    const normalizedGuess = text.replace(/[^A-Z]/g, '');
    const normalizedTarget = this.cleanAnswer.replace(/[^A-Z]/g, '');

    if (normalizedGuess === normalizedTarget) {
      this.solvePuzzleVictory();
    } else {
      sound.playWrong();
      this.answerFeedback.textContent = '❌ INCORRECT! RE-EXAMINE THE CLUE!';
      this.answerFeedback.className = 'validation-message error';
      const playboard = document.querySelector('.playboard-card');
      playboard.classList.remove('shake-error');
      void playboard.offsetWidth;
      playboard.classList.add('shake-error');
      this.state.streak = 0;
      this.saveState();
    }
  }

  submitWordleGuess() {
    const activeRow = this.wordleBoard.querySelector('.active-row');
    if (this.wordleCurrentGuess.length !== 5) {
      sound.playWrong();
      if (activeRow) {
        activeRow.classList.remove('wiggle');
        void activeRow.offsetWidth;
        activeRow.classList.add('wiggle');
      }
      this.answerFeedback.textContent = '❌ NEED 5 LETTERS';
      this.answerFeedback.className = 'validation-message error';
      setTimeout(() => this.answerFeedback.textContent = '', 1500);
      return;
    }
    
    // Valid 5 letters
    if (!WORDLE_DICTIONARY.includes(this.wordleCurrentGuess)) {
      sound.playWrong();
      if (activeRow) {
        activeRow.classList.remove('wiggle');
        void activeRow.offsetWidth;
        activeRow.classList.add('wiggle');
      }
      this.answerFeedback.textContent = '❌ NOT IN WORD LIST';
      this.answerFeedback.className = 'validation-message error';
      setTimeout(() => this.answerFeedback.textContent = '', 2000);
      return;
    }

    this.wordleGuesses.push(this.wordleCurrentGuess);
    this.wordleCurrentGuess = '';
    this.puzzleProgressPill.textContent = `Attempt ${Math.min(this.wordleGuesses.length + 1, this.wordleMaxGuesses)} of ${this.wordleMaxGuesses}`;
    
    const lastGuess = this.wordleGuesses[this.wordleGuesses.length - 1];
    
    if (lastGuess === this.cleanAnswer) {
      this.solvePuzzleVictory();
      this.renderWordleBoard();
      this.renderKeyboard();
    } else if (this.wordleGuesses.length >= this.wordleMaxGuesses) {
      sound.playWrong();
      this.answerFeedback.textContent = `❌ GAME OVER! The word was ${this.cleanAnswer}`;
      this.answerFeedback.className = 'validation-message error';
      this.state.streak = 0;
      this.saveState();
      this.renderWordleBoard();
      this.renderKeyboard();
      
      // Show modal on loss too so they can proceed
      setTimeout(() => {
        this.modalTitle.textContent = 'GAME OVER';
        this.modalEquation.textContent = `Out of attempts`;
        this.modalExplanation.textContent = `The correct word was ${this.cleanAnswer}. Better luck next time!`;
        this.modalAnswer.textContent = this.cleanAnswer;
        this.modalCoinReward.textContent = `+0 🪙`;
        this.modalStreakItem.style.display = 'none';
        this.winModal.classList.remove('hidden');
      }, 1500);
    } else {
      sound.playPop(700);
      this.renderWordleBoard();
      this.renderKeyboard();
    }
  }

  // ================= ANSWER CHECK & VICTORY =================
  checkAnswer() {
    const currentGuess = this.placedLetters.map((item) => (item ? item.char : '')).join('');
    const target = this.cleanAnswer.replace(/[^A-Z]/g, '');

    if (currentGuess === target) {
      this.solvePuzzleVictory();
    } else {
      sound.playWrong();
      this.answerFeedback.textContent = '❌ NOT QUITE! TAP ANY LETTER TO REMOVE IT!';
      this.answerFeedback.className = 'validation-message error';
      const playboard = document.querySelector('.playboard-card');
      playboard.classList.remove('shake-error');
      void playboard.offsetWidth; // trigger reflow
      playboard.classList.add('shake-error');
      this.state.streak = 0;
      this.saveState();
    }
  }

  solvePuzzleVictory() {
    sound.playCorrect();
    launchConfetti({ count: 85 });

    const baseCoins = 15;
    const streakBonus = Math.min(this.state.streak * 5, 25);
    const totalWon = baseCoins + streakBonus;

    this.state.coins += totalWon;
    this.state.streak += 1;
    if (this.state.streak > this.state.bestStreak) {
      this.state.bestStreak = this.state.streak;
    }

    const isRebus = this.currentPuzzle.category === 'rebus';
    const isWordle = this.currentPuzzle.category === 'wordle';
    if (isRebus) {
      if (!this.state.solvedRebusIds.includes(this.currentPuzzle.id)) {
        this.state.solvedRebusIds.push(this.currentPuzzle.id);
      }
    } else if (!isWordle) {
      if (!this.state.solvedEmojiIds.includes(this.currentPuzzle.id)) {
        this.state.solvedEmojiIds.push(this.currentPuzzle.id);
      }
    }
    this.saveState();

    if (this.state.streak > 0 && this.state.streak % 5 === 0) {
      setTimeout(() => sound.playFanfare(), 350);
    }

    // Modal Content
    if (isWordle) {
      this.modalTitle.textContent = 'CODE CRACKED!';
      this.modalEquation.textContent = `Solved in ${this.wordleGuesses.length} attempts`;
      this.modalExplanation.textContent = 'Great logic deduction!';
    } else {
      this.modalTitle.textContent = isRebus ? 'REBUS DECODED!' : 'EQUATION CRACKED!';
      this.modalEquation.textContent = isRebus ? (this.currentPuzzle.title || 'Rebus Wordplay') : this.currentPuzzle.emojis.join(' + ');
      this.modalExplanation.textContent = this.currentPuzzle.explanation;
    }
    
    this.modalAnswer.textContent = this.cleanAnswer;
    this.modalCoinReward.textContent = `+${baseCoins} 🪙`;

    if (streakBonus > 0) {
      this.modalStreakItem.style.display = 'flex';
      this.modalStreakReward.textContent = `+${streakBonus} 🪙 (${this.state.streak}x 🔥)`;
    } else {
      this.modalStreakItem.style.display = 'none';
    }

    this.winModal.classList.remove('hidden');
  }

  nextPuzzle() {
    this.hideAdmireBar();
    if (this.gameMode === 'wordle') {
      this.wordleGuesses = [];
      this.wordleCurrentGuess = '';
    } else if (this.gameMode === 'connections') {
      this.connectionsSelectedTiles = [];
      this.connectionsSolvedGroups = [];
      this.connectionsRemainingTiles = [];
    } else if (this.gameMode === 'contexto') {
      this.contextoGuesses = [];
      this.contextoIsGameOver = false;
    } else if (this.gameMode === 'spellingBee') {
      this.loadSpellingBeeGame();
      return;
    }
    this.pickRandomPuzzle();
  }

  // ================= CONNECTIONS SYSTEM =================
  loadConnectionsBoard(board) {
    this.connectionsCurrentBoard = board;
    this.connectionsSolvedGroups = [];
    this.connectionsMistakes = 4;
    this.connectionsSelectedTiles = [];
    this.connectionsIsGameOver = false;

    const allWords = [];
    board.groups.forEach(g => {
      g.items.forEach(w => allWords.push(w.toUpperCase()));
    });
    // Shuffle words
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }
    this.connectionsRemainingTiles = allWords;

    this.puzzleTypeBadge.textContent = 'CONNECTIONS';
    this.puzzleIdLabel.textContent = `#${board.id}`;
    this.puzzleProgressPill.textContent = 'Group in Fours';
    this.hintBanner.classList.add('hidden');
    this.hintBanner.style.display = 'none';
    this.hintBodyText.textContent = '';
    this.answerFeedback.textContent = '';
    this.answerFeedback.className = 'validation-message';

    this.renderConnectionsBoard();
  }

  renderConnectionsBoard() {
    if (!this.connectionsBoard) return;

    // 1. Solved groups banner cards
    this.connectionsSolvedContainer.innerHTML = '';
    this.connectionsSolvedGroups.forEach(group => {
      const card = document.createElement('div');
      card.className = `connections-solved-card group-${group.color}`;
      card.innerHTML = `
        <div class="cg-title">${group.category}</div>
        <div class="cg-items">${group.items.join(', ')}</div>
      `;
      this.connectionsSolvedContainer.appendChild(card);
    });

    // 2. Remaining 4x4 tiles grid
    this.connectionsTilesGrid.innerHTML = '';
    this.connectionsRemainingTiles.forEach(word => {
      const btn = document.createElement('button');
      const isSelected = this.connectionsSelectedTiles.includes(word);
      btn.className = `connections-tile ${isSelected ? 'selected' : ''}`;
      btn.textContent = word;
      btn.addEventListener('click', () => this.handleConnectionsTileClick(word));
      this.connectionsTilesGrid.appendChild(btn);
    });

    // 3. Mistakes dots
    let dotsStr = '';
    for (let i = 0; i < this.connectionsMaxMistakes; i++) {
      dotsStr += (i < this.connectionsMistakes) ? '● ' : '○ ';
    }
    this.connectionsMistakesDots.textContent = dotsStr.trim();

    // 4. Submit button state
    this.connectionsSubmitBtn.disabled = (this.connectionsSelectedTiles.length !== 4 || this.connectionsIsGameOver);
  }

  handleConnectionsTileClick(word) {
    if (this.connectionsIsGameOver) return;

    const idx = this.connectionsSelectedTiles.indexOf(word);
    if (idx > -1) {
      sound.playPop(480);
      this.connectionsSelectedTiles.splice(idx, 1);
    } else {
      if (this.connectionsSelectedTiles.length >= 4) {
        sound.playError();
        return;
      }
      sound.playPop(620);
      this.connectionsSelectedTiles.push(word);
    }

    this.renderConnectionsBoard();
  }

  handleConnectionsShuffle() {
    if (this.connectionsIsGameOver) return;
    sound.playPop(550);
    for (let i = this.connectionsRemainingTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.connectionsRemainingTiles[i], this.connectionsRemainingTiles[j]] = [this.connectionsRemainingTiles[j], this.connectionsRemainingTiles[i]];
    }
    this.renderConnectionsBoard();
  }

  handleConnectionsDeselect() {
    if (this.connectionsIsGameOver) return;
    sound.playPop(420);
    this.connectionsSelectedTiles = [];
    this.renderConnectionsBoard();
  }

  handleConnectionsSubmit() {
    if (this.connectionsIsGameOver || this.connectionsSelectedTiles.length !== 4) return;

    // Check if the 4 selected items match any unsolved group in the board
    const matchedGroup = this.connectionsCurrentBoard.groups.find(group => {
      if (this.connectionsSolvedGroups.some(sg => sg.category === group.category)) return false;
      const groupWords = group.items.map(w => w.toUpperCase());
      return this.connectionsSelectedTiles.every(w => groupWords.includes(w));
    });

    if (matchedGroup) {
      sound.playSuccess();
      this.connectionsSolvedGroups.push(matchedGroup);
      const matchedItemsUpper = matchedGroup.items.map(w => w.toUpperCase());
      this.connectionsRemainingTiles = this.connectionsRemainingTiles.filter(w => !matchedItemsUpper.includes(w));
      this.connectionsSelectedTiles = [];
      this.answerFeedback.textContent = '';
      this.renderConnectionsBoard();

      if (this.connectionsSolvedGroups.length === 4) {
        this.connectionsIsGameOver = true;
        this.state.coins += 25;
        this.state.streak++;
        if (this.state.streak > this.state.bestStreak) {
          this.state.bestStreak = this.state.streak;
        }
        this.saveState();

        this.answerFeedback.textContent = '🎉 All 4 Connections Found! Fantastic!';
        this.answerFeedback.className = 'validation-message success';

        // 1400ms delay gives user time to see the 4th row snap into place and see all 4 groups on the board!
        setTimeout(() => {
          launchConfetti();
          sound.playFanfare();

          this.modalTitle.textContent = 'ALL CONNECTIONS FOUND!';
          this.modalEquation.innerHTML = '🟨 🟩 🟦 🟪';
          this.modalExplanation.textContent = `Brilliant deduction! You solved all four categories in "${this.connectionsCurrentBoard.title}".`;
          this.modalAnswer.textContent = 'PERFECT 4/4';
          this.modalCoinReward.textContent = '+25 🪙';
          if (this.state.streak > 1) {
            this.modalStreakItem.style.display = 'flex';
            this.modalStreakReward.textContent = `🔥 Streak: ${this.state.streak}`;
          } else {
            this.modalStreakItem.style.display = 'none';
          }
          this.winModal.classList.remove('hidden');
        }, 1400);
      }
      return;
    }

    // Not a match!
    sound.playWrong();
    this.connectionsMistakes--;

    // Check "one away" (if 3 of the 4 match any unsolved group)
    const isOneAway = this.connectionsCurrentBoard.groups.some(group => {
      if (this.connectionsSolvedGroups.some(sg => sg.category === group.category)) return false;
      const groupWords = group.items.map(w => w.toUpperCase());
      const matchCount = this.connectionsSelectedTiles.filter(w => groupWords.includes(w)).length;
      return matchCount === 3;
    });

    if (isOneAway) {
      this.answerFeedback.textContent = 'One away... 🤏';
      this.answerFeedback.className = 'validation-message error';
    } else {
      this.answerFeedback.textContent = 'Not quite! Try again.';
      this.answerFeedback.className = 'validation-message error';
    }

    // Wiggle selected tiles
    document.querySelectorAll('.connections-tile.selected').forEach(t => {
      t.classList.add('wiggle');
      setTimeout(() => t.classList.remove('wiggle'), 400);
    });

    if (this.connectionsMistakes <= 0) {
      this.connectionsIsGameOver = true;
      this.state.streak = 0;
      this.saveState();

      setTimeout(() => {
        this.connectionsCurrentBoard.groups.forEach(group => {
          if (!this.connectionsSolvedGroups.some(sg => sg.category === group.category)) {
            this.connectionsSolvedGroups.push(group);
          }
        });
        this.connectionsRemainingTiles = [];
        this.connectionsSelectedTiles = [];
        this.renderConnectionsBoard();
        this.answerFeedback.textContent = 'Out of mistakes! Here are the group solutions.';
        this.answerFeedback.className = 'validation-message';
        this.showAdmireBar('Group Solutions Revealed • Study the connections!');
      }, 600);
    } else {
      this.renderConnectionsBoard();
    }
  }

  // ================= CONTEXTO SYSTEM =================
  loadContextoGame(game) {
    this.contextoCurrentGame = game;
    this.contextoGuesses = [];
    this.contextoIsGameOver = false;

    this.puzzleTypeBadge.textContent = 'CONTEXTO';
    this.puzzleIdLabel.textContent = `#${game.id}`;
    this.puzzleProgressPill.textContent = `Secret #${game.id}`;
    this.hintBanner.classList.add('hidden');
    this.hintBanner.style.display = 'none';
    this.hintBodyText.textContent = '';
    this.answerFeedback.textContent = '';
    this.answerFeedback.className = 'validation-message';

    if (this.contextoInputField) {
      this.contextoInputField.value = '';
      this.contextoInputField.disabled = false;
      setTimeout(() => this.contextoInputField.focus(), 150);
    }

    this.renderContextoBoard();
  }

  handleContextoSubmit() {
    if (!this.contextoCurrentGame || this.contextoIsGameOver) return;
    const raw = (this.contextoInputField.value || '').trim();
    if (!raw) return;

    const cleanWord = raw.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length < 2) {
      this.answerFeedback.textContent = 'Please enter a valid word (min 2 letters).';
      this.answerFeedback.className = 'validation-message error';
      return;
    }

    // Check duplicate guess
    if (this.contextoGuesses.some(g => g.word.toLowerCase() === cleanWord)) {
      this.answerFeedback.textContent = `Already guessed "${cleanWord.toUpperCase()}"!`;
      this.answerFeedback.className = 'validation-message error';
      this.contextoInputField.value = '';
      return;
    }

    // Compute rank
    const targetWord = this.contextoCurrentGame.target.toLowerCase();
    let rank = 10000;
    if (cleanWord === targetWord) {
      rank = 1;
    } else {
      rank = getContextoRank(this.contextoCurrentGame, cleanWord);
    }

    // Add guess
    const guessEntry = {
      word: cleanWord.toUpperCase(),
      rank: rank,
      time: Date.now()
    };
    this.contextoGuesses.unshift(guessEntry);
    this.contextoInputField.value = '';
    this.contextoInputField.focus();

    // Sound and feedback
    if (rank === 1) {
      sound.playSuccess();
      this.contextoIsGameOver = true;
      if (this.contextoInputField) this.contextoInputField.disabled = true;
      this.state.streak++;
      if (this.state.streak > this.state.bestStreak) {
        this.state.bestStreak = this.state.streak;
      }
      const coinReward = Math.max(15, 60 - Math.min(45, Math.floor(this.contextoGuesses.length / 2)));
      this.state.coins += coinReward;
      this.saveState();
      this.renderContextoBoard();

      launchConfetti();
      setTimeout(() => {
        this.openContextoWinModal(coinReward);
      }, 1300);
    } else {
      if (rank <= 300) {
        sound.playCorrect();
        this.answerFeedback.textContent = `🔥 Super close! Rank ${rank}`;
        this.answerFeedback.className = 'validation-message success';
      } else if (rank <= 1500) {
        sound.playPop(480);
        this.answerFeedback.textContent = `Warm! Rank ${rank}`;
        this.answerFeedback.className = 'validation-message';
      } else {
        sound.playPop(320);
        this.answerFeedback.textContent = `Cold! Rank ${rank}`;
        this.answerFeedback.className = 'validation-message';
      }
      this.renderContextoBoard();
    }
  }

  openContextoWinModal(coinReward) {
    this.modalTitle.textContent = '🌟 BRILLIANT DEDUCTION!';
    this.modalEquation.innerHTML = `<span style="font-size: 2.2rem; font-weight: 900; letter-spacing: 2px;">${this.contextoCurrentGame.target}</span>`;
    this.modalAnswer.textContent = `Rank #1 found in ${this.contextoGuesses.length} guesses!`;
    this.modalExplanation.textContent = `Category: ${this.contextoCurrentGame.category.toUpperCase()}. You solved the semantic maze!`;
    this.modalCoinReward.textContent = `+${coinReward}🪙`;
    if (this.state.streak > 1) {
      this.modalStreakItem.style.display = 'flex';
      this.modalStreakReward.textContent = `${this.state.streak}🔥`;
    } else {
      this.modalStreakItem.style.display = 'none';
    }
    this.winModal.classList.remove('hidden');
  }

  handleContextoSortToggle() {
    sound.playPop(420);
    this.contextoSortMode = this.contextoSortMode === 'rank' ? 'time' : 'rank';
    if (this.contextoSortBtn) {
      this.contextoSortBtn.textContent = this.contextoSortMode === 'rank' ? '📶 By Closeness' : '⏱️ By Recent';
    }
    this.renderContextoBoard();
  }

  handleContextoHint() {
    if (!this.contextoCurrentGame || this.contextoIsGameOver) return;
    const cost = 20;
    const actualCost = Math.min(this.state.coins, cost);
    this.state.coins = Math.max(0, this.state.coins - cost);
    this.saveState();

    const topWords = this.contextoCurrentGame.topWords || this.contextoCurrentGame.ranked || [];
    const guessedWords = new Set(this.contextoGuesses.map(g => g.word.toUpperCase()));
    const nonWinningGuesses = this.contextoGuesses.filter(g => g.rank > 1);
    const hasGuesses = nonWinningGuesses.length > 0;
    const bestRank = hasGuesses ? Math.min(...nonWinningGuesses.map(g => g.rank)) : 99999;

    let hintWord = null;
    let hintRank = null;

    if (bestRank <= 5) {
      // Best guess was closer than 5: give the closest lower one (smallest rank > bestRank)
      for (let i = 0; i < topWords.length; i++) {
        const r = i + 2;
        if (r > bestRank && !guessedWords.has(topWords[i].toUpperCase())) {
          hintWord = topWords[i];
          hintRank = r;
          break;
        }
      }
    } else {
      // Best guess was not closer than 5: give a word that is a little higher than best guess (closer to #1)
      let idealRank;
      if (!hasGuesses || bestRank > 200) {
        idealRank = Math.min(topWords.length + 1, 35);
      } else if (bestRank > 50) {
        idealRank = Math.round(bestRank * 0.55);
      } else if (bestRank > 15) {
        idealRank = Math.round(bestRank * 0.65);
      } else {
        idealRank = Math.max(2, bestRank - 2);
      }

      const candidates = [];
      for (let i = 0; i < topWords.length; i++) {
        const r = i + 2;
        if (r < bestRank && !guessedWords.has(topWords[i].toUpperCase())) {
          candidates.push({ word: topWords[i], rank: r });
        }
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => Math.abs(a.rank - idealRank) - Math.abs(b.rank - idealRank));
        hintWord = candidates[0].word;
        hintRank = candidates[0].rank;
      }
    }

    // Fallback: pick any available unguessed word in topWords (never rank 1)
    if (!hintWord) {
      for (let i = 0; i < topWords.length; i++) {
        const r = i + 2;
        if (!guessedWords.has(topWords[i].toUpperCase())) {
          hintWord = topWords[i];
          hintRank = r;
          break;
        }
      }
    }

    if (!hintWord) {
      this.showNotice('No more hints available for this secret word!');
      return;
    }

    sound.playBonus();

    const guessEntry = {
      word: hintWord.toUpperCase(),
      rank: hintRank,
      time: Date.now()
    };
    this.contextoGuesses.unshift(guessEntry);
    this.answerFeedback.textContent = actualCost > 0
      ? `💡 Hint: "${hintWord.toUpperCase()}" is rank ${hintRank}! (-${actualCost}🪙)`
      : `💡 Hint: "${hintWord.toUpperCase()}" is rank ${hintRank}! (Complimentary Hint)`;
    this.answerFeedback.className = 'validation-message success';
    this.renderContextoBoard();
  }

  handleContextoGiveUp() {
    if (!this.contextoCurrentGame || this.contextoIsGameOver) return;
    this.contextoIsGameOver = true;
    this.state.streak = 0;
    this.saveState();
    sound.playWrong();

    if (this.contextoInputField) {
      this.contextoInputField.disabled = true;
    }

    const secret = this.contextoCurrentGame.target;
    this.answerFeedback.textContent = `The secret word was "${secret}"!`;
    this.answerFeedback.className = 'validation-message error';

    if (!this.contextoGuesses.some(g => g.rank === 1)) {
      this.contextoGuesses.unshift({
        word: secret.toUpperCase(),
        rank: 1,
        time: Date.now()
      });
    }
    this.renderContextoBoard();
    this.showAdmireBar(`Secret Word Revealed: "${secret}" • Study the ranks!`);
  }

  renderContextoBoard() {
    if (!this.contextoBoard) return;

    const count = this.contextoGuesses.length;
    let best = count > 0 ? Math.min(...this.contextoGuesses.map(g => g.rank)) : '---';
    if (this.contextoGuessCount) this.contextoGuessCount.textContent = count;
    if (this.contextoBestRank) this.contextoBestRank.textContent = best === 1 ? '👑 1' : (best === '---' ? '---' : best.toLocaleString());

    let displayList = [...this.contextoGuesses];
    if (this.contextoSortMode === 'rank') {
      displayList.sort((a, b) => a.rank - b.rank);
    } else {
      displayList.sort((a, b) => b.time - a.time);
    }

    this.contextoGuessesContainer.innerHTML = '';
    if (displayList.length === 0) {
      this.contextoGuessesContainer.innerHTML = `
        <div class="contexto-empty-placeholder">No guesses yet. Type your first word above!</div>
      `;
      return;
    }

    displayList.forEach(item => {
      const card = document.createElement('div');
      card.className = 'contexto-guess-card';
      if (item.rank === 1) card.classList.add('winner');

      let barColorClass = 'bar-red';
      let rankBadgeClass = 'rank-red';
      let pct = 10;

      if (item.rank === 1) {
        barColorClass = 'bar-green';
        rankBadgeClass = 'rank-green';
        pct = 100;
      } else if (item.rank <= 300) {
        barColorClass = 'bar-green';
        rankBadgeClass = 'rank-green';
        pct = Math.round(99 - ((item.rank - 2) / 298) * 39);
      } else if (item.rank <= 1500) {
        barColorClass = 'bar-yellow';
        rankBadgeClass = 'rank-yellow';
        pct = Math.round(59 - ((item.rank - 301) / 1199) * 34);
      } else {
        barColorClass = 'bar-red';
        rankBadgeClass = 'rank-red';
        pct = Math.max(5, Math.round(24 - ((item.rank - 1501) / 23500) * 19));
      }

      card.innerHTML = `
        <div class="contexto-fill-bar ${barColorClass}" style="width: ${pct}%;"></div>
        <div class="contexto-card-content">
          <span class="c-word">${item.word}</span>
          <span class="c-rank-badge ${rankBadgeClass}">${item.rank === 1 ? '👑 1' : item.rank.toLocaleString()}</span>
        </div>
      `;
      this.contextoGuessesContainer.appendChild(card);
    });
  }

  // ================= SPELLING BEE SYSTEM =================
  getRandomBeeHive() {
    if (!SPELLING_BEE_HIVES || SPELLING_BEE_HIVES.length === 0) return null;
    const idx = Math.floor(Math.random() * SPELLING_BEE_HIVES.length);
    return SPELLING_BEE_HIVES[idx];
  }

  loadSpellingBeeGame(hive) {
    this.beeCurrentHive = hive || this.getRandomBeeHive();
    if (!this.beeCurrentHive) return;

    this.beeInputWord = '';
    this.beeScore = 0;
    this.beeFoundWords = new Set();
    this.beeOuterDisplay = [...this.beeCurrentHive.outerLetters];
    this.beeShelfOpen = false;

    // Calculate maximum score
    let maxPoints = 0;
    this.beeCurrentHive.validWords.forEach(w => {
      const isPangram = this.isBeePangram(w);
      const pts = (w.length === 4 ? 1 : w.length) + (isPangram ? 7 : 0);
      maxPoints += pts;
    });
    this.beeMaxScore = Math.max(20, maxPoints);

    this.renderSpellingBeeBoard();
  }

  isBeePangram(word) {
    if (!this.beeCurrentHive) return false;
    const req = [this.beeCurrentHive.centerLetter, ...this.beeCurrentHive.outerLetters];
    return req.every(ch => word.includes(ch));
  }

  getBeeRankTitle(score) {
    const max = this.beeMaxScore || 100;
    const ratio = score / max;
    if (ratio >= 1.0) return { title: '👑 Queen Bee', class: 'rank-queen' };
    if (ratio >= 0.70) return { title: '🧠 Genius', class: 'rank-genius' };
    if (ratio >= 0.50) return { title: '✨ Amazing', class: 'rank-amazing' };
    if (ratio >= 0.35) return { title: '🔥 Great', class: 'rank-great' };
    if (ratio >= 0.22) return { title: '⚡ Nice', class: 'rank-nice' };
    if (ratio >= 0.12) return { title: '🌱 Solid', class: 'rank-solid' };
    if (ratio >= 0.05) return { title: '🐣 Moving Up', class: 'rank-novice' };
    return { title: '🐝 Beginner', class: 'rank-beginner' };
  }

  renderSpellingBeeBoard() {
    if (!this.spellingBeeBoard || !this.beeCurrentHive) return;

    // 1. Center & Outer letter cells
    if (this.beeCellCenter) {
      const el = this.beeCellCenter.querySelector('.bee-hex-letter') || this.beeCellCenter;
      el.textContent = this.beeCurrentHive.centerLetter;
    }
    if (this.beeHexButtons) {
      this.beeHexButtons.forEach((btn, idx) => {
        if (btn && this.beeOuterDisplay[idx]) {
          const el = btn.querySelector('.bee-hex-letter') || btn;
          el.textContent = this.beeOuterDisplay[idx];
        }
      });
    }

    // 2. Input word display (Clean single cursor)
    if (this.beeInputText) {
      if (!this.beeInputWord || this.beeInputWord.length === 0) {
        this.beeInputText.innerHTML = '';
      } else {
        const center = this.beeCurrentHive.centerLetter;
        const html = this.beeInputWord.split('').map(ch => {
          return ch === center
            ? `<span class="bee-char bee-center-char">${ch}</span>`
            : `<span class="bee-char">${ch}</span>`;
        }).join('');
        this.beeInputText.innerHTML = html;
      }
    }

    // 3. Score, Rank, and Progress
    const rankInfo = this.getBeeRankTitle(this.beeScore);
    const geniusThreshold = Math.round((this.beeMaxScore || 100) * 0.7);

    if (this.beeRankBadge) {
      this.beeRankBadge.textContent = rankInfo.title;
      this.beeRankBadge.className = `bee-rank-badge ${rankInfo.class}`;
    }
    if (this.beeScoreVal) {
      this.beeScoreVal.textContent = this.beeScore;
    }
    if (this.beeGeniusTarget) {
      this.beeGeniusTarget.textContent = `/ ${geniusThreshold} for Genius`;
    }
    if (this.beeProgressFill) {
      const pct = Math.min(100, Math.round((this.beeScore / (this.beeMaxScore || 100)) * 100));
      this.beeProgressFill.style.width = `${pct}%`;
    }

    // 4. Words Shelf (Always visible & up to date)
    const foundCount = this.beeFoundWords.size;
    const totalCount = this.beeCurrentHive.validWords.length;
    if (this.beeFoundCountLabel) {
      this.beeFoundCountLabel.textContent = `${foundCount} / ${totalCount} words (${this.beeScore} pts)`;
    }

    if (this.beeFoundChipsList) {
      this.beeFoundChipsList.innerHTML = '';
      if (foundCount === 0) {
        this.beeFoundChipsList.innerHTML = '<div class="bee-no-words">Words you discover will appear here!</div>';
      } else {
        const sortedWords = Array.from(this.beeFoundWords).sort();
        sortedWords.forEach(w => {
          const chip = document.createElement('span');
          chip.className = 'bee-chip';
          if (this.isBeePangram(w)) {
            chip.classList.add('pangram');
            chip.innerHTML = `🌟 ${w}`;
          } else {
            chip.textContent = w;
          }
          this.beeFoundChipsList.appendChild(chip);
        });
      }
    }
  }

  handleBeeLetter(ch) {
    if (!ch || !this.beeCurrentHive) return;
    if (this.beeInputWord.length >= 20) return;
    this.beeInputWord += ch.toUpperCase();
    sound.playPop(420 + Math.min(240, this.beeInputWord.length * 20));
    this.renderSpellingBeeBoard();
  }

  handleBeeDelete() {
    if (this.beeInputWord.length > 0) {
      this.beeInputWord = this.beeInputWord.slice(0, -1);
      sound.playPop(340);
      this.renderSpellingBeeBoard();
    }
  }

  handleBeeShuffle() {
    if (!this.beeOuterDisplay || this.beeOuterDisplay.length === 0) return;
    sound.playPop(520);
    for (let i = this.beeOuterDisplay.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.beeOuterDisplay[i], this.beeOuterDisplay[j]] = [this.beeOuterDisplay[j], this.beeOuterDisplay[i]];
    }
    if (this.beeHexButtons) {
      this.beeHexButtons.forEach(btn => {
        if (btn) {
          btn.classList.remove('bee-spin-anim');
          void btn.offsetWidth;
          btn.classList.add('bee-spin-anim');
        }
      });
    }
    this.renderSpellingBeeBoard();
  }

  toggleBeeShelf() {
    this.beeShelfOpen = !this.beeShelfOpen;
    sound.playPop(460);
    this.renderSpellingBeeBoard();
  }

  handleBeeSubmit() {
    if (!this.beeCurrentHive) return;
    const word = this.beeInputWord.trim().toUpperCase();

    if (word.length < 4) {
      sound.playWrong();
      this.showNotice('Too short (minimum 4 letters)!');
      this.animateBeeInputError();
      return;
    }

    if (!word.includes(this.beeCurrentHive.centerLetter)) {
      sound.playWrong();
      this.showNotice(`Must include center letter "${this.beeCurrentHive.centerLetter}"!`);
      this.animateBeeInputError();
      return;
    }

    if (this.beeFoundWords.has(word)) {
      sound.playWrong();
      this.showNotice('Already found!');
      this.animateBeeInputError();
      return;
    }

    const isValid = this.beeCurrentHive.validWords.map(w => w.toUpperCase()).includes(word);
    if (!isValid) {
      sound.playWrong();
      this.showNotice('Not in word list!');
      this.animateBeeInputError();
      return;
    }

    // Valid word scored!
    const isPangram = this.isBeePangram(word);
    const pts = (word.length === 4 ? 1 : word.length) + (isPangram ? 7 : 0);

    this.beeFoundWords.add(word);
    this.beeScore += pts;
    this.state.coins += pts;
    this.state.streak++;
    if (this.state.streak > this.state.bestStreak) {
      this.state.bestStreak = this.state.streak;
    }
    this.saveState();

    this.beeInputWord = '';

    if (isPangram) {
      sound.playBonus();
      launchConfetti();
      this.showNotice(`🌟 PANGRAM! +${pts} pts (+${pts}🪙)!`);
    } else {
      sound.playCorrect();
      const praise = pts >= 7 ? 'Awesome!' : (pts >= 5 ? 'Great!' : 'Good!');
      this.showNotice(`${praise} +${pts} pts (+${pts}🪙)`);
    }

    this.renderSpellingBeeBoard();

    // Check if Queen Bee achieved
    if (this.beeScore >= this.beeMaxScore || this.beeFoundWords.size === this.beeCurrentHive.validWords.length) {
      setTimeout(() => {
        this.openBeeWinModal();
      }, 1200);
    }
  }

  animateBeeInputError() {
    if (!this.beeInputText) return;
    this.beeInputText.classList.remove('shake-error');
    void this.beeInputText.offsetWidth;
    this.beeInputText.classList.add('shake-error');
    setTimeout(() => {
      if (this.beeInputText) this.beeInputText.classList.remove('shake-error');
    }, 500);
  }

  handleBeeHint() {
    if (!this.beeCurrentHive) return;
    const cost = 10;
    const actualCost = Math.min(this.state.coins, cost);
    this.state.coins = Math.max(0, this.state.coins - cost);
    this.saveState();

    // Find unguessed words
    const unguessed = this.beeCurrentHive.validWords
      .map(w => w.toUpperCase())
      .filter(w => !this.beeFoundWords.has(w));

    if (unguessed.length === 0) {
      this.showNotice('🐝 Amazing! You have found every single word!');
      return;
    }

    // Pick an unguessed word to hint
    const pangrams = unguessed.filter(w => this.isBeePangram(w));
    const target = pangrams.length > 0
      ? pangrams[0]
      : unguessed.sort((a, b) => b.length - a.length)[0];

    const prefix = target.slice(0, 2);
    sound.playHint();
    const costNote = actualCost > 0 ? `(-${actualCost}🪙)` : `(Free)`;
    this.showNotice(`💡 Hint: Starts with "${prefix}...", length ${target.length} letters! ${costNote}`);
  }

  openBeeWinModal() {
    sound.playBonus();
    launchConfetti();
    this.modalTitle.textContent = '👑 QUEEN BEE ASCENSION!';
    this.modalEquation.innerHTML = `<span style="font-size: 2.2rem; font-weight: 900; letter-spacing: 2px;">PERFECT HIVE</span>`;
    this.modalAnswer.textContent = `All ${this.beeFoundWords.size} words conquered! Score: ${this.beeScore} pts`;
    this.modalExplanation.textContent = `Theme: ${this.beeCurrentHive.theme || 'Master Lexicographer'}. You have mastered the hive!`;
    this.modalCoinReward.textContent = `+100🪙`;
    this.state.coins += 100;
    this.saveState();
    if (this.state.streak > 1) {
      this.modalStreakItem.style.display = 'flex';
      this.modalStreakReward.textContent = `${this.state.streak}🔥`;
    } else {
      this.modalStreakItem.style.display = 'none';
    }
    this.winModal.classList.remove('hidden');
  }

  // ================= ADMIRE PUZZLE SYSTEM =================
  handleAdmirePuzzle() {
    sound.playPop(480);
    if (this.winModal) {
      this.winModal.classList.add('hidden');
    }
    this.showAdmireBar();
  }

  showAdmireBar(customLabel) {
    if (!this.admireBoardBar) return;
    this.isAdmiring = true;
    if (this.admireBarLabel) {
      if (customLabel) {
        this.admireBarLabel.textContent = customLabel;
      } else if (this.gameMode === 'connections') {
        this.admireBarLabel.textContent = 'All 4 Categories Found • Review the connections!';
      } else if (this.gameMode === 'contexto') {
        this.admireBarLabel.textContent = `Secret Word Found: "${this.contextoCurrentGame?.target}" • Browse guess ranks!`;
      } else if (this.gameMode === 'spellingBee') {
        this.admireBarLabel.textContent = `Queen Bee Conquered! • Score: ${this.beeScore} pts`;
      } else if (this.gameMode === 'wordle') {
        this.admireBarLabel.textContent = `Code Solved: "${this.cleanAnswer || this.currentPuzzle?.answer}" • Review guess grid`;
      } else {
        this.admireBarLabel.textContent = `Decoded: "${this.cleanAnswer}" • Admire your solution!`;
      }
    }
    this.admireBoardBar.classList.remove('hidden');
  }

  hideAdmireBar() {
    this.isAdmiring = false;
    if (this.admireBoardBar) {
      this.admireBoardBar.classList.add('hidden');
    }
  }

  reopenWinModal() {
    sound.playPop(520);
    if (this.winModal) {
      this.winModal.classList.remove('hidden');
    }
  }

  // ================= HINTS SYSTEM =================
  handleClueHint() {
    if (this.clueRevealed) return;
    const cost = 10;
    const actualCost = Math.min(this.state.coins, cost);
    this.state.coins = Math.max(0, this.state.coins - cost);
    this.saveState();
    sound.playHint();

    this.clueRevealed = true;
    this.hintBodyText.textContent = this.currentPuzzle.hint;
    this.hintBanner.classList.remove('hidden');
    this.hintBanner.style.display = 'flex';
  }

  handleRevealLetter() {
    const cost = 25;
    if (this.state.coins < cost) {
      this.showNotice(`Requires ${cost}🪙 to reveal a letter!`);
      return;
    }

    const targetChars = this.cleanAnswer.replace(/[^A-Z]/g, '').split('');

    let targetSlotIdx = -1;
    for (let i = 0; i < targetChars.length; i++) {
      const placed = this.placedLetters[i];
      if (!placed || placed.char !== targetChars[i] || !placed.isRevealed) {
        targetSlotIdx = i;
        break;
      }
    }

    if (targetSlotIdx === -1) return;

    const correctChar = targetChars[targetSlotIdx];

    if (this.placedLetters[targetSlotIdx]) {
      this.handleSlotClick(targetSlotIdx);
    }

    let tile = this.keyboardPool.find((t) => t.char === correctChar && !t.isUsed && !t.isDisabled);

    if (!tile) {
      for (let i = 0; i < this.placedLetters.length; i++) {
        const item = this.placedLetters[i];
        if (item && item.char === correctChar && !item.isRevealed) {
          this.handleSlotClick(i);
          tile = this.keyboardPool.find((t) => t.id === item.tileId);
          break;
        }
      }
    }

    if (!tile) {
      tile = { id: `rev_${Date.now()}`, char: correctChar, isUsed: true };
    } else {
      tile.isUsed = true;
    }

    this.state.coins -= cost;
    this.saveState();
    sound.playCoin();

    this.placedLetters[targetSlotIdx] = {
      char: correctChar,
      tileId: tile.id,
      isRevealed: true
    };

    this.renderSlots();
    this.renderKeyboard();

    if (!this.placedLetters.includes(null)) {
      this.checkAnswer();
    }
  }

  handleClearDistractors() {
    const cost = 20;
    if (this.state.coins < cost) {
      this.showNotice(`Requires ${cost}🪙 to clear extra letters!`);
      return;
    }

    let count = 0;
    for (const tile of this.keyboardPool) {
      if (tile.isDistractor && !tile.isDisabled && !tile.isUsed) {
        tile.isDisabled = true;
        count++;
        if (count >= 3) break;
      }
    }

    if (count === 0) {
      this.showNotice('No extra letters available to clear!');
      return;
    }

    this.state.coins -= cost;
    this.saveState();
    sound.playHint();
    this.renderKeyboard();
  }

  handleShuffleKeyboard() {
    sound.playPop(520);
    const active = this.keyboardPool.filter((t) => !t.isUsed && !t.isDisabled);
    for (let i = active.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const c = active[i].char;
      const d = active[i].isDistractor;
      active[i].char = active[j].char;
      active[i].isDistractor = active[j].isDistractor;
      active[j].char = c;
      active[j].isDistractor = d;
    }
    this.renderKeyboard();
  }

  handleSkip() {
    const cost = 15;
    if (this.state.coins < cost) {
      this.showNotice(`Requires ${cost}🪙 to skip!`);
      return;
    }

    this.state.coins -= cost;
    this.state.streak = 0;
    this.saveState();
    sound.playPop(340);
    this.nextPuzzle();
  }

  showNotice(msg) {
    this.answerFeedback.textContent = msg;
    this.answerFeedback.className = 'validation-message error';
    setTimeout(() => {
      if (this.answerFeedback.textContent === msg) {
        this.answerFeedback.textContent = '';
      }
    }, 2800);
  }

  // ================= ARCHIVE COLLECTION =================
  openArchive() {
    this.renderArchiveGrid();
    this.bookModal.classList.remove('hidden');
  }

  renderArchiveGrid() {
    this.bookGrid.innerHTML = '';
    const isEmoji = this.archiveTab === 'emoji';
    const list = isEmoji ? PUZZLES : REBUS_PUZZLES;
    const solvedList = isEmoji ? this.state.solvedEmojiIds : this.state.solvedRebusIds;

    list.forEach((puzzle) => {
      const isSolved = solvedList.includes(puzzle.id);
      const card = document.createElement('div');
      card.className = `archive-card ${isSolved ? 'solved' : 'locked'}`;

      if (isSolved) {
        card.innerHTML = `
          <div class="archive-card-art">${isEmoji ? puzzle.emojis.join(' ') : '🧩 ' + puzzle.title}</div>
          <div class="archive-card-title">${puzzle.answer}</div>
          <div class="archive-card-sub">${puzzle.explanation}</div>
        `;
      } else {
        card.innerHTML = `
          <div class="archive-card-art">${isEmoji ? puzzle.emojis.join(' ') : '🧩 REBUS'}</div>
          <div class="archive-card-title">???</div>
          <div class="archive-card-sub">Tap to play & unlock</div>
        `;
      }

      card.addEventListener('click', () => {
        this.bookModal.classList.add('hidden');
        this.showScreen('game');
        if (isEmoji) {
          this.gameMode = 'emoji';
          this.categoryNav.style.display = 'flex';
          this.switchEmojiModeBtn.classList.add('active');
          this.switchRebusModeBtn.classList.remove('active');
          this.currentList = [...PUZZLES];
        } else {
          this.gameMode = 'rebus';
          this.categoryNav.style.display = 'none';
          this.switchEmojiModeBtn.classList.remove('active');
          this.switchRebusModeBtn.classList.add('active');
          this.currentList = [...REBUS_PUZZLES];
        }
        this.currentPuzzle = puzzle;
        this.renderCurrentPuzzle();
      });

      this.bookGrid.appendChild(card);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new WordplayArcadeApp();
});
