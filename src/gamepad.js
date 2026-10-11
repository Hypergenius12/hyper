// Seleste Gamepad & Controller Manager
// Full W3C Standard Gamepad API support with dual-rumble haptics,
// 8-way Celeste analog snapping, hotplug auto-detection, and UI status sync.

import { sfx } from './audio.js';

export class GamepadManager {
  constructor(game) {
    this.game = game;
    this.connected = false;
    this.gamepadIndex = null;
    this.rawId = '';
    this.displayName = 'GAMEPAD';
    this.deadzone = 0.22;
    
    this.rumbleEnabled = true;
    try {
      const saved = localStorage.getItem('seleste_rumble');
      if (saved !== null) {
        this.rumbleEnabled = saved === 'true';
      }
    } catch (_) {}

    // Track previous button states for rising-edge trigger detection
    this.prevButtons = new Map();
    this.onStateChange = null;

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('gamepadconnected', (e) => {
      this.handleConnected(e.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      this.handleDisconnected(e.gamepad);
    });
  }

  formatDisplayName(rawId = '') {
    if (!rawId) return 'CONTROLLER';
    const s = rawId.toLowerCase();
    if (s.includes('xbox') || s.includes('xinput')) {
      return 'XBOX CONTROLLER';
    }
    if (s.includes('dualshock') || s.includes('dualsense') || s.includes('playstation') || s.includes('054c') || s.includes('sony')) {
      return 'PLAYSTATION CONTROLLER';
    }
    if (s.includes('nintendo') || s.includes('switch') || s.includes('joy-con') || s.includes('pro controller')) {
      return 'NINTENDO SWITCH PAD';
    }
    if (s.includes('8bitdo')) {
      return '8BITDO CONTROLLER';
    }
    // Extract first 18 characters of generic name
    const cleaned = rawId.split('(')[0].trim();
    return (cleaned.slice(0, 18) || 'CONTROLLER').toUpperCase();
  }

  handleConnected(gp) {
    if (!gp) return;
    this.connected = true;
    this.gamepadIndex = gp.index;
    this.rawId = gp.id || '';
    this.displayName = this.formatDisplayName(this.rawId);

    // Provide friendly in-game feedback
    if (this.game && this.game.particles) {
      this.game.particles.addFloater(`PAD CONNECTED: ${this.displayName}`, 40, 50, 8);
    }
    sfx.playHeartCollect();
    this.vibrate(100, 0.4, 0.4);

    if (this.onStateChange) {
      this.onStateChange(true, this.displayName);
    }
  }

  handleDisconnected(gp) {
    if (gp && this.gamepadIndex !== null && gp.index !== this.gamepadIndex) {
      // Disconnected another controller, check if primary still valid
      return;
    }
    this.connected = false;
    this.gamepadIndex = null;
    this.prevButtons.clear();

    if (this.game && this.game.particles) {
      this.game.particles.addFloater('CONTROLLER DISCONNECTED', 60, 50, 6);
    }

    if (this.onStateChange) {
      this.onStateChange(false, 'DISCONNECTED');
    }
  }

  getActiveGamepad() {
    if (!navigator.getGamepads) return null;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return null;

    // 1. Try currently assigned index
    if (this.gamepadIndex !== null && gamepads[this.gamepadIndex] && gamepads[this.gamepadIndex].connected) {
      return gamepads[this.gamepadIndex];
    }

    // 2. Scan for any connected gamepad
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        if (!this.connected) {
          this.handleConnected(gp);
        }
        return gp;
      }
    }

    if (this.connected) {
      this.handleDisconnected(null);
    }
    return null;
  }

  poll() {
    const defaultResult = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      jumpPressed: false,
      dash: false,
      dashPressed: false,
      climb: false,
      restartPressed: false,
      startPressed: false,
      cyclePressed: false,
      analogX: 0,
      analogY: 0
    };

    const gp = this.getActiveGamepad();
    if (!gp) return defaultResult;

    // Left Analog Stick & Deadzone
    let rawX = gp.axes && gp.axes.length > 0 ? gp.axes[0] : 0;
    let rawY = gp.axes && gp.axes.length > 1 ? gp.axes[1] : 0;
    const mag = Math.hypot(rawX, rawY);

    let stickX = 0;
    let stickY = 0;
    let snapX = 0;
    let snapY = 0;

    if (mag >= this.deadzone) {
      stickX = rawX;
      stickY = rawY;

      // 8-Way Celeste angle snapping for digital precision dashes & wall jumps
      const angle = Math.atan2(rawY, rawX);
      const octant = Math.round(angle / (Math.PI / 4));
      snapX = Math.round(Math.cos(octant * (Math.PI / 4)));
      snapY = Math.round(Math.sin(octant * (Math.PI / 4)));
    }

    // Standard Gamepad Buttons (W3C standard)
    // 0: A / Cross / B (Jump)
    // 1: B / Circle / A (Dash Alt / Back)
    // 2: X / Square / Y (Dash Main)
    // 3: Y / Triangle / X (Climb)
    // 4: LB / L1 (Climb)
    // 5: RB / R1 (Dash)
    // 6: LT / L2 (Climb Trigger)
    // 7: RT / R2 (Dash Trigger)
    // 8: Back / View / Select / Share (Restart Room)
    // 9: Start / Menu / Options (Pause / Start)
    // 10: L3 Stick Click (Cycle Hero)
    // 11: R3 Stick Click (Restart Room Alt)
    // 12: D-Pad Up
    // 13: D-Pad Down
    // 14: D-Pad Left
    // 15: D-Pad Right

    const isBtnDown = (idx) => {
      const b = gp.buttons && gp.buttons[idx];
      if (!b) return false;
      return typeof b === 'object' ? (b.pressed || b.value > 0.25) : b > 0.25;
    };

    const wasBtnDown = (idx) => this.prevButtons.get(idx) || false;
    const justPressed = (idx) => isBtnDown(idx) && !wasBtnDown(idx);

    // Directional inputs (Merge D-Pad and Left Analog)
    const dUp = isBtnDown(12);
    const dDown = isBtnDown(13);
    const dLeft = isBtnDown(14);
    const dRight = isBtnDown(15);

    const left = dLeft || rawX < -0.3 || (snapX === -1 && mag >= 0.35);
    const right = dRight || rawX > 0.3 || (snapX === 1 && mag >= 0.35);
    const up = dUp || rawY < -0.3 || (snapY === -1 && mag >= 0.35);
    const down = dDown || rawY > 0.3 || (snapY === 1 && mag >= 0.35);

    // Action inputs
    const jump = isBtnDown(0);
    const jumpPressed = justPressed(0);

    const dash = isBtnDown(2) || isBtnDown(1) || isBtnDown(5) || isBtnDown(7);
    const dashPressed = justPressed(2) || justPressed(1) || justPressed(5) || justPressed(7);

    const climb = isBtnDown(3) || isBtnDown(4) || isBtnDown(6);

    const restartPressed = justPressed(8) || justPressed(11);
    const startPressed = justPressed(9);
    const cyclePressed = justPressed(10);

    // Update button states for rising edge tracking
    if (gp.buttons) {
      for (let i = 0; i < gp.buttons.length; i++) {
        this.prevButtons.set(i, isBtnDown(i));
      }
    }

    return {
      left,
      right,
      up,
      down,
      jump,
      jumpPressed,
      dash,
      dashPressed,
      climb,
      restartPressed,
      startPressed,
      cyclePressed,
      analogX: stickX,
      analogY: stickY
    };
  }

  vibrate(duration = 80, weakMagnitude = 0.4, strongMagnitude = 0.4) {
    if (!this.rumbleEnabled) return;
    try {
      const gp = this.getActiveGamepad();
      if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: Math.max(10, duration),
          weakMagnitude: Math.min(1.0, Math.max(0, weakMagnitude)),
          strongMagnitude: Math.min(1.0, Math.max(0, strongMagnitude))
        }).catch(() => {});
      }
    } catch (_) {}
  }

  toggleRumble() {
    this.rumbleEnabled = !this.rumbleEnabled;
    try {
      localStorage.setItem('seleste_rumble', this.rumbleEnabled ? 'true' : 'false');
    } catch (_) {}
    if (this.rumbleEnabled) {
      this.vibrate(100, 0.5, 0.5);
    }
    return this.rumbleEnabled;
  }
}
